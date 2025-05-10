import React, { useEffect, useState } from 'react';
import '../styles/ExtractedDataView.css';
import DocumentHeader from './DocumentHeader';
import { getDocumentById, updateExtractedFields } from '../api/api';

interface ExtractedFieldProps {
  fieldName: string;
  value: string;
  onEdit: (fieldName: string, newValue: string) => void;
  isEditing: boolean;
  onEditToggle: () => void;
}

interface ExtractedDataViewProps {
  documentId: string | null;
}

interface ExtractionResult {
  document_type?: { 
    doc_type: string;
    country: string;
    state: string;
  };
  attributes?: Record<string, any>;
  error?: string;
}

const ExtractedField: React.FC<ExtractedFieldProps> = ({ 
  fieldName, 
  value, 
  onEdit, 
  isEditing,
  onEditToggle 
}) => {
  const [editedValue, setEditedValue] = useState(value);

  useEffect(() => {
    setEditedValue(value);
  }, [value]);

  const handleSave = () => {
    onEdit(fieldName, editedValue);
    onEditToggle();
  };

  const handleCancel = () => {
    setEditedValue(value);
    onEditToggle();
  };

  return (
    <div className="ExtractedField">
      {isEditing ? (
        <div className="EditingMode">
          <span className="FieldName">{fieldName}</span>
          <input
            type="text"
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            className="EditInput"
            autoFocus
          />
          <div className="EditButtons">
            <button onClick={handleSave} className="SaveButton">Save</button>
            <button onClick={handleCancel} className="CancelButton">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="ViewMode">
          <span className="FieldName">{fieldName}</span>
          <span className="FieldValue">{value}</span>
          <button onClick={onEditToggle} className="EditButton">Edit</button>
        </div>
      )}
    </div>
  );
};

