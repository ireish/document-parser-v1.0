import './styles/App.css';
import OriginalDocumentView from './components/OriginalDocumentView';
import ExtractedDataView from './components/ExtractedDataView';
import FileUploader from './components/FileUploader';
import RecentDocumentList from './components/RecentDocumentList';
import DocumentHeader from './components/DocumentHeader';
import React, { useState } from 'react';

function App() {
  const [currentDocument, setCurrentDocument] = useState<{ url: string; type: string; name: string } | null>(null);

  const handleFileUploadSuccess = (fileUrl: string, fileType: string, fileName: string) => {
    setCurrentDocument({ url: fileUrl, type: fileType, name: fileName });
  };

  return (
    <div className="App">
      <div className="LeftPanel">
        <FileUploader onFileUploadSuccess={handleFileUploadSuccess} />
        <RecentDocumentList />
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
        />
      </div>
      <ExtractedDataView />
    </div>
  );
}

export default App; 

