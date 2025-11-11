let videoInfo = null;
let videoDuration = 0;

const urlInput = document.getElementById('youtube-url');
const loadBtn = document.getElementById('load-btn');
const videoInfoDiv = document.getElementById('video-info');
const videoTitle = document.getElementById('video-title');
const videoDurationSpan = document.getElementById('video-duration');
const trimSection = document.getElementById('trim-section');
const startRange = document.getElementById('start-range');
const endRange = document.getElementById('end-range');
const startTime = document.getElementById('start-time');
const endTime = document.getElementById('end-time');
const rangeTrack = document.getElementById('range-track');
const fileNameInput = document.getElementById('file-name');
const outputPathInput = document.getElementById('output-path');
const formatSelect = document.getElementById('format');
const browseBtn = document.getElementById('browse-btn');
const downloadBtn = document.getElementById('download-btn');
const statusDiv = document.getElementById('status');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');

// Format seconds to HH:MM:SS
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update range track visual
function updateRangeTrack() {
    const startPercent = parseFloat(startRange.value);
    const endPercent = parseFloat(endRange.value);
    rangeTrack.style.left = startPercent + '%';
    rangeTrack.style.width = (endPercent - startPercent) + '%';
}

// Update time inputs based on range sliders
function updateTimeInputsFromRange() {
    const startPercent = parseFloat(startRange.value) / 100;
    const endPercent = parseFloat(endRange.value) / 100;
    startTime.value = (videoDuration * startPercent).toFixed(1);
    endTime.value = (videoDuration * endPercent).toFixed(1);
}

// Update range sliders based on time inputs
function updateRangeFromTimeInputs() {
    const start = parseFloat(startTime.value) || 0;
    const end = parseFloat(endTime.value) || videoDuration;
    
    startRange.value = ((start / videoDuration) * 100).toFixed(1);
    endRange.value = ((end / videoDuration) * 100).toFixed(1);
    
    updateRangeTrack();
}

// Show status message
function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type} active`;
}

// Hide status message
function hideStatus() {
    statusDiv.className = 'status';
}

// Load video info
loadBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    
    if (!url) {
        showStatus('Please enter a YouTube URL', 'error');
        return;
    }

    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading...';
    hideStatus();

    const result = await window.electronAPI.getVideoInfo(url);

    if (result.success) {
        videoInfo = result;
        videoDuration = result.duration;
        
        videoTitle.textContent = result.title;
        videoDurationSpan.textContent = formatTime(result.duration);
        
        // Set default file name
        const sanitizedTitle = result.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        fileNameInput.value = sanitizedTitle.substring(0, 50);
        
        // Setup trim sliders
        startRange.max = 100;
        endRange.max = 100;
        startRange.value = 0;
        endRange.value = 100;
        startTime.max = videoDuration;
        endTime.max = videoDuration;
        startTime.value = 0;
        endTime.value = videoDuration;
        
        updateRangeTrack();
        
        videoInfoDiv.classList.add('active');
        trimSection.style.display = 'block';
        
        showStatus('Video loaded successfully!', 'success');
    } else {
        showStatus(`Error: ${result.error}`, 'error');
    }

    loadBtn.disabled = false;
    loadBtn.textContent = 'Load Video';
});

// Range slider event listeners
startRange.addEventListener('input', () => {
    if (parseFloat(startRange.value) >= parseFloat(endRange.value)) {
        startRange.value = parseFloat(endRange.value) - 0.1;
    }
    updateRangeTrack();
    updateTimeInputsFromRange();
});

endRange.addEventListener('input', () => {
    if (parseFloat(endRange.value) <= parseFloat(startRange.value)) {
        endRange.value = parseFloat(startRange.value) + 0.1;
    }
    updateRangeTrack();
    updateTimeInputsFromRange();
});

// Time input event listeners
startTime.addEventListener('change', () => {
    let start = parseFloat(startTime.value) || 0;
    const end = parseFloat(endTime.value) || videoDuration;
    
    if (start < 0) start = 0;
    if (start >= end) start = end - 0.1;
    if (start > videoDuration) start = videoDuration - 0.1;
    
    startTime.value = start.toFixed(1);
    updateRangeFromTimeInputs();
});

endTime.addEventListener('change', () => {
    const start = parseFloat(startTime.value) || 0;
    let end = parseFloat(endTime.value) || videoDuration;
    
    if (end <= start) end = start + 0.1;
    if (end > videoDuration) end = videoDuration;
    
    endTime.value = end.toFixed(1);
    updateRangeFromTimeInputs();
});

// Browse output folder
browseBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.showSaveDialog(fileNameInput.value);
    
    if (result.success) {
        outputPathInput.value = result.path;
        downloadBtn.disabled = false;
    }
});

// Download audio
downloadBtn.addEventListener('click', async () => {
    const fileName = fileNameInput.value.trim();
    const outputPath = outputPathInput.value;
    const format = formatSelect.value;
    
    if (!fileName) {
        showStatus('Please enter a file name', 'error');
        return;
    }
    
    if (!outputPath) {
        showStatus('Please select an output folder', 'error');
        return;
    }

    const startTimeValue = parseFloat(startTime.value) || 0;
    const endTimeValue = parseFloat(endTime.value) || videoDuration;
    
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';
    browseBtn.disabled = true;
    loadBtn.disabled = true;
    progressBar.classList.add('active');
    progressFill.style.width = '0%';
    
    showStatus('Downloading and converting audio...', 'info');

    const fullFileName = `${fileName}.${format}`;
    
    const result = await window.electronAPI.downloadAudio({
        url: urlInput.value.trim(),
        format: format,
        startTime: startTimeValue,
        endTime: endTimeValue,
        outputPath: outputPath,
        fileName: fullFileName
    });

    progressBar.classList.remove('active');
    
    if (result.success) {
        showStatus(`Audio saved successfully to: ${result.path}`, 'success');
        downloadBtn.textContent = 'Download Complete!';
        
        // Reset after 3 seconds
        setTimeout(() => {
            downloadBtn.textContent = 'Download Audio';
            downloadBtn.disabled = false;
            browseBtn.disabled = false;
            loadBtn.disabled = false;
        }, 3000);
    } else {
        showStatus(`Error: ${result.error}`, 'error');
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download Audio';
        browseBtn.disabled = false;
        loadBtn.disabled = false;
    }
});

// Listen for download progress
window.electronAPI.onDownloadProgress((percent) => {
    progressFill.style.width = percent + '%';
});