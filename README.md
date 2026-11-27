# LinkedIn Games Stats Tracker

A Chrome and Firefox extension that automatically tracks daily participation stats for LinkedIn games.

## ⚠️ Important Requirement

**You must complete each game before the extension can collect stats for that day.**

LinkedIn only shows the "X connections played today" information on the results page **after you've played the game**. Schedule your automatic check for a time when you've typically finished your daily games (e.g., evening or late afternoon).

## Features

- **Configurable schedule**: Set your preferred time for daily automatic checks
- Automatically checks LinkedIn game results every day at your chosen time (default: 1:15 PM)
- Extracts the number of connections who played each game
- Saves data to a downloadable results.txt file
- Tracks 6 LinkedIn games: Zip, Mini Sudoku, Tango, Queens, Pinpoint, and Crossclimb
- Manual check option available through popup interface

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right
4. Click "Load unpacked"
5. Select the `linkedin-games-results` folder

## Firefox

Firefox 140 or later is necessary. Firefox uses the same code as Chrome, with a different manifest. Load the Firefox build, not the repository root.

1. Run `./package.sh firefox`. This writes the Firefox build to `build/firefox/`. The script needs `jq` and `zip`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `build/firefox/manifest.json`.

Firefox removes a temporary add-on when it closes. To keep the add-on installed, sign it on addons.mozilla.org (AMO) as unlisted:

```bash
npx web-ext sign --channel=unlisted --source-dir build/firefox --artifacts-dir build/signed
```

The command reads your AMO API keys from the `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` environment variables. Create the keys at https://addons.mozilla.org/en-US/developers/addon/api/key/.

`./package.sh` with no argument makes `linkedin-games-stats-tracker-chrome-vX.Y.Z.zip` and `linkedin-games-stats-tracker-firefox-vX.Y.Z.zip`. The Firefox manifest is `manifest.json` merged with `firefox/manifest.overrides.json`.

## Usage

### Configure Schedule

1. Click the extension icon in Chrome toolbar
2. Click "⚙️ Settings" at the bottom
3. Select your preferred hour and minute for daily checks
4. Click "Save Settings"
5. The alarm will be automatically rescheduled

**Default schedule**: 1:15 PM daily

**Recommended**: Set the schedule for **after** you typically complete your daily games (e.g., 8:00 PM or 10:00 PM).

### Automatic Daily Tracking

The extension automatically checks game stats every day at your configured time. No action required after setup.

**Important**: Make sure you've played the games before the scheduled time, otherwise the extension won't be able to access the results pages.

### Manual Check

1. **Complete your daily games first** on LinkedIn
2. Click the extension icon in Chrome toolbar
3. Click "Check Games Now"
4. Wait for the process to complete (takes about 1-2 minutes)

### Download Results

1. Click the extension icon
2. Click "Download results.txt"
3. The file will be saved to your downloads folder

### View Stats

Click "View All Stats" in the popup to see recent game participation data.

## Data Format

The results.txt file contains comma-separated data in the format:

```
YYYY-MM-DD, Game Name, Number of Connections
```

Example:
```
2025-12-05, Zip, 59
2025-12-05, Mini Sudoku, 42
2025-12-05, Tango, 38
```

## How It Works

1. The extension uses Chrome's alarms API to schedule daily checks
2. At the scheduled time, it opens each game's results page in a background tab
3. A content script extracts the participation count using pattern matching
4. Data is stored in Chrome's local storage
5. Results are compiled into a downloadable text file

## Permissions

- `alarms`: Schedule daily checks
- `storage`: Save game statistics
- `tabs`: Open game results pages
- `scripting`: Inject content scripts to extract data
- `https://www.linkedin.com/games/*`: Access LinkedIn game pages

## Privacy

This extension only accesses LinkedIn game results pages and stores data locally in your browser. No data is sent to external servers.

## Troubleshooting

### Extension not collecting data

1. Make sure you're logged into LinkedIn
2. Manually visit one of the game results pages to ensure you have access
3. Check the console for errors (right-click extension icon > Inspect popup)

### Alarm not triggering

1. Check that Chrome is running at 1:15 PM
2. Visit `chrome://extensions/` and check if the extension is enabled
3. Click the extension icon and manually trigger "Check Games Now"

## Games Tracked

- **Zip**: https://www.linkedin.com/games/zip/results/
- **Mini Sudoku**: https://www.linkedin.com/games/mini-sudoku/results/
- **Tango**: https://www.linkedin.com/games/tango/results/
- **Queens**: https://www.linkedin.com/games/queens/results/
- **Pinpoint**: https://www.linkedin.com/games/pinpoint/results/
- **Crossclimb**: https://www.linkedin.com/games/crossclimb/results/

## Technical Notes

Since LinkedIn doesn't provide a public API for game statistics, this extension uses web scraping to extract data. The content script looks for patterns like "X connections played today" in the page content.

## License

MIT License
