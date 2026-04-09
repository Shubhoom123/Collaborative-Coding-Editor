import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import io from 'socket.io-client';
import Chat from './Chat';
import './Editor.css';

const SOCKET_SERVER = process.env.REACT_APP_SOCKET_SERVER || 'http://localhost:5001';

function Editor({ roomId, username }) {
  const [code, setCode] = useState('// Start coding...');
  const [language, setLanguage] = useState('javascript');
  const [users, setUsers] = useState(1);
  const [chatOpen, setChatOpen] = useState(true);
  const [terminalTabs, setTerminalTabs] = useState([]);
  const [activeTerminalTab, setActiveTerminalTab] = useState(null);
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

    socketRef.current.on('compile-result', (result) => {
      const newTab = {
        id: Date.now(),
        title: result.error ? 'Error' : 'Output',
        content: result.error ? result.message : result.output,
        type: result.error ? 'error' : 'success'
      };
      
      setTerminalTabs(prev => [...prev, newTab]);
      setActiveTerminalTab(newTab.id);
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

  const handleRunCode = () => {
    socketRef.current.emit('compile-code', {
      roomId,
      code,
      language
    });
  };

  const closeTerminalTab = (tabId) => {
    setTerminalTabs(prev => prev.filter(tab => tab.id !== tabId));
    
    if (terminalTabs.length > 1) {
      const remainingTabs = terminalTabs.filter(tab => tab.id !== tabId);
      setActiveTerminalTab(remainingTabs[remainingTabs.length - 1].id);
    } else {
      setActiveTerminalTab(null);
    }
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
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          
          <button onClick={handleRunCode} className="run-button">
            Run Code
          </button>
          
          <button onClick={() => setChatOpen(!chatOpen)} className="chat-toggle">
            {chatOpen ? 'Hide Chat' : 'Show Chat'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="monaco-and-terminal-wrapper">
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
                fixedOverflowWidgets: true,
                renderLineHighlight: 'none',
              }}
            />
          </div>

          {terminalTabs.length > 0 && (
            <div className="terminal-panel">
              <div className="terminal-tabs">
                {terminalTabs.map(tab => (
                  <div 
                    key={tab.id} 
                    className={`terminal-tab ${activeTerminalTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTerminalTab(tab.id)}
                  >
                    {tab.title}
                    <span 
                      className="tab-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTerminalTab(tab.id);
                      }}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
              <div className="terminal-content">
                {terminalTabs
                  .filter(tab => tab.id === activeTerminalTab)
                  .map(tab => (
                    <pre 
                      key={tab.id} 
                      className={`terminal-output ${tab.type}`}
                    >
                      {tab.content}
                    </pre>
                  ))
                }
              </div>
            </div>
          )}
        </div>
        
        {chatOpen && (
          <Chat socket={socketRef.current} roomId={roomId} username={username} />
        )}
      </div>
    </div>
  );
}

export default Editor;