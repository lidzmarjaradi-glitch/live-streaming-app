# Deployment Guide

## Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Enter repository name: `live-streaming-app`
3. Choose "Public" (or Private if you prefer)
4. Click "Create repository"
5. Copy the HTTPS URL (it will look like: https://github.com/YOUR_USERNAME/live-streaming-app.git)

## Step 2: Push to GitHub

Run these commands in your terminal (in the project root):

```bash
git remote add origin https://github.com/YOUR_USERNAME/live-streaming-app.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Deploy Backend to Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Select "Deploy an existing repository"
4. Connect your GitHub account and select the `live-streaming-app` repo
5. Configure:
   - **Name:** live-streaming-backend
   - **Root Directory:** backend
   - **Build Command:** npm install
   - **Start Command:** npm start

6. Under Environment Variables, add:
   - Key: `PORT` → Value: `10000`
   - Key: `CLIENT_URL` → Value: (leave empty for now, we'll update after frontend is deployed)

7. Click "Deploy"

## Step 4: Deploy Frontend to Render (or Vercel)

### Option A: Render
1. In Render, click "New +" → "Static Site"
2. Connect to your GitHub repo
3. Configure:
   - **Name:** live-streaming-frontend
   - **Root Directory:** frontend
   - **Build Command:** npm run build
   - **Publish Directory:** dist

4. Under Environment Variables, add:
   - Key: `VITE_SOCKET_URL` → Value: (leave empty for now)

5. Click "Deploy"

### Option B: Vercel (Recommended for React)
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Root Directory:** frontend
   - **Build Command:** npm run build
   - **Output Directory:** dist

4. Under Environment Variables, add:
   - Key: `VITE_SOCKET_URL` → Value: (leave empty for now)

5. Click "Deploy"

## Step 5: Link Backend and Frontend

Once both are deployed:

1. Copy your **frontend URL** (from Render or Vercel)
2. Copy your **backend URL** (from Render)

### Update Backend Environment Variables:
1. Go to Render → live-streaming-backend → Settings
2. Update `CLIENT_URL` to your frontend URL (e.g., `https://live-streaming-frontend.onrender.com`)
3. Click "Save"

### Update Frontend Environment Variables:
1. Go to Vercel/Render → live-streaming-frontend → Settings
2. Update `VITE_SOCKET_URL` to your backend URL (e.g., `https://live-streaming-backend.onrender.com`)
3. Trigger a redeploy

## Done!

Your live streaming app is now online:
- **Frontend:** https://your-frontend-url
- **Backend:** https://your-backend-url

Users can now:
- Go to the frontend URL
- Enter a username
- Click "Go Live" to stream or "Watch Live" to view
- Chat in real-time
- See live viewer counts
