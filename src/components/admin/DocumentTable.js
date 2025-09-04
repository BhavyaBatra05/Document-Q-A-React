import React from 'react';

const DocumentTable = ({ documents, currentDocument, onActivateDocument }) => {
  if (documents.length === 0) {
    return <div className="info-message">No files uploaded yet.</div>;
  }
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      // If it's a full ISO string, format it
      if (dateString.includes('T')) {
        const date = new Date(dateString);
        return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear().toString().substr(2, 2)}`;
      }
      // Otherwise return as is (pre-formatted dates)
      return dateString;
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="document-table">
      <div className="table-header">
        <div className="col date-col">Date</div>
        <div className="col name-col">File Name</div>
        <div className="col active-col">IsActive</div>
        <div className="col ingested-col">Ingested</div>
      </div>
      
      <div className="table-body">
        {documents.map((doc, index) => (
          <div key={doc.id || index} className="table-row">
            <div className="col date-col">
              {formatDate(doc.uploadDate)}
            </div>
            
            <div className="col name-col">
              <button 
                className="file-name-button"
                onClick={() => onActivateDocument(doc.id)}
              >
                {doc.fileName}
              </button>
            </div>
            
            <div className="col active-col">
              {currentDocument && currentDocument.id === doc.id ? "✓" : "✗"}
            </div>
            
            <div className="col ingested-col">
              {doc.isIngested ? "✓" : "✗"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentTable;