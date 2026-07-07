import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

let streamerSocketId = null;
let streamerName = 'Streamer';
let streamActive = false;
const comments = [];
const viewers = new Set();
const viewerNames = new Map();

const broadcastViewerCount = () => {
    io.emit('viewer-count', viewers.size);
};

const broadcastStreamStatus = () => {
    io.emit('stream-status', {
        active: streamActive,
        streamerName
    });
};

const broadcastComments = () => {
    io.emit('chat-messages', comments.slice(-50));
};

io.on('connection', (socket) => {
    socket.emit('stream-status', {
        active: streamActive,
        streamerName
    });
    socket.emit('viewer-count', viewers.size);
    broadcastComments();

    socket.on('join-streamer', ({ username }) => {
        streamerSocketId = socket.id;
        streamerName = username || 'Streamer';
        streamActive = false;
        socket.emit('stream-status', {
            active: streamActive,
            streamerName
        });
        io.emit('streamer-ready', {
            streamerSocketId: socket.id,
            streamerName
        });
        broadcastStreamStatus();
    });

    socket.on('join-viewer', ({ username }) => {
        if (socket.id === streamerSocketId) {
            return;
        }

        viewers.add(socket.id);
        viewerNames.set(socket.id, username || 'Viewer');
        broadcastViewerCount();

        socket.emit('stream-status', {
            active: streamActive,
            streamerName
        });
        socket.emit('chat-messages', comments.slice(-50));
        socket.emit('viewer-count', viewers.size);

        if (streamerSocketId) {
            socket.emit('streamer-ready', {
                streamerSocketId,
                streamerName
            });
        }

        if (streamerSocketId && streamActive) {
            io.to(streamerSocketId).emit('viewer-joined', { viewerSocketId: socket.id });
        }
    });

    socket.on('request-stream', () => {
        if (streamerSocketId && streamActive) {
            io.to(streamerSocketId).emit('viewer-joined', { viewerSocketId: socket.id });
        }
    });

    socket.on('start-stream', () => {
        if (socket.id !== streamerSocketId) {
            return;
        }

        streamActive = true;
        broadcastStreamStatus();
        io.to([...viewers]).emit('stream-started');
    });

    socket.on('stop-stream', () => {
        if (socket.id !== streamerSocketId) {
            return;
        }

        streamActive = false;
        broadcastStreamStatus();
    });

    socket.on('send-message', ({ text, username }) => {
        const trimmed = text?.trim();
        if (!trimmed) {
            return;
        }

        const message = {
            id: `${Date.now()}-${socket.id.slice(0, 4)}`,
            username: username || viewerNames.get(socket.id) || 'Guest',
            text: trimmed,
            timestamp: new Date().toISOString()
        };

        comments.push(message);
        if (comments.length > 100) {
            comments.shift();
        }

        io.emit('new-comment', message);
    });

    socket.on('offer', ({ to, sdp }) => {
        socket.to(to).emit('offer', { from: socket.id, sdp });
    });

    socket.on('answer', ({ to, sdp }) => {
        socket.to(to).emit('answer', { from: socket.id, sdp });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
        socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    socket.on('disconnect', () => {
        if (socket.id === streamerSocketId) {
            streamerSocketId = null;
            streamActive = false;
            streamerName = 'Streamer';
            broadcastStreamStatus();
        }

        if (viewers.delete(socket.id)) {
            viewerNames.delete(socket.id);
            broadcastViewerCount();
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
