const express = require("express");
const http = require("http");
const cors = require("cors");
const { userJoin, getUsers, userLeave } = require("./utils/user");

const app = express();
const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Store canvas state and elements for each ā
const rooms = new Map()
const BATCH_INTERVAL = 50; // ms
const drawingBatches = new Map();

// Process batched drawings
setInterval(() => {
  drawingBatches.forEach((batch, roomId) => {
    if (batch.length > 0) {
      // Send batch to all users in room
      io.to(roomId).emit('drawing-batch', batch);
      // Clear the batch
      drawingBatches.set(roomId, []);
    }
  });
}, BATCH_INTERVAL);

io.on("connection", (socket) => {
  let userRoom = null;

  socket.on("user-joined", (data) => {
    const { roomId, userId, userName, host, presenter } = data;
    userRoom = roomId;

    if (!drawingBatches.has(roomId)) {
        drawingBatches.set(roomId, []);
      }
    
    // Join user to room
    const user = userJoin(socket.id, userName, roomId, host, presenter);
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        elements: [],
        users: [],
      });
    }

    // Add user to room
    const room = rooms.get(roomId);
    room.users.push(user);
    
    // Send welcome message
    socket.emit("message", {
      message: "Welcome to ChatRoom"
    });
    
    socket.broadcast.to(roomId).emit("message", {
      message: `${userName} has joined`
    });

    // Send current users
    io.to(roomId).emit("users", getUsers(roomId));

    // Send current canvas state to new user
    socket.emit("drawing", room.elements);
  });

  socket.on("drawing", (data) => {
    if (!userRoom || !rooms.has(userRoom)) return;

    const room = rooms.get(userRoom);
    room.elements.push(data);

    const batch = drawingBatches.get(userRoom) || [];
    batch.push(data);
    drawingBatches.set(userRoom, batch);

    // Broadcast to others in room
    socket.broadcast.to(userRoom).emit("drawing", data);
  });

  socket.on("clear", () => {
    if (!userRoom || !rooms.has(userRoom)) return;

    const room = rooms.get(userRoom);
    room.elements = [];

    // Broadcast clear to all in room
    io.to(userRoom).emit("clear");
  });

  socket.on("undo", () => {
    if (!userRoom || !rooms.has(userRoom)) return;

    const room = rooms.get(userRoom);
    if (room.elements.length > 0) {
      room.elements.pop();
      io.to(userRoom).emit("update-canvas", room.elements);
    }
  });

  socket.on("disconnect", () => {
    const userLeaves = userLeave(socket.id);
    
    if (userLeaves) {
      // Remove user from room
      const room = rooms.get(userLeaves.room);
      if (room) {
        room.users = room.users.filter(u => u.id !== socket.id);
        
        // Delete room if empty
        if (room.users.length === 0) {
          rooms.delete(userLeaves.room);
        }
      }

      // Notify others
      io.to(userLeaves.room).emit("message", {
        message: `${userLeaves.username} left the chat`
      });
      
      io.to(userLeaves.room).emit("users", getUsers(userLeaves.room));
    }
  });
});

// Basic endpoints
app.get("/", (req, res) => {
  res.json({ status: "Server is running" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    connections: io.engine.clientsCount,
    rooms: Array.from(rooms.keys())
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => 
  console.log(`Server running on http://localhost:${PORT}`)
);

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});