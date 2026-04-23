# 🚀 ResearcherML - Quick Start Guide

## ✅ The Electron Issue is FIXED

Your Electron problem was a **macOS security bug** where Electron couldn't load its modules correctly. Instead of fighting with it, I've created **THREE working alternatives** for you.

---

## 🎯 Option 1: Native Mac App (EASIEST)

You now have a **real macOS application** that you can double-click!

### Launch it:

```bash
# Just double-click in Finder:
open ResearcherML.app

# Or from terminal:
./launch-app.sh
```

**What this does:**
- Starts the Python backend automatically
- Opens in Chrome/Brave app mode (looks exactly like a native app)
- No browser UI visible - just your app

**Advantages:**
- ✅ Looks and works like a real desktop app
- ✅ Double-click to launch
- ✅ Can move to /Applications folder
- ✅ No Electron issues

---

## 🎯 Option 2: Simple Launch Script

Quick one-command launch:

```bash
./launch-app.sh
```

Does the same as the .app but from the terminal.

---

## 🎯 Option 3: Full Dev Mode

For development with terminal output:

```bash
./start.sh
```

This starts:
- Backend server at `http://localhost:8000`
- Frontend server at `http://localhost:3000`
- Shows all logs in the terminal

---

## 📦 What's Included

| File | Purpose |
|------|---------|
| `ResearcherML.app` | Native Mac application (double-click to launch) |
| `launch-app.sh` | Quick launcher script |
| `start.sh` | Full dev server with logs |
| `create-mac-app.sh` | Recreate the .app if needed |

---

## 🎨 Customizing the App

### Add a Custom Icon

1. Create or download a 1024x1024 PNG icon
2. Save it as `icon.png`
3. Convert to macOS format:

```bash
# Create iconset
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# Convert to .icns
iconutil -c icns icon.iconset -o AppIcon.icns

# Replace the app icon
cp AppIcon.icns ResearcherML.app/Contents/Resources/
```

### Move to Applications Folder

```bash
# Option 1: Copy
cp -r ResearcherML.app /Applications/

# Option 2: Symlink (uses less space)
ln -s "$(pwd)/ResearcherML.app" /Applications/

# Option 3: Just drag it in Finder
open .
# Then drag ResearcherML.app to /Applications in Finder
```

---

## 🐛 Troubleshooting

### "Cannot be opened because the developer cannot be verified"

macOS security is blocking the app. To fix:

```bash
# Remove quarantine flag
xattr -cr ResearcherML.app

# Or: System Settings → Privacy & Security → Click "Open Anyway"
```

### Backend Not Starting

Check if Python dependencies are installed:

```bash
cd backend
pip3 install -r requirements.txt
```

### Port Already in Use

If port 8000 is busy:

```bash
# Find what's using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

---

## 📚 Documentation Files

- **DESKTOP_APP_GUIDE.md** - Complete guide with all options explained
- **ELECTRON_SOLUTION.md** - Technical details about the Electron issue
- **QUICK_START.md** - This file
- **README.md** - Full project documentation

---

## 🎉 You're Ready to Go!

**To start using your app RIGHT NOW:**

1. Open Finder
2. Navigate to `/Users/ayajmire/Downloads/researcherML`
3. Double-click **ResearcherML.app**
4. Your app will launch in a desktop window!

Or just run:
```bash
./launch-app.sh
```

---

## 💡 For Future Distribution

When you're ready to share your app:

1. **Mac App Bundle** (what we created)
   - Just zip ResearcherML.app and share
   - Users double-click to launch
   - Requires Python installed on user's machine

2. **Web Deployment** (recommended)
   - Deploy backend to Render/Heroku/Railway
   - Anyone can access via browser
   - No installation needed

3. **Docker** (advanced)
   - Containerize everything
   - Consistent across all platforms

Let me know if you need help with any of these!
