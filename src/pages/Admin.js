// src/pages/Admin.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { DocumentContext } from '../context/DocumentContext';

const Admin = () => {
  const { isAuthenticated, isAdmin, user, logout } = useContext(AuthContext);
  const { 
    documents, 
    setDocuments, 
    activeDocument, 
    setActiveDocument,
    loading,  // Make sure to add these
    error     // Make sure to add these
  } = useContext(DocumentContext);
  
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [currentActiveFile, setCurrentActiveFile] = useState('');

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (isAdmin === false) { // Only redirect if explicitly false, not if undefined
      navigate('/user');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Set a sample active file for display
  useEffect(() => {
    if (documents && documents.length > 0) {
      const activeDoc = documents.find(doc => doc.is_active);
      if (activeDoc) {
        setCurrentActiveFile(activeDoc.name);
      }
    }
  }, [documents]);
  
  // Initialize empty documents array if undefined
  const safeDocuments = documents || [];
  
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
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleUserClick = () => {
    navigate('/user');
  };

  // Your existing handleFileChange, handleDragOver, etc. functions...
  // ... (keep the rest of your component unchanged)

  // The rest of your component...
  // ... (keep the rest of your component unchanged)

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

  const containerStyle = {
    padding: '0 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  };

  return (
    <div style={containerStyle}>
      {/* Your existing JSX */}
      {/* ... (keep the rest of your component unchanged) */}
    </div>
  );
};

export default Admin;