const WebSocket = require('ws');
const { exec } = require('child_process');
const path = require('path');
const wss = new WebSocket.Server({ port: 8080 });
const cameraIds = ['1111', '1221', '2121', '2425', '2633', '2342', '2233', '3001', '1211'];
const players = [];

// Scan for players on 4030.exaroton.me
function scanForPlayers() {
  setInterval(() => {
    console.log('Scanning for players on 4030.exaroton.me...');
    // Hypothetical: Query exaroton API or server for snooperEnabled: true players
  }, 10000);
}

wss.on('connection', ws => {
  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      if (data.event === 'waiting' && data.snooperEnabled) {
        const cameraId = cameraIds[Math.floor(Math.random() * cameraIds.length)];
        players.push({ ...data, cameraId });
        ws.send(JSON.stringify({ event: 'assign', cameraId }));
      } else if (data.event === 'join') {
        const filename = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.mp4';
        exec(`ffmpeg -i rtmp://minewatch-reborn.onrender.com:1935/live/cameraid${data.cameraId} -c copy -f mp4 videos/${filename} -f hls -hls_time 10 -hls_list_size 0 -hls_segment_filename /tmp/hls/cameraid${data.cameraId}_%03d.ts /tmp/hls/cameraid${data.cameraId}.m3u8`, (err) => {
          if (err) console.error(`FFmpeg error for camera ${data.cameraId}:`, err);
        });
        wss.clients.forEach(client => client.send(JSON.stringify({ 
          event: 'join', 
          cameraId: data.cameraId, 
          username: data.username, 
          mode: 'Multiplayer', // 4030.exaroton.me is a server
          version: '1.12.2', // Your server version
          action: data.action || 'Idle' 
        })));
      } else if (data.event === 'leave') {
        exec(`pkill -f "ffmpeg.*cameraid${data.cameraId}"`);
        const index = players.findIndex(p => p.cameraId === data.cameraId);
        if (index !== -1) players.splice(index, 1);
        wss.clients.forEach(client => client.send(JSON.stringify({ 
          event: 'leave', 
          cameraId: data.cameraId 
        })));
      } else if (data.event === 'action') {
        const index = players.findIndex(p => p.cameraId === data.cameraId);
        if (index !== -1) players[index].action = data.action;
        wss.clients.forEach(client => client.send(JSON.stringify({ 
          event: 'action', 
          cameraId: data.cameraId, 
          action: data.action || 'Idle' 
        })));
      } else if (data.text) {
        console.log(`Chat to ${data.cameraId}: ${data.text}`);
        // Hypothetical: Send /tellraw <username> <data.text> to 4030.exaroton.me
      }
    } catch (e) {
      console.error('WebSocket error:', e);
    }
  });
  ws.on('error', () => {});
  ws.on('close', () => {});
});

console.log('Streaming server running on port 8080');
scanForPlayers();