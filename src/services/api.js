// src/services/api.js
import axios from 'axios';

// Remove the /api/v1 prefix if your backend doesn't use it
const API_URL = 'http://localhost:8000';  // Changed from 'http://localhost:8000/api/v1'

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Rest of your code remains unchanged...

// Documents API calls - update these paths if needed
export const documentsAPI = {
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/documents', formData, {  // Add /api/ prefix if needed
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getUserDocuments: () => api.get('/api/documents'),  // Add /api/ prefix if needed
  getDocument: (id) => api.get(`/api/documents/${id}`),  // Add /api/ prefix if needed
  setActiveDocument: (id) => api.put(`/api/documents/${id}`, { is_active: true }),  // Add /api/ prefix if needed
  deleteDocument: (id) => api.delete(`/api/documents/${id}`),  // Add /api/ prefix if needed
};

// Chats API calls - update these paths if needed
export const chatsAPI = {
  createChat: (data = {}) => api.post('/api/chats', data),  // Add /api/ prefix if needed
  getUserChats: () => api.get('/api/chats'),  // Add /api/ prefix if needed
  getChat: (id) => api.get(`/api/chats/${id}`),  // Add /api/ prefix if needed
  sendMessage: (chatId, content) => api.post(`/api/chats/${chatId}/messages`, { content }),  // Add /api/ prefix if needed
  deleteChat: (id) => api.delete(`/api/chats/${id}`),  // Add /api/ prefix if needed
  queryDocument: (query, documentId = null) => 
    api.post('/api/chats/query', { query, document_id: documentId }),  // Add /api/ prefix if needed
};

export default api;