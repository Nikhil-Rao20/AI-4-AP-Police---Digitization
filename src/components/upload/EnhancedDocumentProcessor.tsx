import React, { useState, useEffect } from 'react';
import { UploadedFile, DocumentRecord, DocumentType } from '../../types';
import { documentTemplates } from '../../data/templates';
import DocumentForm from './DocumentForm';
import { pythonBackendService } from '../../services/pythonBackend';
import { databaseService } from '../../services/databaseService';
import { v4 as uuidv4 } from 'uuid';

interface EnhancedDocumentProcessorProps {
  files: UploadedFile[];
  onDocumentProcessed: (document: DocumentRecord) => void;
}

const EnhancedDocumentProcessor: React.FC<EnhancedDocumentProcessorProps> = ({ 
  files, 
  onDocumentProcessed 
}) => {
  const [processing, setProcessing] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [classifiedType, setClassifiedType] = useState<DocumentType | null>(null);
  const [extractedFields, setExtractedFields] = useState<Record<string, any>>({});
  const [stampImage, setStampImage] = useState<string>('');
  const [signatureImage, setSignatureImage] = useState<string>('');
  const [savedImagePath, setSavedImagePath] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPdf, setIsPdf] = useState<boolean>(false);

  const processFile = async (file: UploadedFile) => {
    setProcessing(file.id);
    setCurrentFile(file);
    
    // Clear existing field values when starting to process a new image
    setExtractedFields({});
    setStampImage('');
    setSignatureImage('');
    setClassifiedType(null);
    setCurrentImageIndex(0);
    setImageUrls([]);
    setIsPdf(false);

    try {
      // Step 1: Save the image to server
      console.log('Saving image...');
      const saveResult = await pythonBackendService.saveImage(file.file);
      
      // Handle PDF vs single image response
      if (typeof saveResult === 'object' && saveResult.is_pdf) {
        // PDF with multiple pages
        setSavedImagePath(saveResult.image_path);
        setImageUrls(saveResult.image_urls);
        setIsPdf(true);
        console.log(`📄 PDF with ${saveResult.page_count} pages`);
      } else {
        // Single image
        setSavedImagePath(saveResult);
        setImageUrls([file.preview]);
        setIsPdf(false);
      }

      // Step 2: Classify the letter type
      console.log('Classifying letter...');
      const classificationResult = await pythonBackendService.classifyLetter(saveResult);
      setClassifiedType(classificationResult.letterType);

      // Step 3: Detect fields based on classified type
      console.log('Detecting fields...');
      const fieldResult = await pythonBackendService.detectFields(saveResult);
      console.log('Field detection result:', fieldResult);
      
      if (fieldResult.fields) {
        const formattedFields = mapBackendFieldsToTemplate(
          fieldResult.fields, 
          classificationResult.letterType
        );
        
        console.log('Mapped fields:', formattedFields);
        setExtractedFields(formattedFields);
      } else {
        console.error('Invalid field structure:', fieldResult);
        setExtractedFields({});
      }

      // Step 4: Detect stamp
      console.log('Detecting stamp...');
      const stampResult = await pythonBackendService.detectStamp(saveResult);
      console.log('Stamp detection result:', stampResult);
      console.log('Stamp image path:', stampResult.stampImagePath);
      setStampImage(stampResult.stampImagePath);
      console.log('Stamp image state updated');

      // Step 5: Detect signature
      console.log('Detecting signature...');
      const signatureResult = await pythonBackendService.detectSignature(saveResult);
      console.log('Signature detection result:', signatureResult);
      console.log('Signature image path:', signatureResult.signatureImagePath);
      setSignatureImage(signatureResult.signatureImagePath);
      console.log('Signature image state updated');

    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setProcessing(null);
    }
  };
  const mapBackendFieldsToTemplate = (backendFields: any, docType: DocumentType) => {
    const template = documentTemplates.find(t => t.type === docType);
    if (!template) {
      console.error('Template not found for document type:', docType);
      return {};
    }
    
    console.log('Mapping backend fields:', backendFields);
    console.log('Template fields:', template.fields);
    
    const mappedData: Record<string, any> = {};
    
    template.fields.forEach(field => {
      const backendValue = backendFields[field.id];
      console.log(`Mapping field ${field.id}:`, backendValue);
      
      // Special handling for date fields
      if (field.type === 'date') {
        if (backendValue && backendValue !== "NONE" && backendValue.includes('-')) {
          const parts = backendValue.split('-');
          if (parts.length === 3) {
            // Convert DD-MM-YYYY to YYYY-MM-DD for HTML date input
            const [day, month, year] = parts;
            mappedData[field.id] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else {
            mappedData[field.id] = '';
          }
        } else {
          mappedData[field.id] = '';
        }
      } 
      // Handle other fields
      else {
        mappedData[field.id] = backendValue && backendValue !== "NONE" ? backendValue : '';
      }
    });
    
    console.log('Final mapped data:', mappedData);
    return mappedData;
  };
  const handleFormSubmit = async (formData: Record<string, any>) => {
    if (!currentFile || !classifiedType) return;

    const document: DocumentRecord = {
      id: uuidv4(),
      caseId: `AP-${Date.now().toString().slice(-6)}`,
      type: classifiedType,
      fields: formData,
      originalImage: currentFile.preview,
      stampImage: stampImage,
      signatureImage: signatureImage,
      status: 'validated',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Saving document:', document);

    try {
      // Save to database
      const response = await databaseService.saveDocument(document);
      console.log('Save response:', response);
      
      if (response.success) {
        console.log('✅ Document saved successfully');
        // Call the callback to update UI
        onDocumentProcessed(document);
        
        // Also save the result as JSON on the backend
        try {
          await fetch('http://localhost:5000/save-result-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(document)
          });
          console.log('✅ Result JSON saved on backend');
        } catch (jsonErr) {
          console.error('❌ Failed to save result JSON:', jsonErr);
        }
        
        // Reset state
        setCurrentFile(null);
        setClassifiedType(null);
        setExtractedFields({});
        setStampImage('');
        setSignatureImage('');
        setSavedImagePath('');
        setCurrentImageIndex(0);
        setImageUrls([]);
        setIsPdf(false);
      } else {
        console.error('❌ Failed to save document:', response.error);
        alert(`Failed to save document: ${response.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving document:', error);
      alert(`Error saving document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getLetterTypeName = (type: DocumentType): string => {
    const template = documentTemplates.find(t => t.type === type);
    return template?.name || type;
  };

  const nextImage = () => {
    if (currentImageIndex < imageUrls.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
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
              {processing === file.id ? 'Processing...' : 'Start Processing'}
            </button>
          </div>
        </div>
      ))}

      {currentFile && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">
            Document Analysis Results
            {classifiedType && (
              <span className="ml-2 text-sm text-blue-600">
                (Classified as: {getLetterTypeName(classifiedType)})
              </span>
            )}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Division - Images */}
            <div className="space-y-4">
              {/* Original Image with Navigation for PDFs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-700">
                    {isPdf ? `Document Page ${currentImageIndex + 1} of ${imageUrls.length}` : 'Original Document'}
                  </h4>
                  {isPdf && imageUrls.length > 1 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                        className="px-2 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={nextImage}
                        disabled={currentImageIndex === imageUrls.length - 1}
                        className="px-2 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
                <img
                  src={imageUrls[currentImageIndex] || currentFile.preview}
                  alt={`Document Page ${currentImageIndex + 1}`}
                  className="w-full border rounded-lg shadow-sm"
                />
              </div>
              
              {/* Detected Stamp and Signature */}
              <div className="grid grid-cols-2 gap-4">
                {/* Stamp */}
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">Detected Stamp</h4>
                  {stampImage ? (
                    <img
                      src={stampImage}
                      alt="Detected Stamp"
                      className="w-full border rounded-lg shadow-sm"
                      onError={(e) => console.error('Stamp image failed to load:', e)}
                      onLoad={() => console.log('Stamp image loaded successfully')}
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                      <p className="text-sm">No stamp detected</p>
                    </div>
                  )}
                </div>
                
                {/* Signature */}
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">Detected Signature</h4>
                  {signatureImage ? (
                    <img
                      src={signatureImage}
                      alt="Detected Signature"
                      className="w-full border rounded-lg shadow-sm"
                      onError={(e) => console.error('Signature image failed to load:', e)}
                      onLoad={() => console.log('Signature image loaded successfully')}
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                      <p className="text-sm">No signature detected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Division - Form Fields */}
            <div>
              {classifiedType ? (
                <DocumentForm
                  type={classifiedType}
                  initialData={extractedFields}
                  onSubmit={handleFormSubmit}
                  hasStamp={!!stampImage}
                  hasSignature={!!signatureImage}
                />
              ) : processing ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Processing Document...</p>
                  <p className="text-sm mt-2">Analyzing document structure and extracting fields</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                  <p>Ready to process document</p>
                  <p className="text-sm mt-2">Click "Start Processing" to begin analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDocumentProcessor;