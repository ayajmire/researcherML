#!/bin/bash

echo "🔍 Checking Electron Permissions on macOS Sequoia"
echo "=================================================="
echo ""

# Check macOS version
echo "📱 macOS Version:"
sw_vers
echo ""

# Check if running as Cursor
if [ -n "$TERM_PROGRAM" ]; then
    echo "📍 Terminal: $TERM_PROGRAM"
fi
echo ""

# Check for Full Disk Access
echo "🔐 Checking Full Disk Access..."
if sqlite3 ~/Library/Application\ Support/com.apple.TCC/TCC.db "SELECT * FROM access WHERE service='kTCCServiceSystemPolicyAllFiles'" 2>/dev/null | grep -q "$(ps -p $$ -o comm=)"; then
    echo "✅ Terminal has Full Disk Access"
else
    echo "❌ Terminal does NOT have Full Disk Access"
    echo ""
    echo "🔧 HOW TO FIX:"
    echo "1. Open System Settings"
    echo "2. Privacy & Security → Full Disk Access"
    echo "3. Add your terminal app:"
    if [ "$TERM_PROGRAM" = "Apple_Terminal" ]; then
        echo "   /Applications/Utilities/Terminal.app"
    elif [ "$TERM_PROGRAM" = "iTerm.app" ]; then
        echo "   /Applications/iTerm.app"
    elif [ -n "$CURSOR_SESSION" ] || [ -n "$VSCODE_PID" ]; then
        echo "   /Applications/Cursor.app"
    else
        echo "   (The terminal app you're using)"
    fi
    echo "4. Toggle it OFF then ON"
    echo "5. Restart terminal"
    echo ""
fi

# Check Gatekeeper
echo "🛡️  Checking Gatekeeper status..."
if spctl --status | grep -q "assessments enabled"; then
    echo "✅ Gatekeeper is enabled (normal)"
else
    echo "⚠️  Gatekeeper is disabled"
fi
echo ""

# Check Electron binary
echo "📦 Checking Electron installation..."
if [ -f "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron" ]; then
    echo "✅ Electron binary found"
    
    # Check signature
    echo ""
    echo "🔏 Checking code signature..."
    codesign -dv --verbose=4 node_modules/electron/dist/Electron.app 2>&1 | grep -E "(Identifier|Format|Signature)" | head -3
    echo ""
    
    # Check quarantine
    echo "🚫 Checking quarantine flags..."
    if xattr -l node_modules/electron/dist/Electron.app 2>/dev/null | grep -q "com.apple.quarantine"; then
        echo "⚠️  Electron app is quarantined"
        echo "   Run: xattr -cr node_modules/electron/dist/Electron.app"
    else
        echo "✅ No quarantine flags"
    fi
else
    echo "❌ Electron binary NOT found"
    echo "   Run: npm install electron"
fi
echo ""

# Test Electron
echo "🧪 Testing Electron..."
if command -v npx >/dev/null 2>&1; then
    echo "Running quick test..."
    TEST_OUTPUT=$(npx electron --version 2>&1)
    if echo "$TEST_OUTPUT" | grep -q "v[0-9]"; then
        echo "✅ Electron version: $TEST_OUTPUT"
    else
        echo "❌ Electron test failed:"
        echo "$TEST_OUTPUT" | head -3
    fi
else
    echo "⚠️  npx not found"
fi
echo ""

# Summary
echo "📊 SUMMARY"
echo "=========="
echo ""
echo "If you see multiple ❌ above, Electron won't work."
echo ""
echo "🎯 RECOMMENDED ACTIONS:"
echo ""
echo "1. Grant Full Disk Access (if ❌ above)"
echo "2. Remove quarantine: xattr -cr node_modules/electron/dist/Electron.app"
echo "3. Test: npx electron test-electron-final.js"
echo ""
echo "OR: Use browser app mode instead:"
echo "    ./launch-app.sh"
echo ""
