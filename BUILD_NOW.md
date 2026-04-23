# 🚀 Build Your Electron App NOW

## Quick 3-Step Process

### Step 1: Make Sure Repo is Private

Visit: https://github.com/ayajmire/researcherML/settings

Look for **"Danger Zone"** at the bottom:
- If it says **"Change repository visibility"** → Click it → Select **"Make private"**
- If it says **"Change visibility"** and shows "Private" → ✅ You're good!

### Step 2: Push Your Code

Run this script:

```bash
cd /Users/ayajmire/Downloads/researcherML
./PUSH_TO_GITHUB.sh
```

This will:
- Commit all your changes
- Push to your private GitHub repo
- Show you next steps

**If it asks for authentication:**
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Get one here: https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Check ☑ `repo` (full access to private repos)
  - Copy the token and paste as password

### Step 3: Trigger the Build

```bash
# Create version tag
git tag v1.0.0

# Push tag to trigger build
git push origin v1.0.0
```

✅ **Done!** GitHub Actions is now building your app.

---

## Watch the Build

1. Go to: https://github.com/ayajmire/researcherML/actions
2. You'll see **"Build Electron App"** workflow running
3. Takes ~5-10 minutes
4. When complete, scroll down to **"Artifacts"**

---

## Download Your Apps

After build completes:

1. Click on the completed workflow
2. Scroll to **"Artifacts"** section
3. Download:
   - **ResearcherML-mac** → Unzip to get `.dmg` file
   - **ResearcherML-windows** → Unzip to get `.exe` installer

---

## Install and Test

### Mac:
1. Double-click `ResearcherML-1.0.0.dmg`
2. Drag to Applications
3. Open from Applications folder
4. If blocked: System Settings → Privacy & Security → "Open Anyway"

### Windows (test on Windows PC):
1. Double-click `ResearcherML-Setup-1.0.0.exe`
2. Follow installer
3. Launch app

---

## Future Updates

When you make changes:

```bash
# Make your code changes
git add -A
git commit -m "Your update description"
git push

# Create new version
git tag v1.0.1
git push origin v1.0.1
```

New builds happen automatically!

---

## Troubleshooting

### "Authentication failed"
- You need a Personal Access Token, not your password
- Get one: https://github.com/settings/tokens
- Scope needed: `repo` (private repository access)

### "Nothing to commit"
- That's okay! Just run the git tag commands

### Build fails
- Check: https://github.com/ayajmire/researcherML/actions
- Click failed workflow to see error logs
- Usually it's a missing dependency

---

## Important Reminders

✅ **Your code stays private** - Only you can see it
✅ **Builds are free** - 2,000 minutes/month on GitHub
✅ **Apps work on all computers** - Even though your Mac can't build them locally

---

## Ready? Run This Now:

```bash
./PUSH_TO_GITHUB.sh
```

Then follow the on-screen instructions!
