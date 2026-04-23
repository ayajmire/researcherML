# 🎨 How to Get the Desktop App Look

## The Problem
You're viewing the app in a **regular browser window** (with tabs, address bar, etc.), which makes it look cluttered.

## ✅ SOLUTION 1: Use Chrome App Mode (BEST)

### Automatic (Easiest):
```bash
./launch-app.sh
```

This automatically opens the app in Chrome's "app mode" which:
- ✅ Removes browser UI (no tabs, address bar, bookmarks)
- ✅ Looks exactly like a native desktop app
- ✅ Full screen dedicated to your app
- ✅ Modern dark theme visible

### Manual (If automatic doesn't work):
```bash
# Close all browser windows showing the app

# Then run this:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --app=http://localhost:8000 \
  --new-window
```

---

## ✅ SOLUTION 2: Use the Mac App

Double-click **ResearcherML.app** in Finder - this does the same thing automatically!

---

## ✅ SOLUTION 3: Create Browser Shortcut

### Chrome:
1. Go to `http://localhost:8000`
2. Click the 3 dots (⋮) in top right
3. Click **Save and Share** → **Create Shortcut**
4. Check ☑ **"Open as window"**
5. Click **Create**

Now you have a desktop icon that opens the app without browser UI!

### Safari:
1. Go to `http://localhost:8000`
2. Click **File** → **Add to Dock**

---

## 🎯 Comparison

| Method | Browser UI | Looks Native | Setup |
|--------|-----------|--------------|-------|
| Regular Browser | ❌ Shows tabs/address bar | ❌ No | None |
| Chrome App Mode | ✅ Hidden | ✅ Yes | Automatic |
| Mac .app | ✅ Hidden | ✅ Yes | Double-click |
| Browser Shortcut | ✅ Hidden | ✅ Yes | One-time setup |

---

## 🐛 If Styling Still Looks Wrong

If the dark theme isn't loading even in app mode:

1. **Hard refresh the page:**
   - Chrome/Safari: `Cmd + Shift + R`
   - This clears cached CSS

2. **Check backend is serving CSS:**
```bash
# Should show "HTTP/1.1 200 OK"
curl -I http://localhost:8000/css/modern-theme.css
```

3. **Restart everything:**
```bash
# Kill backend
kill $(cat /tmp/researcherml-backend.pid)

# Restart
./launch-app.sh
```

---

## 📸 What It Should Look Like

**Regular Browser (WRONG):**
- ❌ Tabs visible at top
- ❌ Address bar showing
- ❌ Bookmarks bar
- ❌ Browser chrome everywhere

**App Mode (CORRECT):**
- ✅ Just your app content
- ✅ Dark theme with grid background
- ✅ Clean navigation on left
- ✅ No browser UI visible
- ✅ Looks professional

---

## 🚀 Quick Command

**Just run this and you're done:**
```bash
./launch-app.sh
```

Close any regular browser tabs showing the app, and use the window that launch-app.sh opens!
