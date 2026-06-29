const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*path', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Store active rooms and their code
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        code: '// Start coding...',
        language: 'javascript',
        users: new Set()
      });
    }

    const room = rooms.get(roomId);
    room.users.add(socket.id);

    socket.emit('load-code', {
      code: room.code,
      language: room.language,
      userCount: room.users.size
    });

    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userCount: room.users.size
    });

    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('code-change', ({ roomId, code }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).code = code;
      socket.to(roomId).emit('code-update', code);
    }
  });

  socket.on('language-change', ({ roomId, language }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).language = language;
      socket.to(roomId).emit('language-update', language);
    }
  });

  socket.on('send-message', ({ roomId, message, username }) => {
    io.to(roomId).emit('receive-message', {
      message,
      username,
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        socket.to(roomId).emit('user-left', {
          userId: socket.id,
          userCount: room.users.size
        });
        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});