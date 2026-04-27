# CHATTR — Local

Zero-config local chat app. Runs in 3 commands.

## Run it

```bash
npm install
node server.js
```

Open http://localhost:3000 — done.

## Show it to your class

Find your local IP:
- **Mac**: `ipconfig getifaddr en0`
- **Windows**: `ipconfig` → look for IPv4
- **Linux**: `hostname -I`

Anyone on the same WiFi can join at `http://<your-ip>:3000`

## Features
- Enter any display name → join the room
- Real-time messaging via Socket.io WebSockets
- Typing indicators
- Live online user count (hover to see names)
- Message history (last 50, stored in memory)
- Each user gets a unique color avatar
- Join/leave notifications
