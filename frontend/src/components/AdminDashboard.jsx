import React, { useState, useEffect, useCallback, useContext } from 'react';
import apiService from '../services/api-service';
import '../styles/App.css';
import logo from '../assets/logo.png';
import { DemoModeContext } from "../contexts/DemoModeContext";

const AdminDashboard = ({ user, onBackToChat, onLogout, onActiveDocumentChange}) => {
  const loginTime = localStorage.getItem("login_time");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const { isDemoMode, setIsDemoMode } = useContext(DemoModeContext);
  const [demoIngestState, setDemoIngestState] = useState({ status: null, messages: [] });
  const [demoIngested, setDemoIngested] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const formattedLoginTime = loginTime
    ? new Date(loginTime).toLocaleString()
    : "Unknown";

  const DEMO_FILES = [
    { filename: "sample w graph.pdf", task_id: "demo_graph" },
    { filename: "sampledata.pdf", task_id: "demo_data" },
  ];
  
  console.log(`[AdminDashboard] Mounted - demoIngested: ${demoIngested} - isDemoMode: ${isDemoMode}`);

  useEffect(() => {
    loadUploadedFiles();
  }, []);

  // Load persisted demo ingestion flag on mount
  useEffect(() => {
    const ingestedFlag = localStorage.getItem("demoFilesIngested");
    if (ingestedFlag === "true") {
      setDemoIngested(true);
    }
  }, []);

  

  useEffect(() => {
    console.log(`[AdminDashboard] useEffect triggered - isDemoMode: ${isDemoMode}, demoIngested: ${demoIngested}`);
    if (isDemoMode && !demoIngested) {
      startDemoIngestion();
    } else if (!isDemoMode) {
      setDemoIngestState({ status: null, messages: [] });
      setDemoIngested(false);
      localStorage.removeItem("demoFilesIngested");
      loadUploadedFiles();
    }
    // eslint-disable-next-line
  }, [isDemoMode, demoIngested]);

  const startDemoIngestion = async () => {
    setDemoIngestState({
      status: 'processing',
      messages: DEMO_FILES.map(file => `Processing ${file.filename}...`),
    });

    try {
      for (const file of DEMO_FILES) {
        await apiService.triggerDemoFileIngest(file.task_id);
      }

      const pollStatuses = async () => {
        let allDone = true;
        for (const file of DEMO_FILES) {
          const statusResp = await apiService.getProcessingStatus(file.task_id);
          if (statusResp.status !== 'completed') {
            allDone = false;
            break;
          }
        }
        if (allDone) {
          setDemoIngestState({
            status: 'done',
            messages: ['✅ All demo documents processed successfully!'],
          });
          await loadUploadedFiles();
        } else {
          setTimeout(pollStatuses, 2000);
        }
      };

      pollStatuses();
    } catch (err) {
      setDemoIngestState({
        status: 'error',
        messages: ['Error processing demo files. Please try again.'],
      });
    }
  };


  const loadUploadedFiles = async () => {
    try {
      const response = await apiService.listDocuments();
      const files = (response?.documents || []).map((f, idx, arr) => ({
        ...f,
        task_id: f.id || f.task_id || f.filename,
        ingested: f.processing_status === 'completed',
        isActive: idx === arr.filter(f => f.processing_status === 'completed').length - 1 && f.processing_status === 'completed',
      }));
      setUploadedFiles(files);
      const activeFile = files.find(f => f.isActive);
      if (activeFile) onActiveDocumentChange && onActiveDocumentChange(activeFile);
    } catch (error) {
      console.error('Error loading uploaded files:', error);
      setUploadedFiles([]);
      onActiveDocumentChange && onActiveDocumentChange(null);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      console.log("File selected:", e.target.files[0]); 
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    console.log("Uploading file:", file);
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExt)) {
      alert('Unsupported file format. Please upload PDF, DOCX, or TXT files only.');
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      alert('File too large. Maximum size is 200MB.');
      return;
    }

    try {
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { progress: 0, status: 'uploading' },
      }));

      const response = await apiService.uploadDocument(file, (progress) => {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { progress, status: 'uploading' },
        }));
      });

      if (!response?.task_id) throw new Error('Upload response missing task_id');

      const taskId = response.task_id;
      monitorProcessing(taskId, file.name);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { progress: 0, status: 'error', error: error.message }
      }));
    }
  };

  const monitorProcessing = async (taskId, filename) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await apiService.getProcessingStatus(taskId);
        setUploadProgress(prev => ({
          ...prev,
          [filename]: {
            progress: status?.progress ?? 0,
            status: status?.status ?? 'unknown',
            message: status?.message ?? '',
          }
        }));

        if (status?.status === 'completed' || status?.status === 'error') {
          clearInterval(pollInterval);

          if (status.status === 'completed') {
            await loadUploadedFiles();

            setTimeout(() => {
              setUploadProgress(prev => {
                const newState = { ...prev };
                delete newState[filename];
                return newState;
              });
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error monitoring processing:', error);
        clearInterval(pollInterval);
        setUploadProgress(prev => ({
          ...prev,
          [filename]: { progress: 0, status: 'error', error: 'Processing failed' }
        }));
      }
    }, 2000);
  };

  const handleSetActive = async (activeIdx) => {
    const selectedDoc = uploadedFiles[activeIdx];
    if (!selectedDoc || !selectedDoc.task_id) {
      alert('Document ID undefined, cannot set active document.');
      return;
    }
    try {
      await apiService.setActiveDocument(selectedDoc?.task_id || selectedDoc?.id);
      const updated = uploadedFiles.map((d, i) => ({
        ...d,
        isActive: i === activeIdx,
      }));
      setUploadedFiles(updated);
      onActiveDocumentChange && onActiveDocumentChange(selectedDoc);
    } catch (error) {
      alert("Failed to update active document.");
    }
  };

  const handleToggleIngested = async (idx) => {
    const doc = uploadedFiles[idx];
    const newStatus = !doc.ingested;
    try {
      await apiService.updateIngestedStatus(doc?.id || doc?.filename, newStatus);
      const updated = uploadedFiles.map((d, i) => {
        if (i === idx) return { ...d, ingested: newStatus, isActive: newStatus };
        return { ...d, isActive: false };
      });
      setUploadedFiles(updated);
      onActiveDocumentChange && onActiveDocumentChange(updated.find(d => d.isActive));
    } catch (error) {
      alert("Failed to update ingested status.");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      onLogout();
    } catch (error) {
      onLogout();
    }
  };

  const getCurrentTimestamp = () => {
    return new Date().toLocaleString();
  };

  return (
    <div className="admin-dashboard">
      <header className="app-header">
        <div className="header-left">
          <img
            src={logo}
            alt="Logo"
            style={{ width: "48px", height: "48px", objectFit: "contain", marginRight: "16px" }}
          />
          <h1>Document Q&A System</h1>
        </div>
        <div className="header-right">
          <span className="user-info">Logged in: {user?.username || 'Unknown'}</span>
          <span className="timestamp">Login Time: {getCurrentTimestamp()}</span>
          <button className="btn btn-secondary" onClick={onBackToChat}>👤 User</button>
          <button className="btn btn-logout" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <h2 className="dashboard-title">Admin Dashboard</h2>

        {isDemoMode && demoIngestState.status && (
            <div style={{ marginBottom: '1rem' }}>
              {demoIngestState.messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: demoIngestState.status === 'done' ? '#d4edda' : '#cce5ff',
                    borderRadius: 6,
                    padding: '0.5rem 1rem',
                    color: demoIngestState.status === 'done' ? '#155724' : '#004085',
                    marginBottom: 6,
                    fontWeight: 500,
                  }}
                >
                  {msg}
                </div>
              ))}
            </div>
        )}

        <div className="section" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isDemoMode}
                onChange={(e) => setIsDemoMode(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">Demo Mode</span>
        </div>

        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              <div className="upload-main-text">Drag and drop file here</div>
              <div className="upload-sub-text">Limit 200MB per file • PDF, DOCX, TXT</div>
            </div>
            <input
              type="file"
              id="file-input"
              className="file-input"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-input" className="btn btn-browse">
              Browse files
            </label>
          </div>
        </div>

        {Object.keys(uploadProgress).length > 0 && (
          <div className="upload-progress-container">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="upload-progress-item">
                <div className="progress-info">
                  <span className="progress-filename">{fileName}</span>
                  <span className="progress-status">
                    {progress.status === 'uploading'
                      ? `${progress.progress.toFixed(1)}%`
                      : progress.status === 'completed'
                      ? '✅ Completed'
                      : '❌ Error'}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress.progress}%` }} />
                </div>
                {progress.message && (
                  <div className="progress-message">{progress.message}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="section">
          <h3 className="section-title">User Specific Uploaded Files</h3>
          {uploadedFiles.length === 0 ? (
            <div className="no-files-message">No files uploaded yet.</div>
          ) : (
            <table className="uploaded-files-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>File Name</th>
                  <th>IsActive</th>
                  <th>Ingested</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((file, idx) => (
                  <tr key={file.filename}>
                    <td>{new Date(file.upload_time).toLocaleDateString()}</td>
                    <td>{file.filename}</td>
                    <td
                      style={{ cursor: 'pointer', color: file.isActive ? 'green' : 'red' }}
                      onClick={() => handleSetActive(idx)}
                      title="Click to set active document"
                    >
                      {file.isActive ? '✓' : '✗'}
                    </td>
                    <td
                      style={{ cursor: 'pointer', color: file.ingested ? 'green' : 'red' }}
                      onClick={() => handleToggleIngested(idx)}
                      title="Click to toggle ingested status"
                    >
                      {file.ingested ? '✓' : '✗'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
