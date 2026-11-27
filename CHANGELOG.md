# Changelog

## Version 1.0.0

### Features
- ✅ Automatic daily tracking of LinkedIn game statistics
- ✅ Configurable schedule (set custom time for daily checks)
- ✅ Manual "Check Games Now" option
- ✅ Download results as results.txt file
- ✅ View stats directly in popup
- ✅ Tracks 6 games: Zip, Mini Sudoku, Tango, Queens, Pinpoint, Crossclimb
- ✅ Settings page for customization
- ✅ Comprehensive debugging and logging

### Games Tracked
1. LinkedIn Zip
2. LinkedIn Mini Sudoku
3. LinkedIn Tango
4. LinkedIn Queens
5. LinkedIn Pinpoint
6. LinkedIn Crossclimb

### Default Settings
- **Schedule**: 1:15 PM daily
- **Wait time**: 3 seconds for dynamic content to load
- **Page timeout**: 15 seconds per game
- **Delay between games**: 2 seconds

### Files
- `manifest.json` - Extension configuration
- `background.js` - Service worker with scheduling logic
- `content.js` - Data extraction from LinkedIn pages
- `popup.html/js` - User interface
- `options.html/js` - Settings page
- `README.md` - Documentation
- `DEBUGGING.md` - Troubleshooting guide
- `CHANGELOG.md` - This file

### How It Works
1. Chrome alarms API schedules daily checks at configured time
2. Background script opens each game's results page in sequence
3. Content script extracts participation count using regex patterns
4. Data is saved to Chrome local storage
5. Results are compiled into downloadable text file format: `DATE, GAME, COUNT`

### Known Limitations
- **⚠️ CRITICAL**: You must complete each game before the extension can collect stats. LinkedIn only shows participation data on results pages after you've played that day's game.
- Requires Chrome to be running at scheduled time
- Requires user to be logged into LinkedIn
- Uses web scraping (no official API available)
- LinkedIn page structure changes may require pattern updates

### Recommended Usage
- Set scheduled time for **after** you typically complete your daily games (e.g., evening)
- Default 1:15 PM may be too early if you play games later in the day
- For manual checks: play all games first, then run "Check Games Now"
