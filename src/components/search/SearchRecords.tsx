import React, { useState } from 'react';
import { Search, Filter, Calendar, User, FileText } from 'lucide-react';
import { DocumentRecord, DocumentType } from '../../types';

interface SearchRecordsProps {
  records: DocumentRecord[];
  onRecordSelect: (record: DocumentRecord) => void;
}

const SearchRecords: React.FC<SearchRecordsProps> = ({ records, onRecordSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredRecords = records.filter(record => {
    const matchesSearch = !searchTerm || 
      record.fields.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.fields.rcNo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !selectedType || record.type === selectedType;

    const matchesDateFrom = !dateFrom || new Date(record.createdAt) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(record.createdAt) <= new Date(dateTo);

    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Search Records
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Term
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, Case ID, RC No..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType | '')}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="medical-leave">Medical Leave</option>
              <option value="reward-letter">Reward Letter</option>
              <option value="probation-letter">Probation Letter</option>
              <option value="punishment-letter">Punishment Letter</option>
              <option value="earned-leave">Earned Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h4 className="text-lg font-semibold">
            Search Results ({filteredRecords.length} records found)
          </h4>
        </div>
        
        <div className="divide-y">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No records found matching your criteria.</p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                onClick={() => onRecordSelect(record)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      record.status === 'approved' ? 'bg-green-500' :
                      record.status === 'validated' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{record.fields.name || 'Unknown'}</span>
                        <span className="text-sm text-gray-500">({record.fields.rank || 'N/A'})</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Filter className="h-3 w-3 mr-1" />
                          {record.type.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(record.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-600">{record.caseId}</div>
                    <div className={`text-xs px-2 py-1 rounded-full capitalize ${
                      record.status === 'approved' ? 'bg-green-100 text-green-800' :
                      record.status === 'validated' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {record.status}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchRecords;