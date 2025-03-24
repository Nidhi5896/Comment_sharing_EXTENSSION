// Utility script to help update selectors for social media platforms
// Run this in the browser console on the target platform to identify current selectors

/**
 * This utility helps identify CSS selectors for elements on social media platforms.
 * If a platform updates its DOM structure, run this in the browser console
 * to find updated selectors.
 */

const SelectorFinder = {
  // Find potential comment containers
  findCommentContainers: function() {
    // Common patterns for comment containers
    const potentialSelectors = [
      // General comment container patterns
      '[data-testid*="comment"]',
      '[class*="comment"]',
      '[id*="comment"]',
      
      // Platform specific patterns
      '.x1lliihq', // Facebook
      '[data-testid="tweet"]', // Twitter
      '.Comment', // Reddit
      'ytd-comment-thread-renderer', // YouTube
      '._a9zr', // Instagram
      '.comments-comment-item' // LinkedIn
    ];
    
    const results = {};
    
    potentialSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results[selector] = elements.length;
        }
      } catch (e) {
        console.error(`Error with selector ${selector}:`, e);
      }
    });
    
    console.log('Potential comment containers:', results);
    return results;
  },
  
  // Find potential text content selectors within a container
  findTextSelectors: function(containerSelector) {
    const containers = document.querySelectorAll(containerSelector);
    if (containers.length === 0) {
      console.log('No containers found with selector:', containerSelector);
      return;
    }
    
    // Common patterns for text content
    const textPatterns = [
      // Text content selectors
      'p', 'span', 'div', '[class*="text"]', '[class*="content"]',
      '[data-testid*="text"]', '[data-testid*="content"]'
    ];
    
    const results = {};
    const container = containers[0]; // Use the first container as example
    
    textPatterns.forEach(pattern => {
      try {
        const elements = container.querySelectorAll(pattern);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text && text.length > 10 && text.length < 1000) {
            // Compute a specific selector for this element
            const specificSelector = this.getSpecificSelector(el, container);
            if (specificSelector) {
              results[specificSelector] = text.substring(0, 50) + (text.length > 50 ? '...' : '');
            }
          }
        });
      } catch (e) {
        console.error(`Error with text pattern ${pattern}:`, e);
      }
    });
    
    console.log('Potential text content selectors within', containerSelector, ':', results);
    return results;
  },
  
  // Find username selectors within a container
  findUsernameSelectors: function(containerSelector) {
    const containers = document.querySelectorAll(containerSelector);
    if (containers.length === 0) return;
    
    // Common patterns for usernames
    const usernamePatterns = [
      'a', '[class*="user"]', '[class*="author"]', '[class*="name"]',
      '[data-testid*="user"]', '[data-testid*="author"]', '[data-testid*="name"]'
    ];
    
    const results = {};
    const container = containers[0];
    
    usernamePatterns.forEach(pattern => {
      try {
        const elements = container.querySelectorAll(pattern);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text && text.length > 1 && text.length < 50) {
            const specificSelector = this.getSpecificSelector(el, container);
            if (specificSelector) {
              results[specificSelector] = text;
            }
          }
        });
      } catch (e) {
        console.error(`Error with username pattern ${pattern}:`, e);
      }
    });
    
    console.log('Potential username selectors within', containerSelector, ':', results);
    return results;
  },
  
  // Find timestamp selectors within a container
  findTimestampSelectors: function(containerSelector) {
    const containers = document.querySelectorAll(containerSelector);
    if (containers.length === 0) return;
    
    // Common patterns for timestamps
    const timestampPatterns = [
      'time', '[class*="time"]', '[class*="date"]', '[datetime]',
      '[data-testid*="time"]', '[data-testid*="date"]'
    ];
    
    const results = {};
    const container = containers[0];
    
    timestampPatterns.forEach(pattern => {
      try {
        const elements = container.querySelectorAll(pattern);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text && (
              text.match(/\d/) || // Contains a digit
              text.includes('ago') || // Contains "ago"
              text.includes('min') || // Contains "min"
              text.includes('hour') || // Contains "hour"
              text.includes('day') // Contains "day"
            )) {
            const specificSelector = this.getSpecificSelector(el, container);
            if (specificSelector) {
              results[specificSelector] = text;
            }
          }
        });
      } catch (e) {
        console.error(`Error with timestamp pattern ${pattern}:`, e);
      }
    });
    
    console.log('Potential timestamp selectors within', containerSelector, ':', results);
    return results;
  },
  
  // Find action bar selectors (where to insert the share button)
  findActionBarSelectors: function(containerSelector) {
    const containers = document.querySelectorAll(containerSelector);
    if (containers.length === 0) return;
    
    // Common patterns for action bars
    const actionBarPatterns = [
      '[role="group"]', '[class*="action"]', '[class*="toolbar"]', 
      '[class*="button"]', '[class*="controls"]', '[class*="footer"]'
    ];
    
    const results = {};
    const container = containers[0];
    
    actionBarPatterns.forEach(pattern => {
      try {
        const elements = container.querySelectorAll(pattern);
        elements.forEach(el => {
          // Check if it looks like an action bar (has buttons or links)
          const hasButtons = el.querySelectorAll('button, a').length > 0;
          if (hasButtons) {
            const specificSelector = this.getSpecificSelector(el, container);
            if (specificSelector) {
              results[specificSelector] = `${el.querySelectorAll('button, a').length} actions`;
            }
          }
        });
      } catch (e) {
        console.error(`Error with action bar pattern ${pattern}:`, e);
      }
    });
    
    console.log('Potential action bar selectors within', containerSelector, ':', results);
    return results;
  },
  
  // Helper to get a specific CSS selector for an element
  getSpecificSelector: function(element, container) {
    // Try by ID
    if (element.id) {
      return '#' + element.id;
    }
    
    // Try by class
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c);
      if (classes.length > 0) {
        return '.' + classes[0];
      }
    }
    
    // Try by data-testid
    if (element.dataset && element.dataset.testid) {
      return `[data-testid="${element.dataset.testid}"]`;
    }
    
    // Try by tag name and position
    const tagName = element.tagName.toLowerCase();
    const sameTagElements = container.querySelectorAll(tagName);
    if (sameTagElements.length === 1) {
      return tagName;
    }
    
    // Default - couldn't find a specific selector
    return null;
  },
  
  // Run all selector finders
  analyzeCurrentPlatform: function() {
    console.log('=== SOCIAL MEDIA SELECTOR ANALYZER ===');
    console.log('Analyzing current page...');
    
    const commentContainers = this.findCommentContainers();
    const containerSelector = Object.keys(commentContainers)[0];
    
    if (containerSelector) {
      console.log(`\nUsing container selector: ${containerSelector}`);
      
      this.findTextSelectors(containerSelector);
      this.findUsernameSelectors(containerSelector);
      this.findTimestampSelectors(containerSelector);
      this.findActionBarSelectors(containerSelector);
      
      console.log('\n=== PLATFORM ANALYSIS COMPLETE ===');
      console.log('Copy the best selectors into content.js PLATFORMS object for the current platform.');
    } else {
      console.log('No comment containers detected on this page.');
    }
  }
};

// Instructions for use
console.log(`
=== COMMENT SHARE SELECTOR UPDATER ===
Use this tool to find updated selectors for social media platforms.

To analyze the current page, run:
SelectorFinder.analyzeCurrentPlatform()

This will display potential selectors for:
1. Comment containers
2. Comment text
3. Usernames
4. Timestamps
5. Action bars (where to place the Share button)

Copy the best matches into the PLATFORMS object in content.js
`);

// Make it accessible globally
window.SelectorFinder = SelectorFinder; 