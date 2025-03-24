# Comment Share Chrome Extension

A Chrome extension that allows users to share specific comments from various social media platforms like Facebook, Twitter/X, Reddit, YouTube, Instagram, and LinkedIn.

## Features

- Adds a "Share Comment" button next to each comment on supported social media platforms
- Creates shareable URLs with comment identifiers
- When opening a shared URL, automatically scrolls to and highlights the shared comment
- Works across multiple social media platforms with a unified experience

## Installation

1. Clone this repository or download the source code
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files
5. The extension should now be installed and active

## Adding Extension Icons

Before using the extension, you need to add icon files to the `images` directory:

- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

## Usage

### Sharing a Comment

1. Navigate to any supported social media platform (Facebook, Twitter/X, Reddit, YouTube, Instagram, LinkedIn)
2. Find the comment you want to share
3. Click the "Share Comment" button that appears next to the comment
4. The shareable URL is automatically copied to your clipboard
5. Share this URL with others

### Viewing a Shared Comment

1. Click on a shared comment URL
2. The page will load and automatically scroll to the shared comment
3. The comment will be briefly highlighted for visibility

## Supported Platforms

- Facebook
- Twitter/X
- Reddit
- YouTube
- Instagram
- LinkedIn

## Customization

You can modify the selectors in the `content.js` file to better match the current DOM structure of each platform if needed. Social media platforms frequently change their HTML structure, so updates may be necessary.

## Technical Notes

- The extension uses a content script that runs on supported social media sites
- Comment identification is done through a combination of text content, username, timestamp, and a hash of the comment text
- A MutationObserver is used to detect and add share buttons to new comments as they load
- The extension requires the "activeTab" and "storage" permissions

## Troubleshooting

If the extension doesn't find a shared comment:

1. Make sure the comment still exists (hasn't been deleted)
2. Try refreshing the page
3. The comment might have been modified since it was shared
