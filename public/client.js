const socket = io();

const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const roomDisplay = document.getElementById('roomDisplay');
const setupDiv = document.getElementById('setup');
const partyDiv = document.getElementById('party');
const video = document.getElementById('video');
const messages = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');

let currentRoom = null;
let lastSent = 0;

createBtn.onclick = () => {
  socket.emit('createRoom');
};

joinBtn.onclick = () => {
  const key = roomInput.value.trim();
  socket.emit('joinRoom', key, (res) => {
    if (res.ok) {
      currentRoom = key;
      startParty();
    } else {
      alert(res.error);
    }
  });
};

socket.on('roomCreated', (key) => {
  currentRoom = key;
  roomInput.value = key;
  startParty();
});

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
