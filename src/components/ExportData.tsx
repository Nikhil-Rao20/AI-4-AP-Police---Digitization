import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Loader } from 'lucide-react';
import { databaseService } from '../services/databaseService';

const ExportData: React.FC = () => {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    setExporting(format);
    
    try {
      let response;
      let filename = '';
      
      switch (format) {
        case 'csv':
          response = await databaseService.exportToCSV();
          filename = `ap_police_documents_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'json':
          response = await databaseService.exportToJSON();
          filename = `ap_police_documents_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'excel':
          response = await databaseService.exportToExcel();
          filename = `ap_police_documents_${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
      }

      if (response.success && response.data) {
        databaseService.downloadFile(response.data, filename);
        alert(`${format.toUpperCase()} export completed successfully!`);
      } else {
        alert(`Export failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      format: 'csv' as const,
      label: 'CSV Format',
      description: 'Comma-separated values file for spreadsheet applications',
      icon: FileText,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      format: 'excel' as const,
      label: 'Excel Format',
      description: 'Microsoft Excel file with formatted data',
      icon: FileSpreadsheet,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      format: 'json' as const,
      label: 'JSON Format',
      description: 'JavaScript Object Notation for data interchange',
      icon: FileJson,
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
          <p className="text-sm text-gray-600 mt-1">
            Download all processed documents in your preferred format
          </p>
        </div>
        <Download className="h-6 w-6 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exportOptions.map((option) => {
          const IconComponent = option.icon;
          const isExporting = exporting === option.format;
          
          return (
            <div
              key={option.format}
              className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition-all duration-200 hover:border-gray-400 ${
                isExporting ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
              }`}
              onClick={() => !isExporting && handleExport(option.format)}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`p-3 rounded-full ${option.color} text-white`}>
                  {isExporting ? (
                    <Loader className="h-6 w-6 animate-spin" />
                  ) : (
                    <IconComponent className="h-6 w-6" />
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">
                    {option.label}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {option.description}
                  </p>
                </div>
                
                {isExporting && (
                  <div className="text-sm text-blue-600">
                    Exporting...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Export Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• CSV: Best for spreadsheet analysis and data processing</li>
          <li>• Excel: Includes formatting and multiple sheets for better presentation</li>
          <li>• JSON: Preserves all data structure and relationships</li>
          <li>• All exports include document metadata, extracted fields, and processing timestamps</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportData; 