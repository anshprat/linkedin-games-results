// Popup script for LinkedIn Games Stats Tracker

document.addEventListener('DOMContentLoaded', () => {
  loadScheduleTime();
  loadLastUpdated();

  document.getElementById('checkNow').addEventListener('click', checkGamesNow);
  document.getElementById('downloadBtn').addEventListener('click', downloadResults);
  document.getElementById('viewStats').addEventListener('click', viewAllStats);
  document.getElementById('settingsLink').addEventListener('click', openSettings);
});

// Load and display scheduled time
async function loadScheduleTime() {
  const data = await chrome.storage.local.get(['scheduleHour', 'scheduleMinute']);
  const hour = data.scheduleHour !== undefined ? data.scheduleHour : 13;
  const minute = data.scheduleMinute !== undefined ? data.scheduleMinute : 15;

  // Format time as 12-hour with AM/PM
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');

  document.getElementById('scheduleTime').textContent = `Daily at ${displayHour}:${displayMinute} ${period}`;
}

// Open settings page
function openSettings(e) {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
}

// Load last updated time
function loadLastUpdated() {
  chrome.runtime.sendMessage({ action: 'getResults' }, (response) => {
    if (response && response.lastUpdated) {
      const lastUpdatedDiv = document.getElementById('lastUpdated');
      const lastUpdateTime = document.getElementById('lastUpdateTime');
      const date = new Date(response.lastUpdated);
      lastUpdateTime.textContent = date.toLocaleString();
      lastUpdatedDiv.style.display = 'block';
    }
  });
}

// Trigger immediate check
function checkGamesNow() {
  const button = document.getElementById('checkNow');
  const statusDiv = document.getElementById('status');

  button.disabled = true;
  button.textContent = 'Checking...';

  statusDiv.innerHTML = '<div class="loading">Opening game pages and extracting data...<br>This may take a minute.</div>';

  chrome.runtime.sendMessage({ action: 'checkNow' }, (response) => {
    button.disabled = false;
    button.textContent = 'Check Games Now';

    if (response && response.success) {
      statusDiv.innerHTML = '<div class="status success">✓ Games checked successfully!</div>';
      setTimeout(() => {
        statusDiv.innerHTML = '';
        loadLastUpdated();
      }, 3000);
    } else {
      statusDiv.innerHTML = '<div class="status error">✗ Error checking games. Please try again.</div>';
      setTimeout(() => {
        statusDiv.innerHTML = '';
      }, 5000);
    }
  });
}

// Download results as text file
function downloadResults() {
  chrome.runtime.sendMessage({ action: 'downloadFile' }, (response) => {
    if (response && response.content) {
      const blob = new Blob([response.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'results.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const statusDiv = document.getElementById('status');
      statusDiv.innerHTML = '<div class="status success">✓ File downloaded!</div>';
      setTimeout(() => {
        statusDiv.innerHTML = '';
      }, 3000);
    } else {
      const statusDiv = document.getElementById('status');
      statusDiv.innerHTML = '<div class="status error">✗ No data available to download.</div>';
      setTimeout(() => {
        statusDiv.innerHTML = '';
      }, 3000);
    }
  });
}

// View all stats
function viewAllStats() {
  const statsDiv = document.getElementById('stats');

  chrome.runtime.sendMessage({ action: 'getResults' }, (response) => {
    console.log('getResults response:', response);

    if (response && response.gameStats && response.gameStats.length > 0) {
      statsDiv.innerHTML = '<h3 style="font-size: 14px; margin: 10px 0;">Recent Stats:</h3>';

      // Show last 20 entries
      const recentStats = response.gameStats.slice(-20).reverse();

      recentStats.forEach(stat => {
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `
          <div>
            <span class="game-name">${stat.game}</span>
            <div style="font-size: 11px; color: #666;">${stat.date}</div>
          </div>
          <div style="font-weight: 600;">${stat.count} played</div>
        `;
        statsDiv.appendChild(item);
      });
    } else {
      statsDiv.innerHTML = '<div class="loading">No stats available yet.<br>Click "Check Games Now" to start tracking.</div>';
      console.warn('No stats found. Response:', response);
    }
  });
}
