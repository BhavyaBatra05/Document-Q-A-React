import axios from 'axios';

// In the future, get this from environment variables
const API_BASE_URL = 'http://localhost:5000/api';  

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getDocuments = async () => {
  try {
    const response = await api.get('/documents');
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error.response?.data || error.message;
  }
};

export const uploadDocument = async (file) => {
  // For now, we'll simulate this since we don't have a backend yet
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        document: {
          id: Date.now(),
          fileName: file.name,
          originalName: file.name,
          uploadDate: new Date().toISOString(),
          isActive: true,
          isIngested: true,
          wordCount: Math.floor(Math.random() * 5000) + 1000,
          chunkCount: Math.floor(Math.random() * 50) + 10
        }
      });
    }, 2000);
  });
  
  // When you have a backend, use this:
  /*
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
  */
};

export const activateDocument = async (documentId) => {
  // Simulate activation for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        document: {
          id: documentId,
          isActive: true
        }
      });
    }, 500);
  });
  
  // When you have a backend, use this:
  /*
  try {
    const response = await api.post(`/documents/${documentId}/activate`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
  */
};

export const queryDocument = async (documentId, question) => {
  // Simulate response for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        answer: `This is a simulated answer to your question: "${question}" about document ID ${documentId}.`
      });
    }, 1500);
  });
  
  // When you have a backend, use this:
  /*
  try {
    const response = await api.post(`/documents/${documentId}/query`, { question });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
  */
};

export default {
  getDocuments,
  uploadDocument,
  activateDocument,
  queryDocument
};