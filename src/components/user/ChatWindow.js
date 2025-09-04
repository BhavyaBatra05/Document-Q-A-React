// src/components/user/ChatWindow.js
import React, { useEffect, useRef } from 'react';

const ChatWindow = ({ messages }) => {
  const chatEndRef = useRef(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="chat-container" style={{ backgroundColor: '#f5f7f9', borderRadius: '8px' }}>
      {messages.map((message, index) => (
        <div 
          key={index} 
          className={message.role === 'user' ? 'user-message' : 'bot-message'}
          style={{ 
            backgroundColor: message.role === 'user' ? '#e6f3ff' : 'white',
            borderRadius: '8px',
            padding: '10px 15px',
            marginBottom: '10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          <span className={message.role === 'user' ? 'user-icon' : 'bot-icon'}>
            {message.role === 'user' ? '👤' : '🤖'}
          </span>
          <span className="message-content">{message.content}</span>
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatWindow;