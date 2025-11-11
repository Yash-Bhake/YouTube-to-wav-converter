# YouTube Audio Converter

A modern GUI that downloads and converts YouTube videos to audio files (MP3 or WAV) with trimming capabilities. Uses **yt-dlp** for reliable, future-proof YouTube downloading.

## Features

✨ **Key Features:**
- Download audio from any YouTube video
- Convert to MP3 or WAV format
- Trim audio with intuitive dual-slider interface
- Precise timestamp control (double-click to edit exact values)
- Choose custom output location and filename
- Full-length audio by default

## Prerequisites

Before installation, ensure you have the following installed on your Mac:

### 1. Node.js (v16 or higher)
```bash
# Check if installed
node --version

# Install from https://nodejs.org/ if needed
```

### 2. yt-dlp (Required)
```bash
# Install via Homebrew
brew install yt-dlp

# Verify installation
yt-dlp --version
```

### 3. FFmpeg 
```bash
brew install ffmpeg

# Verify installation
ffmpeg -version
```

## Installation

### Step 1: Clone this repository
```bash
git clone https://github.com/Yash-Bhake/YouTube-to-wav-converter.git
```

### Step 2: Install Dependencies
```bash
# Clean install
npm install
```

This will install:
- Electron (desktop app framework)
- fluent-ffmpeg (audio processing wrapper)

## Running the Application

### Development Mode
```bash
npm start
```

### Building for macOS
```bash
npm run build:mac
```

This creates a distributable `.dmg` file in the `dist` folder.

**IMPORTANT FOR BUILT APP:**
The built `.dmg` app will look for yt-dlp and ffmpeg in these locations:
- `/opt/homebrew/bin/` (Apple Silicon Macs)
- `/usr/local/bin/` (Intel Macs)

Make sure you installed yt-dlp and ffmpeg via Homebrew so they're in these standard locations.

### Verify Installation Paths
```bash
# Check where your binaries are installed
which yt-dlp
which ffmpeg

# Should show something like:
# /opt/homebrew/bin/yt-dlp
# /opt/homebrew/bin/ffmpeg
```

## Usage Guide

### 1. Load a Video
- Paste a YouTube URL into the input field
- Click "Load Video" button
- Wait for video information to load

### 2. Trim Audio (Optional)
- Use the dual-slider to select start and end points
- Drag the left handle to set start time
- Drag the right handle to set end time
- Or enter precise timestamps in the input boxes
- By default, the entire video length is selected

### 3. Configure Output
- Enter a custom filename (without extension)
- Choose format: MP3 (192kbps) or WAV (lossless)
- Click "Browse Output Folder" to select save location

### 4. Download
- Click "Download Audio" button
- Watch the progress bar (0-50% download, 50-100% conversion)
- Find your file in the selected output folder

## Why yt-dlp?

**yt-dlp is superior to ytdl-core because:**
- Actively maintained with frequent updates
- Handles YouTube API changes automatically
- No "Could not extract functions" errors
- Better error handling and reliability
- Works with more websites than just YouTube
- Faster downloads with better quality selection
- Built-in retry logic and error recovery

## File Structure

```
youtube-audio-converter/
├── package.json         # Project dependencies
├── main.js              # Electron main process (yt-dlp + ffmpeg)
├── preload.js           # Security bridge
├── index.html           # Application UI
├── renderer.js          # Frontend logic
└── README.md            # This file
```

## Technical Details

### Audio Quality
- **MP3**: 192 kbps bitrate, stereo, 44.1 kHz
- **WAV**: Lossless PCM, 16-bit, stereo, 44.1 kHz

### Download Process
1. **yt-dlp** downloads the best audio quality available
2. Audio is saved to a temporary location
3. **FFmpeg** processes and trims the audio (if needed)
4. Final file is saved to your chosen location
5. Temporary files are automatically cleaned up

### Trimming
- Precision: 0.1 second increments
- No quality loss during trimming

## Troubleshooting

### Built App Says "yt-dlp is not installed"

Even though you have yt-dlp installed, the built app can't find it. Here's why and how to fix:

**Cause:** The packaged app doesn't inherit your terminal's PATH environment variable.

**Solution 1 (Recommended):** Verify Homebrew installation
```bash
# Check where yt-dlp is installed
which yt-dlp

# Should show:
# /opt/homebrew/bin/yt-dlp (Apple Silicon)
# OR
# /usr/local/bin/yt-dlp (Intel Mac)

# If it's somewhere else, reinstall via Homebrew:
brew uninstall yt-dlp
brew install yt-dlp
```

**Solution 2:** Use development mode
```bash
# Development mode always works because it uses your full PATH
npm start
```

### "yt-dlp is not installed" Error
```bash
# Install yt-dlp
brew install yt-dlp

# Update if already installed
brew upgrade yt-dlp
```

### "Invalid YouTube URL" Error
- Ensure URL is in format: `https://www.youtube.com/watch?v=...`
- Check your internet connection
- Try the URL in a browser first

### Download Fails
- Update yt-dlp: `brew upgrade yt-dlp`
- Ensure write permissions to output folder

### FFmpeg Errors
```bash
# Reinstall FFmpeg if issues occur
brew reinstall ffmpeg
```

### Permission Issues on macOS
If the built app won't open:
```bash
# Remove quarantine attribute
xattr -d com.apple.quarantine "/Applications/YouTube Audio Converter.app"
```

### Update yt-dlp Regularly
YouTube frequently changes their code. Keep yt-dlp updated:
```bash
brew upgrade yt-dlp
```

## Building from Source

### Create Distributable App
```bash
npm run build:mac
```

The built app will be in `dist/mac/YouTube Audio Converter.app`

### Create DMG Installer
The build process automatically creates a `.dmg` file in the `dist` folder.

## Privacy & Legal

- This tool is for personal use only
- Respect copyright laws and YouTube's Terms of Service
- Only download content you have rights to use
- No data is collected or transmitted

## System Requirements

- macOS 10.13 (High Sierra) or later
- Node.js 16+
- yt-dlp (installed via Homebrew)
- FFmpeg (installed via Homebrew)

## Dependencies

- **Electron**: Cross-platform desktop framework
- **yt-dlp**: Reliable YouTube downloader (replaces youtube-dl/ytdl-core)
- **fluent-ffmpeg**: Audio processing wrapper
- **FFmpeg**: System dependency for audio conversion

## Support

### Common Issues

**Q: Why yt-dlp instead of ytdl-core?**  
A: yt-dlp is actively maintained and handles YouTube's constant changes. ytdl-core packages frequently break with "Could not extract functions" errors.

**Q: Can I use this with other video sites?**  
A: Yes! yt-dlp supports 1000+ websites including Vimeo, Soundcloud, Twitter, etc.

**Q: Does this store any data?**  
A: No. Everything runs locally on your Mac. No data is sent anywhere except to YouTube to download videos.

### Getting Help

1. Ensure all prerequisites are installed:
   - `node --version` (should be 16+)
   - `yt-dlp --version` (should show version number)
   - `ffmpeg -version` (should show version number)

2. Update yt-dlp if downloads fail:
   - `brew upgrade yt-dlp`

3. Try running in development mode:
   - `npm start`

## License

MIT License - Feel free to modify and distribute

---

**Note**: This application requires an active internet connection to download videos. Make sure yt-dlp and FFmpeg are installed via Homebrew before running the app.