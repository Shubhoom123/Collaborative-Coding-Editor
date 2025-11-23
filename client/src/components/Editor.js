import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import io from 'socket.io-client';
import Chat from './Chat';
import './Editor.css';

const SOCKET_SERVER = 'http://localhost:5001';

function Editor({ roomId, username }) {
  const [code, setCode] = useState('// Start coding...');
  const [language, setLanguage] = useState('javascript');
  const [users, setUsers] = useState(1);
  const [chatOpen, setChatOpen] = useState(true);
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const isRemoteChange = useRef(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER);
    socketRef.current.emit('join-room', roomId);

    socketRef.current.on('load-code', (roomData) => {
      setCode(roomData.code);
      setLanguage(roomData.language);
      setUsers(roomData.users.size);
    });

    socketRef.current.on('code-update', (newCode) => {
      isRemoteChange.current = true;
      setCode(newCode);
    });

    socketRef.current.on('language-update', (newLanguage) => {
      setLanguage(newLanguage);
    });

    socketRef.current.on('user-joined', ({ userCount }) => {
      setUsers(userCount);
    });

    socketRef.current.on('user-left', ({ userCount }) => {
      setUsers(userCount);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId]);

  const handleEditorChange = (value) => {
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }
    
    setCode(value);
    socketRef.current.emit('code-change', { roomId, code: value });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socketRef.current.emit('language-change', { roomId, language: newLanguage });
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="header-left">
          <h2>Collaborative Editor</h2>
          <div className="room-info">
            <span className="room-id" onClick={copyRoomId} title="Click to copy">
              Room: {roomId}
            </span>
            <span className="user-count">{users} user{users !== 1 ? 's' : ''} online</span>
          </div>
        </div>
        
        <div className="header-right">
          <select value={language} onChange={handleLanguageChange} className="language-select">
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
          </select>
          
          <button onClick={() => setChatOpen(!chatOpen)} className="chat-toggle">
            {chatOpen ? 'Hide Chat' : 'Show Chat'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="monaco-wrapper">
          <MonacoEditor
            height="100%"
            language={language}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
        
        {chatOpen && (
          <Chat socket={socketRef.current} roomId={roomId} username={username} />
        )}
      </div>
    </div>
  );
}

export default Editor;