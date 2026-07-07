import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://three-yaks-build.loca.lt', { autoConnect: false });

const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function HomePage() {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    const handleJoin = (mode) => {
        const name = username.trim() || (mode === 'stream' ? 'Streamer' : 'Viewer');
        localStorage.setItem('stream-username', name);
        if (mode === 'stream') {
            socket.connect();
            socket.emit('join-streamer', { username: name });
            navigate('/streamer');
        } else {
            socket.connect();
            socket.emit('join-viewer', { username: name });
            navigate('/viewer');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
            <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
                <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Live Streaming Demo</p>
                    <h1 className="mt-2 text-3xl font-semibold">Simple streaming room</h1>
                    <p className="mt-3 text-slate-400">Enter your name and join the room as a streamer or viewer.</p>
                </div>

                <label className="flex flex-col gap-2 text-sm font-medium">
                    <span>Username</span>
                    <input
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none ring-0"
                        placeholder="Enter your name"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                    />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        className="flex-1 rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
                        onClick={() => handleJoin('stream')}
                    >
                        Go Live
                    </button>
                    <button
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 font-semibold transition hover:bg-slate-700"
                        onClick={() => handleJoin('watch')}
                    >
                        Watch Live
                    </button>
                </div>
            </div>
        </div>
    );
}

function StreamerPage() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [comments, setComments] = useState([]);
    const [streamStatus, setStreamStatus] = useState('Offline');
    const [username, setUsername] = useState('');
    const localVideoRef = useRef(null);
    const streamRef = useRef(null);
    const peerConnectionsRef = useRef(new Map());

    useEffect(() => {
        const saved = localStorage.getItem('stream-username') || 'Streamer';
        setUsername(saved);

        socket.on('viewer-count', (count) => setViewerCount(count));
        socket.on('chat-messages', (messages) => setComments(messages));
        socket.on('new-comment', (message) => setComments((prev) => [...prev, message]));
        socket.on('stream-status', ({ active, streamerName }) => {
            setStreamStatus(active ? 'Live' : 'Offline');
            setUsername(streamerName || saved);
        });
        socket.on('offer', async ({ from, sdp }) => {
            if (!streamRef.current) {
                return;
            }

            const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            peerConnectionsRef.current.set(from, pc);

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', { to: from, candidate: event.candidate });
                }
            };

            streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current));
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { to: from, sdp: answer });
        });
        socket.on('ice-candidate', async ({ from, candidate }) => {
            const pc = peerConnectionsRef.current.get(from);
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        return () => {
            socket.off('viewer-count');
            socket.off('chat-messages');
            socket.off('new-comment');
            socket.off('stream-status');
            socket.off('offer');
            socket.off('ice-candidate');
            peerConnectionsRef.current.forEach((connection) => connection.close());
            peerConnectionsRef.current.clear();
        };
    }, []);

    const startStream = async () => {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            streamRef.current = displayStream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = displayStream;
            }

            socket.emit('start-stream');
            setIsStreaming(true);
            setStreamStatus('Live');
        } catch (error) {
            console.error(error);
            alert('Screen sharing was cancelled or unavailable.');
        }
    };

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        socket.emit('stop-stream');
        setIsStreaming(false);
        setStreamStatus('Offline');
    };

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">Streamer Room</p>
                        <h2 className="text-2xl font-semibold">{username}</h2>
                    </div>
                    <Link to="/" className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Back Home</Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Viewers: {viewerCount}</p>
                                <p className="text-lg font-semibold">Status: {streamStatus}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="rounded-lg bg-cyan-500 px-3 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400"
                                    onClick={startStream}
                                    disabled={isStreaming}
                                >
                                    Start Stream
                                </button>
                                <button
                                    className="rounded-lg border border-slate-700 px-3 py-2 font-semibold transition hover:bg-slate-800"
                                    onClick={stopStream}
                                    disabled={!isStreaming}
                                >
                                    Stop Stream
                                </button>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-800 bg-black">
                            <video ref={localVideoRef} autoPlay muted playsInline className="min-h-[320px] w-full bg-black" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
                        <h3 className="mb-4 text-lg font-semibold">Live Chat</h3>
                        <div className="flex h-[360px] flex-col gap-2 overflow-y-auto rounded-xl bg-slate-950/70 p-3">
                            {comments.length === 0 ? (
                                <p className="text-sm text-slate-500">No comments yet.</p>
                            ) : comments.map((comment) => (
                                <div key={comment.id} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-cyan-400">{comment.username}</span>
                                        <span className="text-xs text-slate-500">{formatTime(comment.timestamp)}</span>
                                    </div>
                                    <p className="mt-1 text-slate-300">{comment.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ViewerPage() {
    const [viewerCount, setViewerCount] = useState(0);
    const [comments, setComments] = useState([]);
    const [message, setMessage] = useState('');
    const [username, setUsername] = useState('');
    const [streamActive, setStreamActive] = useState(false);
    const [streamerName, setStreamerName] = useState('');
    const [streamerSocketId, setStreamerSocketId] = useState(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);

    useEffect(() => {
        const storedName = localStorage.getItem('stream-username') || 'Viewer';
        setUsername(storedName);

        socket.on('viewer-count', (count) => setViewerCount(count));
        socket.on('chat-messages', (messages) => setComments(messages));
        socket.on('new-comment', (message) => setComments((prev) => [...prev, message]));
        socket.on('stream-status', ({ active, streamerName }) => {
            setStreamActive(active);
            setStreamerName(streamerName || 'Streamer');
        });
        socket.on('streamer-ready', ({ streamerSocketId, streamerName }) => {
            setStreamerSocketId(streamerSocketId);
            setStreamerName(streamerName || 'Streamer');
        });

        socket.on('stream-started', async () => {
            await connectToStreamer();
        });

        socket.on('offer', async ({ from, sdp }) => {
            const pc = createPeerConnection(from);
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { to: from, sdp: answer });
        });

        socket.on('answer', async ({ from, sdp }) => {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
            }
        });

        socket.on('ice-candidate', async ({ from, candidate }) => {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        socket.emit('join-viewer', { username: storedName });
        socket.emit('request-stream');

        return () => {
            socket.off('viewer-count');
            socket.off('chat-messages');
            socket.off('new-comment');
            socket.off('stream-status');
            socket.off('streamer-ready');
            socket.off('stream-started');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
        };
    }, []);

    const createPeerConnection = (remoteSocketId) => {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerConnectionRef.current = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { to: remoteSocketId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }

        return pc;
    };

    const connectToStreamer = async () => {
        if (!streamerSocketId || peerConnectionRef.current) {
            return;
        }

        const pc = createPeerConnection(streamerSocketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { to: streamerSocketId, sdp: offer });
    };

    const sendMessage = () => {
        const text = message.trim();
        if (!text) {
            return;
        }

        socket.emit('send-message', { text, username });
        setMessage('');
    };

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">Viewer Room</p>
                        <h2 className="text-2xl font-semibold">Watching {streamerName}</h2>
                    </div>
                    <Link to="/" className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">Back Home</Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">Viewers: {viewerCount}</p>
                                <p className="text-lg font-semibold">{streamActive ? 'Live now' : 'No one is currently live.'}</p>
                            </div>
                            <div className="rounded-full border border-slate-700 px-3 py-1 text-sm">{username}</div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-800 bg-black">
                            {streamActive ? (
                                <video ref={remoteVideoRef} autoPlay playsInline className="min-h-[320px] w-full bg-black" />
                            ) : (
                                <div className="flex min-h-[320px] items-center justify-center bg-slate-900 text-slate-400">
                                    No one is currently live.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
                        <h3 className="mb-4 text-lg font-semibold">Live Chat</h3>
                        <div className="mb-3 flex h-[300px] flex-col gap-2 overflow-y-auto rounded-xl bg-slate-950/70 p-3">
                            {comments.length === 0 ? (
                                <p className="text-sm text-slate-500">No comments yet.</p>
                            ) : comments.map((comment) => (
                                <div key={comment.id} className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-cyan-400">{comment.username}</span>
                                        <span className="text-xs text-slate-500">{formatTime(comment.timestamp)}</span>
                                    </div>
                                    <p className="mt-1 text-slate-300">{comment.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none"
                                placeholder="Type a comment"
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
                            />
                            <button className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950" onClick={sendMessage}>Send</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function App() {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <div className="min-h-screen bg-slate-950">
            {!isHome && (
                <div className="mx-auto flex max-w-6xl justify-end px-4 pt-4">
                    <Link to="/" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Home</Link>
                </div>
            )}
            <Routes />
        </div>
    );
}

function Routes() {
    const location = useLocation();

    return (
        <>
            <Link to="/" />
            {location.pathname === '/' ? <HomePage /> : location.pathname === '/streamer' ? <StreamerPage /> : <ViewerPage />}
        </>
    );
}

export default App;
