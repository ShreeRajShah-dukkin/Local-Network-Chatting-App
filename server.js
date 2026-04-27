const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Serve frontend — works if index.html is in /public OR same folder as server.js
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname));
app.get("/", (req, res) => {
  const fs = require("fs");
  const inPublic = path.join(__dirname, "public", "index.html");
  const inRoot   = path.join(__dirname, "index.html");
  if (fs.existsSync(inPublic)) res.sendFile(inPublic);
  else if (fs.existsSync(inRoot)) res.sendFile(inRoot);
  else res.send("❌ index.html not found. Put it next to server.js or inside a /public folder.");
});

// Store last 50 messages in memory
const messageHistory = [];
const connectedUsers = new Map(); // socketId → { name, color }

// Give each user a random accent color
const USER_COLORS = [
  "#e8ff3e", "#ff4e3a", "#3dff87", "#4e9eff",
  "#ff9f3d", "#c87eff", "#ff4eb8", "#3dfff0"
];
let colorIndex = 0;

io.on("connection", (socket) => {
  console.log(`[+] connected: ${socket.id}`);

  // Send message history to new user
  socket.emit("history", messageHistory);

  // User sets their name
  socket.on("join", ({ name }) => {
    const color = USER_COLORS[colorIndex % USER_COLORS.length];
    colorIndex++;
    connectedUsers.set(socket.id, { name, color });
    broadcastOnlineCount();

    const sysMsg = { type: "system", text: `${name} joined the room` };
    io.emit("system_msg", sysMsg);
    console.log(`[join] ${name}`);
  });

  // Relay message to everyone
  socket.on("send_message", ({ text }) => {
    const user = connectedUsers.get(socket.id);
    if (!user || !text?.trim()) return;

    const msg = {
      name: user.name,
      color: user.color,
      text: text.trim().slice(0, 500),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      socketId: socket.id
    };

    messageHistory.push(msg);
    if (messageHistory.length > 50) messageHistory.shift();

    io.emit("receive_message", msg);
  });

  // Typing indicator
  socket.on("typing", () => {
    const user = connectedUsers.get(socket.id);
    if (user) socket.broadcast.emit("user_typing", { name: user.name, socketId: socket.id });
  });

  socket.on("stop_typing", () => {
    socket.broadcast.emit("user_stop_typing", { socketId: socket.id });
  });

  socket.on("disconnect", () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`[-] ${user.name} disconnected`);
      io.emit("system_msg", { type: "system", text: `${user.name} left the room` });
      connectedUsers.delete(socket.id);
      broadcastOnlineCount();
    }
  });
});

function broadcastOnlineCount() {
  const names = [...connectedUsers.values()].map(u => u.name);
  io.emit("online_users", names);
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log("\n🚀 CHATTR is running!");
  console.log(`   Open http://localhost:${PORT} in your browser\n`);
});