import { io } from 'socket.io-client';

const BACKEND = 'https://live-streaming-backend.onrender.com';

function wait(ms){return new Promise(res=>setTimeout(res,ms));}

async function run() {
  console.log('Starting test against', BACKEND);

  const viewer = io(BACKEND, { autoConnect: false });
  const streamer = io(BACKEND, { autoConnect: false });

  viewer.on('connect', () => {
    console.log('[viewer] connected', viewer.id);
    viewer.emit('join-viewer', { username: 'test-viewer' });
  });
  viewer.on('connect_error', (err) => console.log('[viewer] connect_error', err && err.message));
  viewer.on('connect_timeout', () => console.log('[viewer] connect_timeout'));
  viewer.on('stream-started', () => console.log('[viewer] received stream-started'));
  viewer.on('stream-status', (s) => console.log('[viewer] stream-status', s));
  viewer.on('streamer-ready', (d) => console.log('[viewer] streamer-ready', d));

  streamer.on('connect', () => {
    console.log('[streamer] connected', streamer.id);
    streamer.emit('join-streamer', { username: 'test-streamer' });
  });
  streamer.on('connect_error', (err) => console.log('[streamer] connect_error', err && err.message));
  streamer.on('connect_timeout', () => console.log('[streamer] connect_timeout'));
  streamer.on('viewer-joined', (d) => console.log('[streamer] viewer-joined', d));

  viewer.connect();
  streamer.connect();

  // wait for connections
  await wait(1500);

  console.log('[test] streamer emitting start-stream');
  streamer.emit('start-stream');

  // wait to receive events
  await wait(2000);

  viewer.disconnect();
  streamer.disconnect();

  console.log('Test finished');
}

run().catch((e)=>{console.error(e);process.exit(1);});
