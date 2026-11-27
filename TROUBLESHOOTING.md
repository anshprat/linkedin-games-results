# Troubleshooting: No Stats Available

If you're seeing "No stats available yet" after running "Check Games Now", follow these steps:

## Quick Diagnostic Steps

### Step 1: Open Background Console
1. Go to `chrome://extensions/`
2. Find "LinkedIn Games Stats Tracker"
3. Click **"Inspect views: service worker"** (or "service worker" link)
4. This opens the background script console
5. **Keep this window open**

### Step 2: Trigger Manual Check
1. Click the extension icon
2. Click "Check Games Now"
3. **Watch the background console** for logs

**What you should see:**
```
Starting game check for 2025-12-05
Checking Zip...
Zip page loaded, waiting for content...
Zip response: {count: 59, success: true}
✓ Zip: 59 connections played
... (repeat for other games)
Game check complete. Found 6 results: [...]
Results saved successfully
```

### Step 3: Identify the Issue

#### Issue A: "Error sending message to [Game]"
**Cause:** Content script not loading on LinkedIn pages

**Fix:**
1. Check if you're **logged into LinkedIn**
2. Manually visit: https://www.linkedin.com/games/zip/results/
3. Right-click > Inspect > Console tab
4. Look for: `"LinkedIn Games Stats Tracker content script loaded"`
5. If NOT there:
   - Reload the extension at chrome://extensions/
   - Check manifest.json has correct host_permissions
   - Make sure content_scripts matches pattern is correct

#### Issue B: "✗ [Game]: No data extracted"
**Cause:** Content script loaded but can't find the text

**Fix:**
1. Manually visit: https://www.linkedin.com/games/zip/results/
2. Look for text like "59 connections played today"
3. If you see it, note the **exact wording**
4. Open browser console (F12) and run:
   ```javascript
   document.body.innerText.match(/(\d+)\s+connections?\s+played/i)
   ```
5. If this returns `null`, LinkedIn changed their text
6. Copy the exact text you see
7. Update patterns in `content.js`

#### Issue C: "Timeout checking [Game]"
**Cause:** Page taking too long to load

**Fix:**
1. Increase timeout in background.js line 123 from 15000 to 30000
2. Increase wait time in background.js line 108 from 3000 to 5000

#### Issue D: Tabs open but close immediately
**Cause:** LinkedIn redirecting to login page

**Fix:**
1. Make sure you're logged into LinkedIn
2. Visit one game results page manually first
3. Complete any 2FA or verification if prompted

### Step 4: Check Storage

In the background console, run:
```javascript
chrome.storage.local.get(['gameStats', 'fileContent'], (data) => {
  console.log('Storage:', data);
  console.log('Stats count:', data.gameStats?.length || 0);
});
```

**Expected output:**
```javascript
Storage: {
  gameStats: [{date: "2025-12-05", game: "Zip", count: 59}, ...],
  fileContent: "2025-12-05, Zip, 59\n..."
}
Stats count: 6
```

**If storage is empty:**
- Data extraction is failing
- Follow Issue A or B above

### Step 5: Test Individual Game

In background console, run this test:
```javascript
async function testGame() {
  const tab = await chrome.tabs.create({
    url: 'https://www.linkedin.com/games/zip/results/',
    active: true
  });

  setTimeout(async () => {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
      console.log('Test result:', response);
    } catch (error) {
      console.error('Test error:', error);
    }
  }, 5000);
}

testGame();
```

## Common Solutions

### Solution 1: Reload Extension
1. Go to `chrome://extensions/`
2. Find the extension
3. Click the reload icon (↻)
4. Try "Check Games Now" again

### Solution 2: Check LinkedIn Login
1. Open new tab: https://www.linkedin.com
2. Make sure you're logged in
3. Visit: https://www.linkedin.com/games/zip/results/
4. If redirected to login, sign in first

### Solution 3: Re-inject Content Script
The content script might not be registered. Try:
1. Remove the extension
2. Reload it via "Load unpacked"
3. Try again

### Solution 4: Update Content Script Patterns

If LinkedIn changed their UI, you may need to update the regex patterns.

1. Visit a game results page manually
2. Find the text showing connections count
3. Open `content.js`
4. Add the new pattern to the patterns array around line 28

Example: If LinkedIn now shows "59 people played this game today":
```javascript
const patterns = [
  /(\d+)\s+connections?\s+played\s+today/i,
  /(\d+)\s+connections?\s+played/i,
  /(\d+)\s+people\s+played\s+this\s+game\s+today/i,  // Add this
  // ... existing patterns
];
```

## Still Not Working?

### Enable Verbose Logging

The extension already has extensive logging. Check:

1. **Background console**: All main operations
2. **Game page console**: Content script operations
3. **Popup console**: Right-click popup > Inspect

### Share Debug Info

If you need help, share:
1. Background console logs (full output after "Check Games Now")
2. Output of storage check (Step 4 above)
3. Screenshot of a game results page showing the connections text
4. Chrome version: chrome://version/

### Manual Workaround

If automated extraction isn't working, you can manually test if content script works:

1. Visit: https://www.linkedin.com/games/zip/results/
2. Open console (F12)
3. Run:
   ```javascript
   // Test pattern matching
   const bodyText = document.body.innerText;
   console.log('Body text sample:', bodyText.substring(0, 500));

   const match = bodyText.match(/(\d+)\s+connections?\s+played/i);
   console.log('Match result:', match);

   if (match) {
     console.log('Found count:', parseInt(match[1]));
   }
   ```

This will show if the pattern can find the data on the page.
