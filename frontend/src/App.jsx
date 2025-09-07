import React, { useState, useEffect, useContext } from "react";
import Login from "./components/Login";
import ChatInterface from "./components/ChatInterface";
import AdminDashboard from "./components/AdminDashboard";
import apiService from "./services/api-service";
import "./styles/App.css";
import { DemoModeContext } from "./contexts/DemoModeContext";

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("chat"); // "chat" or "admin"
  const [isLoading, setIsLoading] = useState(true);
  const [activeDocument, setActiveDocument] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  

  // Initialize isDemoMode to false
  const { isDemoMode, setIsDemoMode } = useContext(DemoModeContext);

  console.log(`[App] Render - currentView: ${currentView}, user: ${user?.username}`);

  useEffect(() => {
  console.log("DemoModeProvider: isDemoMode changed", isDemoMode);
  }, [isDemoMode]);

  

  useEffect(() => {
    async function checkSessionAndLoadChats() {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("access_token");
        if (storedUser && token) {
          const userJson = JSON.parse(storedUser);
          setUser(userJson);

          const sessionsResp = await apiService.getChatSessions();
          if (sessionsResp.sessions?.length > 0) {
            setChatSessions(sessionsResp.sessions);
            setActiveSessionId(sessionsResp.sessions[0].sessionId);
          } else {
            // Create first session only IF none exist
            const newSessionId = `chat_${Date.now()}`;
            setChatSessions([
              {
                sessionId: newSessionId,
                createdAt: new Date(),
                messages: [
                  {
                    role: "assistant",
                    content: "Hello! I'm your document assistant. How can I help you today?",
                    timestamp: new Date().toISOString(),
                  },
                ],
              },
            ]);
            setActiveSessionId(newSessionId);
          }
        }
      } catch (err) {
        console.error("Error during session check or chat load:", err);
        localStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkSessionAndLoadChats();
  }, []);


  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView("chat");
  };

  const handleLogout = () => {
    setUser(null);
    setActiveDocument(null);
    setChatSessions([]);
    setActiveSessionId(null);
    setCurrentView("chat");
  };

  // Show Admin (Upload) section for all logged-in users
  const handleShowAdmin = () => {
    setCurrentView("admin");
  };

  const handleBackToChat = () => {
    setCurrentView("chat");
  };

  const handleActiveDocumentChange = (document) => {
    setActiveDocument(document);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Document Q&A System...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

    return (
      <>
      {currentView === "admin" ? (
      <AdminDashboard
        user={user}
        onBackToChat={handleBackToChat}
        onLogout={handleLogout}
        onActiveDocumentChange={handleActiveDocumentChange}
      />
      ):(
      <ChatInterface
      user={user}
      onLogout={handleLogout}
      onShowAdmin={handleShowAdmin}
      activeDocument={activeDocument}
      chatSessions={chatSessions}
      setChatSessions={setChatSessions}
      activeSessionId={activeSessionId}
      setActiveSessionId={setActiveSessionId}
      isDemoMode={isDemoMode}
    />
    )}
    </>
    );
  }

export default App;
