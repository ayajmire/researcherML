#!/bin/bash

# ResearcherML GitHub Setup Script
# This script helps you set up your repository for GitHub and Render deployment

echo "=========================================="
echo "ResearcherML - GitHub Setup"
echo "=========================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing Git repository..."
    git init
    echo "✓ Git initialized"
else
    echo "✓ Git already initialized"
fi

# Add all files
echo ""
echo "Adding files to Git..."
git add .
echo "✓ Files added"

# Check for existing commits
if git log > /dev/null 2>&1; then
    echo "✓ Repository already has commits"
    echo ""
    echo "Creating new commit for deployment changes..."
    git commit -m "Setup for Render deployment with static file serving"
else
    echo ""
    echo "Creating initial commit..."
    git commit -m "Initial commit: ResearcherML platform ready for deployment"
fi

echo "✓ Changes committed"
echo ""

# Check if remote exists
if git remote get-url origin > /dev/null 2>&1; then
    CURRENT_REMOTE=$(git remote get-url origin)
    echo "✓ Remote already configured: $CURRENT_REMOTE"
    echo ""
    echo "To update remote:"
    echo "git remote set-url origin https://github.com/YOUR-USERNAME/researcherML.git"
else
    echo "Now you need to:"
    echo "1. Create a new repository on GitHub (github.com)"
    echo "2. Run this command with YOUR username:"
    echo ""
    echo "   git remote add origin https://github.com/YOUR-USERNAME/researcherML.git"
fi

echo ""
echo "Then push to GitHub:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "After pushing, go to render.com and deploy!"
echo "See DEPLOYMENT.md for detailed instructions."
echo ""
echo "=========================================="

