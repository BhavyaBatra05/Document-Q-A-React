// src/services/api.js
import axios from 'axios';

// Keep the same base URL
const API_URL = 'http://localhost:8000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to set the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Update all endpoints to include /v1/ prefix
export const documentsAPI = {
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/v1/documents', formData, {  // Changed from /api/documents
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getUserDocuments: () => api.get('/api/v1/documents'),  // Changed from /api/documents
  getDocument: (id) => api.get(`/api/v1/documents/${id}`),  // Changed from /api/documents
  setActiveDocument: (id) => api.put(`/api/v1/documents/${id}`, { is_active: true }),  // Changed from /api/documents
  deleteDocument: (id) => api.delete(`/api/v1/documents/${id}`),  // Changed from /api/documents
};

// Chats API calls - also update these paths
export const chatsAPI = {
  createChat: (data = {}) => api.post('/api/v1/chats', data),  // Changed from /api/chats
  getUserChats: () => api.get('/api/v1/chats'),  // Changed from /api/chats
  getChat: (id) => api.get(`/api/v1/chats/${id}`),  // Changed from /api/chats
  sendMessage: (chatId, content) => api.post(`/api/v1/chats/${chatId}/messages`, { content }),  // Changed from /api/chats
  deleteChat: (id) => api.delete(`/api/v1/chats/${id}`),  // Changed from /api/chats
  queryDocument: (query, documentId = null) => 
    api.post('/api/v1/chats/query', { query, document_id: documentId }),  // Changed from /api/chats
};

export default api;