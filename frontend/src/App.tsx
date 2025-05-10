import './styles/App.css';
import OriginalDocumentView from './components/OriginalDocumentView';
import ExtractedDataView from './components/ExtractedDataView';
import FileUploader from './components/FileUploader';
import RecentDocumentList from './components/RecentDocumentList';
import DocumentHeader from './components/DocumentHeader';
import React, { useState } from 'react';

function App() {
  const [currentDocument, setCurrentDocument] = useState<{ 
    url: string | null; 
    type: string; 
    name: string;
    id: string;
  } | null>(null);

  const handleFileUploadSuccess = (documentId: string, fileType: string, fileName: string) => {
    setCurrentDocument({ 
      url: null, // URL will be fetched by OriginalDocumentView
      type: fileType, 
      name: fileName,
      id: documentId 
    });
  };

  const handleDocumentSelect = (documentId: string, fileUrl: string, fileName: string, fileType: string) => {
    setCurrentDocument({
      url: fileUrl,
      type: fileType,
      name: fileName,
      id: documentId
    });
  };

  return (
    <div className="App">
      <div className="LeftPanel">
        <FileUploader onFileUploadSuccess={handleFileUploadSuccess} />
        <RecentDocumentList onDocumentSelect={handleDocumentSelect} />
      </div>
      <div className="DocumentSection">
        <DocumentHeader 
          title="Original Document View" 
          fileName={currentDocument?.name} 
        />
        <OriginalDocumentView
          fileUrl={currentDocument?.url || null}
          fileType={currentDocument?.type || null}
          fileName={currentDocument?.name || null}
          documentId={currentDocument?.id || null}
        />
      </div>
      <ExtractedDataView documentId={currentDocument?.id || null} />
    </div>
  );
}

export default App; 

