import React from 'react';
import '../styles/OriginalDocumentView.css';

interface OriginalDocumentViewProps {
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
}

const OriginalDocumentView: React.FC<OriginalDocumentViewProps> = ({ fileUrl, fileType, fileName }) => {
  if (!fileUrl || !fileType) {
    return (
      <div className="OriginalDocumentViewContainer">
        <p>No document selected or uploaded yet. Please upload a document to view it here.</p>
      </div>
    );
  }

  const isImage = fileType.startsWith('image/');
  const isPdf = fileType === 'application/pdf';
  console.log(fileUrl);
  console.log(fileType);

  return (
    <div className="OriginalDocumentViewContainer">
      {isImage && (
        <img src={fileUrl} alt={fileName || 'Uploaded Image'} className="ResponsiveMedia" />
      )}
      {isPdf && (
        <object data={fileUrl} type="application/pdf" className="ResponsiveMediaPdf">
          <p>
            Your browser does not support PDFs. Please download the PDF to view it:
            <a href={fileUrl} download={fileName || 'document.pdf'}>Download PDF</a>.
          </p>
        </object>
      )}
      {!isImage && !isPdf && (
        <p>Unsupported file type. Cannot display this file.</p>
      )}
    </div>
  );
};

export default OriginalDocumentView; 