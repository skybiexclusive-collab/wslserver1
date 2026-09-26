const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// index.html ana dizinde olduğu için doğrudan kök dizini sunuyoruz
app.use(express.static(__dirname));

wss.on('connection', (ws) => {
  // Render gerçek Linux olduğu için doğrudan 'bash' kabuğu başlatılır
  const ptyProcess = pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || process.cwd(),
    env: process.env
  });

  ptyProcess.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  ws.on('message', (message) => {
    ptyProcess.write(message.toString());
  });

  ws.on('close', () => {
    ptyProcess.kill();
  });

  ptyProcess.onExit(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });
});

// Render'ın dinamik portunu alır
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Web terminali aktif: Port ${PORT}`);
});
