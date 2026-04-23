# ResearcherML - Electron Desktop Application

## Overview
ResearcherML is now packaged as a desktop application using Electron. Users can download and run it like any other app - no terminal commands, no separate servers, just double-click and go!

## Architecture

```
ResearcherML.app
├── Electron (Node.js) - Window management
├── Python Backend - Auto-starts on launch
├── Frontend (HTML/CSS/JS) - Loaded in Electron window
└── User Data - Stored locally in app directories
```

## Building the Application

### Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   # Check version
   node --version
   npm --version
   ```

2. **Python 3.11+** (must be available on system)
   ```bash
   # Check version
   python3 --version
   ```

3. **Install Dependencies**
   ```bash
   cd /Users/ayajmire/Downloads/researcherML
   
   # Install Node dependencies
   npm install
   
   # Install Python dependencies (if not already done)
   cd backend
   pip3 install -r requirements.txt
   cd ..
   ```

### Development Mode

Run the app in development mode (with DevTools):

```bash
npm run dev
```

This will:
1. Start Electron
2. Auto-start Python backend on port 8000
3. Open the app window with DevTools
4. Show console logs for debugging

### Building Installers

#### Build for macOS (on Mac)
```bash
npm run build:mac
```

Creates in `dist/`:
- `ResearcherML-1.0.0.dmg` - Installer
- `ResearcherML-1.0.0-mac.zip` - Portable version

#### Build for Windows (on Windows or Mac with wine)
```bash
npm run build:win
```

Creates in `dist/`:
- `ResearcherML Setup 1.0.0.exe` - Installer
- `ResearcherML 1.0.0.exe` - Portable version

#### Build for Linux
```bash
npm run build:linux
```

Creates in `dist/`:
- `ResearcherML-1.0.0.AppImage` - Universal Linux app
- `researcherml_1.0.0_amd64.deb` - Debian/Ubuntu installer

#### Build for All Platforms
```bash
npm run build:all
```

**Note:** Building for Windows on Mac requires `wine`. Install with:
```bash
brew install --cask wine-stable
```

## Application Structure

```
researcherML/
├── electron/
│   ├── main.js              # Main Electron process
│   ├── preload.js           # Security bridge
│   └── entitlements.mac.plist  # macOS permissions
├── frontend/
│   ├── css/                 # Stylesheets
│   ├── js/                  # Application logic
│   └── ...
├── backend/
│   ├── main.py              # FastAPI server
│   ├── questionnaire_handler.py
│   ├── session_store.py
│   └── ...
├── assets/
│   ├── icon.icns            # Mac icon (512x512)
│   ├── icon.ico             # Windows icon
│   └── icon.png             # Linux icon
├── index.html               # Main app page
├── package.json             # Electron config
└── README.md
```

## How It Works

### Startup Sequence

1. **User double-clicks app icon**
2. Electron starts (main.js)
3. Python backend is spawned as child process
4. Electron waits for backend health check (up to 10 seconds)
5. Once backend responds, app window opens
6. User sees ResearcherML interface

### Backend Management

- Backend runs on `localhost:8000`
- Starts automatically when app launches
- Stops automatically when app quits
- Logs visible in DevTools console (dev mode)

### Data Storage

User data stored in standard OS locations:

**macOS:**
```
~/Library/Application Support/ResearcherML/
├── sessions/          # Uploaded datasets
├── models/           # Trained models
└── settings.json     # User preferences
```

**Windows:**
```
%APPDATA%\ResearcherML\
├── sessions\
├── models\
└── settings.json
```

**Linux:**
```
~/.config/ResearcherML/
├── sessions/
├── models/
└── settings.json
```

## Distribution

### For UCLA Researchers

Create a download page with:
- macOS installer (.dmg) - Apple Silicon + Intel
- Windows installer (.exe)
- Quick start guide

**Installation Steps (for end users):**

**Mac:**
1. Download `ResearcherML.dmg`
2. Open the DMG file
3. Drag ResearcherML to Applications folder
4. Double-click to launch
5. (First launch: Right-click → Open to bypass Gatekeeper)

**Windows:**
1. Download `ResearcherML Setup.exe`
2. Run the installer
3. Follow installation wizard
4. Launch from Start Menu or desktop shortcut

**Linux:**
1. Download `ResearcherML.AppImage`
2. Make executable: `chmod +x ResearcherML*.AppImage`
3. Double-click to run

## Code Signing & Notarization

### macOS (recommended for distribution)

1. **Get Apple Developer Account** ($99/year)
2. **Create certificates** in Xcode
3. **Add to package.json:**
   ```json
   "mac": {
     "identity": "Developer ID Application: Your Name (TEAM_ID)",
     "hardenedRuntime": true,
     "gatekeeperAssess": false
   }
   ```
4. **Notarize:**
   ```bash
   npm run build:mac
   xcrun notarytool submit dist/ResearcherML-1.0.0.dmg \
     --apple-id your@email.com \
     --team-id YOUR_TEAM_ID \
     --password your-app-specific-password
   ```

### Windows

1. **Get code signing certificate** (~$100-300/year)
2. **Sign the installer:**
   ```bash
   signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com dist/ResearcherML-Setup.exe
   ```

**Without signing:**
- Users will see "Windows protected your PC" warning
- They need to click "More info" → "Run anyway"

## Troubleshooting

### Backend Won't Start

**Check Python:**
```bash
python3 --version
which python3
```

**Check dependencies:**
```bash
cd backend
pip3 list
```

**Manual test:**
```bash
cd backend
python3 main.py
# Should start on port 8000
```

### Build Fails

**Clear cache:**
```bash
rm -rf node_modules dist
npm install
npm run build:mac
```

**Check logs:**
Build logs are in terminal output. Look for:
- Python import errors
- Missing dependencies
- File permission issues

### App Crashes on Launch

**Check DevTools console:**
```bash
npm run dev
# Look for errors in console
```

**Common issues:**
- Backend failed to start (check Python)
- Port 8000 already in use (close other apps)
- Missing Python dependencies (run pip install)

## Performance Optimization

### Reduce App Size

**Exclude unnecessary files:**
Edit `package.json` → `build.files`:
```json
"files": [
  "!backend/__pycache__",
  "!backend/venv",
  "!**/*.pyc",
  "!**/.git"
]
```

**Use asar archive:**
Automatically enabled by electron-builder. Bundles app files into single archive.

### Faster Startup

1. **Optimize Python imports** - Lazy load heavy libraries
2. **Reduce backend wait time** - Lower health check delay
3. **Bundle Python with app** - Avoid system Python lookup

## Security Best Practices

### Electron Security

✅ **Implemented:**
- Context isolation enabled
- Node integration disabled
- Preload script for IPC
- Content Security Policy

✅ **Backend Security:**
- CORS limited to localhost
- No remote code execution
- File system access limited
- Session data encrypted

### User Privacy

- All data processed locally
- No telemetry or tracking
- No internet required (except pip install)
- No account or login needed (yet)

## CI/CD - Automated Builds

### GitHub Actions (Recommended)

Create `.github/workflows/build.yml`:

```yaml
name: Build ResearcherML

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: 3.11
      
      - name: Install dependencies
        run: |
          npm install
          pip install -r backend/requirements.txt
      
      - name: Build app
        run: npm run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ResearcherML-${{ matrix.os }}
          path: dist/*
```

**To release:**
```bash
git tag v1.0.0
git push origin v1.0.0
# GitHub Actions auto-builds for all platforms
```

## Version Management

Update version in `package.json`:
```json
{
  "version": "1.0.0"
}
```

This version appears in:
- Installer filenames
- App "About" dialog
- Window title

## What's Next?

After successful build and distribution:

1. ✅ **Test with real users** - Get UCLA researchers to download and try it
2. 🔜 **Add auto-updates** - Use `electron-updater` for seamless updates
3. 🔜 **Analytics** (optional) - Track crashes and usage (with user consent)
4. 🔜 **Authentication** - Add user accounts and cloud sync later

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development mode with DevTools |
| `npm run build:mac` | Build macOS app |
| `npm run build:win` | Build Windows app |
| `npm run build:linux` | Build Linux app |
| `npm run build:all` | Build for all platforms |

**Support:** For issues, check `electron/main.js` console logs or open GitHub issue.
