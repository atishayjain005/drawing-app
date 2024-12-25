// server.js

const express = require("express");
const http = require("http");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { userJoin, getUsers, userLeave } = require("./utils/user");
require("dotenv").config();

const supabase = createClient(process.env.DB_URL, process.env.DB_SECRET);

// Rest of your imports...

const app = express();
const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// Store canvas state and elements for each room
const rooms = new Map();
const BATCH_INTERVAL = 50; // ms
const drawingBatches = new Map();

// Process batched drawings
setInterval(() => {
  drawingBatches.forEach((batch, roomId) => {
    if (batch.length > 0) {
      // Send batch to all users in room
      io.to(roomId).emit("drawing-batch", batch);
      // Clear the batch
      drawingBatches.set(roomId, []);
    }
  });
}, BATCH_INTERVAL);

// Function to save a drawing to Supabase
async function saveDrawing(roomId, elementData) {
  const { data, error } = await supabase.from("drawings").insert({
    room_id: roomId,
    element_data: elementData,
    sequence: elementData.sequence, // Add sequence to track order
  });

  if (error) console.error("Error saving drawing:", error);
  return data;
}

// Function to retrieve all drawings for a room
async function getRoomDrawings(roomId) {
  const { data, error } = await supabase
    .from("drawings")
    .select("element_data")
    .eq("room_id", roomId)
    .order("sequence", { ascending: true });

  if (error) {
    console.error("Error fetching drawings:", error);
    return [];
  }
  return data.map((d) => d.element_data);
}

io.on("connection", (socket) => {
  let userRoom = null;

  socket.on("user-joined", async (data) => {
    const { roomId, userId, userName, host, presenter } = data;
    userRoom = roomId;

    const { error: roomError } = await supabase.from("rooms").upsert({
      id: roomId,
      active: true,
    });

    if (roomError) console.error("Error updating room:", roomError);

    if (!drawingBatches.has(roomId)) {
      drawingBatches.set(roomId, []);
    }

    // Join user to room with color
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
    if (room && room.elements.length > 0) {
      // Send all existing elements at once
      socket.emit("initialize-canvas", room.elements);
    }
    room.users.push(user);

    // Send welcome message along with user info
    socket.emit("message", {
      message: "Welcome to ChatRoom",
      user: {
        id: user.id,
        username: user.username,
        color: user.color,
      },
    });

    socket.broadcast.to(roomId).emit("message", {
      message: `${userName} has joined`,
      user: {
        id: user.id,
        username: user.username,
        color: user.color,
      },
    });

    // Send current users with their colors
    io.to(roomId).emit("users", getUsers(roomId));

    const existingDrawings = await getRoomDrawings(roomId);
    rooms.get(roomId).elements = existingDrawings;

    // Send current canvas state to new user
    socket.emit("drawing", existingDrawings);

    const drawingSubscription = supabase
      .channel(`room-${roomId}`)
      .on(
        "INSERT",
        {
          event: "*",
          schema: "public",
          table: "drawings",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Handle new drawings from other clients/servers
          if (payload.new && payload.new.element_data) {
            socket.broadcast
              .to(roomId)
              .emit("drawing", payload.new.element_data);
          }
        }
      )
      .subscribe();

    socket.on("disconnect", () => {
      drawingSubscription.unsubscribe();
    });
  });

  socket.on("drawing", async (data) => {
    if (!userRoom || !rooms.has(userRoom)) return;

    const room = rooms.get(userRoom);
    const user = room.users.find(u => u.id === socket.id);
    if (!user) return;

    const drawingData = {
      ...data,
      color: user.color, // Include user color
      sequence: room.elements.length + 1, // Ensure sequence is incremented
    };

    room.elements.push(drawingData);

    await saveDrawing(userRoom, drawingData);

    const batch = drawingBatches.get(userRoom) || [];
    batch.push(drawingData);
    drawingBatches.set(userRoom, batch);

    // Broadcast to others in room
    socket.broadcast.to(userRoom).emit("drawing", drawingData);
  });

  socket.on("clear", async () => {
    if (!userRoom || !rooms.has(userRoom)) return;

    const { error } = await supabase
      .from("drawings")
      .delete()
      .eq("room_id", userRoom);

    if (error) console.error("Error clearing drawings:", error);

    const room = rooms.get(userRoom);
    room.elements = [];

    io.to(userRoom).emit("clear");
  });

  socket.on("undo", async () => {
    if (!userRoom || !rooms.has(userRoom)) return;

    const room = rooms.get(userRoom);
    if (room.elements.length > 0) {
      // Remove last drawing from Supabase
      const lastSequence = room.elements.length;
      const { error } = await supabase
        .from("drawings")
        .delete()
        .eq("room_id", userRoom)
        .eq("sequence", lastSequence);

      if (error) console.error("Error undoing drawing:", error);

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
        room.users = room.users.filter((u) => u.id !== socket.id);

        // Delete room if empty
        if (room.users.length === 0) {
          rooms.delete(userLeaves.room);
        }
      }

      // Notify others
      io.to(userLeaves.room).emit("message", {
        message: `${userLeaves.username} left the chat`,
      });

      io.to(userLeaves.room).emit("users", getUsers(userLeaves.room));
    }
  });
});

// Basic endpoints remain unchanged
app.get("/", (req, res) => {
  res.json({ status: "Server is running" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    connections: io.engine.clientsCount,
    rooms: Array.from(rooms.keys()),
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

// Graceful shutdown remains unchanged
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
