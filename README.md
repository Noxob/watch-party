# Watch Party

A simple Node.js watch party application using Socket.IO. Create rooms, chat, and sync video playback among participants.

## Features
- Create and join rooms with human-readable keys
- Room-based chat
- Video time synchronization
- Play and pause events shared to all participants
- Choose a unique name when joining a room

## Development
```bash
npm install
npm start
```

The app serves the client at http://localhost:3000.

## Deploying to Render
1. Create a new Web Service on [Render](https://render.com/) connected to this repository.
2. Use the Node runtime.
3. Set the start command to `npm start`.
4. The server listens on the port provided by `PORT` env variable.

Enjoy your watch party!
