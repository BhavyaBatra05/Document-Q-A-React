// src/components/common/Header.js
import React from 'react';

const Header = ({ title, username, onUserClick, onAdminClick, onLogoutClick }) => {
  return (
    <div className="header">
      <div className="header-left">
        <img src="/logo.png" alt="Logo" className="logo" style={{ maxHeight: '40px', width: 'auto' }} />
        <h2>{title}</h2>
      </div>
      
      <div className="header-right">
        {username && (
          <>
            <span className="username-display">Logged in: {username}</span>
            
            {onUserClick && (
              <button className="nav-button" onClick={onUserClick}>
                User
              </button>
            )}
            
            {onAdminClick && (
              <button className="nav-button" onClick={onAdminClick}>
                Admin
              </button>
            )}
            
            <button className="nav-button" onClick={onLogoutClick}>
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;