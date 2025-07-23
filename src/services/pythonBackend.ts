import { ClassificationResult, FieldDetectionResult, StampDetectionResult, SignatureDetectionResult } from '../types';

// Mock Python backend service - replace with actual API calls
export class PythonBackendService {
  private static instance: PythonBackendService;
  private baseUrl: string = 'http://localhost:5000'; // Python Flask server URL

  private constructor() {}

  public static getInstance(): PythonBackendService {
    if (!PythonBackendService.instance) {
      PythonBackendService.instance = new PythonBackendService();
    }
    return PythonBackendService.instance;
  }

  // Classify the letter type
  async classifyLetter(saveResult: any): Promise<ClassificationResult> {
    try {
      // Handle both single images and PDFs
      const requestData = this.isPdfResult(saveResult) 
        ? { image_paths: saveResult.image_paths }
        : { image_path: saveResult };

      const response = await fetch(`${this.baseUrl}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Classification failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Classification error:', error);
      // Return mock data for development
      return {
        letterType: 'earned-leave',
        confidence: 0.85
      };
    }
  }

  // Detect fields from the image
  async detectFields(saveResult: any): Promise<FieldDetectionResult> {
    try {
      // Handle both single images and PDFs
      const requestData = this.isPdfResult(saveResult) 
        ? { image_paths: saveResult.image_paths }
        : { image_path: saveResult };

      const response = await fetch(`${this.baseUrl}/detect-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Field detection failed');
      }

      const result = await response.json();
      
      // Handle the new response structure with parsed_fields
      if (result.parsed_fields) {
        return {
          fields: result.parsed_fields
        };
      } else if (result.fields) {
        // Fallback to old structure
        return result;
      } else {
        console.warn('Unexpected response structure:', result);
        return {
          fields: {}
        };
      }
    } catch (error) {
      console.error('Field detection error:', error);
      // Return mock data for development
      return {
        fields: {}
      };
    }
  }

  // Detect stamp from the image
  async detectStamp(saveResult: any): Promise<StampDetectionResult> {
    try {
      // Handle both single images and PDFs
      const requestData = this.isPdfResult(saveResult) 
        ? { image_paths: saveResult.image_paths }
        : { image_path: saveResult };

      const response = await fetch(`${this.baseUrl}/detect-stamp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Stamp detection failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Stamp detection error:', error);
      // Return mock data for development
      return {
        stampImagePath: ''
      };
    }
  }

  // Detect signature from the image
  async detectSignature(saveResult: any): Promise<SignatureDetectionResult> {
    try {
      // Handle both single images and PDFs
      const requestData = this.isPdfResult(saveResult) 
        ? { image_paths: saveResult.image_paths }
        : { image_path: saveResult };

      const response = await fetch(`${this.baseUrl}/detect-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Signature detection failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Signature detection error:', error);
      // Return mock data for development
      return {
        signatureImagePath: ''
      };
    }
  }

  // Helper method to check if result is from PDF
  private isPdfResult(result: any): boolean {
    return typeof result === 'object' && result.is_pdf === true;
  }

  // Save uploaded image to server
  async saveImage(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${this.baseUrl}/save-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image save failed');
      }

      const result = await response.json();
      
      // Return the full result for PDFs, or just the path for single images
      if (result.is_pdf) {
        return {
          image_path: result.image_path,
          image_url: result.image_url,
          is_pdf: true,
          image_paths: result.image_paths,
          image_urls: result.image_urls,
          page_count: result.page_count
        };
      } else {
        return result.image_path;
      }
    } catch (error) {
      console.error('Image save error:', error);
      // Return mock path for development
      return `/uploads/${file.name}`;
    }
  }
}

export const pythonBackendService = PythonBackendService.getInstance(); 