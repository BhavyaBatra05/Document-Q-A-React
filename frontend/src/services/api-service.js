const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('access_token');
  }

  // Authentication methods
  async login(username, password) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password})
    });
    if (!response.ok) throw new Error('Invalid credentials');
    const data = await response.json();
    this.token = data.access_token;
    localStorage.setItem('access_token', this.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
      }
    } finally {
      this.token = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }

  async triggerDemoFileIngest(taskId) {
    const response = await fetch(`${API_BASE_URL}/api/documents/demo_ingest/${taskId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to ingest demo file');
    return await response.json();
}


  // File upload
  async uploadDocument(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable && onProgress)
          onProgress((e.loaded / e.total) * 100);
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const json = JSON.parse(xhr.responseText);
            if (!json.task_id) {
              reject(new Error('Upload response missing task_id'));
            } else {
              resolve(json);
            }
          } catch {
            reject(new Error('Invalid JSON response from upload'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed due to network error'));

      xhr.open('POST', `${API_BASE_URL}/api/documents/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      xhr.send(formData);
    });
  }

  async getProcessingStatus(taskId) {
    const response = await fetch(`${API_BASE_URL}/api/documents/processing-status/${taskId}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    if (!response.ok) throw new Error('Failed to get processing status');
    return await response.json();
  }

  async listDocuments() {
    const response = await fetch(`${API_BASE_URL}/api/documents/list`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    if (!response.ok) throw new Error('Failed to list documents');
    return await response.json();
  }

  // Set active document API call
  async setActiveDocument(documentId) {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/set_active`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    if (!response.ok) throw new Error('Failed to set active document');
    return await response.json();
  }

  // Update ingestion status API call
  async updateIngestedStatus(documentId, status) {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/set_ingested`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ingested: status })
    });
    if (!response.ok) throw new Error('Failed to update ingestion status');
    return await response.json();
  }

  // Chat querying with optional documentId
  async queryDocument(query, sessionId, documentId = null) {
    const body = { query, session_id: sessionId };
    if (documentId) body.document_id = documentId;
    const response = await fetch(`${API_BASE_URL}/api/chat/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Query failed');
    }
    return await response.json();
  }

  async getChatHistory(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/chat/history/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    if (!response.ok) throw new Error('Failed to get chat history');
    return await response.json();
  }

  async clearChatHistory(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/chat/history/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    if (!response.ok) throw new Error('Failed to clear chat history');
    return await response.json();
  }

  async getSystemStatus() {
    const response = await fetch(`${API_BASE_URL}/api/system/status`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    if (!response.ok) throw new Error('Failed to get system status');
    return await response.json();
  }

  async getUserProfile() {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    if (!response.ok) throw new Error('Failed to get user profile');
    return await response.json();
  }

  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  }

  // New method to clear all chat history for logged-in user
  async clearAllChatHistory() {
    const response = await fetch(`${API_BASE_URL}/api/chat/history/clear_all`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.token}` },
    });
    if (!response.ok) throw new Error('Failed to clear chat history');
    return await response.json();
  }
}

const apiService = new ApiService();

export default apiService;
