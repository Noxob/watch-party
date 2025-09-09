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
  socket.on('createRoom', (name, cb) => {
    let key;
    do {
      key = generateRoomKey();
    } while (rooms[key]);
    rooms[key] = {
      video: { time: 0, playing: false },
      users: { [name]: socket.id },
    };
    socket.join(key);
    socket.name = name;
    socket.room = key;
    cb && cb({ ok: true, key });
  });

  socket.on('joinRoom', ({ key, name }, cb) => {
    const room = rooms[key];
    if (room) {
      if (room.users[name]) {
        cb && cb({ ok: false, error: 'Name already taken' });
        return;
      }
      room.users[name] = socket.id;
      socket.join(key);
      socket.name = name;
      socket.room = key;
      socket.emit('videoState', { ...room.video, timestamp: new Date().toISOString() });
      cb && cb({ ok: true });
    } else {
      cb && cb({ ok: false, error: 'Room not found' });
    }
  });

  socket.on('chatMessage', ({ room, message }) => {
    const timestamp = new Date().toISOString();
    io.to(room).emit('chatMessage', { sender: socket.name, message, timestamp });
  });

  socket.on('videoTimeUpdate', ({ room, time }) => {
    if (rooms[room]) {
      rooms[room].video.time = time;
      const timestamp = new Date().toISOString();
      socket.to(room).emit('videoTimeUpdate', { time, timestamp });
    }
  });

  socket.on('videoStateChange', ({ room, playing }) => {
    if (rooms[room]) {
      rooms[room].video.playing = playing;
      const timestamp = new Date().toISOString();
      socket.to(room).emit('videoStateChange', { playing, timestamp });
    }
  });

  socket.on('disconnect', () => {
    const { room, name } = socket;
    if (room && rooms[room]) {
      delete rooms[room].users[name];
      if (Object.keys(rooms[room].users).length === 0) {
        delete rooms[room];
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
