// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(null);
  
  useEffect(() => {
    // Check if user is already logged in from local storage
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
      setIsAuthenticated(true);
      setIsAdmin(parsedUser.isAdmin);
      
      // Set the token in axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);
  
  const login = async (username, password, adminMode = false) => {
    try {
      console.log('Attempting login with:', { username, password });
      
      // For debugging
      alert("Logging in with: " + username + " / " + password);
      
      // Call the real API for login
      const response = await axios.post('http://localhost:8000/api/v1/auth/login', {
        username,
        password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data && response.data.access_token) {
        const accessToken = response.data.access_token;
        
        // Set the token in axios defaults for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        try {
          // Try to get user profile
          const userResponse = await axios.get('http://localhost:8000/api/v1/auth/profile');
          console.log('User profile response:', userResponse.data);
          
          const newUser = {
            username: userResponse.data.username,
            isAdmin: userResponse.data.is_admin,
            email: userResponse.data.email,
            id: userResponse.data.id,
            loginTime: new Date().toISOString()
          };
          
          // Store user in local storage
          localStorage.setItem('user', JSON.stringify(newUser));
          localStorage.setItem('token', accessToken);
          
          // Update state
          setUser(newUser);
          setToken(accessToken);
          setIsAuthenticated(true);
          setIsAdmin(newUser.isAdmin);
          
          return true;
        } catch (profileError) {
          console.error('Error getting user profile:', profileError);
          
          // Even if we couldn't get the profile, we're still logged in
          // Just use basic information
          const newUser = {
            username: username,
            isAdmin: adminMode,
            loginTime: new Date().toISOString()
          };
          
          localStorage.setItem('user', JSON.stringify(newUser));
          localStorage.setItem('token', accessToken);
          
          setUser(newUser);
          setToken(accessToken);
          setIsAuthenticated(true);
          setIsAdmin(adminMode);
          
          return true;
        }
      } else {
        console.error('No access token in response');
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert("Login failed: " + errorMessage);
      return false;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };
  
  const value = {
    isAuthenticated,
    isAdmin,
    user,
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};