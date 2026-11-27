// Background service worker for LinkedIn Games Stats Tracker

const GAME_URLS = [
  { name: 'Zip', url: 'https://www.linkedin.com/games/zip/results/' },
  { name: 'Mini Sudoku', url: 'https://www.linkedin.com/games/mini-sudoku/results/' },
  { name: 'Tango', url: 'https://www.linkedin.com/games/tango/results/' },
  { name: 'Queens', url: 'https://www.linkedin.com/games/queens/results/' },
  { name: 'Pinpoint', url: 'https://www.linkedin.com/games/pinpoint/results/' },
  { name: 'Crossclimb', url: 'https://www.linkedin.com/games/crossclimb/results/' }
];

const ALARM_NAME = 'dailyGameCheck';

// Set up alarm when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Games Stats Tracker installed');
  setupDailyAlarm();
});

// Set up daily alarm with configurable time
async function setupDailyAlarm() {
  // Get configured time from storage, default to 1:15 PM
  const data = await chrome.storage.local.get(['scheduleHour', 'scheduleMinute']);
  const hour = data.scheduleHour !== undefined ? data.scheduleHour : 13;
  const minute = data.scheduleMinute !== undefined ? data.scheduleMinute : 15;

  // Clear any existing alarms
  chrome.alarms.clear(ALARM_NAME, () => {
    // Calculate next scheduled time
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // If it's already past the scheduled time today, schedule for tomorrow
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Create alarm
    chrome.alarms.create(ALARM_NAME, {
      when: scheduledTime.getTime(),
      periodInMinutes: 24 * 60 // Repeat daily
    });

    console.log(`Alarm set for ${scheduledTime.toLocaleString()} (${hour}:${minute.toString().padStart(2, '0')})`);
  });
}

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('Daily alarm triggered, checking games...');
    checkAllGames();
  }
});

// Function to check all games
async function checkAllGames() {
  const today = new Date().toISOString().split('T')[0];
  const results = [];

  console.log(`Starting game check for ${today}`);

  for (const game of GAME_URLS) {
    try {
      console.log(`Checking ${game.name}...`);

      // Open each game results page in a new tab
      const tab = await chrome.tabs.create({ url: game.url, active: false });

      // Wait for the page to load and extract data
      await new Promise((resolve) => {
        let resolved = false;

        const listener = (tabId, changeInfo) => {
          if (tabId === tab.id && changeInfo.status === 'complete') {
            console.log(`${game.name} page loaded, waiting for content...`);

            // Wait a bit more for dynamic content to load
            setTimeout(() => {
              // Inject content script to extract data
              chrome.tabs.sendMessage(tab.id, { action: 'extract' }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error(`Error sending message to ${game.name}:`, chrome.runtime.lastError.message);
                } else {
                  console.log(`${game.name} response:`, response);

                  if (response && response.count) {
                    results.push({
                      date: today,
                      game: game.name,
                      count: response.count
                    });
                    console.log(`✓ ${game.name}: ${response.count} connections played`);
                  } else {
                    console.warn(`✗ ${game.name}: No data extracted`, response);
                  }
                }

                // Close the tab after extraction
                if (!resolved) {
                  resolved = true;
                  chrome.tabs.onUpdated.removeListener(listener);
                  chrome.tabs.remove(tab.id).catch(e => console.error('Error closing tab:', e));
                  resolve();
                }
              });
            }, 3000); // Wait 3 seconds for dynamic content
          }
        };

        chrome.tabs.onUpdated.addListener(listener);

        // Timeout after 15 seconds
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.warn(`Timeout checking ${game.name}`);
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.tabs.remove(tab.id).catch(e => console.error('Error closing tab:', e));
            resolve();
          }
        }, 15000);
      });

      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`Error checking ${game.name}:`, error);
    }
  }

  console.log(`Game check complete. Found ${results.length} results:`, results);

  // Save results even if empty (for debugging)
  if (results.length > 0) {
    await saveResults(results);
  } else {
    console.warn('No results to save. Check console logs for errors.');
  }

  return results;
}

// Save results to storage and generate downloadable file
async function saveResults(results) {
  try {
    // Get existing data
    const data = await chrome.storage.local.get(['gameStats']);
    const existingStats = data.gameStats || [];

    // Append new results
    const updatedStats = [...existingStats, ...results];

    // Save to storage
    await chrome.storage.local.set({ gameStats: updatedStats });

    // Generate text file content
    let fileContent = '';
    for (const result of results) {
      fileContent += `${result.date}, ${result.game}, ${result.count}\n`;
    }

    // Append to existing file content if it exists
    const existingFile = await chrome.storage.local.get(['fileContent']);
    const newFileContent = (existingFile.fileContent || '') + fileContent;

    await chrome.storage.local.set({
      fileContent: newFileContent,
      lastUpdated: new Date().toISOString()
    });

    console.log('Results saved successfully');
  } catch (error) {
    console.error('Error saving results:', error);
  }
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkNow') {
    checkAllGames().then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'getResults') {
    chrome.storage.local.get(['gameStats', 'fileContent', 'lastUpdated']).then((data) => {
      sendResponse(data);
    });
    return true;
  }

  if (request.action === 'downloadFile') {
    chrome.storage.local.get(['fileContent']).then((data) => {
      sendResponse({ content: data.fileContent || '' });
    });
    return true;
  }

  if (request.action === 'updateSchedule') {
    console.log(`Updating schedule to ${request.hour}:${request.minute}`);
    setupDailyAlarm().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
