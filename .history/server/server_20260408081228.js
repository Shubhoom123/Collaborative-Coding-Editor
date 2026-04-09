const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
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

// Store active rooms and their code
const rooms = new Map();

function compileAndRunCode(code, language, socket, roomId) {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Use socket.id to ensure unique filenames per user — fixes Java concurrent conflict
  const uid = socket.id.replace(/[^a-zA-Z0-9]/g, '');
  let filename, command;

  switch (language) {
    case 'python':
      filename = path.join(tempDir, `code_${uid}.py`);
      fs.writeFileSync(filename, code);
      command = `python3 "${filename}"`;
      break;

    case 'javascript':
      filename = path.join(tempDir, `code_${uid}.js`);
      fs.writeFileSync(filename, code);
      command = `node "${filename}"`;
      break;

    case 'cpp': {
      filename = path.join(tempDir, `code_${uid}.cpp`);
      const execFile = path.join(tempDir, `code_${uid}.out`);
      fs.writeFileSync(filename, code);
      command = `g++ "${filename}" -o "${execFile}" && "${execFile}"`;
      break;
    }

    case 'java': {
      // Extract public class name from code, fallback to Main
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : 'Main';

      // Each user gets their own subdirectory to avoid file conflicts
      const javaDir = path.join(tempDir, `java_${uid}`);
      if (!fs.existsSync(javaDir)) fs.mkdirSync(javaDir);

      filename = path.join(javaDir, `${className}.java`);
      fs.writeFileSync(filename, code);
      command = `javac "${filename}" && java -cp "${javaDir}" ${className}`;
      break;
    }

    default:
      io.to(roomId).emit('compile-result', {
        error: true,
        message: `Unsupported language: ${language}`
      });
      return;
  }

  exec(command, { timeout: 10000, cwd: tempDir }, (error, stdout, stderr) => {
    // Clean up temp files
    try {
      if (filename && fs.existsSync(filename)) fs.unlinkSync(filename);

      if (language === 'cpp') {
        const execFile = path.join(tempDir, `code_${uid}.out`);
        if (fs.existsSync(execFile)) fs.unlinkSync(execFile);
      }
      if (language === 'java') {
        const javaDir = path.join(tempDir, `java_${uid}`);
        if (fs.existsSync(javaDir)) {
          fs.readdirSync(javaDir).forEach(f => fs.unlinkSync(path.join(javaDir, f)));
          fs.rmdirSync(javaDir);
        }
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    if (error) {
      io.to(roomId).emit('compile-result', {
        error: true,
        message: stderr || error.message
      });
      return;
    }

    io.to(roomId).emit('compile-result', {
      error: false,
      output: stdout || '(No output)'
    });
  });
}

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

    // Fix: send userCount as a plain number, not users (Set doesn't serialize over socket)
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

  socket.on('compile-code', ({ roomId, code, language }) => {
    // Re-register room if server restarted (silent failure fix)
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        code,
        language,
        users: new Set([socket.id])
      });
    }
    compileAndRunCode(code, language, socket, roomId);
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