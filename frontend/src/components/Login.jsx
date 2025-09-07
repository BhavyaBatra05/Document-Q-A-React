import React, { useState, useEffect } from 'react';
import apiService from '../services/api-service';
import '../styles/App.css';
import logo from '../assets/logo.png';

const Login = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiService.login(
                credentials.username, 
                credentials.password,
            );
            
            onLogin(response.user);
        } catch (error) {
            setError('Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-form">
                    <div className="login-header">
                        <img
                            src={logo}
                            alt="Logo"
                            style={{ width: "48px", height: "48px", objectFit: "contain", marginRight: "16px" }}
                        />
                        <div className="document-icon"></div>
                        <h1>Document Q&A System</h1>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="text"
                                name="username"
                                className="form-control"
                                placeholder="Username"
                                value={credentials.username}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </div>
                        
                        <div className="form-group">
                            <input
                                type="password"
                                name="password"
                                className="form-control"
                                placeholder="Password"
                                value={credentials.password}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </div>
                        
                        <div className="form-group">
                        </div>
                        
                        {error && <div className="error-message">{error}</div>}
                        
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-full-width"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;