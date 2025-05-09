import axios from 'axios';

const API_URL = 'http://localhost:8000'; // process.env.REACT_APP_API_URL || 

interface UploadResponse {
  message: string;
  uuid: string;
  filename: string;
  original_filename: string;
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  
  // Append only the file with its original name
  formData.append('file', file);
  formData.append('original_file_name', file.name);

  try {
    const response = await axios.post<UploadResponse>(`${API_URL}/api/v1/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.detail) {
      // Backend error with response detail
      throw new Error(error.response.data.detail);
    } else if (error?.message) {
      // Any error with a message
      throw new Error(error.message);
    } else {
      // Fallback error
      throw new Error('An unexpected error occurred during file upload');
    }
  }
}; 