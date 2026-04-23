#!/bin/bash

echo "🚀 Pushing ResearcherML to GitHub (Private Repo)"
echo "=================================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Not a git repository. Run: git init"
    exit 1
fi

# Check if remote exists
if ! git remote | grep -q origin; then
    echo "❌ No origin remote found"
    echo "Run: git remote add origin https://github.com/YOUR_USERNAME/researcherml.git"
    exit 1
fi

echo "📦 Staging all changes..."
git add -A

echo ""
echo "📝 Files to be committed:"
git status --short | head -20
echo ""

# Commit
echo "💾 Creating commit..."
git commit -m "Add Electron desktop app with GitHub Actions build workflow

- Added GitHub Actions workflow for building Mac/Windows apps
- Updated .gitignore to exclude build artifacts
- Added comprehensive documentation
- Ready for private repository deployment"

if [ $? -ne 0 ]; then
    echo "❌ Commit failed or no changes to commit"
    echo "Checking if we can still push..."
fi

echo ""
echo "🌐 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Make sure your repo is PRIVATE:"
    echo "   Visit: https://github.com/ayajmire/researcherML/settings"
    echo "   Under 'Danger Zone' → Check if it says 'Change repository visibility'"
    echo "   If public, click it and change to Private"
    echo ""
    echo "2. Create a release to trigger build:"
    echo "   git tag v1.0.0"
    echo "   git push origin v1.0.0"
    echo ""
    echo "3. Watch the build:"
    echo "   Visit: https://github.com/ayajmire/researcherML/actions"
    echo ""
    echo "4. Download built apps (after ~10 min):"
    echo "   Go to Actions → Click completed workflow → Download artifacts"
    echo ""
else
    echo ""
    echo "❌ Push failed!"
    echo ""
    echo "Common fixes:"
    echo "1. Make sure you're authenticated with GitHub"
    echo "2. Check your internet connection"
    echo "3. Verify remote URL: git remote -v"
    echo ""
    echo "Need to authenticate? Visit:"
    echo "https://github.com/settings/tokens"
    echo "Create a token with 'repo' scope and use it as password"
fi
