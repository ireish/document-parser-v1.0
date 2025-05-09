import React from 'react';
import '../styles/DocumentHeader.css';

interface DocumentHeaderProps {
  title: string;
  fileName?: string | null;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ title, fileName }) => {
  return (
    <div className="DocumentHeaderContainer">
      <h2>
        {title}
        {fileName && (
          <span className="FileName">: {fileName}</span>
        )}
      </h2>
    </div>
  );
};

export default DocumentHeader; 