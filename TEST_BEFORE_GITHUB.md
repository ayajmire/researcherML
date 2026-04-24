# How to Test Your App BEFORE Uploading to GitHub

## ✅ Option 1: Test the Browser Version (WORKS NOW)

This is the fastest way to test all your app's features:

```bash
# Make sure backend dependencies are installed
cd backend
pip3 install -r requirements.txt
cd ..

# Launch the app
./launch-app.sh
```

**What this does:**
- Starts the Python backend
- Opens the app in Chrome app mode (looks like a desktop app)
- You can test ALL features:
  - Upload datasets
  - Use the questionnaire
  - Train models
  - Everything works!

**This is what I recommend for testing!** It's exactly what your users will see, just in a browser.

---

## ⚠️ Option 2: Try Building Electron Locally (Won't Work on Your Mac)

Due to the macOS Sequoia bug, this will fail on your Mac, but here's how you would try:

```bash
# Install dependencies
npm install

# Try to build Mac app (will fail on your Mac)
npm run build:mac

# If it somehow worked, you'd find:
# dist/ResearcherML-1.0.0.dmg
```

**Expected result on your Mac:** ❌ Fails with module loading errors

**Why try this?** To confirm the issue is your Mac, not your code.

---

## ✅ Option 3: Test on a Different Mac (If Available)

If you have access to another Mac (friend, work, etc.) running macOS 14 or earlier:

```bash
# Clone your repo on their Mac
git clone https://github.com/ayajmire/researcherML.git
cd researcherML

# Install dependencies
npm install
cd backend && pip3 install -r requirements.txt && cd ..

# Build
npm run build:mac

# Test the DMG
open dist/ResearcherML-1.0.0.dmg
```

This would prove your code works fine on normal Macs!

---

## ✅ Option 4: Test Backend Independently

Test just the Python backend to ensure it works:

```bash
cd backend
python3 main.py
```

Then open: http://localhost:8000

You should see the app interface. Test:
- Upload a dataset
- Data cleaning
- Model training
- Everything backend-related

---

## ✅ Option 5: Test Frontend Independently

```bash
# Start any simple HTTP server
cd frontend
python3 -m http.server 3000
```

Open: http://localhost:3000

Test the UI (though API calls won't work without backend).

---

## 📋 What to Test Before GitHub:

### Core Features:
- [ ] Upload CSV file
- [ ] Data viewer shows data correctly
- [ ] Questionnaire appears
- [ ] Answer questionnaire questions
- [ ] Data cleaning works
- [ ] Feature engineering works
- [ ] Model training completes
- [ ] Download trained model works

### UI/UX:
- [ ] Navigation works
- [ ] Buttons respond
- [ ] No console errors (open DevTools with Cmd+Option+I)
- [ ] Styling looks good
- [ ] Dark theme displays correctly

### Performance:
- [ ] App loads in < 5 seconds
- [ ] Large datasets (1000+ rows) work
- [ ] Model training doesn't freeze UI

---

## 🎯 My Recommendation:

**Use Option 1** (`./launch-app.sh`) for testing:

1. **Launch the app:**
   ```bash
   ./launch-app.sh
   ```

2. **Open DevTools** (Cmd+Option+I) to see any errors

3. **Test all features** - upload data, clean it, train models

4. **If everything works** → Push to GitHub with confidence!

---

## ⚡ Quick Test Script:

I can create a test script that checks everything:

```bash
#!/bin/bash
echo "🧪 Testing ResearcherML..."

# Check Python dependencies
echo "📦 Checking Python dependencies..."
cd backend && pip3 list | grep -E "fastapi|pandas|scikit-learn" && cd ..

# Check Node dependencies
echo "📦 Checking Node dependencies..."
npm list electron

# Start backend
echo "🚀 Starting backend..."
cd backend && python3 main.py &
BACKEND_PID=$!
sleep 3

# Test backend
echo "🔍 Testing backend..."
curl -s http://localhost:8000/ > /dev/null && echo "✅ Backend works!" || echo "❌ Backend failed"

# Cleanup
kill $BACKEND_PID

echo ""
echo "✨ Tests complete!"
```

---

## Summary:

**Before uploading to GitHub:**
1. Run `./launch-app.sh`
2. Test all features manually
3. Check browser console for errors
4. If everything works → Push to GitHub!

**The GitHub Actions build is mainly to:**
- Create distributable installers (.dmg, .exe)
- Sign the apps properly
- Package everything for users

But the actual functionality can be fully tested with the browser version! 🚀
