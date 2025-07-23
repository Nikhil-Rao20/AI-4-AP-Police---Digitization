import { DocumentRecord } from '../types';

const API_BASE_URL = 'http://localhost:5000';

export interface DatabaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Statistics {
  total_documents: number;
  documents_by_type: Record<string, number>;
  documents_by_status: Record<string, number>;
  recent_documents: number;
}

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<DatabaseResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Document operations
  async getAllDocuments(): Promise<DatabaseResponse<{ documents: DocumentRecord[] }>> {
    return this.makeRequest<{ documents: DocumentRecord[] }>('/documents');
  }

  async getDocumentById(id: string): Promise<DatabaseResponse<{ document: DocumentRecord }>> {
    return this.makeRequest<{ document: DocumentRecord }>(`/documents/${id}`);
  }

  async saveDocument(document: DocumentRecord): Promise<DatabaseResponse<{ message: string; id: string }>> {
    return this.makeRequest<{ message: string; id: string }>('/documents', {
      method: 'POST',
      body: JSON.stringify(document),
    });
  }

  async deleteDocument(id: string): Promise<DatabaseResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Search operations
  async searchDocuments(query: string, type?: string): Promise<DatabaseResponse<{ documents: DocumentRecord[] }>> {
    const params = new URLSearchParams({ q: query });
    if (type) {
      params.append('type', type);
    }
    return this.makeRequest<{ documents: DocumentRecord[] }>(`/search?${params.toString()}`);
  }

  // Statistics
  async getStatistics(): Promise<DatabaseResponse<Statistics>> {
    return this.makeRequest<Statistics>('/statistics');
  }

  // Export operations
  async exportToCSV(): Promise<DatabaseResponse<Blob>> {
    try {
      const response = await fetch(`${API_BASE_URL}/export/csv`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      const blob = await response.blob();
      return {
        success: true,
        data: blob,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async exportToJSON(): Promise<DatabaseResponse<Blob>> {
    try {
      const response = await fetch(`${API_BASE_URL}/export/json`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      const blob = await response.blob();
      return {
        success: true,
        data: blob,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async exportToExcel(): Promise<DatabaseResponse<Blob>> {
    try {
      const response = await fetch(`${API_BASE_URL}/export/excel`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      const blob = await response.blob();
      return {
        success: true,
        data: blob,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Utility function to download file
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const databaseService = DatabaseService.getInstance(); 