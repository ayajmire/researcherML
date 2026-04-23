#!/bin/bash

# ResearcherML Cleanup Script
# Removes development artifacts and temporary files

echo "🧹 Cleaning up ResearcherML codebase..."

# Remove Python cache
echo "Removing Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete 2>/dev/null
find . -type f -name "*.pyo" -delete 2>/dev/null

# Remove macOS artifacts
echo "Removing macOS artifacts..."
find . -name ".DS_Store" -delete 2>/dev/null

# Remove runtime data
echo "Removing runtime data..."
rm -rf backend/sessions/
rm -rf backend/models/
rm -rf backend/saved_models/
rm -rf backend/uploads/
rm -rf uploads/

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf dist/
rm -rf out/
rm -rf build/

# Remove logs
echo "Removing logs..."
find . -type f -name "*.log" -delete 2>/dev/null

# Clean Electron cache (optional - comment out if you want to keep)
# echo "Removing Electron cache..."
# rm -rf node_modules/

echo "✅ Cleanup complete!"
echo ""
echo "To rebuild, run:"
echo "  npm install           # Install dependencies"
echo "  npm run build:mac     # Build for macOS"
