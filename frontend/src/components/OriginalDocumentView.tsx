import React, { useEffect, useState } from 'react';
import { getDocumentContent, getDocumentById } from '../api/api';
import '../styles/OriginalDocumentView.css';

interface OriginalDocumentViewProps {
  fileUrl: string | null; // This prop can be a direct URL (e.g., from recent selection)
  fileType: string | null;
  fileName: string | null;
  documentId: string | null; // This is always the ID of the document to display
}

const OriginalDocumentView: React.FC<OriginalDocumentViewProps> = ({ fileUrl, fileType, fileName, documentId }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [currentFileType, setCurrentFileType] = useState<string | null>(null);

  useEffect(() => {
    // Prioritize fileUrl prop if it exists
    if (fileUrl) {
      setDisplayUrl(fileUrl);
      setCurrentFileType(fileType);
      setError(null);
      setLoading(false);
      return; // Exit if fileUrl is provided
    }

    // If no fileUrl prop, but we have a documentId, try to fetch content
    if (documentId) {
      const fetchDocument = async () => {
        setLoading(true);
        setError(null);
        setDisplayUrl(null); // Clear previous content
        setCurrentFileType(null);

        try {
          const docDetails = await getDocumentById(documentId);
          if (docDetails.status === 'completed' || docDetails.status === 'processing' || docDetails.status === 'failed') { // also show if processing or failed, to provide feedback
            const backendFileType = docDetails.file_type.toLowerCase(); // Ensure lowercase
            let mimeType = 'application/octet-stream'; // Default if unknown
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(backendFileType)) {
              mimeType = `image/${backendFileType === 'jpg' ? 'jpeg' : backendFileType}`;
            } else if (backendFileType === 'pdf') {
              mimeType = 'application/pdf';
            }
            // Use the derived MIME type
            setCurrentFileType(mimeType); 
            if (docDetails.status === 'completed' || docDetails.status === 'processing') {
                 const url = await getDocumentContent(documentId);
                 setDisplayUrl(url);
            } else if (docDetails.status === 'failed') {
                setError(`Document processing failed. Cannot display content.`);
            }
          } else {
            // This case might not be hit if status is always one of the above
            setError(`Document status: ${docDetails.status}. Content will be loaded when processing completes.`);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to load document details or content');
        } finally {
          setLoading(false);
        }
      };
      fetchDocument();
    } else {
      // No documentId and no fileUrl, so clear everything
      setDisplayUrl(null);
      setCurrentFileType(null);
      setError(null);
      setLoading(false);
    }

    // Cleanup function to revoke object URL if displayUrl was created by this component
    // This is important if getDocumentContent creates a blob URL
    return () => {
      if (displayUrl && displayUrl.startsWith('blob:')) {
        URL.revokeObjectURL(displayUrl);
      }
    };
  }, [documentId, fileUrl, fileType]); // Rerun if any of these key identifiers change

  if (loading) {
    return (
      <div className="OriginalDocumentViewContainer">
        <p>Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="OriginalDocumentViewContainer">
        <p className="ErrorMessage">{error}</p>
      </div>
    );
  }

  if (!displayUrl || !currentFileType) {
    return (
      <div className="OriginalDocumentViewContainer">
        <p>No document selected or uploaded yet. Please upload a document to view it here.</p>
      </div>
    );
  }

  const isImage = currentFileType.startsWith('image/');
  const isPdf = currentFileType === 'application/pdf';

  return (
    <div className="OriginalDocumentViewContainer">
      {isImage && (
        <img src={displayUrl} alt={fileName || 'Uploaded Document'} className="ResponsiveMedia" />
      )}
      {isPdf && (
        <object data={displayUrl} type="application/pdf" className="ResponsiveMediaPdf">
          <p>
            Your browser does not support PDFs. Please download the PDF to view it:
            <a href={displayUrl} download={fileName || 'document.pdf'}>Download PDF</a>.
          </p>
        </object>
      )}
      {!isImage && !isPdf && (
        // Use currentFileType for a more specific message if needed
        <p>Unsupported file type ({currentFileType}). Cannot display this file.</p>
      )}
    </div>
  );
};

export default OriginalDocumentView; 