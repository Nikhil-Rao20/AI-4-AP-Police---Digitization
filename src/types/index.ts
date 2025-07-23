export interface DocumentRecord {
  id: string;
  caseId: string;
  type: DocumentType;
  fields: Record<string, any>;
  originalImage?: string;
  extractedText?: string;
  stampImage?: string;
  signatureImage?: string;
  status: 'pending' | 'validated' | 'approved';
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentType = 'earned-leave' | 'medical-leave' | 'reward-letter' | 'probation-letter' | 'punishment-letter';

export interface DocumentTemplate {
  type: DocumentType;
  name: string;
  fields: TemplateField[];
}

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select' | 'textarea' | 'tel';
  required: boolean;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  placeholder?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  type: DocumentType | null;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  extractedText?: string;
  error?: string;
  stampImage?: string;
  signatureImage?: string;
  isPdf?: boolean;
  imageUrls?: string[];
  pageCount?: number;
}

export interface ClassificationResult {
  letterType: DocumentType;
  confidence: number;
}

export interface FieldDetectionResult {
  fields: Record<string, any>;
}

export interface StampDetectionResult {
  stampImagePath: string;
}

export interface SignatureDetectionResult {
  signatureImagePath: string;
}

export interface ValidationResult {
  status: 'Approved' | 'Disapproved';
  errors: Record<string, string>;
}