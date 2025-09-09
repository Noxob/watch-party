const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const rooms = {};

function generateRoomKey() {
  const adjectives = ['happy', 'brave', 'cool', 'eager', 'fancy', 'jolly'];
  const nouns = ['lion', 'panda', 'otter', 'eagle', 'whale', 'fox'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${adjective}-${noun}-${number}`;
}

io.on('connection', (socket) => {
  socket.on('createRoom', () => {
    let key;
    do {
      key = generateRoomKey();
    } while (rooms[key]);
    rooms[key] = { video: { time: 0, playing: false } };
    socket.join(key);
    socket.emit('roomCreated', key);
  });

  socket.on('joinRoom', (key, cb) => {
    if (rooms[key]) {
      socket.join(key);
      socket.emit('videoState', rooms[key].video);
      cb && cb({ ok: true });
    } else {
      cb && cb({ ok: false, error: 'Room not found' });
    }
  });

  socket.on('chatMessage', ({ room, message }) => {
    io.to(room).emit('chatMessage', { sender: socket.id, message });
  });

  socket.on('videoTimeUpdate', ({ room, time }) => {
    if (rooms[room]) {
      rooms[room].video.time = time;
      socket.to(room).emit('videoTimeUpdate', time);
    }
  });

  socket.on('videoStateChange', ({ room, playing }) => {
    if (rooms[room]) {
      rooms[room].video.playing = playing;
      socket.to(room).emit('videoStateChange', playing);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
