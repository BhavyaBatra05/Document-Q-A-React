// src/App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { DocumentProvider } from './context/DocumentContext';
// Make sure these import paths are correct
import Login from './pages/Login';
import User from './pages/User';
import Admin from './pages/Admin';

// Protected route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/user" />;
  }
  
  return children;
};

// Routes component separate from App to use context
const AppRoutes = () => {
  const routes = (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <User />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/user" 
        element={
          <ProtectedRoute>
            <User />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute adminOnly={true}>
            <Admin />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
  
  return routes;
};

function App() {
  console.log("App component rendering");
  
  return (
    <AuthProvider>
      <DocumentProvider>
        <Router>
          <AppRoutes />
        </Router>
      </DocumentProvider>
    </AuthProvider>
  );
}

export default App;