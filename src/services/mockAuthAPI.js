// src/services/mockAuthAPI.js

// Mock user data
const users = [
  { id: 1, username: 'user', email: 'user@example.com', password: 'password123', is_admin: false },
  { id: 2, username: 'admin', email: 'admin@example.com', password: 'admin123', is_admin: true }
];

// Mock authentication functions
export const mockAuthAPI = {
  register: (userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const existingUser = users.find(user => user.username === userData.username || user.email === userData.email);
        
        if (existingUser) {
          reject({ response: { data: { detail: 'Username or email already exists' } } });
          return;
        }
        
        const newUser = {
          id: users.length + 1,
          ...userData,
          is_admin: false
        };
        
        users.push(newUser);
        
        resolve({
          data: {
            access_token: 'mock_token_' + userData.username,
            user: {
              id: newUser.id,
              username: newUser.username,
              email: newUser.email,
              is_admin: newUser.is_admin
            }
          }
        });
      }, 500); // Simulate network delay
    });
  },
  
  login: (username, password) => {
    console.log("Mock login called with:", username, password);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users.find(user => user.username === username && user.password === password);
        
        if (!user) {
          reject({ response: { data: { detail: 'Invalid credentials' } } });
          return;
        }
        
        resolve({
          data: {
            access_token: 'mock_token_' + username,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              is_admin: user.is_admin
            }
          }
        });
      }, 500); // Simulate network delay
    });
  },
  
  getProfile: () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const token = localStorage.getItem('token');
        
        if (!token || !token.startsWith('mock_token_')) {
          reject({ response: { data: { detail: 'Not authenticated' } } });
          return;
        }
        
        const username = token.replace('mock_token_', '');
        const user = users.find(user => user.username === username);
        
        if (!user) {
          reject({ response: { data: { detail: 'User not found' } } });
          return;
        }
        
        resolve({
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            is_admin: user.is_admin
          }
        });
      }, 500); // Simulate network delay
    });
  }
};