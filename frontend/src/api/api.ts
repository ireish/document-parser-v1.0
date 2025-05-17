import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UploadResponse {
  message: string;
  uuid: string;
  filename: string;
  original_filename: string;
}

interface DocumentResponse {
  id: string;
  status: string;
  document_type: string;
  file_type: string;
  original_filename: string;
  extracted_fields: string;
  upload_path?: string;
}

interface RecentDocument {
  id: string;
  original_filename: string;
  document_type: string;
  status: string;
  created_at: string;
}

interface UpdateFieldsResponse {
  id: string;
  status: string;
  message: string;
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  
  // Generate UUID on the frontend
  const documentId = uuidv4();
  
  // Append file, original filename, and the generated UUID
  formData.append('file', file);
  formData.append('original_file_name', file.name);
  formData.append('document_id', documentId);

  try {
    const response = await axios.post<UploadResponse>(`${API_URL}/api/documents/upload`, formData, {
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

export const getDocumentById = async (documentId: string): Promise<DocumentResponse> => {
  try {
    const response = await axios.get<DocumentResponse>(`${API_URL}/api/documents/${documentId}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else if (error?.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to fetch document information');
    }
  }
};

export const getDocumentContent = async (documentId: string): Promise<string> => {
  try {
    const response = await axios.get<Blob>(`${API_URL}/api/documents/${documentId}/content`, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  } catch (error: any) {
    if (error?.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else if (error?.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to fetch document content');
    }
  }
};

export const updateExtractedFields = async (documentId: string, extractedFields: any): Promise<UpdateFieldsResponse> => {
  try {
    const response = await axios.put<UpdateFieldsResponse>(`${API_URL}/api/documents/${documentId}`, {
      extracted_fields_json: extractedFields
    });
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else if (error?.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to update extracted fields');
    }
  }
};

export const getRecentDocuments = async (): Promise<RecentDocument[]> => {
  try {
    const response = await axios.get<RecentDocument[]>(`${API_URL}/api/documents/recent/list`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else if (error?.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to fetch recent documents');
    }
  }
};

export const clearAllDocuments = async (): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/api/documents/clear_all`);
  } catch (error: any) {
    if (error?.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else if (error?.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to clear recent documents');
    }
  }
}; 