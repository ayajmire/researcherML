#!/bin/bash

echo "🧹 Opening Fresh ResearcherML with Latest Changes"
echo "=================================================="
echo ""

# Kill any running instances
pkill -f "python.*http.server.*3000" 2>/dev/null
pkill -f "python.*main.py" 2>/dev/null
sleep 1

# Start backend (which serves the frontend files)
cd /Users/ayajmire/Downloads/researcherML/backend
python3 main.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/backend.pid

# Wait for backend
sleep 3

echo "✅ Backend running on http://localhost:8000"
echo ""
echo "🌐 Opening browser..."

# Open browser with cache disabled
TIMESTAMP=$(date +%s)

# Try to find Chrome
if [ -d "/Applications/Google Chrome.app" ]; then
    open -a "Google Chrome" "http://localhost:8000/?nocache=$TIMESTAMP"
elif [ -d "/Applications/Brave Browser.app" ]; then
    open -a "Brave Browser" "http://localhost:8000/?nocache=$TIMESTAMP"
else
    open "http://localhost:8000/?nocache=$TIMESTAMP"
fi

echo ""
echo "📋 IMPORTANT:"
echo "  → Go to: http://localhost:8000 (NOT 3000!)"
echo "  → Press: Cmd + Shift + R (hard reload)"
echo ""
echo "To stop backend: kill $BACKEND_PID"
