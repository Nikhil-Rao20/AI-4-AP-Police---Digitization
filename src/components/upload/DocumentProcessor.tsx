import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { UploadedFile, DocumentRecord } from '../../types';
import { documentTemplates } from '../../data/templates';
import DocumentForm from './DocumentForm';
import { v4 as uuidv4 } from 'uuid';

interface DocumentProcessorProps {
  files: UploadedFile[];
  onDocumentProcessed: (document: DocumentRecord) => void;
}

const DocumentProcessor: React.FC<DocumentProcessorProps> = ({ files, onDocumentProcessed }) => {
  const [processing, setProcessing] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedFields, setExtractedFields] = useState<Record<string, any>>({});

  const processFile = async (file: UploadedFile) => {
    setProcessing(file.id);
    setCurrentFile(file);

    try {
      const { data: { text } } = await Tesseract.recognize(file.file, 'eng', {
        logger: m => console.log(m)
      });

      setExtractedText(text);
      
      // Simple field extraction based on common patterns
      const fields = extractFieldsFromText(text, file.type);
      setExtractedFields(fields);

    } catch (error) {
      console.error('OCR Error:', error);
    } finally {
      setProcessing(null);
    }
  };

  const extractFieldsFromText = (text: string, type: string): Record<string, any> => {
    const fields: Record<string, any> = {};
    const template = documentTemplates.find(t => t.type === type);
    
    if (!template) return fields;

    // Basic pattern matching for common fields
    const patterns = {
      name: /(?:name|officer)[\s:]+([a-zA-Z\s]+)/i,
      rank: /(?:rank|designation)[\s:]+([a-zA-Z\s]+)/i,
      orderNumber: /(?:order|no|number)[\s:]+([a-zA-Z0-9\/\-]+)/i,
      date: /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g
    };

    template.fields.forEach(field => {
      const pattern = patterns[field.id as keyof typeof patterns];
      if (pattern) {
        const match = text.match(pattern);
        if (match) {
          fields[field.id] = match[1]?.trim() || '';
        }
      }
    });

    return fields;
  };

  const handleFormSubmit = (formData: Record<string, any>) => {
    if (!currentFile) return;

    const document: DocumentRecord = {
      id: uuidv4(),
      caseId: `AP-${Date.now().toString().slice(-6)}`,
      type: currentFile.type,
      fields: formData,
      originalImage: currentFile.preview,
      extractedText,
      status: 'validated',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onDocumentProcessed(document);
    setCurrentFile(null);
    setExtractedText('');
    setExtractedFields({});
  };

  return (
    <div className="space-y-6">
      {files.filter(f => f.status === 'uploading').map(file => (
        <div key={file.id} className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Process: {file.file.name}</h3>
            <button
              onClick={() => processFile(file)}
              disabled={processing === file.id}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {processing === file.id ? 'Processing...' : 'Start OCR'}
            </button>
          </div>
        </div>
      ))}

      {currentFile && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Validate Extracted Data</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Original Document</h4>
              <img
                src={currentFile.preview}
                alt="Document"
                className="w-full border rounded-lg"
              />
              {extractedText && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Extracted Text</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm max-h-40 overflow-y-auto">
                    {extractedText}
                  </div>
                </div>
              )}
            </div>
            <div>
              <DocumentForm
                type={currentFile.type}
                initialData={extractedFields}
                onSubmit={handleFormSubmit}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentProcessor;