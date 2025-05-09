import React from 'react';
import '../styles/RecentDocumentList.css';

const RecentDocumentList: React.FC = () => {
  return (
    <div className="RecentExtractions">
      <h3>Recent extractions</h3>
      <ul>
        <li>Document 1</li>
        <li>Document 2</li>
        <li>Document 3</li>
        <li>....</li>
      </ul>
    </div>
  );
};

export default RecentDocumentList; 