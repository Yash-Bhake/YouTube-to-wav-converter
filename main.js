const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const os = require('os');
const { promisify } = require('util');

const execAsync = promisify(exec);

let mainWindow;
let ytdlpPath = 'yt-dlp';
let ffmpegPath = 'ffmpeg';
let ffprobePath = 'ffprobe';

// Find system binaries
async function findSystemBinaries() {
  const brewPaths = [
    '/opt/homebrew/bin',  // Apple Silicon
    '/usr/local/bin'      // Intel Mac
  ];

  // Find yt-dlp
  for (const brewPath of brewPaths) {
    const candidate = path.join(brewPath, 'yt-dlp');
    if (fs.existsSync(candidate)) {
      ytdlpPath = candidate;
      break;
    }
  }

  // Find ffmpeg
  for (const brewPath of brewPaths) {
    const ffmpegCandidate = path.join(brewPath, 'ffmpeg');
    const ffprobeCandidate = path.join(brewPath, 'ffprobe');
    if (fs.existsSync(ffmpegCandidate)) {
      ffmpegPath = ffmpegCandidate;
      if (fs.existsSync(ffprobeCandidate)) {
        ffprobePath = ffprobeCandidate;
      }
      break;
    }
  }

  // Set ffmpeg paths
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);

  console.log('Using yt-dlp:', ytdlpPath);
  console.log('Using ffmpeg:', ffmpegPath);
  console.log('Using ffprobe:', ffprobePath);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    resizable: false,
    backgroundColor: '#1a1a1a'
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  // if (!app.isPackaged) {
  //   mainWindow.webContents.openDevTools();
  // }
}

app.whenReady().then(async () => {
  await findSystemBinaries();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Check if yt-dlp is accessible
async function checkYtDlp() {
  try {
    const { stdout } = await execAsync(`"${ytdlpPath}" --version`, { 
      maxBuffer: 10 * 1024 * 1024 
    });
    return { installed: true, version: stdout.trim() };
  } catch (error) {
    return { 
      installed: false, 
      message: `yt-dlp not found at ${ytdlpPath}. Please install it using: brew install yt-dlp`,
      path: ytdlpPath
    };
  }
}

// Get video info using yt-dlp
ipcMain.handle('get-video-info', async (event, url) => {
  try {
    const ytdlpCheck = await checkYtDlp();
    if (!ytdlpCheck.installed) {
      return {
        success: false,
        error: ytdlpCheck.message
      };
    }

    const command = `"${ytdlpPath}" --dump-json "${url}"`;
    // Increase maxBuffer for long videos (100MB for very long video metadata)
    const { stdout } = await execAsync(command, { maxBuffer: 100 * 1024 * 1024 });
    const info = JSON.parse(stdout);

    return {
      success: true,
      title: info.title,
      duration: parseInt(info.duration),
      thumbnail: info.thumbnail,
      id: info.id
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch video information'
    };
  }
});

// Download and convert audio using yt-dlp and ffmpeg
ipcMain.handle('download-audio', async (event, { url, format, startTime, endTime, outputPath, fileName }) => {
  return new Promise(async (resolve) => {
    try {
      const ytdlpCheck = await checkYtDlp();
      if (!ytdlpCheck.installed) {
        return resolve({
          success: false,
          error: ytdlpCheck.message
        });
      }

      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `temp_${Date.now()}.m4a`);
      const finalPath = path.join(outputPath, fileName);

      // Download audio using yt-dlp with explicit path
      const ytdlpArgs = [
        '-f', 'bestaudio',
        '--extract-audio',
        '--audio-format', 'm4a',
        '-o', tempFile,
        '--no-playlist',
        url
      ];

      console.log('Spawning yt-dlp:', ytdlpPath, ytdlpArgs);

      const ytdlpProcess = spawn(ytdlpPath, ytdlpArgs, {
        env: { ...process.env }
      });

      let downloadError = '';
      
      ytdlpProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.log(message);
        
        // Parse download progress
        const progressMatch = message.match(/(\d+\.?\d*)%/);
        if (progressMatch) {
          const percent = parseFloat(progressMatch[1]);
          event.sender.send('download-progress', Math.min(percent, 50));
        }
      });

      ytdlpProcess.stdout.on('data', (data) => {
        console.log('yt-dlp stdout:', data.toString());
      });

      ytdlpProcess.on('error', (error) => {
        downloadError = `Failed to spawn yt-dlp: ${error.message}`;
        console.error(downloadError);
      });

      ytdlpProcess.on('close', (code) => {
        if (code !== 0 || !fs.existsSync(tempFile)) {
          resolve({ 
            success: false, 
            error: downloadError || `Download failed with code ${code}. Please check your internet connection and try again.` 
          });
          return;
        }

        // Convert and trim using ffmpeg
        event.sender.send('download-progress', 50);

        let command = ffmpeg(tempFile);

        // Set start and duration if trimming
        if (startTime > 0) {
          command = command.setStartTime(startTime);
        }
        
        if (endTime > startTime) {
          command = command.setDuration(endTime - startTime);
        }

        // Set output format
        if (format === 'mp3') {
          command = command
            .audioBitrate('192k')
            .audioCodec('libmp3lame')
            .audioChannels(2)
            .audioFrequency(44100);
        } else {
          // WAV format
          command = command
            .audioCodec('pcm_s16le')
            .audioFrequency(44100)
            .audioChannels(2);
        }

        command
          .output(finalPath)
          .on('end', () => {
            // Clean up temp file
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }
            event.sender.send('download-progress', 100);
            resolve({ success: true, path: finalPath });
          })
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            // Clean up temp file on error
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }
            resolve({ success: false, error: err.message });
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              const conversionPercent = 50 + (progress.percent * 0.5);
              event.sender.send('download-progress', Math.round(conversionPercent));
            }
          })
          .run();
      });

    } catch (error) {
      console.error('Download error:', error);
      resolve({ success: false, error: error.message });
    }
  });
});

// Show save dialog
ipcMain.handle('show-save-dialog', async (event, defaultName) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Output Directory'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return {
      success: true,
      path: result.filePaths[0]
    };
  }
  
  return { success: false };
});