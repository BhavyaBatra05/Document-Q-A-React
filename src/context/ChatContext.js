// src/context/ChatContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { chatsAPI } from '../services/api';
import { AuthContext } from './AuthContext';
import { DocumentContext } from './DocumentContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useContext(AuthContext);
  const { activeDocument } = useContext(DocumentContext);

  // Fetch user chats when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    }
  }, [isAuthenticated]);

  // Fetch all user chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await chatsAPI.getUserChats();
      
      setChats(res.data.chats);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  // Create a new chat
  const createChat = async (title = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = {
        title: title || 'New Chat',
        document_id: activeDocument ? activeDocument.id : null
      };
      
      const res = await chatsAPI.createChat(data);
      
      // Add new chat to list and set as current
      setChats([res.data, ...chats]);
      setCurrentChat(res.data);
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create chat');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get a specific chat
  const getChat = async (chatId) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await chatsAPI.getChat(chatId);
      
      setCurrentChat(res.data);
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get chat');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Send a message in a chat
  const sendMessage = async (chatId, content) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await chatsAPI.sendMessage(chatId, content);
      
      // Update current chat
      setCurrentChat(res.data);
      
      // Update chat in list
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, preview: res.data.preview, updated_at: res.data.updated_at } : chat
      ));
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send message');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a chat
  const deleteChat = async (chatId) => {
    try {
      setLoading(true);
      setError(null);
      
      await chatsAPI.deleteChat(chatId);
      
      // Remove from chats list
      const updatedChats = chats.filter(chat => chat.id !== chatId);
      setChats(updatedChats);
      
      // If current chat was deleted, set null or first available
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat(updatedChats[0] || null);
      }
      
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete chat');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Query document without creating a chat
  const queryDocument = async (query, documentId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await chatsAPI.queryDocument(query, documentId || (activeDocument ? activeDocument.id : null));
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to query document');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        loading,
        error,
        fetchChats,
        createChat,
        getChat,
        sendMessage,
        deleteChat,
        queryDocument,
        setCurrentChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};