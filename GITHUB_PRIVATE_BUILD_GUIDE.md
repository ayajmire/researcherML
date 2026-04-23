# Building Electron on Private GitHub Repository

## Overview

You'll create a **private GitHub repository** where:
- ✅ Only YOU can see the code
- ✅ GitHub Actions builds Electron apps automatically
- ✅ You download the `.dmg` and `.exe` files
- ✅ Everything stays private

## Step 1: Create Private GitHub Repository

### 1.1 Go to GitHub
Visit: https://github.com/new

### 1.2 Configure Repository
- **Repository name:** `researcherml` (or any name you want)
- **Description:** "ResearcherML - ML Research Platform"
- **Visibility:** ⚠️ **Select "Private"** ⚠️
- **Initialize:** Leave unchecked (we have existing code)
- Click **"Create repository"**

## Step 2: Push Your Code to GitHub

Open terminal in your project folder and run:

```bash
cd /Users/ayajmire/Downloads/researcherML

# Initialize git (if not already done)
git init

# Add your GitHub private repo as remote
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/researcherml.git

# Create .gitignore to exclude large files
cat > .gitignore << 'EOF'
node_modules/
backend/__pycache__/
backend/sessions/
backend/uploads/
backend/models/
backend/saved_models/
*.pyc
.DS_Store
.env
*.log
EOF

# Add all files
git add .

# Commit
git commit -m "Initial commit - ResearcherML platform"

# Push to private repo
git branch -M main
git push -u origin main
```

### Authentication
GitHub will ask for authentication. You have two options:

**Option A: Personal Access Token (Recommended)**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "ResearcherML Build"
4. Check: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token (you won't see it again!)
7. Use the token as your password when pushing

**Option B: GitHub CLI**
```bash
# Install GitHub CLI if not installed
brew install gh

# Login
gh auth login

# Then push
git push -u origin main
```

## Step 3: Enable GitHub Actions

The workflow file is already in your project at:
`.github/workflows/build-electron.yml`

GitHub Actions will automatically detect it and run when you push code!

## Step 4: Trigger a Build

### Option A: Create a Release Tag
```bash
# Tag your first version
git tag v1.0.0
git push origin v1.0.0
```

This triggers the build automatically.

### Option B: Manual Trigger
1. Go to your repo: `https://github.com/YOUR_USERNAME/researcherml`
2. Click **"Actions"** tab
3. Click **"Build Electron App"** workflow
4. Click **"Run workflow"** button
5. Click **"Run workflow"** (confirm)

## Step 5: Download Built Apps

### After Build Completes (usually 5-10 minutes):

1. Go to **Actions** tab in your repo
2. Click on the completed workflow run
3. Scroll to **"Artifacts"** section at the bottom
4. Download:
   - **ResearcherML-mac** (contains the `.dmg` file)
   - **ResearcherML-windows** (contains the `.exe` installer)

### Extract and Use:
```bash
# Unzip the downloaded artifacts
unzip ResearcherML-mac.zip

# You'll find:
# - ResearcherML-1.0.0.dmg (Mac installer)
# - ResearcherML-1.0.0-mac.zip (Mac app bundle)
```

## Step 6: Install Your App

### On Mac:
1. Double-click `ResearcherML-1.0.0.dmg`
2. Drag ResearcherML to Applications folder
3. Open Applications → ResearcherML
4. If macOS blocks it: System Settings → Privacy & Security → "Open Anyway"

### On Windows:
1. Double-click `ResearcherML-Setup-1.0.0.exe`
2. Follow installer wizard
3. App installs and launches

## Important: Keep Your Repo Private

### Who Can See What:

**✅ Private Repo = Only You Can:**
- See the code
- Download source files
- Access the repository
- View build logs

**❌ Others CANNOT:**
- See your code
- Access your repository
- Clone your repo
- View anything unless you invite them

### Sharing Built Apps:

You can share the `.dmg` and `.exe` files with others without sharing your code:
1. Download artifacts from GitHub Actions
2. Share the `.dmg`/`.exe` files via:
   - Email
   - Google Drive
   - Dropbox
   - Your own website

Users get the app, but NOT your source code!

## Updating Your App

When you make changes:

```bash
# Make your changes to code
git add .
git commit -m "Add new feature"
git push

# Create new version
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions automatically builds the new version!

## Troubleshooting

### Build Fails

Check the build logs:
1. Go to **Actions** tab
2. Click the failed workflow
3. Click the failed job
4. Read the error messages

Common fixes:
- Make sure `package.json` is valid
- Check `backend/requirements.txt` has all dependencies
- Ensure `electron/main.js` exists

### "Resource not accessible" Error

Your repo might not have Actions enabled:
1. Go to repo **Settings**
2. Click **Actions** → **General**
3. Enable **"Allow all actions and reusable workflows"**
4. Click **Save**

## Cost

**GitHub Actions is FREE for private repos!**
- 2,000 minutes/month free (each build takes ~5-10 minutes)
- That's ~200-400 builds per month for free
- More than enough for development

## Security Best Practices

### Never Commit:
- API keys
- Passwords
- Private certificates
- `.env` files with secrets

### Use GitHub Secrets for sensitive data:
1. Repo **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add sensitive values here
4. Reference in workflow: `${{ secrets.SECRET_NAME }}`

## Summary

✅ **Private repository** - Only you see code
✅ **GitHub Actions builds** - Works perfectly
✅ **Download installers** - Get `.dmg` and `.exe` files
✅ **Share apps** - Give installers to users (not source)
✅ **Free** - No cost for private repos

Your code stays private, but you get working Electron apps!

## Next Steps

1. Create private GitHub repo
2. Push your code
3. Create tag: `v1.0.0`
4. Wait ~10 minutes
5. Download your Mac and Windows installers!

Need help with any step? Let me know!
