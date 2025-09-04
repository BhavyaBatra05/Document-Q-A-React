import React, { useState, useRef } from 'react';

const DocumentUpload = ({ onFileUpload, isLoading, supportedFormats = ['pdf', 'docx', 'txt'] }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileSelection(file);
    }
  };
  
  const handleFileSelection = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (supportedFormats.includes(extension)) {
      setSelectedFile(file);
    } else {
      alert(`Unsupported file format. Please upload a ${supportedFormats.join(', ')} file.`);
    }
  };
  
  const handleUpload = async () => {
    if (selectedFile) {
      const success = await onFileUpload(selectedFile);
      if (success) {
        setSelectedFile(null);
      }
    }
  };
  
  const openFileDialog = () => {
    fileInputRef.current.click();
  };
  
  return (
    <div className="document-upload">
      <div 
        className={`drop-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept={supportedFormats.map(format => `.${format}`).join(',')}
        />
        
        <div className="upload-icon">📄</div>
        <p>Click or drag a file to upload</p>
        <p className="small">Supported formats: {supportedFormats.join(', ')}</p>
      </div>
      
      {selectedFile && (
        <div className="selected-file">
          <p>Selected file: {selectedFile.name}</p>
          <button 
            className="button primary-button" 
            onClick={handleUpload}
            disabled={isLoading}
          >
            {isLoading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;