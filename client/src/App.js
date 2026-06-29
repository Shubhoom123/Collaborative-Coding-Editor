import React, { useState } from 'react';
import Editor from './components/Editor';
import './App.css';

function App() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);

  const ROOM_ID_RE = /^[a-zA-Z0-9_-]{1,32}$/;

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const trimmedRoom = roomId.trim();
    const trimmedName = username.trim();
    if (!ROOM_ID_RE.test(trimmedRoom)) {
      alert('Room ID must be 1–32 characters: letters, numbers, - or _ only.');
      return;
    }
    if (!trimmedName || trimmedName.length > 32) {
      alert('Username must be 1–32 characters.');
      return;
    }
    setJoined(true);
  };

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    setRoomId(randomId);
  };

  if (!joined) {
    return (
      <div className="App">
        <div className="join-container">
          <div className="join-card">
            <h1>Collaborative Code Editor</h1>
            <p className="subtitle">Code together in real-time</p>
            
            <form onSubmit={handleJoinRoom} className="join-form">
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  maxLength={32}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Room ID</label>
                <input
                  type="text"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="input-field"
                  maxLength={32}
                  required
                />
              </div>
              
              <button type="button" onClick={generateRoomId} className="btn-secondary">
                Generate Random Room
              </button>
              
              <button type="submit" className="btn-primary">
                Join Room
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Editor roomId={roomId} username={username} />
    </div>
  );
}

export default App;