
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

wss.on('connection', (ws) => {
  // Doğrudan Ubuntu dağıtımını başlatır (varsayılan WSL için args dizisi [] yapılabilir)
  const ptyProcess = pty.spawn('wsl.exe', ['-d', 'Ubuntu'], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.USERPROFILE,
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

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`WinWSL Çoklu Oturum Sunucusu: http://localhost:${PORT}`);
});
