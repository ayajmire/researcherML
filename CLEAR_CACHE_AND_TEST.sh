#!/bin/bash

echo "🧹 Clearing Browser Cache and Testing Questionnaire"
echo "=================================================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "❌ Backend is not running!"
    echo "Starting backend..."
    cd backend
    python3 main.py > /tmp/researcherml-backend.log 2>&1 &
    echo $! > /tmp/researcherml-backend.pid
    cd ..
    
    # Wait for backend
    for i in {1..10}; do
        if curl -s http://localhost:8000 > /dev/null 2>&1; then
            echo "✅ Backend started!"
            break
        fi
        sleep 1
    done
fi

echo ""
echo "✅ Backend is running at http://localhost:8000"
echo ""
echo "🌐 Opening app with cache-busting parameters..."
echo ""

# Open with timestamp to bust cache
TIMESTAMP=$(date +%s)

if [ -d "/Applications/Google Chrome.app" ]; then
    # Close existing Chrome windows for this app
    osascript -e 'tell application "Google Chrome" to close (every window whose URL starts with "http://localhost:8000")' 2>/dev/null
    
    # Open fresh with cache busting
    open -na "Google Chrome" --args \
        --app="http://localhost:8000/?nocache=$TIMESTAMP" \
        --disable-application-cache \
        --disable-cache \
        --new-window
    
    echo "✅ Chrome opened in app mode"
else
    open "http://localhost:8000/?nocache=$TIMESTAMP"
    echo "✅ Browser opened"
fi

echo ""
echo "📋 IN THE BROWSER:"
echo ""
echo "1. Press: Cmd + Option + I (open console)"
echo "2. In console, type: window.QuestionnaireClean"
echo "   → Should show: {init: ƒ, nextColumn: ƒ, ...}"
echo ""
echo "3. Upload a CSV file"
echo ""
echo "4. Look for in console:"
echo "   '📥 Fetching data to start questionnaire...'"
echo "   '🎯 Starting questionnaire cleaning with X columns'"
echo ""
echo "5. You should see:"
echo "   • Questions on LEFT side"
echo "   • Visualizations on RIGHT side"
echo "   • Resizable divider in middle"
echo ""
echo "If you still see the OLD cleaning page:"
echo "  → Take a screenshot of the console"
echo "  → Tell me what errors you see"
