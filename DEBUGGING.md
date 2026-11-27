# Debugging Guide

## How to Debug the Extension

### Step 1: Check Background Script Console

1. Open Chrome and go to `chrome://extensions/`
2. Find "LinkedIn Games Stats Tracker"
3. Click "Inspect views: service worker" (this opens the background script console)
4. Keep this console open
5. Click the extension icon and press "Check Games Now"
6. Watch the console for logs

**What to look for:**
- "Starting game check for [date]"
- "Checking [Game Name]..."
- "[Game Name] page loaded, waiting for content..."
- "[Game Name] response: {count: X, success: true}"
- "✓ [Game Name]: X connections played"

**Common errors:**
- "Error sending message": Content script not loaded or permission issue
- "Timeout checking [Game Name]": Page took too long to load
- "No data extracted": Content script couldn't find the pattern

### Step 2: Check Content Script on Game Page

1. Manually open a game results page: https://www.linkedin.com/games/zip/results/
2. Right-click on the page and select "Inspect"
3. Go to the Console tab
4. You should see: "LinkedIn Games Stats Tracker content script loaded"

**If you don't see the log:**
- The content script isn't loading
- Check if you're logged into LinkedIn
- Reload the extension at chrome://extensions/

**To manually test extraction:**
```javascript
// In the console, run this to see what the content script sees:
console.log(document.body.innerText);

// Look for text like "59 connections played today"
```

### Step 3: Check Storage

1. In the background script console (from Step 1), run:
```javascript
chrome.storage.local.get(['gameStats', 'fileContent', 'lastUpdated'], (data) => {
  console.log('Stored data:', data);
});
```

2. This will show you what data is actually saved

**To clear storage and start fresh:**
```javascript
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
});
```

### Step 4: Manual Content Script Test

1. Go to a game results page
2. Open DevTools Console
3. Run this test:
```javascript
// Test if the pattern exists
const bodyText = document.body.innerText;
const pattern = /(\d+)\s+connections?\s+played\s+today/i;
const match = bodyText.match(pattern);
console.log('Match:', match);
```

## Common Issues and Solutions

### Issue: No data being extracted

**Possible causes:**
1. **Not logged into LinkedIn** - You must be logged in
2. **Page structure changed** - LinkedIn may have updated their HTML
3. **Dynamic content not loaded** - The extension waits 3 seconds, but may need more

**Solutions:**
- Manually visit the results pages and check if you can see "X connections played today"
- Copy the exact text and update the patterns in content.js
- Increase the wait time in background.js (line 103) from 3000ms to 5000ms

### Issue: Extension icon not showing

**Solution:**
- Make sure the extension is enabled at chrome://extensions/
- Check if icon files exist: icon16.png, icon48.png, icon128.png

### Issue: "Checking games now" never completes

**Possible causes:**
- LinkedIn requires authentication
- Network/connection issues
- Rate limiting

**Solutions:**
- Manually visit https://www.linkedin.com/games/zip/results/ first
- Check if you get redirected to login page
- Wait a few minutes and try again

### Issue: Results show but download is empty

**Solution:**
Check if data is in storage:
```javascript
// In background script console:
chrome.storage.local.get(['fileContent'], (data) => {
  console.log('File content:', data.fileContent);
});
```

## Debugging Script

Run this in the background script console for a complete diagnostic:

```javascript
async function debugExtension() {
  console.log('=== Extension Diagnostic ===');

  // Check storage
  const data = await chrome.storage.local.get(['gameStats', 'fileContent', 'lastUpdated']);
  console.log('Storage data:', data);
  console.log('- Stats entries:', data.gameStats?.length || 0);
  console.log('- File content length:', data.fileContent?.length || 0);
  console.log('- Last updated:', data.lastUpdated);

  // Check alarms
  const alarms = await chrome.alarms.getAll();
  console.log('Active alarms:', alarms);

  // Check permissions
  const permissions = await chrome.permissions.getAll();
  console.log('Permissions:', permissions);

  console.log('=== End Diagnostic ===');
}

debugExtension();
```

## Testing Individual Games

To test a specific game manually:

```javascript
// In background script console:
async function testSingleGame() {
  const game = { name: 'Zip', url: 'https://www.linkedin.com/games/zip/results/' };
  const tab = await chrome.tabs.create({ url: game.url, active: true });

  setTimeout(async () => {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
    console.log('Game data:', response);
  }, 5000);
}

testSingleGame();
```

## Next Steps if Still Not Working

1. **Share console logs:** Copy the output from both background and content script consoles
2. **Check LinkedIn page structure:** Visit the game results page and inspect the HTML to find where "X connections played" appears
3. **Update patterns:** If LinkedIn changed their text, update the regex patterns in content.js
4. **Increase timeouts:** Edit background.js to wait longer for pages to load
