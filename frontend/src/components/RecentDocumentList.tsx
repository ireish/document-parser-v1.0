import React, { useEffect, useState } from 'react';
import { getRecentDocuments, getDocumentContent, clearAllDocuments } from '../api/api';
import '../styles/RecentDocumentList.css';

interface RecentDocument {
  id: string;
  original_filename: string;
  document_type: string;
  status: string;
  created_at: string;
}

interface RecentDocumentListProps {
  onDocumentSelect: (
    documentId: string, 
    fileUrl: string, 
    fileName: string, 
    fileType: string
  ) => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

const RecentDocumentList: React.FC<RecentDocumentListProps> = ({ onDocumentSelect }) => {
  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentDocuments = async () => {
      try {
        setLoading(true);
        const recentDocs = await getRecentDocuments();
        setDocuments(recentDocs);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load recent documents');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDocuments();
    
    // Set up polling to refresh the list every 30 seconds
    const intervalId = setInterval(fetchRecentDocuments, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleClearAllExtractions = async () => {
    try {
      await clearAllDocuments();
      setDocuments([]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to clear recent documents');
    }
  };

  const handleDocumentClick = async (document: RecentDocument) => {
    try {
      // Get the document content URL
      const fileUrl = await getDocumentContent(document.id);
      
      // Determine file type from original filename
      const fileExtension = document.original_filename.split('.').pop()?.toLowerCase() || '';
      let fileType = 'application/octet-stream'; // Default type
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension)) {
        fileType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
      } else if (fileExtension === 'pdf') {
        fileType = 'application/pdf';
      }
      
      // Call the parent component's handler
      onDocumentSelect(document.id, fileUrl, document.original_filename, fileType);
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="RecentDocumentListContainer">
        <h2>Recent extractions</h2>
        <div className="LoadingMessage">Loading recent documents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="RecentDocumentListContainer">
        <h2>Recent extractions</h2>
        <div className="ErrorMessage">{error}</div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="RecentDocumentListContainer">
        <h2>Recent extractions</h2>
        <div className="EmptyMessage">No documents have been processed yet.</div>
      </div>
    );
  }

  return (
    <div className="RecentDocumentListContainer">
      <h2>Recent extractions</h2>
      <button onClick={handleClearAllExtractions} className="ClearButton" disabled={documents.length === 0}>
        Clear All Extractions
      </button>
      <ul className="DocumentList">
        {documents.map((doc) => (
          <li 
            key={doc.id} 
            className={`DocumentListItem ${doc.status}`}
            onClick={() => doc.status === 'completed' ? handleDocumentClick(doc) : null}
          >
            <div className="DocumentTitle">{doc.original_filename}</div>
            <div className="DocumentMeta">
              <span className="DocumentType">{doc.document_type || 'Unknown'}</span>
              <span className="DocumentStatus">{doc.status}</span>
            </div>
            <div className="DocumentDate">{formatDate(doc.created_at)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentDocumentList; 