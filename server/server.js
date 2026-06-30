const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGIN = process.env.CLIENT_URL || 'http://localhost:3000';

const io = socketIo(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST']
  },
  // Limit incoming message size to 200 KB (covers max code + overhead)
  maxHttpBufferSize: 200 * 1024
});

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '10kb' }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
}));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*path', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// ── Validation constants ────────────────────────────────────────────────────
const ROOM_ID_RE = /^[a-zA-Z0-9_-]{1,32}$/;
const MAX_USERNAME_LEN = 32;
const MAX_MESSAGE_LEN = 1000;
const MAX_CODE_LEN = 100_000;
const MAX_USERS_PER_ROOM = 10;
const MAX_ROOMS = 200;

// ── Socket-level rate limiter ───────────────────────────────────────────────
// Tracks per-socket, per-event counters in a rolling window.
const socketRateLimits = new Map();

function allowSocketEvent(socketId, event, maxCount = 30, windowMs = 10_000) {
  const now = Date.now();
  if (!socketRateLimits.has(socketId)) socketRateLimits.set(socketId, {});
  const limits = socketRateLimits.get(socketId);
  if (!limits[event] || now > limits[event].resetAt) {
    limits[event] = { count: 1, resetAt: now + windowMs };
    return true;
  }
  limits[event].count += 1;
  return limits[event].count <= maxCount;
}

function cleanSocketLimits(socketId) {
  socketRateLimits.delete(socketId);
}

// ── Input helpers ───────────────────────────────────────────────────────────
function sanitizeStr(value, maxLen) {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLen);
}

function validRoomId(id) {
  return typeof id === 'string' && ROOM_ID_RE.test(id);
}

// ── Room state ──────────────────────────────────────────────────────────────
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (rawRoomId) => {
    if (!allowSocketEvent(socket.id, 'join-room', 5, 30_000)) {
      socket.emit('error-event', { message: 'Too many join attempts.' });
      return;
    }

    if (!validRoomId(rawRoomId)) {
      socket.emit('error-event', { message: 'Invalid room ID.' });
      return;
    }

    const roomId = rawRoomId;

    if (!rooms.has(roomId) && rooms.size >= MAX_ROOMS) {
      socket.emit('error-event', { message: 'Server is at room capacity.' });
      return;
    }

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        code: '// Start coding...',
        language: 'javascript',
        users: new Set()
      });
    }

    const room = rooms.get(roomId);

    if (room.users.size >= MAX_USERS_PER_ROOM) {
      socket.emit('error-event', { message: 'Room is full.' });
      return;
    }

    socket.join(roomId);
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
    if (!allowSocketEvent(socket.id, 'code-change', 60, 5_000)) return;

    if (!validRoomId(roomId) || !rooms.has(roomId)) return;

    const sanitizedCode = sanitizeStr(code, MAX_CODE_LEN);
    if (sanitizedCode === null) return;

    rooms.get(roomId).code = sanitizedCode;
    socket.to(roomId).emit('code-update', sanitizedCode);
  });

  socket.on('language-change', ({ roomId, language }) => {
    if (!allowSocketEvent(socket.id, 'language-change', 10, 10_000)) return;

    if (!validRoomId(roomId) || !rooms.has(roomId)) return;

    const allowed = ['javascript', 'python', 'java', 'cpp'];
    if (!allowed.includes(language)) {
      socket.emit('error-event', { message: 'Unsupported language.' });
      return;
    }

    rooms.get(roomId).language = language;
    socket.to(roomId).emit('language-update', language);
  });

  socket.on('send-message', ({ roomId, message, username }) => {
    if (!allowSocketEvent(socket.id, 'send-message', 20, 10_000)) {
      socket.emit('error-event', { message: 'Sending messages too fast.' });
      return;
    }

    if (!validRoomId(roomId) || !rooms.has(roomId)) return;

    const sanitizedMessage = sanitizeStr(message, MAX_MESSAGE_LEN);
    const sanitizedUsername = sanitizeStr(username, MAX_USERNAME_LEN);

    if (!sanitizedMessage || !sanitizedUsername) return;

    io.to(roomId).emit('receive-message', {
      message: sanitizedMessage,
      username: sanitizedUsername,
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    cleanSocketLimits(socket.id);

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
