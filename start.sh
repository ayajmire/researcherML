#!/bin/bash

# ResearcherML - Machine Learning Research Platform
# Startup script for backend and frontend

echo "🚀 Starting ResearcherML - Machine Learning Research Platform"
echo "=================================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Python installation
if ! command_exists python3; then
    echo "❌ Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install -r backend/requirements.txt

# Create uploads directory
mkdir -p backend/uploads

# Start backend server
echo "🚀 Starting backend server..."
cd backend
python3 main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend server started (PID: $BACKEND_PID)"
    echo "🌐 Backend running at: http://localhost:8000"
else
    echo "❌ Failed to start backend server"
    exit 1
fi

# Start frontend server (simple HTTP server)
echo "🌐 Starting frontend server..."
if command_exists python3; then
    python3 -m http.server 3000 &
    FRONTEND_PID=$!
elif command_exists python; then
    python -m SimpleHTTPServer 3000 &
    FRONTEND_PID=$!
else
    echo "❌ No Python HTTP server available"
    exit 1
fi

sleep 2

echo ""
echo "🎉 ResearcherML is now running!"
echo "=========================="
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait
