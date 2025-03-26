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

// Add a comment cache for fast retrieval
const commentCache = {
  byId: new Map(),
  byText: new Map(),
  byHash: new Map(),
  lastSearched: null,
  
  // Store a comment with multiple keys for fast lookup
  store(commentData, commentElement) {
    if (commentData.commentId) {
      this.byId.set(commentData.commentId, commentElement);
    }
    
    if (commentData.text) {
      const textKey = commentData.username 
        ? `${commentData.text}::${commentData.username}` 
        : commentData.text;
      this.byText.set(textKey, commentElement);
    }
    
    if (commentData.hash) {
      this.byHash.set(commentData.hash, commentElement);
    }
    
    this.lastSearched = commentData;
  },
  
  // Find a comment in cache
  find(commentData) {
    // Try to find by ID (fastest)
    if (commentData.commentId && this.byId.has(commentData.commentId)) {
      return this.byId.get(commentData.commentId);
    }
    
    // Try to find by text+username
    if (commentData.text && commentData.username) {
      const textKey = `${commentData.text}::${commentData.username}`;
      if (this.byText.has(textKey)) {
        return this.byText.get(textKey);
      }
    }
    
    // Try to find just by text
    if (commentData.text && this.byText.has(commentData.text)) {
      return this.byText.get(commentData.text);
    }
    
    // Try to find by hash
    if (commentData.hash && this.byHash.has(commentData.hash)) {
      return this.byHash.get(commentData.hash);
    }
    
    return null;
  }
};

