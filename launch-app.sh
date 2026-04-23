#!/bin/bash

# ResearcherML Desktop Launcher
# Opens the app in a standalone Chrome/Safari window (works like a desktop app)

echo "🚀 Launching ResearcherML..."

# Start backend if not already running
if ! curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "📦 Starting backend server..."
    cd backend
    python3 main.py > /tmp/researcherml-backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/researcherml-backend.pid
    cd ..
    
    # Wait for backend to be ready
    echo "⏳ Waiting for backend to start..."
    for i in {1..10}; do
        if curl -s http://localhost:8000 > /dev/null 2>&1; then
            echo "✅ Backend ready!"
            break
        fi
        sleep 1
    done
else
    echo "✅ Backend already running"
fi

# Open in browser as standalone app
echo "🌐 Opening application..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - Try Chrome app mode first, then Safari
    if [ -d "/Applications/Google Chrome.app" ]; then
        open -na "Google Chrome" --args --app=http://localhost:8000 --new-window
    elif [ -d "/Applications/Brave Browser.app" ]; then
        open -na "Brave Browser" --args --app=http://localhost:8000 --new-window
    else
        # Fallback to Safari
        open -a Safari http://localhost:8000
    fi
else
    # Linux
    if command -v google-chrome > /dev/null; then
        google-chrome --app=http://localhost:8000 --new-window &
    elif command -v chromium-browser > /dev/null; then
        chromium-browser --app=http://localhost:8000 --new-window &
    else
        xdg-open http://localhost:8000
    fi
fi

echo "✨ ResearcherML is now running!"
echo ""
echo "📍 URL: http://localhost:8000"
echo "📋 Backend logs: /tmp/researcherml-backend.log"
echo ""
echo "To stop the backend:"
echo "  kill \$(cat /tmp/researcherml-backend.pid)"
