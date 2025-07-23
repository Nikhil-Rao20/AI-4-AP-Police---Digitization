import React from 'react';
import { X, Download, Calendar, User, Hash } from 'lucide-react';
import { DocumentRecord } from '../types';
import { documentTemplates } from '../data/templates';

interface RecordModalProps {
  record: DocumentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const RecordModal: React.FC<RecordModalProps> = ({ record, isOpen, onClose }) => {
  if (!isOpen || !record) return null;

  const template = documentTemplates.find(t => t.type === record.type);

  const downloadJSON = () => {
    const dataStr = JSON.stringify(record, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${record.caseId}_${record.type}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Record Details</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadJSON}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{record.caseId}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs capitalize ${
                    record.status === 'approved' ? 'bg-green-100 text-green-800' :
                    record.status === 'validated' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {record.status}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{record.fields.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-4">
                {template?.name || record.type.replace('-', ' ').toUpperCase()}
              </h3>

              <div className="space-y-4">
                {template?.fields.map((field) => (
                  <div key={field.id} className="border-b pb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <div className="text-gray-900">
                      {record.fields[field.id] || 'Not provided'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {record.originalImage && (
                <div>
                  <h4 className="font-medium mb-2">Original Document</h4>
                  <img
                    src={record.originalImage}
                    alt="Original Document"
                    className="w-full border rounded-lg"
                  />
                </div>
              )}

              {record.stampImage && (
                <div>
                  <h4 className="font-medium mb-2">Detected Stamp</h4>
                  <img
                    src={record.stampImage}
                    alt="Detected Stamp"
                    className="w-full border rounded-lg"
                  />
                </div>
              )}

              {record.extractedText && (
                <div>
                  <h4 className="font-medium mb-2">Extracted Text (OCR)</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{record.extractedText}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordModal;