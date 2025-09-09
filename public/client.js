const socket = io();

const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const nameInput = document.getElementById('nameInput');
const roomDisplay = document.getElementById('roomDisplay');
const setupDiv = document.getElementById('setup');
const partyDiv = document.getElementById('party');
const video = document.getElementById('video');
const messages = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

let currentRoom = null;
let currentName = '';
let lastSent = 0;

createBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (!name) {
    alert('Enter a name');
    return;
  }
  socket.emit('createRoom', name, (res) => {
    if (res.ok) {
      currentRoom = res.key;
      currentName = name;
      roomInput.value = res.key;
      startParty();
    }
  });
};

joinBtn.onclick = () => {
  const key = roomInput.value.trim();
  const name = nameInput.value.trim();
  if (!key || !name) {
    alert('Enter room key and name');
    return;
  }
  socket.emit('joinRoom', { key, name }, (res) => {
    if (res.ok) {
      currentRoom = key;
      currentName = name;
      startParty();
    } else {
      alert(res.error);
    }
  });
};

function startParty() {
  roomDisplay.textContent = currentRoom;
  setupDiv.style.display = 'none';
  partyDiv.style.display = 'block';
}

sendBtn.onclick = sendMessage;
msgInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit('chatMessage', { room: currentRoom, message: text });
  msgInput.value = '';
}

socket.on('chatMessage', ({ sender, message }) => {
  const li = document.createElement('li');
  li.textContent = `${sender}: ${message}`;
  messages.appendChild(li);
});

video.addEventListener('play', () => {
  socket.emit('videoStateChange', { room: currentRoom, playing: true });
});
video.addEventListener('pause', () => {
  socket.emit('videoStateChange', { room: currentRoom, playing: false });
});
video.addEventListener('timeupdate', () => {
  if (Math.abs(video.currentTime - lastSent) > 0.5) {
    lastSent = video.currentTime;
    socket.emit('videoTimeUpdate', { room: currentRoom, time: video.currentTime });
  }
});

socket.on('videoTimeUpdate', (time) => {
  if (Math.abs(video.currentTime - time) > 0.5) {
    video.currentTime = time;
  }
});

socket.on('videoStateChange', (playing) => {
  if (playing && video.paused) video.play();
  if (!playing && !video.paused) video.pause();
});

socket.on('videoState', ({ time, playing }) => {
  video.currentTime = time;
  if (playing) video.play();
  else video.pause();
});
