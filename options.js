// Default options
const defaultOptions = {
  platforms: {
    facebook: true,
    twitter: true,
    reddit: true,
    youtube: true,
    instagram: true,
    linkedin: true
  },
  buttonStyle: 'default',
  highlightColor: '#FFEB3B',
  highlightDuration: 2.0
};

// Save options to storage
function saveOptions() {
  const options = {
    platforms: {
      facebook: document.getElementById('facebook').checked,
      twitter: document.getElementById('twitter').checked,
      reddit: document.getElementById('reddit').checked,
      youtube: document.getElementById('youtube').checked,
      instagram: document.getElementById('instagram').checked,
      linkedin: document.getElementById('linkedin').checked
    },
    buttonStyle: document.getElementById('buttonStyle').value,
    highlightColor: document.getElementById('highlightColor').value,
    highlightDuration: parseFloat(document.getElementById('highlightDuration').value)
  };
  
  chrome.storage.sync.set({ options }, () => {
    // Show the "Options saved!" message
    const saveStatus = document.getElementById('saveStatus');
    saveStatus.style.display = 'block';
    
    // Hide it after 1.5 seconds
    setTimeout(() => {
      saveStatus.style.display = 'none';
    }, 1500);
  });
}

// Load saved options
function loadOptions() {
  chrome.storage.sync.get('options', (data) => {
    const options = data.options || defaultOptions;
    
    // Set platform checkboxes
    document.getElementById('facebook').checked = options.platforms.facebook;
    document.getElementById('twitter').checked = options.platforms.twitter;
    document.getElementById('reddit').checked = options.platforms.reddit;
    document.getElementById('youtube').checked = options.platforms.youtube;
    document.getElementById('instagram').checked = options.platforms.instagram;
    document.getElementById('linkedin').checked = options.platforms.linkedin;
    
    // Set other options
    document.getElementById('buttonStyle').value = options.buttonStyle;
    document.getElementById('highlightColor').value = options.highlightColor;
    document.getElementById('highlightDuration').value = options.highlightDuration;
    document.getElementById('durationValue').textContent = options.highlightDuration.toFixed(1);
  });
}

// Update duration display when slider is moved
function updateDurationLabel() {
  const duration = parseFloat(document.getElementById('highlightDuration').value);
  document.getElementById('durationValue').textContent = duration.toFixed(1);
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Load saved options
  loadOptions();
  
  // Set up event listeners
  document.getElementById('save').addEventListener('click', saveOptions);
  document.getElementById('highlightDuration').addEventListener('input', updateDurationLabel);
}); 