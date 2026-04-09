# Collaborative-Coding-Editor

My attempt at a real-time collaborative code editor that allows multiple users to code together simultaneously, with built-in code execution and live chat.

## Features
 
- **Real-time collaboration** — Multiple users can edit code in the same room simultaneously
- **Code execution** — Run code directly in the browser with output displayed in a terminal panel
- **Live chat** — Communicate with collaborators via the built-in chat sidebar
- **Multi-language support** — JavaScript, Python, Java, and C++
- **Room system** — Create or join rooms using a unique Room ID

## Live Demo
**[Try it live!](https://collaborative-coding-editor.onrender.com)**

## Tech Stack
 
- **Frontend:** React, Monaco Editor, Socket.io-client
- **Backend:** Node.js, Express, Socket.io
- **Code Execution:** Node.js

File Structure
```
collab-code-editor/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Editor.js   # Main editor with terminal
│       │   └── Chat.js     # Chat sidebar
│       ├── App.js          # Join room screen
│       └── index.js
└── server/                 # Node.js backend
    └── server.js           # Socket.io + code execution
```

Built on Render
