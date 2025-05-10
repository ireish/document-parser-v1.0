import React, { useRef, useState } from 'react';
import { uploadFile, getDocumentContent } from '../api/api';
import '../styles/FileUploader.css';

interface FileUploaderProps {
  onFileUploadSuccess: (documentId: string, fileType: string, fileName: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploadSuccess }) => {
  const [error, setError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input to allow re-uploading the same file
      setError('');
      setSelectedFile(null);
      setUploadMessage('');
      fileInputRef.current.click();
    }
  };

  const validateFileType = (file: File): boolean => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    return validTypes.includes(file.type);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setError('');
    setUploadMessage('');
    setSelectedFile(null);

    if (files && files.length > 0) {
      const file = files[0];

      if (validateFileType(file)) {
        setSelectedFile(file);
        try {
          setUploadMessage('Uploading...');
          const response = await uploadFile(file);
          
          // No longer fetch document content here
          setUploadMessage(`File uploaded successfully: ${response.original_filename}`);
          console.log("Document UUID: ", response.uuid);
          // Pass the document ID, type, and name to the parent component
          onFileUploadSuccess(response.uuid, file.type, response.original_filename);
          setSelectedFile(null); // Clear selected file after successful upload
        } catch (err: any) {
          // setError(err.message || 'Upload failed. Please try again.'); // Original error handling
          // Keep existing error handling for upload itself
          let errorMessage = 'Upload failed. Please try again.';
          if (err.message) {
            errorMessage = err.message;
          } else if (err.response && err.response.data && err.response.data.detail) {
            errorMessage = err.response.data.detail;
          }
          setError(errorMessage);
          setUploadMessage('');
          setSelectedFile(null);
        }
      } else {
        setError('Unsupported file type. Please upload a PDF or image file.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div className="FileUploaderContainer">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,image/*"
        style={{ display: 'none' }}
      />
      <button className="ExtractButton" onClick={handleButtonClick}>
        Extract New Document
      </button>
      <p className="SupportedTypes">Supports PDF and Image files.</p>
      {error && <p className="ErrorMessage">{error}</p>}
      {uploadMessage && <p className="UploadMessage">{uploadMessage}</p>}
      {selectedFile && !uploadMessage && <p className="SelectedFile">Selected: {selectedFile.name}</p>}
    </div>
  );
};

export default FileUploader; 