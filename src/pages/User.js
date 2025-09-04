// src/pages/User.js
import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { DocumentContext } from '../context/DocumentContext';

const User = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { 
    activeDocument, 
    chats, 
    currentChat, 
    messages, 
    sendMessage, 
    loadChat,
    createChat,
    setMessages,
    loading,  // Make sure to add these two
    error     // Make sure to add these two
  } = useContext(DocumentContext);
  
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Auto-scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Initialize default values to avoid undefined errors
  const safeMessages = messages || [];
  const safeChats = chats || [];
  
  const handleNewChat = () => {
    console.log("New chat button clicked");
    
    if (typeof createChat === 'function') {
      createChat();
    } else {
      // Fallback if createChat is not available
      setMessages([
        { role: 'assistant', content: "Hello! I'm your document assistant. How can I help you today?" }
      ]);
    }
    
    setInputMessage('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '') {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #2E86AB',
            borderRadius: '50%',
            marginBottom: '20px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <div>Loading...</div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh'
      }}>
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '20px',
          borderRadius: '4px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            style={{
              padding: '10px 15px',
              backgroundColor: '#2E86AB',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Styles to match Streamlit
  const containerStyle = {
    padding: '0 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  };

  // Rest of your styles and component...
  // ... (keep the rest of your component unchanged)

  // Initialize messages if empty
  const displayMessages = safeMessages.length > 0 ? safeMessages : [
    { role: 'assistant', content: "Hello! I'm your document assistant. How can I help you today?" }
  ];

  return (
    <div style={containerStyle}>
      {/* Your existing JSX */}
      {/* ... (keep the rest of your component unchanged) */}
    </div>
  );
};

export default User;