# Debug Upload & Questionnaire

## Steps to Test:

### 1. Launch the App
```bash
./launch-app.sh
```

### 2. Hard Reload to Clear Cache
Press: **Cmd + Shift + R**

### 3. Open Developer Console
Press: **Cmd + Option + I**

### 4. Upload a Test File

Use any CSV file, then check the console for these messages:

**Look for:**
```
✅ Should see: "🎯 Starting questionnaire cleaning with X columns"
❌ If you see: "Questionnaire not available, showing data viewer"
```

### 5. Check What's Happening

In the console, type:
```javascript
window.QuestionnaireClean
```

This should show: `{init: ƒ, nextColumn: ƒ, ...}`

If it shows `undefined`, the module didn't load.

---

## Common Issues:

### Issue 1: Browser Cache
**Solution:** Hard reload with Cmd + Shift + R

### Issue 2: QuestionnaireClean Not Loaded
**Check:** Look for errors in console when page loads
**Solution:** Make sure `/js/questionnaireClean.js` loads without errors

### Issue 3: Data Format Wrong
**Check:** After upload, in console type: `uploadedData`
**Should have:**
- `file_ids: ["some-id"]`
- `columns: ["column1", "column2", ...]`

### Issue 4: Navigation Module Conflict
**Check:** Type in console: `Navigation`
**Should show:** Object with `navigateTo` function

---

## Quick Test Without Upload:

In the console, try manually:

```javascript
// Test if module exists
window.QuestionnaireClean

// Test if Navigation works
Navigation.navigateTo('questionnaireCleanPage')

// Check if section exists
document.getElementById('questionnaireCleanPage')
```

---

## If Questionnaire Still Doesn't Show:

**Send me a screenshot of:**
1. The page after you upload a file
2. The console (Cmd + Option + I) showing any errors
3. Type in console: `uploadedData` and show me the output

Then I can see exactly what's happening!
