import React from 'react';
import '../styles/ExtractedDataView.css';
import DocumentHeader from './DocumentHeader';

interface ExtractedFieldProps {
  fieldName: string;
  value: string;
  onEdit: () => void; // Placeholder for edit functionality
}

const ExtractedField: React.FC<ExtractedFieldProps> = ({ fieldName, value, onEdit }) => {
  return (
    <div className="ExtractedField">
      <span>{`${fieldName} => ${value}`}</span>
      <button onClick={onEdit}>Edit</button>
    </div>
  );
};

const ExtractedDataView: React.FC = () => {
  // Placeholder data - this would come from props or state management
  const extractedData = [
    { fieldName: 'Document_type', value: 'Some_Type' },
    { fieldName: 'field_1', value: 'extracted_value_1' },
    { fieldName: 'field_2', value: 'extracted_value_2' },
    { fieldName: 'field_3', value: 'extracted_value_3' },
  ];

  const handleEdit = (fieldName: string) => {
    console.log(`Edit clicked for ${fieldName}`);
    // Implement actual edit logic here
  };

  return (
    <div className="ExtractedDataViewContainer">
      <DocumentHeader title="Extracted Data" />
      <div className="ExtractedDataContent">
        {extractedData.map((item) => (
          <ExtractedField
            key={item.fieldName}
            fieldName={item.fieldName}
            value={item.value}
            onEdit={() => handleEdit(item.fieldName)}
          />
        ))}
      </div>
    </div>
  );
};

export default ExtractedDataView; 