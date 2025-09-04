// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user is already logged in from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
      setIsAdmin(parsedUser.isAdmin);
    }
  }, []);
  
  const login = (username, password, adminMode = false) => {
    // In a real app, you would validate credentials against an API
    // This is a simplified version for demonstration
    
    const currentDate = new Date().toISOString();
    
    // Create user object - always set admin to true for demo purposes
    // Change this to `adminMode` for actual validation in a real app
    const newUser = {
      username,
      isAdmin: true, // Set to true for easy navigation during demo
      loginTime: currentDate
    };
    
    // Store user in local storage
    localStorage.setItem('user', JSON.stringify(newUser));
    
    // Update state
    setUser(newUser);
    setIsAuthenticated(true);
    setIsAdmin(true); // Set to true for easy navigation during demo
    
    return true;
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