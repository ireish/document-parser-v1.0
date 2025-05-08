import React from 'react';
import './styles/App.css';
import OriginalDocumentView from './components/OriginalDocumentView';
import ExtractedDataView from './components/ExtractedDataView';
import Controls from './components/Controls';

function App() {
  return (
    <div className="App">
      <Controls />
      <OriginalDocumentView />
      <ExtractedDataView />
    </div>
  );
}

export default App; 