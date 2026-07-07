# Live Streaming Web App

A simple live streaming demo with two pages:
- Home page for choosing streamer or viewer mode
- Streamer page for screen sharing and live chat
- Viewer page for watching and commenting

## Features
- Username entry
- Screen share via the browser Screen Share API
- Live viewer count
- Real-time chat
- Stream online/offline status

## Project Structure
- backend: Express + Socket.IO server
- frontend: React + Vite + Tailwind client

## Setup

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment
Copy the backend example env file:
```bash
cp backend/.env.example backend/.env
```

Then start the backend and frontend in separate terminals.

## Notes
- The app is intended to be simple and functional rather than production-ready.
- WebRTC signaling is handled through Socket.IO for local demo use.
