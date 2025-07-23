import React, { useState } from 'react';
import { Settings, Users, BarChart3, FileText, Plus, Edit } from 'lucide-react';
import { DocumentRecord, DocumentTemplate } from '../../types';
import { documentTemplates } from '../../data/templates';

interface AdminPanelProps {
  records: DocumentRecord[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ records }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'templates' | 'users'>('overview');
  const [templates, setTemplates] = useState<DocumentTemplate[]>(documentTemplates);

  const getStatistics = () => {
    const total = records.length;
    const byType = records.reduce((acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byStatus = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, byType, byStatus };
  };

  const stats = getStatistics();

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-blue-600">Total Records</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-900">{stats.byStatus.approved || 0}</div>
              <div className="text-green-600">Approved</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-yellow-900">{stats.byStatus.validated || 0}</div>
              <div className="text-yellow-600">Pending Approval</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h4 className="text-lg font-semibold mb-4">Records by Type</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{type.replace('-', ' ')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h4 className="text-lg font-semibold mb-4">System Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Version:</strong> 1.0.0
          </div>
          <div>
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </div>
          <div>
            <strong>OCR Accuracy:</strong> ~85% (Estimated)
          </div>
          <div>
            <strong>Storage:</strong> Local Browser Storage
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Document Templates</h4>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.type} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start mb-4">
              <h5 className="font-semibold">{template.name}</h5>
              <button className="text-blue-600 hover:text-blue-800">
                <Edit className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {template.fields.length} fields configured
            </div>
            <div className="space-y-2">
              {template.fields.slice(0, 3).map((field) => (
                <div key={field.id} className="text-xs bg-gray-50 px-2 py-1 rounded">
                  {field.label} ({field.type})
                </div>
              ))}
              {template.fields.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{template.fields.length - 3} more fields
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h4 className="text-lg font-semibold mb-4">User Management</h4>
      <div className="text-center py-8 text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>User management features would be implemented here.</p>
        <p className="text-sm">This would include role-based access control, audit logs, etc.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Admin Panel
        </h3>
        
        <div className="flex space-x-4 border-b">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'users', label: 'Users', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 font-medium text-sm ${
                  activeSection === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeSection === 'overview' && renderOverview()}
      {activeSection === 'templates' && renderTemplates()}
      {activeSection === 'users' && renderUsers()}
    </div>
  );
};

export default AdminPanel;