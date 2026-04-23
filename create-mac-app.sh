#!/bin/bash

# Create a native macOS .app bundle for ResearcherML
# This doesn't use Electron - it's a simple wrapper that launches the app

APP_NAME="ResearcherML"
APP_DIR="$APP_NAME.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

echo "📦 Creating macOS application: $APP_NAME.app"

# Remove existing app if present
rm -rf "$APP_DIR"

# Create app directory structure
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Create the executable launcher script
cat > "$MACOS_DIR/$APP_NAME" << 'LAUNCHER_SCRIPT'
#!/bin/bash

# Get the directory where the app is located
APP_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
PROJECT_DIR="$APP_DIR/../researcherML"

# If the project directory doesn't exist, try to find it
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="/Users/ayajmire/Downloads/researcherML"
fi

cd "$PROJECT_DIR" || exit 1

# Check if backend is already running
if ! curl -s http://localhost:8000 > /dev/null 2>&1; then
    # Start backend
    cd backend
    python3 main.py > /tmp/researcherml-backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/researcherml-backend.pid
    cd ..
    
    # Wait for backend
    for i in {1..10}; do
        if curl -s http://localhost:8000 > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
fi

# Open in Chrome app mode
if [ -d "/Applications/Google Chrome.app" ]; then
    open -na "Google Chrome" --args --app=http://localhost:8000 --new-window
elif [ -d "/Applications/Brave Browser.app" ]; then
    open -na "Brave Browser" --args --app=http://localhost:8000 --new-window
else
    open -a Safari http://localhost:8000
fi
LAUNCHER_SCRIPT

# Make launcher executable
chmod +x "$MACOS_DIR/$APP_NAME"

# Create Info.plist
cat > "$CONTENTS_DIR/Info.plist" << PLIST_CONTENT
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleDisplayName</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>com.researcherml.app</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsLocalNetworking</key>
        <true/>
    </dict>
</dict>
</plist>
PLIST_CONTENT

# Create a simple icon (optional - using emoji as placeholder)
# You can replace this with a proper icon later
cat > "$RESOURCES_DIR/AppIcon.icns" << 'ICON_PLACEHOLDER'
# Placeholder icon file
# To add a real icon:
# 1. Create icon.png (1024x1024)
# 2. Use: iconutil -c icns icon.iconset -o AppIcon.icns
ICON_PLACEHOLDER

echo "✅ Application created: $APP_DIR"
echo ""
echo "📍 Location: $(pwd)/$APP_DIR"
echo ""
echo "To use:"
echo "  1. Double-click $APP_DIR to launch"
echo "  2. Or drag to /Applications folder"
echo "  3. Or create alias: ln -s \"$(pwd)/$APP_DIR\" ~/Desktop/"
echo ""
echo "📝 Note: The app requires the ResearcherML project folder to exist at:"
echo "  /Users/ayajmire/Downloads/researcherML"
echo ""
echo "To add a custom icon:"
echo "  1. Create a 1024x1024 PNG icon"
echo "  2. Convert to .icns format"
echo "  3. Replace: $RESOURCES_DIR/AppIcon.icns"
