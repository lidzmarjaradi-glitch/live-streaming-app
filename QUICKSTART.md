# 🚀 Live Streaming App - Deployment Checklist

Your app is built and ready to deploy! Follow these steps to get it online.

## ✅ What's Done
- [x] Backend server (Node.js + Socket.IO)
- [x] Frontend app (React + Vite + Tailwind)
- [x] Local git repository initialized
- [x] .gitignore configured
- [x] Build verified and working
- [x] Deployment configs added (Procfile, render.yaml, netlify.toml, vercel.json)

## 📋 What You Need to Do

### 1️⃣ Create a GitHub Repository
- Go to https://github.com/new
- Name it: `live-streaming-app`
- Choose Public or Private
- Click "Create repository"
- Copy the HTTPS URL

### 2️⃣ Push Your Code to GitHub
Run in the project folder:
```bash
git remote add origin https://github.com/YOUR_USERNAME/live-streaming-app.git
git branch -M main
git push -u origin main
```

Or use the automated script:
```bash
push-to-github.bat
```

### 3️⃣ Deploy Backend to Render
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Select your GitHub repository
4. Configuration:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variable:
     - PORT: `10000`
     - CLIENT_URL: (update after frontend is deployed)
5. Click "Deploy"
6. **Save your backend URL** (e.g., `https://my-backend.onrender.com`)

### 4️⃣ Deploy Frontend (Choose One)

#### Option A: Vercel (Recommended for React)
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configuration:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Add environment variable:
     - VITE_SOCKET_URL: (update after backend URL is ready)
4. Click "Deploy"
5. **Save your frontend URL**

#### Option B: Render Static Site
1. Go to https://render.com → "New +" → "Static Site"
2. Select your GitHub repository
3. Configuration:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Add environment variable:
     - VITE_SOCKET_URL: (update after backend URL is ready)
4. Click "Deploy"
5. **Save your frontend URL**

### 5️⃣ Link Backend and Frontend

#### Update Backend:
1. Go to Render → live-streaming-backend → Settings
2. Under Environment Variables, update:
   - CLIENT_URL: `https://your-frontend-url.com`
3. Click "Save" and redeploy

#### Update Frontend:
1. Go to Vercel/Render → live-streaming-frontend → Settings
2. Under Environment Variables, update:
   - VITE_SOCKET_URL: `https://your-backend-url.onrender.com`
3. Trigger a redeploy

## 🎉 Done!

Your live streaming app is now online!

### Test It:
1. Go to your frontend URL
2. Open in two browser tabs/windows
3. In tab 1: Enter username → Click "Go Live"
4. In tab 2: Enter username → Click "Watch Live"
5. Try sending a comment
6. Click "Start Stream" to test screen sharing

### Features Available:
- ✅ Real-time chat
- ✅ Live viewer count
- ✅ Screen sharing (WebRTC)
- ✅ Stream status indicator
- ✅ Mobile responsive

## ⚠️ Important Notes

1. **Screen Sharing**: Uses `navigator.mediaDevices.getDisplayMedia()` - only works on HTTPS
2. **WebRTC**: Uses Google's STUN servers for NAT traversal
3. **Socket.IO**: Requires both frontend and backend to be publicly reachable
4. **Free Tier**: Render free tier spins down after 15 minutes of inactivity

## 📞 Support

- Backend runs on the URL provided by Render
- Frontend runs on the URL provided by Vercel/Render
- Both must be updated to point to each other for full functionality

See DEPLOYMENT.md for detailed step-by-step instructions.
