import React from 'react';

const ChatHistory = ({ sessions, onSelectSession }) => {
  // Format date for display
  const formatDate = (isoString) => {
    if (!isoString) return 'Unknown date';
    
    try {
      const date = new Date(isoString);
      return `${date.getDate().toString().padStart(2, '0')}-${
        (date.getMonth() + 1).toString().padStart(2, '0')}-${
        date.getFullYear()}`;
    } catch (e) {
      return isoString;
    }
  };
  
  return (
    <div className="chat-history">
      {sessions.map((session, index) => (
        <div key={session.id} className="chat-history-item">
          <button 
            className="chat-history-button"
            onClick={() => onSelectSession(session.id)}
          >
            Chat {session.id}
          </button>
          <div className="history-item">
            <small>{session.lastMessage.substring(0, 30)}...</small><br />
            <small className="date-text">{formatDate(session.timestamp)}</small>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatHistory;