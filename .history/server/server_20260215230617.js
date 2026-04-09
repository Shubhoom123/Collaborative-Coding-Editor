
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

  let filename, command;
  switch(language) {
    case 'python':
      filename = path.join(tempDir, `code_${socket.id}.py`);
      fs.writeFileSync(filename, code);
      command = `python3 ${filename}`;
      break;
    case 'javascript':
      filename = path.join(tempDir, `code_${socket.id}.js`);
      fs.writeFileSync(filename, code);
      command = `node ${filename}`;
      break;
    case 'cpp':
      filename = path.join(tempDir, `code_${socket.id}.cpp`);
      const execFilename = path.join(tempDir, `code_${socket.id}`);
      fs.writeFileSync(filename, code);
      command = `g++ ${filename} -o ${execFilename} && ${execFilename}`;
      break;
    case 'java':
      filename = path.join(tempDir, `Main.java`);
      fs.writeFileSync(filename, code);
      command = `javac ${filename} && java -cp ${tempDir} Main`;
      break;
    default:
      io.to(roomId).emit('compile-result', { 
        error: true, 
        message: 'Unsupported language' 
      });
      return;
  }

  exec(command, { timeout: 10000, cwd: tempDir }, (error, stdout, stderr) => {
    // Clean up temporary files
    try {
      if (fs.existsSync(filename)) {
        fs.unlinkSync(filename);
      }
      if (language === 'cpp') {
        const execFilename = path.join(tempDir, `code_${socket.id}`);
        if (fs.existsSync(execFilename)) {
          fs.unlinkSync(execFilename);
        }
      }
      if (language === 'java') {
        const classFile = path.join(tempDir, 'Main.class');
        if (fs.existsSync(classFile)) {
          fs.unlinkSync(classFile);
        }
      }
    } catch (cleanupError) {
      console.error('Error cleaning up files:', cleanupError);
    }

    if (error) {
      io.to(roomId).emit('compile-result', { 
        error: true, 
        message: error.message || stderr 
      });
      return;
    }

    io.to(roomId).emit('compile-result', { 
      error: false, 
      output: stdout || 'Code executed successfully' 
    });
  });
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        code: '// Start coding...',
        language: 'javascript',
        users: new Set()
      });
    }
    
    // Add user to room
    rooms.get(roomId).users.add(socket.id);
    
    // Send current code to the new user
    socket.emit('load-code', rooms.get(roomId));
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userCount: rooms.get(roomId).users.size
    });
    
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle code changes
  socket.on('code-change', ({ roomId, code }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).code = code;
      // Broadcast to everyone else in the room
      socket.to(roomId).emit('code-update', code);
    }
  });

  // Handle language changes
  socket.on('language-change', ({ roomId, language }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).language = language;
      socket.to(roomId).emit('language-update', language);
    }
  });

  // Handle code compilation
  socket.on('compile-code', ({ roomId, code, language }) => {
    if (rooms.has(roomId)) {
      compileAndRunCode(code, language, socket, roomId);
    }
  });

  // Handle chat messages
  socket.on('send-message', ({ roomId, message, username }) => {
    io.to(roomId).emit('receive-message', {
      message,
      username,
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove user from all rooms
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        socket.to(roomId).emit('user-left', {
          userId: socket.id,
          userCount: room.users.size
        });
        
        // Delete room if empty
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