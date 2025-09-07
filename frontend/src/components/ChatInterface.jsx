import React, { useState, useEffect, useRef, useContext } from "react";
import apiService from "../services/api-service";
import "../styles/App.css";
import logo from "../assets/logo.png";
import { DemoModeContext } from "../contexts/DemoModeContext";

const BOT_GREETING = {
  role: "assistant",
  content: "Hello! I'm your document assistant. How can I help you today?",
  timestamp: new Date().toISOString(),
};

function ChatInterface({
  user,
  onLogout,
  onShowAdmin,
  activeDocument,
  chatSessions,
  setChatSessions,
  activeSessionId,
  setActiveSessionId,
}) {
  // Use demo mode from context here too
  const { isDemoMode } = useContext(DemoModeContext);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasDocument, setHasDocument] = useState(!!activeDocument);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setHasDocument(!!activeDocument);
    if (activeDocument && messages.length === 0) {
      setMessages([BOT_GREETING]);
    }
  }, [activeDocument]);

  useEffect(() => {
    if (activeSessionId) {
      loadChatHistory(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async (sessionId) => {
    try {
      const resp = await apiService.getChatHistory(sessionId);
      let loaded = resp.history || [];
      if (loaded.length === 0) loaded = [BOT_GREETING];
      setMessages(loaded);

      setChatSessions((prev) => {
        const index = prev.findIndex((s) => s.sessionId === sessionId);
        const createdAt = index !== -1 ? prev[index].createdAt : new Date();
        const newSession = {
          sessionId,
          createdAt,
          messages: loaded,
        };
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = newSession;
          return updated;
        }
        return [...prev, newSession];
      });
    } catch (err) {
      setMessages([BOT_GREETING]);
    }
  };

  const handleNewChat = () => {
    const newSessionId = `chat_${Date.now()}`;
    setActiveSessionId(newSessionId);
    setMessages([BOT_GREETING]);
    setChatSessions((prev) => [
      { sessionId: newSessionId, createdAt: new Date(), messages: [BOT_GREETING] },
      ...prev,
    ]);
  };

  const handleSelectChat = (sessionId) => {
    setActiveSessionId(sessionId);
  };

  const handleSendMessage = async (overrideMessage = null) => {
    const messageToSend = overrideMessage ?? inputMessage;

    if (!messageToSend.trim() || loading) return;

    if (!hasDocument || !activeDocument) {
      alert("Please upload and select a document in Admin section to start.");
      return;
    }

    const userMessage = {
      role: "user",
      content: messageToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await apiService.queryDocument(
        messageToSend,
        activeSessionId,
        activeDocument?.task_id
      );

      const assistantMessage = {
        role: "assistant",
        content: response.answer,
        timestamp: new Date().toISOString(),
        confidence: response.confidence,
        sourcesUsed: response.sources_used,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      setChatSessions((prev) => {
        const index = prev.findIndex((s) => s.sessionId === activeSessionId);
        if (index === -1) return prev;
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          messages: [...updated[index].messages, userMessage, assistantMessage],
        };
        return updated;
      });
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your question. Please try again.",
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      onLogout();
    } catch {
      onLogout();
    }
  };

  const handleClearAllChats = async () => {
    if (!window.confirm("Are you sure you want to delete all chat history?")) return;

    try {
      await apiService.clearAllChatHistory();
      setChatSessions([]);
      setActiveSessionId(null);
      setMessages([]);
    } catch {
      alert("Failed to clear chat history. Please try again.");
    }
  };

  return (
    <div className="main-app">
      <header className="app-header">
        <div className="header-left">
          <img
            src={logo}
            alt="Logo"
            style={{ width: "48px", height: "48px", objectFit: "contain", marginRight: "16px" }}
          />
          <h1>Document Q&A System</h1>
        </div>
        <div className="header-right">
          <span className="user-info">Logged in: {user.username}</span>
          <span className="timestamp">Login Time: {new Date().toLocaleString()}</span>
          {user && (
            <button className="btn btn-secondary" onClick={onShowAdmin}>
              👨‍💼 Admin
            </button>
          )}
          <button className="btn btn-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      <div className="app-content">
        <div className="chat-section">
          {!hasDocument && (
            <div className="warning-banner">
              Please upload a document in Admin section to start
            </div>
          )}

          <button className="btn btn-new-chat" style={{ marginRight: "auto" }} onClick={handleNewChat}>
            New Chat
          </button>

          <div style={{ clear: "both" }} />

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-avatar">{message.role === "assistant" ? "🤖" : "👤"}</div>
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                  {message.confidence && (
                    <div className="message-meta">
                      🎯 Confidence: {(message.confidence * 100).toFixed(0)}%
                      {message.sourcesUsed && <span className="sources"> 📚 Sources: {message.sourcesUsed} chunks used</span>}
                    </div>
                  )}
                  <div className="message-timestamp">{new Date(message.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset queries only show if demo mode active AND chat fresh */}
          {isDemoMode && messages.length === 1 && messages[0].content === BOT_GREETING.content && (
            <div className="preset-queries" style={{ marginBottom: "1rem", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                "What are the 2024 sales figures?",
                "Which region has the highest sales?",
                "Describe the bar chart in the document.",
                "Sort the continents in ascending order."
              ].map((query, idx) => (
                <button key={idx} onClick={() => handleSendMessage(query)} className="btn btn-secondary">
                  {query}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-area">
            <div className="input-group">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question here..."
                className="chat-input"
                disabled={loading}
                rows="1"
              />
              <button className="btn btn-send" onClick={handleSendMessage} disabled={loading || !inputMessage.trim()}>
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="chat-sidebar">
          <div className="sidebar-header" style={{ display: "flex", alignItems: "center" }}>
            <h3 style={{ margin: 0, flexGrow: 1 }}>Chat History</h3>
            <button
              onClick={handleClearAllChats}
              className="btn-clear-chats"
              style={{
                backgroundColor: "#d9534f",
                border: "none",
                color: "white",
                padding: "5px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                marginLeft: "10px",
                fontSize: "0.8rem",
              }}
            >
              Clear All
            </button>
          </div>
          <p className="sidebar-subtitle">With date specific to user. Latest message on top.</p>
          <div className="chat-history-list">
            {chatSessions.length === 0 && <div className="no-chat-history">No chat history yet.</div>}
            {chatSessions.map((session, idx) => (
              <button
                key={session.sessionId}
                onClick={() => handleSelectChat(session.sessionId)}
                className={`chat-history-item ${session.sessionId === activeSessionId ? "active" : ""}`}
              >
                {`Chat ${chatSessions.length - idx}`}
                <br />
                <small>{session.messages?.[0]?.content?.slice(0, 40) || "No messages yet"}</small>
                <br />
                <small>{new Date(session.createdAt).toLocaleDateString() || ""}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
