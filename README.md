# NextBarrio Property Parser

A simple tool to extract property listings and save them to Notion.

## Quick Start

1. **Double-click** `Start NextBarrio Parser.command`
2. The app opens in your browser at `http://localhost:3000`
3. First time: add your Claude API key in Settings
4. Drag the bookmarklet to your bookmarks bar

## Daily Workflow

1. Go to any property listing (Idealista, Fotocasa, Badi, etc.)
2. Click the **"Send to NextBarrio"** bookmarklet
3. The parser opens with everything pre-filled
4. Click **"Parse & Save to Notion"**
5. Done! Check your Notion database.

## Files

- `Start NextBarrio Parser.command` - Double-click to start the app
- `server.py` - The Python server (don't edit unless you know what you're doing)
- `index.html` - The web interface
- `config.json` - Your saved API keys (auto-created)

## First Time Setup

### On Mac

If you get a security warning when double-clicking:
1. Right-click the file → Open
2. Click "Open" in the dialog

Or run in Terminal:
```bash
chmod +x "Start NextBarrio Parser.command"
```

### API Keys

- **Claude API Key**: Get from https://console.anthropic.com
- **Notion Integration**: Already configured!

## Troubleshooting

**"Python not found"**
- Install Python from https://www.python.org/downloads/

**Bookmarklet doesn't work**
- Make sure the parser app is running first
- Some browsers block popups - allow popups for the listing site

**Images not showing in Notion**
- Some listing sites block external access to images
- The images may expire after some time

## Notion Database Fields

Make sure your Notion database has these columns:
- Name (title) - auto-filled with description
- Property type (select: long_term, temporal, vacacional)
- Address (text)
- Status (select: to contact, waiting for reply, etc.)
- Area (text)
- Availability (select: available, not available anymore, not available yet)
- Availability date (date)
- price/month (number)
- size m2 (number)
- price/m2 (number)
- double bedrooms (number)
- single bedrooms (number)
- terrace (checkbox)
- external (checkbox)
- balcony (checkbox)
- elevator (checkbox)
- air conditioning (checkbox)
- closets (checkbox)
- wifi included (checkbox)
- utilities included (checkbox)
- comments (text)
- condition (text)
- overall description (text)
- URL (url)
