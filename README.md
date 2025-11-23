# Collaborative-Coding-Editor

A real-time collaborative code editor that allows multiple users to code together simultaneously. Built with React, Node.js, Socket.io, and Monaco Editor.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://collaborative-coding-editor.onrender.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ Features

- 💻 **Real-time Collaboration** - Multiple users can edit code simultaneously
- 🎨 **Syntax Highlighting** - Support for 8+ programming languages (JavaScript, Python, Java, C++, HTML, CSS, TypeScript, JSON)
- 💬 **Built-in Chat** - Collaborate with team members via integrated chat
- 🌙 **Dark Theme** - Beautiful VS Code-inspired dark theme
- 🔄 **Live Sync** - Changes sync instantly across all connected users
- 🏷️ **Room System** - Create or join rooms using unique room IDs
- 👥 **User Presence** - See how many users are online in your room
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## 🌐 Live Demo

**[Try it live!](https://collaborative-coding-editor.onrender.com)**

## 🛠️ Tech Stack

### Frontend
- React.js
- Monaco Editor (VS Code's editor)
- Socket.io Client
- CSS3

### Backend
- Node.js
- Express
- Socket.io
- CORS

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Clone the Repository
```bash
git clone https://github.com/Shubhoom123/Collaborative-Coding-Editor.git
cd Collaborative-Coding-Editor
```

### Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

## 🚀 Running Locally

### Start the Backend Server
```bash
cd server
npm run dev
```
Server will run on `http://localhost:5001`

### Start the Frontend
```bash
cd client
npm start
```
Frontend will run on `http://localhost:3000`

## 💡 Usage

1. **Enter your name** on the welcome screen
2. **Create a room** by clicking "Generate Random Room" or enter an existing room ID
3. **Share the room ID** with collaborators
4. **Start coding together!** Changes will sync in real-time
5. Use the **chat feature** to communicate with your team
6. **Change language** from the dropdown to get proper syntax highlighting

## 🎯 How It Works

1. Users join a room using a unique Room ID
2. Socket.io establishes WebSocket connections between clients and server
3. Code changes are broadcast to all users in the same room
4. Monaco Editor provides the rich code editing experience
5. Chat messages are sent through the same WebSocket connection

## 📁 Project Structure
```
Collaborative-Coding-Editor/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Editor.js      # Main editor component
│       │   ├── Editor.css
│       │   ├── Chat.js        # Chat component
│       │   └── Chat.css
│       ├── App.js
│       └── App.css
├── server/                 # Node.js backend
│   ├── server.js          # Express + Socket.io server
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

## 🌟 Features in Detail

### Real-time Code Synchronization
- All users in a room see code changes instantly
- Conflict-free collaborative editing
- Cursor position tracking

### Multi-language Support
- JavaScript
- TypeScript
- Python
- Java
- C++
- HTML
- CSS
- JSON

### Room Management
- Unique room IDs for privacy
- Easy room creation and joining
- Automatic cleanup of empty rooms

## 🚀 Deployment

### Backend (Render)
1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set Root Directory to `server`
4. Build Command: `npm install`
5. Start Command: `npm start`

### Frontend (Render/Vercel/Netlify)
1. Create a new Static Site
2. Set Root Directory to `client`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `build`
5. Add environment variable: `REACT_APP_SOCKET_SERVER` with your backend URL

## 🔧 Environment Variables

### Frontend (.env)
```
REACT_APP_SOCKET_SERVER=https://your-backend-url.onrender.com
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Future Enhancements

- [ ] User authentication
- [ ] Save code snippets to database
- [ ] Code execution feature
- [ ] Video/Audio chat integration
- [ ] More themes (light mode, custom themes)
- [ ] File upload/download
- [ ] Code sharing via unique URLs
- [ ] Syntax error detection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Shubham Khalkho**
- GitHub: [@Shubhoom123](https://github.com/Shubhoom123)
- Project Link: [https://github.com/Shubhoom123/Collaborative-Coding-Editor](https://github.com/Shubhoom123/Collaborative-Coding-Editor)

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - The code editor that powers VS Code
- [Socket.io](https://socket.io/) - Real-time bidirectional event-based communication
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- Inspired by collaborative coding platforms like CodePen and Repl.it

---

⭐️ If you found this project helpful, please give it a star!