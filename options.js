// Options page script for LinkedIn Games Stats Tracker

const DEFAULT_HOUR = 13; // 1 PM
const DEFAULT_MINUTE = 15;

// Load saved settings
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  updateNextCheckTime();

  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('resetBtn').addEventListener('click', resetSettings);

  // Update next check time when values change
  document.getElementById('scheduleHour').addEventListener('change', updateNextCheckTime);
  document.getElementById('scheduleMinute').addEventListener('change', updateNextCheckTime);
});

// Load settings from storage
async function loadSettings() {
  const data = await chrome.storage.local.get(['scheduleHour', 'scheduleMinute']);

  const hour = data.scheduleHour !== undefined ? data.scheduleHour : DEFAULT_HOUR;
  const minute = data.scheduleMinute !== undefined ? data.scheduleMinute : DEFAULT_MINUTE;

  document.getElementById('scheduleHour').value = hour;
  document.getElementById('scheduleMinute').value = minute;
}

// Save settings to storage
async function saveSettings() {
  const hour = parseInt(document.getElementById('scheduleHour').value);
  const minute = parseInt(document.getElementById('scheduleMinute').value);

  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    // Save to storage
    await chrome.storage.local.set({
      scheduleHour: hour,
      scheduleMinute: minute
    });

    // Notify background script to update alarm
    await chrome.runtime.sendMessage({
      action: 'updateSchedule',
      hour: hour,
      minute: minute
    });

    statusDiv.className = 'status success';
    statusDiv.textContent = '✓ Settings saved successfully! Alarm has been rescheduled.';

    updateNextCheckTime();

    setTimeout(() => {
      statusDiv.className = 'status';
      statusDiv.style.display = 'none';
    }, 3000);

  } catch (error) {
    statusDiv.className = 'status error';
    statusDiv.textContent = '✗ Error saving settings: ' + error.message;
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Settings';
  }
}

// Reset to default settings
async function resetSettings() {
  document.getElementById('scheduleHour').value = DEFAULT_HOUR;
  document.getElementById('scheduleMinute').value = DEFAULT_MINUTE;

  updateNextCheckTime();

  const statusDiv = document.getElementById('status');
  statusDiv.className = 'status success';
  statusDiv.textContent = 'Settings reset to default (1:15 PM). Click "Save Settings" to apply.';
  statusDiv.style.display = 'block';
}

// Calculate and display next check time
function updateNextCheckTime() {
  const hour = parseInt(document.getElementById('scheduleHour').value);
  const minute = parseInt(document.getElementById('scheduleMinute').value);

  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, minute, 0, 0);

  // If it's already past the scheduled time today, show tomorrow's time
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  document.getElementById('nextCheckTime').textContent = scheduledTime.toLocaleString('en-US', options);
}
