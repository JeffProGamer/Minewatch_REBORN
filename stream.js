const WebSocket = require('ws');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const wss = new WebSocket.Server({ port: 8080 });
const players = [];

// Generate a random 4-digit camera ID
function generateRandomCameraId() {
  const usedIds = players.map(p => p.cameraId);
  let newId;
  do {
    newId = Math.floor(1000 + Math.random() * 9000).toString();
  } while (usedIds.includes(newId));
  return newId;
}

// Notify player via RCON (update with your server details)
function notifyPlayer(username, cameraId) {
  console.log(`Sending /tellraw to ${username}: Your camera ID is ${cameraId}`);
  // Replace with your RCON command
  // Example: exec(`mcrcon -H <server-ip> -P 25575 -p your_secure_password "tellraw ${username} {\"text\":\"Your camera ID is ${cameraId}\",\"color\":\"green\"}"`);
}

// Parse logs/latest.log for player events (update path)
function scanForPlayers() {
  setInterval(() => {
    console.log('Scanning for players on :25565...');
    // Update with path to logs/latest.log or API call
    /*
    fs.readFile('/path/to/server/logs/latest.log', 'utf8', (err, data) => {
      if (err) return console.error('Log read error:', err);
      const lines = data.split('\n');
      lines.forEach(line => {
        if (line.includes('joined the game')) {
          const username = line.match(/\[Server\] (\w+) joined the game/)?.[1];
          if (username && !players.find(p => p.username === username)) {
            const cameraId = generateRandomCameraId();
            players.push({ username, cameraId });
            notifyPlayer(username, cameraId);
            wss.clients.forEach(client => client.send(JSON.stringify({
              event: 'join',
              cameraId,
              username,
              mode: 'Multiplayer',
              version: '1.12.2',
              action: 'Idle'
            })));
          }
        } else if (line.includes('left the game')) {
          const username = line.match(/\[Server\] (\w+) left the game/)?.[1];
          const player = players.find(p => p.username === username);
          if (player) {
            exec(`pkill -f "ffmpeg.*cameraid${player.cameraId}"`);
            players.splice(players.indexOf(player), 1);
            wss.clients.forEach(client => client.send(JSON.stringify({
              event: 'leave',
              cameraId: player.cameraId
            })));
          }
        }
      });
    });
    */
    // Simulated player for testing
    const username = 'TestPlayer';
    if (!players.find(p => p.username === username)) {
      const cameraId = generateRandomCameraId();
      players.push({ username, cameraId });
      notifyPlayer(username, cameraId);
      wss.clients.forEach(client => client.send(JSON.stringify({
        event: 'join',
        cameraId,
        username,
        mode: 'Multiplayer',
        version: '1.12.2',
        action: 'Idle'
      })));
    }
  }, 10000);
}

wss.on('connection', ws => {
  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      if (data.event === 'waiting' && data.snooperEnabled) {
        const cameraId = generateRandomCameraId();
        players.push({ ...data, cameraId });
        notifyPlayer(data.username, cameraId);
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
          mode: 'Multiplayer',
          version: '1.12.2',
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
        // Send /tellraw via RCON
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