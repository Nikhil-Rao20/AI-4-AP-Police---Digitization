import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import FileUpload from './components/upload/FileUpload';
import EnhancedDocumentProcessor from './components/upload/EnhancedDocumentProcessor';
import SearchRecords from './components/search/SearchRecords';
import RecordsList from './components/database/RecordsList';
import AdminPanel from './components/admin/AdminPanel';
import RecordModal from './components/RecordModal';
import ExportData from './components/ExportData';
import Footer from './components/Footer';
import { DocumentRecord, UploadedFile } from './types';
import { databaseService } from './services/databaseService';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [records, setRecords] = useState<DocumentRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DocumentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load records from database on component mount
  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await databaseService.getAllDocuments();
      if (response.success && response.data) {
        setRecords(response.data.documents);
      } else {
        console.error('Failed to load records:', response.error);
      }
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleDocumentProcessed = async (document: DocumentRecord) => {
    try {
      const response = await databaseService.saveDocument(document);
      if (response.success) {
        // Reload records to get the updated list
        await loadRecords();
        setUploadedFiles(prev => prev.filter(f => f.id !== document.id));
        alert('Document saved successfully!');
      } else {
        alert(`Failed to save document: ${response.error}`);
      }
    } catch (error) {
      alert(`Error saving document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRecordSelect = (record: DocumentRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleRecordDelete = async (recordId: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        const response = await databaseService.deleteDocument(recordId);
        if (response.success) {
          await loadRecords(); // Reload records
          alert('Record deleted successfully!');
        } else {
          alert(`Failed to delete record: ${response.error}`);
        }
      } catch (error) {
        alert(`Error deleting record: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="space-y-6">
            <FileUpload onFilesUploaded={handleFilesUploaded} />
            <EnhancedDocumentProcessor
              files={uploadedFiles}
              onDocumentProcessed={handleDocumentProcessed}
            />
          </div>
        );
      
      case 'search':
        return (
          <SearchRecords
            records={records}
            onRecordSelect={handleRecordSelect}
          />
        );
      
      case 'database':
        return (
          <div className="space-y-6">
            <RecordsList
              records={records}
              onRecordSelect={handleRecordSelect}
              onRecordDelete={handleRecordDelete}
              loading={loading}
            />
            <ExportData />
          </div>
        );
      
      case 'admin':
        return <AdminPanel records={records} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {renderTabContent()}
      </main>

      <Footer />

      <RecordModal
        record={selectedRecord}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecord(null);
        }}
      />
    </div>
  );
}

export default App;