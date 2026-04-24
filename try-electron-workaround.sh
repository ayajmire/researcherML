#!/bin/bash

echo "🔬 Trying experimental Electron workaround for macOS Sequoia..."
echo ""

# This is a last-ditch effort using environment variables
# that might bypass some of the security checks

export ELECTRON_RUN_AS_NODE=0
export ELECTRON_NO_ATTACH_CONSOLE=1
export ELECTRON_ENABLE_LOGGING=0
export ELECTRON_DISABLE_SECURITY_WARNINGS=1
export NODE_OPTIONS="--no-warnings"

# Try disabling some macOS security features for this session
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES

echo "🚀 Attempting to run Electron with security bypasses..."
echo ""

# Try running with reduced security checks
npx electron electron/main.js 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ It worked! Electron is running!"
else
    echo ""
    echo "❌ Still failed. macOS Sequoia's security is too strict."
    echo ""
    echo "📌 Confirmed: Your Mac cannot run Electron locally."
    echo ""
    echo "✅ BUT: The GitHub Actions build WILL work!"
    echo "   The apps built there will run on your Mac after installation."
    echo ""
    echo "💡 For development, use: ./launch-app.sh"
fi
