// src/context/DocumentContext.js
import React, { createContext, useState, useEffect } from 'react';
import { documentsAPI, chatsAPI } from '../services/api';

export const DocumentContext = createContext();

export const DocumentProvider = ({ children }) => {
  // State for documents and chats
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your document assistant. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch user documents on load
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await documentsAPI.getUserDocuments();
        setDocuments(response.data);
        
        // Find active document if any
        const activeDoc = response.data.find(doc => doc.is_active);
        if (activeDoc) {
          setActiveDocument(activeDoc);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);
  
  // Fetch user chats on load
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await chatsAPI.getUserChats();
        setChats(response.data);
        
        // Set most recent chat as current if available
        if (response.data.length > 0) {
          setCurrentChat(response.data[0]);
          
          // Load messages for the current chat
          const chatResponse = await chatsAPI.getChat(response.data[0].id);
          setMessages(chatResponse.data.messages || [
            { role: 'assistant', content: "Hello! I'm your document assistant. How can I help you today?" }
          ]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Failed to load chat history. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchChats();
  }, []);
  
  // Upload a document
  const uploadDocument = async (file) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await documentsAPI.uploadDocument(file);
      
      // Set all documents to not active first
      if (documents.length > 0) {
        // This is a UI-only update; the backend handles actual activation
        const updatedDocs = documents.map(doc => ({
          ...doc,
          is_active: false
        }));
        setDocuments(updatedDocs);
      }
      
      // Add the new document
      const newDocument = response.data;
      setDocuments(prev => [...prev, newDocument]);
      
      // Set the new document as active
      await documentsAPI.setActiveDocument(newDocument.id);
      setActiveDocument(newDocument);
      
      setLoading(false);
      return newDocument;
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document. Please try again.');
      setLoading(false);
      throw err;
    }
  };
  
  // Set active document
  const activateDocument = async (documentId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call API to set active document
      await documentsAPI.setActiveDocument(documentId);
      
      // Update local state
      const updatedDocs = documents.map(doc => ({
        ...doc,
        is_active: doc.id === documentId
      }));
      
      setDocuments(updatedDocs);
      const activeDoc = updatedDocs.find(doc => doc.is_active);
      setActiveDocument(activeDoc || null);
      
      setLoading(false);
    } catch (err) {
      console.error('Error setting active document:', err);
      setError('Failed to set active document. Please try again.');
      setLoading(false);
    }
  };
  
  // Create a new chat
  const createChat = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Creating new chat with active document:", activeDocument);
      
      // Create chat in backend
      const response = await chatsAPI.createChat({
        document_id: activeDocument ? activeDocument.id : null
      });
      
      const newChat = response.data;
      
      // Add to local state
      setChats(prev => [newChat, ...prev]);
      
      // Set as current chat
      setCurrentChat(newChat);
      
      // Reset messages
      setMessages([
        { role: 'assistant', content: "Hello! I'm your document assistant. How can I help you today?" }
      ]);
      
      setLoading(false);
      return newChat;
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Failed to create new chat. Please try again.');
      setLoading(false);
    }
  };
  
  // Load a chat
  const loadChat = async (chatId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get chat details from backend
      const response = await chatsAPI.getChat(chatId);
      const chat = response.data;
      
      setCurrentChat(chat);
      setMessages(chat.messages || [
        { role: 'assistant', content: "Hello! I'm your document assistant. How can I help you today?" }
      ]);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading chat:', err);
      setError('Failed to load chat. Please try again.');
      setLoading(false);
    }
  };
  
  // Send a message
  const sendMessage = async (content) => {
    try {
      setLoading(true);
      setError(null);
      
      // Add user message to UI immediately
      const userMessage = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);
      
      let chatId;
      
      // If no current chat, create one first
      if (!currentChat) {
        const newChat = await createChat();
        chatId = newChat.id;
      } else {
        chatId = currentChat.id;
      }
      
      // Send message to backend
      const response = await chatsAPI.sendMessage(chatId, content);
      
      // Get AI response
      const assistantMessage = response.data;
      
      // Add to messages
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update chat preview in the list
      const updatedChats = chats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            preview: content.length > 20 ? content.substring(0, 20) + '...' : content,
            last_updated: new Date().toISOString()
          };
        }
        return chat;
      });
      
      setChats(updatedChats);
      
      setLoading(false);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setLoading(false);
      
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: "I'm sorry, I couldn't process your request. Please try again later." 
        }
      ]);
    }
  };
  
  // Query document directly (without creating a chat)
  const queryDocument = async (query, documentId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await chatsAPI.queryDocument(query, documentId);
      
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error('Error querying document:', err);
      setError('Failed to query document. Please try again.');
      setLoading(false);
      throw err;
    }
  };
  
  // Delete a document
  const deleteDocument = async (documentId) => {
    try {
      setLoading(true);
      setError(null);
      
      await documentsAPI.deleteDocument(documentId);
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      // If active document was deleted, set active to null
      if (activeDocument && activeDocument.id === documentId) {
        setActiveDocument(null);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
      setLoading(false);
    }
  };
  
  const value = {
    documents,
    setDocuments,
    activeDocument,
    setActiveDocument: activateDocument,
    chats,
    setChats,
    currentChat,
    setCurrentChat,
    messages,
    setMessages,
    loading,
    error,
    uploadDocument,
    createChat,
    loadChat,
    sendMessage,
    queryDocument,
    deleteDocument
  };
  
  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};