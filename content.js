// Configuration for different social media platforms
const PLATFORMS = {
  facebook: {
    commentSelector: '.x1lliihq', // Facebook comment container
    commentTextSelector: '.xdj266r', // Text content of comment
    commentUsernameSelector: '.x3nfvp2', // Username/display name
    commentTimestampSelector: '.x4k7w5x', // Timestamp element
    actionBarSelector: '.x78zum5', // Where to insert the share button
  },
  twitter: {
    commentSelector: '[data-testid="tweet"]',
    commentTextSelector: '[data-testid="tweetText"]',
    commentUsernameSelector: '[data-testid="User-Name"]',
    commentTimestampSelector: 'time',
    actionBarSelector: '[role="group"]',
  },
  reddit: {
    commentSelector: '.Comment',
    commentTextSelector: '.RichTextJSON-root',
    commentUsernameSelector: 'a[data-testid="comment_author"]',
    commentTimestampSelector: 'a[data-testid="comment_timestamp"]',
    actionBarSelector: '.voteButtonsContainer + div',
  },
  youtube: {
    commentSelector: 'ytd-comment-thread-renderer',
    commentTextSelector: '#content-text',
    commentUsernameSelector: '#author-text',
    commentTimestampSelector: '.published-time-text',
    actionBarSelector: '#toolbar',
  },
  instagram: {
    commentSelector: '._a9zr',
    commentTextSelector: '._a9zs',
    commentUsernameSelector: '._a9zc',
    commentTimestampSelector: 'time',
    actionBarSelector: '._abl-',
  },
  linkedin: {
    commentSelector: '.comments-comment-item',
    commentTextSelector: '.comments-comment-item__main-content',
    commentUsernameSelector: '.comments-post-meta__name-text',
    commentTimestampSelector: '.comments-comment-item__timestamp',
    actionBarSelector: '.comments-comment-social-bar',
  }
};

// Default options (same as in options.js)
const defaultOptions = {
  platforms: {
    facebook: true,
    twitter: true,
    reddit: true,
    youtube: true,
    instagram: true,
    linkedin: true
  },
  highlightColor: '#FFEB3B',
  highlightDuration: 2.0
};

// Global options variable
let userOptions = defaultOptions;

// Load options from storage
function loadUserOptions(callback) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get('options', (data) => {
      userOptions = data.options || defaultOptions;
      if (callback) callback();
    });
  } else {
    // Fallback for when chrome API is not available (e.g., during testing)
    console.warn('Chrome storage API not available');
    if (callback) callback();
  }
}

// Detect which platform we're on
function detectPlatform() {
  const domain = window.location.hostname;
  if (domain.includes('facebook.com')) return 'facebook';
  if (domain.includes('twitter.com') || domain.includes('x.com')) return 'twitter';
  if (domain.includes('reddit.com')) return 'reddit';
  if (domain.includes('youtube.com')) return 'youtube';
  if (domain.includes('instagram.com')) return 'instagram';
  if (domain.includes('linkedin.com')) return 'linkedin';
  return null;
}

// Check if the current platform is enabled
function isPlatformEnabled(platform) {
  return userOptions.platforms[platform] === true;
}

