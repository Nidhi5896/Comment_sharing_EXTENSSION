// Listen for when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('Comment Share extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSharedComment') {
    // Forward the message to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'scrollToComment',
          commentData: message.commentData
        });
      }
    });
  }
  return true;
}); 