// Find YouTube comment by ID or content with ultra-fast algorithm
function findYouTubeComment(commentData) {
  // Try cache first for instant retrieval
  const cachedComment = commentCache.find(commentData);
  if (cachedComment) {
    console.log('Found comment in cache');
    return cachedComment;
  }
  
  // Method 1: Try to find by comment ID (fastest method)
  if (commentData.commentId) {
    const commentById = document.getElementById(commentData.commentId);
    if (commentById) {
      console.log('Found comment by ID');
      // Store in cache for future lookups
      commentCache.store(commentData, commentById);
      return commentById;
    }
  }
  
  // Method 2: Ultra-fast direct selector approach
  // For text + username combo, build a targeted selector
  if (commentData.text && commentData.username) {
    try {
      // Use a single query to find matching comments
      const comments = document.querySelectorAll('ytd-comment-thread-renderer');
      
      // Parallel array filtering approach for faster processing
      const matchingComment = Array.from(comments).find(comment => {
        const textElement = comment.querySelector('#content-text');
        const authorElement = comment.querySelector('#author-text');
        
        if (!textElement || !authorElement) return false;
        
        const text = textElement.textContent.trim();
        const author = authorElement.textContent.trim();
        
        return text === commentData.text && author === commentData.username;
      });
      
      if (matchingComment) {
        console.log('Found comment by direct selector');
        commentCache.store(commentData, matchingComment);
        return matchingComment;
      }
    } catch (e) {
      console.warn('Error in fast selector search:', e);
    }
  }
  
  // Hash-based direct lookup
  if (commentData.hash) {
    const comments = document.querySelectorAll('ytd-comment-thread-renderer');
    
    // Process in chunks for better responsiveness
    const CHUNK_SIZE = 50;
    let result = null;
    
    for (let i = 0; i < comments.length; i += CHUNK_SIZE) {
      const chunk = Array.from(comments).slice(i, i + CHUNK_SIZE);
      
      const matchingComment = chunk.find(comment => {
        const textElement = comment.querySelector('#content-text');
        if (!textElement) return false;
        
        const commentText = textElement.textContent.trim();
        const hash = generateCommentHash(commentText);
        
        return hash === commentData.hash;
      });
      
      if (matchingComment) {
        result = matchingComment;
        break;
      }
    }
    
    if (result) {
      console.log('Found comment by hash');
      commentCache.store(commentData, result);
      return result;
    }
  }
  
  // If we just have text, try a text-only match
  if (commentData.text) {
    // Direct content match
    const selector = `ytd-comment-thread-renderer #content-text`;
    const allTextElements = document.querySelectorAll(selector);
    
    for (const textElement of allTextElements) {
      if (textElement.textContent.trim() === commentData.text) {
        const comment = textElement.closest('ytd-comment-thread-renderer');
        if (comment) {
          console.log('Found comment by text match');
          commentCache.store(commentData, comment);
          return comment;
        }
      }
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

// Function to load all YouTube comments with smooth scrolling
function loadYouTubeComments(callback, maxJumps = 3) {
  let jumpCount = 0;
  let previousCommentCount = 0;
  let noChangeCount = 0;
  
  const checkAndJump = () => {
    // Get current comment count
    const comments = document.querySelectorAll('ytd-comment-thread-renderer');
    const currentCommentCount = comments.length;
    
    console.log(`YouTube comments loaded: ${currentCommentCount}`);
    
    // Stop if we've reached max jumps or comments aren't increasing
    if (jumpCount >= maxJumps || noChangeCount >= 2) {
      console.log('Finished loading YouTube comments');
      if (callback) callback();
      return;
    }
    
    // Track if comments are still loading
    if (currentCommentCount === previousCommentCount) {
      noChangeCount++;
    } else {
      noChangeCount = 0;
    }
    
    // Update previous count
    previousCommentCount = currentCommentCount;
    
    // Jump to end of page to force-load all comments
    window.scrollTo({
      top: document.body.scrollHeight * 3, // Overscroll to force loading
      behavior: 'smooth' // Restored smooth scrolling
    });
    
    // Jump back to the comments section after a moment
    setTimeout(() => {
      const commentsSection = document.querySelector('ytd-comments');
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500); // Increased to allow smooth scrolling to complete
    
    // Increment counter
    jumpCount++;
    
    // Check again after a delay - increased to allow smooth scrolling
    setTimeout(checkAndJump, 1000);
  };
  
  // Start the process
  checkAndJump();
}

// Scroll to and highlight a comment with smooth approach
function scrollToComment(commentData, retryCount = 0, maxRetries = 3) {
  const platform = detectPlatform();
  const comment = findComment(commentData);
  
  if (!comment) {
    if (retryCount >= maxRetries) {
      console.log('Comment not found after maximum retries');
      return;
    }
    
    // Fast but not instant backoff
    const backoffTime = 500 + (retryCount * 300); // Adjusted for better user experience
    console.log(`Comment not found, will retry in ${backoffTime/1000} seconds (attempt ${retryCount + 1}/${maxRetries})`);
    
    // For YouTube, try to load more comments by scrolling
    if (platform === 'youtube' && retryCount === 0) {
      // First try, initiate loading of comments with smooth scrolling
      console.log('Starting loading of YouTube comments');
      loadYouTubeComments(() => {
        // After loading, try to find the comment again
        const foundComment = findComment(commentData);
        if (foundComment) {
          console.log('Comment found after loading more comments');
          // Smooth scroll to the comment
          foundComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
          highlightComment(foundComment);
        } else {
          console.log('Comment not found after initial loading, will continue retrying');
          setTimeout(() => {
            scrollToComment(commentData, retryCount + 1, maxRetries);
          }, backoffTime);
        }
      }, 2);
      return;
    } else if (platform === 'youtube') {
      // Jump to different sections to trigger more comment loading
      const sections = [0.3, 0.6, 0.9];
      const section = sections[retryCount % sections.length];
      
      window.scrollTo({
        top: document.body.scrollHeight * section,
        behavior: 'smooth' // Restored smooth scrolling
      });
      
      // Also try forcing comments into view
      const commentsSection = document.querySelector('ytd-comments');
      if (commentsSection) {
        setTimeout(() => {
          commentsSection.scrollIntoView({ behavior: 'smooth' });
        }, 300); // Increased to allow smooth scrolling 
      }
    }
    
    // Wait and retry
    setTimeout(() => {
      scrollToComment(commentData, retryCount + 1, maxRetries);
    }, backoffTime);
    
    return;
  }
  
  // Smooth scroll to the comment
  comment.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Highlight the comment
  highlightComment(comment);
}

// Check if we have a shared comment in the URL - with smooth scrolling
function checkForSharedComment() {
  // Early startup for YouTube to begin loading comments
  const preloadYouTubeComments = () => {
    const commentsSection = document.querySelector('ytd-comments');
    if (commentsSection) {
      // Force comments section into view with smooth scrolling
      commentsSection.scrollIntoView({ behavior: 'smooth' });
      
      // Click to expand comments if they're collapsed
      const expandButton = document.querySelector('#comments-button');
      if (expandButton) expandButton.click();
      
      // Start preloading comments after a short delay
      setTimeout(() => {
        // Quick jump to force loading, but with smooth behavior
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
        
        // Jump back to comments after a moment
        setTimeout(() => {
          commentsSection.scrollIntoView({ behavior: 'smooth' });
        }, 400); // Increased to allow smooth scrolling
      }, 300); // Increased to allow smooth scrolling
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const sharedComment = urlParams.get('shared_comment');
  
  if (!sharedComment) return;
  
  try {
    console.log('Found shared comment in URL:', sharedComment);
    const commentData = JSON.parse(sharedComment);
    
    const platform = detectPlatform();
    
    if (platform === 'youtube') {
      // Approach for YouTube with smooth scrolling
      const initialWait = 1000; // Slightly increased for smooth experience
      
      // Start some operations immediately
      if (commentData.videoId && commentData.videoTimestamp && commentData.videoTimestamp > 0) {
        // Try to get player immediately
        requestAnimationFrame(() => {
          try {
            const player = getYouTubePlayer();
            if (player) {
              if (typeof player.seekTo === 'function') {
                player.seekTo(commentData.videoTimestamp);
              } else if (player.currentTime !== undefined) {
                player.currentTime = commentData.videoTimestamp;
              }
            }
          } catch (e) {
            console.warn('Initial seek attempt failed, will retry:', e);
          }
        });
      }
      
      // Start a timer for the main navigation sequence
      setTimeout(() => {
        // If there's a video timestamp, seek to it first (second attempt)
        if (commentData.videoId && commentData.videoTimestamp && commentData.videoTimestamp > 0) {
          try {
            const player = getYouTubePlayer();
            if (player) {
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
        
        // Scroll to comments section
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
          
          // First try to find the comment immediately
          setTimeout(() => {
            const immediateFind = findComment(commentData);
            if (immediateFind) {
              console.log('Comment found immediately without loading');
              // Smooth scroll to the comment
              immediateFind.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Highlight found comment
              highlightComment(immediateFind);
            } else {
              // Start comment loading with smooth scrolling
              loadYouTubeComments(() => {
                // After loading attempt to navigate
                const foundComment = findComment(commentData);
                if (foundComment) {
                  console.log('Comment found after loading');
                  foundComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  highlightComment(foundComment);
                } else {
                  // Last resort - regular retry approach
                  console.log('Comment not found after initial loading, will retry');
                  scrollToComment(commentData);
                }
              }, 2);
            }
          }, 400); // Small delay to allow comments section to come into view
        } else {
          console.log('Comments section not found, will retry');
          setTimeout(() => checkForSharedComment(), 1000);
        }
      }, initialWait);
      
      // Start preloading comments immediately
      preloadYouTubeComments();
    } else {
      // For other platforms, use smooth scrolling
      setTimeout(() => scrollToComment(commentData), 500);
    }
  } catch (error) {
    console.error('Failed to parse shared comment data', error);
  }
}

// Extract highlight logic to separate function for reuse
function highlightComment(comment) {
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

// Listen for storage changes to update options in real-time
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.options) {
      userOptions = changes.options.newValue;
    }
  });
}

// Initialize on page load with fast startup
function initialize() {
  // Log that the extension is running
  console.log('Comment Share extension initialized');
  
  // Check for shared comment immediately, don't wait for options
  const urlParams = new URLSearchParams(window.location.search);
  const hasSharedComment = urlParams.has('shared_comment');
  
  // If we have a shared comment, start looking immediately
  if (hasSharedComment) {
    // For YouTube, preload comments as early as possible
    if (detectPlatform() === 'youtube') {
      // Try to preload comments right away
      requestAnimationFrame(() => {
        const commentsSection = document.querySelector('ytd-comments');
        if (commentsSection) {
          console.log('Early comment section detection, starting preload');
          commentsSection.scrollIntoView({ behavior: 'auto' });
        }
      });
    }
    
    // Start shared comment processing ASAP
    checkForSharedComment();
  }
  
  // Load user options in parallel
  loadUserOptions(() => {
    // Initial run after options are loaded
    addShareButtonsToComments();
    
    // If we haven't already checked, check for shared comment
    if (!hasSharedComment) {
      checkForSharedComment();
    }
    
    // Set up a MutationObserver to add share buttons to new comments
    const observer = new MutationObserver(() => {
      // Wait a bit to let the DOM settle, but not too long
      setTimeout(addShareButtonsToComments, 300); // Reduced from 500ms
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