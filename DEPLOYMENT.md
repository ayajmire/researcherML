# Deployment Guide - Render.com

This guide walks you through deploying ResearcherML to Render's free tier.

## Prerequisites

- A GitHub account
- A Render.com account (free)
- Your code pushed to GitHub

## Step 1: Push to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: ResearcherML platform ready for deployment"

# Add your GitHub repository
git remote add origin https://github.com/YOUR-USERNAME/researcherML.git

# Push
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Render

### Option A: Automatic Deployment (Recommended)

1. Go to [render.com](https://render.com) and sign up/log in
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click "Apply" to start deployment
6. Wait 5-10 minutes for the build to complete

### Option B: Manual Deployment

1. Go to [render.com](https://render.com) and sign up/log in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: researcherml (or your choice)
   - **Region**: Oregon (or closest to you)
   - **Branch**: main
   - **Root Directory**: Leave blank
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Select "Free" plan
6. Click "Create Web Service"
7. Wait 5-10 minutes for deployment

## Step 3: Access Your App

Once deployed, Render will provide you with a URL like:
```
https://researcherml.onrender.com
```

Your app is now live and accessible to everyone!

## Important Notes

### Free Tier Limitations

- **Spin Down**: After 15 minutes of inactivity, your app will sleep
- **Spin Up**: Takes ~30 seconds to wake up when accessed
- **Storage**: Files are ephemeral (deleted on restart)
- **RAM**: 512 MB
- **Build Time**: ~5-10 minutes on first deploy

### Data Persistence

The free tier does NOT persist uploaded files or trained models across restarts. For persistence:

1. Upgrade to a paid plan ($7/month) with disk storage
2. Use external storage (AWS S3, Google Cloud Storage)
3. Store models in a database

### Environment Variables

If needed, add environment variables in Render dashboard:
- Go to your service → "Environment"
- Add key-value pairs

## Troubleshooting

### Build Fails

- Check build logs in Render dashboard
- Ensure `backend/requirements.txt` exists
- Verify Python version compatibility

### App Won't Start

- Check the logs in Render dashboard
- Verify the start command is correct
- Ensure PORT environment variable is used

### 502 Bad Gateway

- App is likely sleeping (wait 30 seconds)
- Check if build completed successfully
- Review application logs

## Updating Your App

To deploy changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render will automatically rebuild and redeploy (takes 5-10 minutes).

## Alternative Free Hosting

If Render doesn't work well for you:

- **Railway.app**: $5/month free credit, no sleep
- **Hugging Face Spaces**: Great for ML demos
- **PythonAnywhere**: Free tier for Python apps

## Support

For issues with:
- **Render**: Check [Render docs](https://render.com/docs)
- **This app**: Open an issue on GitHub

