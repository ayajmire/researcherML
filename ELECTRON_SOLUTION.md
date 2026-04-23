# Electron Issue & Solutions

## Problem Summary
Your Mac has a deep Electron module loading bug where `require('electron')` returns a string path instead of the Electron API objects (`app`, `BrowserWindow`, etc.). This is a known macOS + npm cache + security issue that cannot be easily fixed.

## What We Tried
1. ✗ Reinstalling Electron multiple times (v16, v20, v28, v41)
2. ✗ Manually downloading Electron binaries from GitHub
3. ✗ Clearing npm cache
4. ✗ Removing quarantine flags
5. ✗ Custom module loaders

All attempts show the same problem: `app` and `BrowserWindow` are **undefined** because Electron's internal module interception system is failing on your Mac.

## macOS Security Issue
The error `task_name_for_pid: (os/kern) failure (5)` indicates macOS is blocking Electron from accessing certain system APIs due to security restrictions.

## SOLUTION 1: Use the Web Version (Recommended for Testing)

Since you mentioned you're in "testing and iteration phase", the **fastest** way to get a working desktop-like experience is to:

1. Run the Python backend:
```bash
cd backend
python3 main.py
```

2. Open in browser:
```
http://localhost:8000
```

3. For desktop-like experience, create an app shortcut:
- Chrome: Menu → More Tools → Create Shortcut → Check "Open as window"
- Safari: File → Add to Dock
- Firefox: Install PWA extension

This gives you a native-looking app window without Electron issues.

## SOLUTION 2: Use the Start Script (Simpler)

Your project already has a `start.sh` script that launches both backend and opens the browser:

```bash
chmod +x start.sh
./start.sh
```

## SOLUTION 3: Build Native App with electron-builder

Even though `electron` command fails, `electron-builder` might work because it bundles everything differently:

```bash
npm run build:mac
```

Then open: `dist/ResearcherML.app`

This may work because the built app has different security signatures than the dev environment.

## SOLUTION 4: Use Docker + Browser

Package the whole app in Docker for consistent behavior:

```bash
# Create Dockerfile in project root
docker build -t researcherml .
docker run -p 8000:8000 researcherml
```

Then access at `http://localhost:8000`

## SOLUTION 5: Fix macOS Security (Advanced)

If you MUST fix Electron:

1. Give Terminal/Cursor Full Disk Access:
   - System Settings → Privacy & Security → Full Disk Access
   - Add Terminal.app and Cursor.app

2. Disable SIP (System Integrity Protection) - **NOT RECOMMENDED**:
```bash
# Restart in Recovery Mode (⌘-R on boot)
# In Terminal:
csrutil disable
# Restart normally
```

3. Try with sudo (may not work):
```bash
sudo npm run start
```

## Recommended Path Forward

For **testing and iteration**:
- Use SOLUTION 1 or 2 (web browser)
- This is how most developers test anyway
- No Electron issues to fight
- Faster iteration cycle

For **production/distribution**:
- Try SOLUTION 3 (electron-builder)
- If that fails, consider alternatives:
  - **Tauri** (Rust-based, more reliable than Electron)
  - **Neutralino** (lightweight native apps)
  - **PWA** (Progressive Web App)
  - **Web-only** (deploy to Render/Heroku)

## Next Steps

Let me know which solution you want to pursue and I'll implement it fully!
