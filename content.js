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
    commentIdAttribute: 'id', // YouTube comment threads have IDs
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

// Extract YouTube specific comment ID if available
function extractYouTubeCommentId(commentElement) {
  if (!commentElement || !commentElement.id) return null;
  return commentElement.id;
}

// Get YouTube player instance
function getYouTubePlayer() {
  // Method 1: Try to get player via YouTube's API
  if (typeof document.getElementById === 'function' && 
      typeof window.YT !== 'undefined' && 
      typeof window.YT.get === 'function') {
    try {
      const player = window.YT.get('movie_player');
      if (player) return player;
    } catch (e) {
      console.warn('Failed to get player via YT.get()', e);
    }
  }
  
  // Method 2: Try to get video element directly
  try {
    const videoElement = document.querySelector('.video-stream');
    if (videoElement) return videoElement;
  } catch (e) {
    console.warn('Failed to get video element', e);
  }
  
  // Method 3: Try to get movie_player element
  try {
    const moviePlayer = document.getElementById('movie_player');
    if (moviePlayer) return moviePlayer;
  } catch (e) {
    console.warn('Failed to get movie_player element', e);
  }
  
  return null;
}

// Extract specific information for YouTube comments
function extractYouTubeInfo() {
  // Get video ID from URL
  const url = new URL(window.location.href);
  const videoId = url.searchParams.get('v');
  
  // Get current video timestamp (if available)
  let timestamp = 0;
  try {
    const player = getYouTubePlayer();
    if (player) {
      // Try different methods to get current time
      if (typeof player.getCurrentTime === 'function') {
        timestamp = Math.floor(player.getCurrentTime());
      } else if (player.currentTime !== undefined) {
        timestamp = Math.floor(player.currentTime);
      }
    }
  } catch (e) {
    console.warn('Could not get video timestamp', e);
  }
  
  return {
    videoId,
    timestamp
  };
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
  
  // Additional platform-specific data
  let extraData = {};
  
  // For YouTube, extract additional info
  if (platform === 'youtube') {
    // Get comment ID
    const commentId = extractYouTubeCommentId(commentElement);
    if (commentId) {
      extraData.commentId = commentId;
    }
    
    // Get video info
    const youtubeInfo = extractYouTubeInfo();
    if (youtubeInfo.videoId) {
      extraData.videoId = youtubeInfo.videoId;
      extraData.videoTimestamp = youtubeInfo.timestamp;
    }
  }
  
  return {
    text: commentText,
    username: username,
    timestamp: timestamp,
    hash: commentHash,
    ...extraData
  };
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
    
    // For YouTube, create a cleaner URL with just the video ID and comment data
    if (commentData.videoId) {
      // Use video URL with just the ID
      url.searchParams.delete('t');
      url.searchParams.delete('ab_channel');
      url.searchParams.set('v', commentData.videoId);
    }
    
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

// Find YouTube comment by ID or content
function findYouTubeComment(commentData) {
  // Method 1: Try to find by comment ID
  if (commentData.commentId) {
    const commentById = document.getElementById(commentData.commentId);
    if (commentById) {
      console.log('Found comment by ID');
      return commentById;
    }
  }
  
  // Method 2: Try to find by text content and author
  const comments = document.querySelectorAll('ytd-comment-thread-renderer');
  console.log(`Searching through ${comments.length} YouTube comments`);
  
  for (const comment of comments) {
    // Check text content
    const textElement = comment.querySelector('#content-text');
    if (!textElement) continue;
    
    const commentText = textElement.textContent.trim();
    
    // If text doesn't match, skip
    if (commentText !== commentData.text) continue;
    
    // If we have username, check that too
    if (commentData.username) {
      const authorElement = comment.querySelector('#author-text');
      if (authorElement) {
        const authorName = authorElement.textContent.trim();
        if (authorName !== commentData.username) continue;
      }
    }
    
    // If we got here, we found a match
    console.log('Found comment by content match');
    return comment;
  }
  
  // Method 3: Try just by hash
  for (const comment of comments) {
    const textElement = comment.querySelector('#content-text');
    if (!textElement) continue;
    
    const commentText = textElement.textContent.trim();
    const hash = generateCommentHash(commentText);
    
    if (hash === commentData.hash) {
      console.log('Found comment by hash');
      return comment;
    }
  }
  
  return null;
}

// Find a comment based on data from URL
function findComment(commentData) {
  const platform = detectPlatform();
  if (!platform || !PLATFORMS[platform]) return null;
  
  // Use platform-specific finders if available
  if (platform === 'youtube') {
    return findYouTubeComment(commentData);
  }
  
  const config = PLATFORMS[platform];
  const comments = document.querySelectorAll(config.commentSelector);
  
  // For YouTube, try to find by commentId first
  if (platform === 'youtube' && commentData.commentId) {
    const commentWithId = document.getElementById(commentData.commentId);
    if (commentWithId) {
      return commentWithId;
    }
  }
  
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

// Function to progressively load YouTube comments by scrolling
function loadYouTubeComments(callback, maxScrolls = 10) {
  let scrollCount = 0;
  let previousCommentCount = 0;
  
  const checkAndScroll = () => {
    // Get current comment count
    const comments = document.querySelectorAll('ytd-comment-thread-renderer');
    const currentCommentCount = comments.length;
    
    console.log(`YouTube comments loaded: ${currentCommentCount}`);
    
    // Stop if we've reached max scrolls or comments aren't increasing
    if (scrollCount >= maxScrolls || 
        (scrollCount > 2 && currentCommentCount === previousCommentCount)) {
      console.log('Finished loading YouTube comments');
      if (callback) callback();
      return;
    }
    
    // Update previous count
    previousCommentCount = currentCommentCount;
    
    // Scroll to load more comments
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
    
    // Increment counter
    scrollCount++;
    
    // Check again after a delay
    setTimeout(checkAndScroll, 1500);
  };
  
  // Start the process
  checkAndScroll();
}

// Scroll to and highlight a comment
function scrollToComment(commentData, retryCount = 0, maxRetries = 10) {
  const platform = detectPlatform();
  const comment = findComment(commentData);
  
  if (!comment) {
    if (retryCount >= maxRetries) {
      console.log('Comment not found after maximum retries');
      return;
    }
    
    console.log(`Comment not found, will retry in ${Math.min(2 ** retryCount, 5)} seconds (attempt ${retryCount + 1}/${maxRetries})`);
    
    // For YouTube, try to load more comments by scrolling
    if (platform === 'youtube' && retryCount === 0) {
      // First try, initiate progressive loading of comments
      console.log('Starting progressive loading of YouTube comments');
      loadYouTubeComments(() => {
        // After loading, try to find the comment again
        const foundComment = findComment(commentData);
        if (foundComment) {
          console.log('Comment found after loading more comments');
          scrollToComment(commentData);
        } else {
          console.log('Comment not found after initial loading, will continue retrying');
          setTimeout(() => {
            scrollToComment(commentData, retryCount + 1, maxRetries);
          }, Math.min(2 ** retryCount, 5) * 1000);
        }
      });
      return;
    } else if (platform === 'youtube') {
      // On subsequent tries, just scroll a bit more
      window.scrollBy(0, 500);
    }
    
    // Wait with exponential backoff and retry
    setTimeout(() => {
      scrollToComment(commentData, retryCount + 1, maxRetries);
    }, Math.min(2 ** retryCount, 5) * 1000);
    
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
      
      // For YouTube, we need to ensure comments are loaded
      const platform = detectPlatform();
      
      if (platform === 'youtube') {
        // For YouTube, wait for video player to be ready
        const initialWait = 3000;
        
        setTimeout(() => {
          // If there's a video timestamp, seek to it first
          if (commentData.videoId && commentData.videoTimestamp && commentData.videoTimestamp > 0) {
            try {
              const player = getYouTubePlayer();
              if (player) {
                // Try different methods to seek
                if (typeof player.seekTo === 'function') {
                  player.seekTo(commentData.videoTimestamp);
                } else if (player.currentTime !== undefined) {
                  player.currentTime = commentData.videoTimestamp;
                }
                console.log(`Seeking to timestamp: ${commentData.videoTimestamp}`);
              }
            } catch (e) {
              console.warn('Could not seek to timestamp', e);
            }
          }
          
          // First ensure comments section is visible
          const commentsSection = document.querySelector('ytd-comments');
          if (commentsSection) {
            console.log('Scrolling to comments section');
            commentsSection.scrollIntoView({ behavior: 'smooth' });
            
            // Expand comments if they're collapsed
            const expandButton = document.querySelector('#comments-button');
            if (expandButton) {
              expandButton.click();
              console.log('Clicked to expand comments');
            }
            
            // Give time for the initial comments to load
            setTimeout(() => {
              // Then attempt to find our specific comment
              scrollToComment(commentData);
            }, 2000);
          } else {
            console.log('Comments section not found, will retry');
            setTimeout(() => checkForSharedComment(), 2000);
          }
        }, initialWait);
      } else {
        // For other platforms, use the standard approach
        setTimeout(() => scrollToComment(commentData), 1500);
      }
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