// Generate a consistent hash for a comment
function generateCommentHash(commentText) {
  let hash = 0;
  if (commentText.length === 0) return hash;
  
  for (let i = 0; i < commentText.length; i++) {
    const char = commentText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Create a popup with the shareable link
function createShareLinkPopup(shareableUrl, event) {
  // Remove any existing popups
  const existingPopup = document.querySelector('.comment-share-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // Create popup container
  const popup = document.createElement('div');
  popup.className = 'comment-share-popup';
  
  // Create popup header
  const header = document.createElement('div');
  header.className = 'comment-share-popup-header';
  header.innerHTML = '<span>Share Comment Link</span><button class="comment-share-popup-close">&times;</button>';
  
  // Create popup content
  const content = document.createElement('div');
  content.className = 'comment-share-popup-content';
  
  // Create URL input field
  const linkInput = document.createElement('input');
  linkInput.type = 'text';
  linkInput.className = 'comment-share-popup-link';
  linkInput.value = shareableUrl;
  linkInput.readOnly = true;
  
  // Create copy button
  const copyButton = document.createElement('button');
  copyButton.className = 'comment-share-popup-copy-btn';
  copyButton.textContent = 'Copy Link';
  
  // Add elements to content
  content.appendChild(linkInput);
  content.appendChild(copyButton);
  
  // Add header and content to popup
  popup.appendChild(header);
  popup.appendChild(content);
  
  // Position popup relative to the click event
  const rect = event.target.getBoundingClientRect();
  popup.style.position = 'fixed';
  popup.style.left = `${Math.min(rect.left, window.innerWidth - 340)}px`;
  popup.style.top = `${rect.bottom + 10}px`;
  
  // Add popup to the document
  document.body.appendChild(popup);
  
  // Focus and select the link
  setTimeout(() => {
    linkInput.focus();
    linkInput.select();
  }, 100);
  
  // Handle copy button click
  copyButton.addEventListener('click', () => {
    linkInput.select();
    document.execCommand('copy');
    
    // Show "Copied!" text temporarily
    copyButton.textContent = 'Copied!';
    copyButton.classList.add('copied');
    setTimeout(() => {
      copyButton.textContent = 'Copy Link';
      copyButton.classList.remove('copied');
    }, 2000);
  });
  
  // Handle close button click
  const closeButton = header.querySelector('.comment-share-popup-close');
  closeButton.addEventListener('click', () => {
    popup.remove();
  });
  
  // Close popup when clicking outside
  document.addEventListener('click', function closePopup(e) {
    if (!popup.contains(e.target) && e.target !== event.target && !event.target.contains(e.target)) {
      popup.remove();
      document.removeEventListener('click', closePopup);
    }
  });
  
  return popup;
}

// Create a share button for a comment
function createShareButton(commentElement, commentData) {
  // Create icon button
  const shareButton = document.createElement('button');
  shareButton.className = 'comment-share-btn comment-share-icon-btn';
  shareButton.title = 'Share Comment';
  shareButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>';
  
  // Click handler
  shareButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Create the shareable URL
    const url = new URL(window.location.href);
    // Clear any existing shared_comment parameter
    url.searchParams.delete('shared_comment');
    // Add the new parameter
    url.searchParams.set('shared_comment', JSON.stringify(commentData));
    
    const shareableUrl = url.toString();
    console.log('Generated shareable URL:', shareableUrl);
    
    // Show popup with the link
    createShareLinkPopup(shareableUrl, event);
  });
  
  return shareButton;
}

// Extract comment data (text, username, timestamp)
function extractCommentData(commentElement, platform) {
  const config = PLATFORMS[platform];
  
  // Extract text content
  const textElement = commentElement.querySelector(config.commentTextSelector);
  const commentText = textElement ? textElement.textContent.trim() : '';
  
  // Extract username
  const usernameElement = commentElement.querySelector(config.commentUsernameSelector);
  const username = usernameElement ? usernameElement.textContent.trim() : '';
  
  // Extract timestamp
  const timestampElement = commentElement.querySelector(config.commentTimestampSelector);
  const timestamp = timestampElement ? timestampElement.textContent.trim() : '';
  
  // Generate a hash from comment text
  const commentHash = generateCommentHash(commentText);
  
  return {
    text: commentText,
    username: username,
    timestamp: timestamp,
    hash: commentHash
  };
}

// Add share buttons to all comments on the page
function addShareButtonsToComments() {
  const platform = detectPlatform();
  if (!platform || !PLATFORMS[platform] || !isPlatformEnabled(platform)) return;
  
  const config = PLATFORMS[platform];
  const comments = document.querySelectorAll(config.commentSelector);
  
  comments.forEach(comment => {
    // Skip if we've already added a button
    if (comment.querySelector('.comment-share-btn')) return;
    
    const actionBar = comment.querySelector(config.actionBarSelector);
    if (!actionBar) return;
    
    const commentData = extractCommentData(comment, platform);
    if (!commentData.text) return; // Skip if we couldn't extract text
    
    const shareButton = createShareButton(comment, commentData);
    actionBar.appendChild(shareButton);
  });
}

// Find a comment based on data from URL
function findComment(commentData) {
  const platform = detectPlatform();
  if (!platform || !PLATFORMS[platform]) return null;
  
  const config = PLATFORMS[platform];
  const comments = document.querySelectorAll(config.commentSelector);
  
  // First try to find by text and username
  for (const comment of comments) {
    const currentCommentData = extractCommentData(comment, platform);
    
    // Check if text and username match
    if (currentCommentData.text === commentData.text && 
        currentCommentData.username === commentData.username) {
      return comment;
    }
  }
  
  // If not found, try just by hash
  for (const comment of comments) {
    const currentCommentData = extractCommentData(comment, platform);
    
    if (currentCommentData.hash === commentData.hash) {
      return comment;
    }
  }
  
  return null;
}

// Scroll to and highlight a comment
function scrollToComment(commentData) {
  const comment = findComment(commentData);
  if (!comment) {
    console.log('Comment not found, will retry in 1 second');
    // Wait and try again, as comments might still be loading
    setTimeout(() => scrollToComment(commentData), 1000);
    return;
  }
  
  // Scroll to the comment
  comment.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Create a dynamic style for the highlight animation based on user options
  const styleId = 'comment-share-highlight-style';
  let styleEl = document.getElementById(styleId);
  
  // If the style doesn't exist, create it
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  
  // Set the animation with user's preferred color and duration
  styleEl.textContent = `
    @keyframes highlight-comment {
      0% {
        background-color: ${userOptions.highlightColor}BF;
        box-shadow: 0 0 10px ${userOptions.highlightColor}BF;
      }
      100% {
        background-color: transparent;
        box-shadow: none;
      }
    }
    .comment-highlight {
      animation: highlight-comment ${userOptions.highlightDuration}s ease-out;
    }
  `;
  
  // Add highlight class
  comment.classList.add('comment-highlight');
  
  // Remove highlight after animation completes
  setTimeout(() => {
    comment.classList.remove('comment-highlight');
  }, userOptions.highlightDuration * 1000);
}

// Check if we have a shared comment in the URL
function checkForSharedComment() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedComment = urlParams.get('shared_comment');
  
  if (sharedComment) {
    try {
      console.log('Found shared comment in URL:', sharedComment);
      const commentData = JSON.parse(sharedComment);
      // Wait for page to fully load before attempting to find the comment
      setTimeout(() => scrollToComment(commentData), 1500);
    } catch (error) {
      console.error('Failed to parse shared comment data', error);
    }
  }
}

// Listen for storage changes to update options in real-time
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.options) {
      userOptions = changes.options.newValue;
    }
  });
}

// Initialize on page load
function initialize() {
  // Log that the extension is running
  console.log('Comment Share extension initialized');
  
  // Load user options first
  loadUserOptions(() => {
    // Initial run after options are loaded
    addShareButtonsToComments();
    checkForSharedComment();
    
    // Set up a MutationObserver to add share buttons to new comments
    const observer = new MutationObserver(() => {
      // Wait a bit to let the DOM settle
      setTimeout(addShareButtonsToComments, 500);
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  });
  
  // Listen for messages from the background script
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'scrollToComment' && message.commentData) {
        scrollToComment(message.commentData);
      }
      return true;
    });
  }
}

// Start when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
} 