const ExtractedDataView: React.FC<ExtractedDataViewProps> = ({ documentId }) => {
  const [extractedData, setExtractedData] = useState<Array<{ fieldName: string; value: string }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [originalExtractedFields, setOriginalExtractedFields] = useState<ExtractionResult | null>(null);

  useEffect(() => {
    const fetchExtractedData = async () => {
      if (!documentId) {
        setExtractedData([]);
        setDocumentStatus(null);
        setOriginalExtractedFields(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getDocumentById(documentId);
        setDocumentStatus(response.status);

        if (response.status === 'completed') {
          // Parse the JSON string into an object
          const extractedFields: ExtractionResult = response.extracted_fields 
            ? JSON.parse(response.extracted_fields) 
            : {};
          
          // Store the original data structure for later updates
          setOriginalExtractedFields(extractedFields);

          const fieldsArray: Array<{ fieldName: string; value: string }> = [];

          // Add document type information
          if (extractedFields.document_type) {
            fieldsArray.push({ 
              fieldName: 'Document Type', 
              value: extractedFields.document_type.doc_type || 'Unknown' 
            });

            if (extractedFields.document_type.country) {
              fieldsArray.push({ 
                fieldName: 'Country', 
                value: extractedFields.document_type.country 
              });
            }

            if (extractedFields.document_type.state) {
              fieldsArray.push({ 
                fieldName: 'State', 
                value: extractedFields.document_type.state 
              });
            }
          }

          // Add all attributes
          if (extractedFields.attributes) {
            Object.entries(extractedFields.attributes).forEach(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                // For nested objects, stringify them
                fieldsArray.push({ fieldName: key, value: JSON.stringify(value) });
              } else {
                fieldsArray.push({ fieldName: key, value: String(value) });
              }
            });
          }

          setExtractedData(fieldsArray);
        } else if (response.status === 'error') {
          setError('Document processing failed');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch extracted data');
      } finally {
        setLoading(false);
      }
    };

    fetchExtractedData();
    
    // If document is still processing, poll for updates every 5 seconds
    let intervalId: number | null = null;
    
    if (documentId && documentStatus === 'processing') {
      intervalId = window.setInterval(fetchExtractedData, 5000);
    }
    
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [documentId, documentStatus]);

  const handleEditToggle = (fieldName: string) => {
    setEditingField(editingField === fieldName ? null : fieldName);
  };

  const handleEditField = async (fieldName: string, newValue: string) => {
    if (!documentId || !originalExtractedFields) return;
    
    setSaveLoading(true);
    setSaveError(null);
    
    try {
      // Create a deep copy of the original data
      const updatedFields = JSON.parse(JSON.stringify(originalExtractedFields));
      
      // Update the specific field in the structure
      if (fieldName === 'Document Type' && updatedFields.document_type) {
        updatedFields.document_type.doc_type = newValue;
      } else if (fieldName === 'Country' && updatedFields.document_type) {
        updatedFields.document_type.country = newValue;
      } else if (fieldName === 'State' && updatedFields.document_type) {
        updatedFields.document_type.state = newValue;
      } else if (updatedFields.attributes && fieldName in updatedFields.attributes) {
        // Handle different types appropriately
        const originalValue = updatedFields.attributes[fieldName];
        if (typeof originalValue === 'number') {
          updatedFields.attributes[fieldName] = Number(newValue);
        } else if (typeof originalValue === 'boolean') {
          updatedFields.attributes[fieldName] = newValue.toLowerCase() === 'true';
        } else {
          updatedFields.attributes[fieldName] = newValue;
        }
      }
      
      // Send the update to the server
      await updateExtractedFields(documentId, updatedFields);
      
      // Update the local state
      setExtractedData(prev => prev.map(item => 
        item.fieldName === fieldName ? { ...item, value: newValue } : item
      ));
      
      // Update the original fields for future edits
      setOriginalExtractedFields(updatedFields);
      
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update field');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading && !extractedData.length) {
    return (
      <div className="ExtractedDataViewContainer">
        <DocumentHeader title="Extracted Data" />
        <div className="ExtractedDataContent">
          <p className="StatusMessage">Loading extracted data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ExtractedDataViewContainer">
        <DocumentHeader title="Extracted Data" />
        <div className="ExtractedDataContent">
          <p className="ErrorMessage">{error}</p>
        </div>
      </div>
    );
  }

  if (saveError) {
    return (
      <div className="ExtractedDataViewContainer">
        <DocumentHeader title="Extracted Data" />
        <div className="ExtractedDataContent">
          <div className="SaveErrorBanner">
            <p>Error saving changes: {saveError}</p>
            <button onClick={() => setSaveError(null)}>Dismiss</button>
          </div>
          {renderFields()}
        </div>
      </div>
    );
  }

  if (documentStatus === 'processing') {
    return (
      <div className="ExtractedDataViewContainer">
        <DocumentHeader title="Extracted Data" />
        <div className="ExtractedDataContent">
          <p className="StatusMessage">Processing document... This may take a few moments.</p>
        </div>
      </div>
    );
  }

  if (!documentId || !extractedData.length) {
    return (
      <div className="ExtractedDataViewContainer">
        <DocumentHeader title="Extracted Data" />
        <div className="ExtractedDataContent">
          <p className="StatusMessage">No data extracted yet. Please upload a document to extract information.</p>
        </div>
      </div>
    );
  }

  function renderFields() {
    return extractedData.map((item) => (
      <ExtractedField
        key={item.fieldName}
        fieldName={item.fieldName}
        value={item.value}
        onEdit={handleEditField}
        isEditing={editingField === item.fieldName}
        onEditToggle={() => handleEditToggle(item.fieldName)}
      />
    ));
  }

  return (
    <div className="ExtractedDataViewContainer">
      <DocumentHeader title="Extracted Data" />
      <div className="ExtractedDataContent">
        {saveLoading && <div className="SaveLoadingIndicator">Saving changes...</div>}
        {renderFields()}
      </div>
    </div>
  );
};

export default ExtractedDataView; 