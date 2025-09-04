import React from 'react';

const Footer = ({ isAdmin = false }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      © {currentYear} Document Q&A System {isAdmin ? "- Admin Panel" : "- All rights reserved"}
    </footer>
  );
};

export default Footer;