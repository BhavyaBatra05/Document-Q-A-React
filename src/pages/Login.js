// src/pages/Login.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState(''); // Empty username by default
  const [password, setPassword] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    
    console.log('Attempting login with:', { username, password, isAdminLogin });
    setError('Logging in...');
    
    try {
      const success = await login(username, password, isAdminLogin);
      console.log('Login result:', success);
      
      if (success) {
        console.log('Login successful, navigating to:', isAdminLogin ? '/admin' : '/user');
        navigate(isAdminLogin ? '/admin' : '/user');
      } else {
        console.log('Login failed');
        setError('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed: ' + (error.message || 'Unknown error'));
    }
  };
  
  // Custom styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa'
    },
    formContainer: {
      width: '100%',
      maxWidth: '400px',
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    logo: {
      height: '40px',
      marginRight: '15px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: '500'
    },
    input: {
      width: '100%',
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      backgroundColor: '#f5f5f5'
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px'
    },
    checkbox: {
      marginRight: '10px'
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#2E86AB',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold'
    }
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <div style={styles.header}>
          <img src="/logo.png" alt="Logo" style={styles.logo} />
          <h2 style={styles.title}>Document Q&A System</h2>
        </div>
        
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h3>
        
        {error && <div style={{ backgroundColor: '#ffebee', color: '#d32f2f', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          
          <div style={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="admin"
              style={styles.checkbox}
              checked={isAdminLogin}
              onChange={(e) => setIsAdminLogin(e.target.checked)}
            />
            <label htmlFor="admin">Login as Admin</label>
          </div>
          
          <button type="submit" style={styles.button}>Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;