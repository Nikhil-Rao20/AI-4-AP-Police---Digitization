import React, { useState, useEffect } from 'react';
import { DocumentType } from '../../types';
import { documentTemplates } from '../../data/templates';
import { validateDocument } from '../../services/validationService';

interface DocumentFormProps {
  type: DocumentType;
  initialData: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  hasStamp?: boolean;
  hasSignature?: boolean;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ 
  type, 
  initialData, 
  onSubmit, 
  hasStamp = false, 
  hasSignature = false 
}) => {
  const template = documentTemplates.find(t => t.type === type);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<{
    status: 'Approved' | 'Disapproved';
    errors: Record<string, string>;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    console.log('DocumentForm - initialData changed:', initialData);
    setFormData(initialData);
    // Clear validation result when data changes
    setValidationResult(null);
  }, [initialData]);

  console.log('DocumentForm - type:', type);
  console.log('DocumentForm - initialData:', initialData);
  console.log('DocumentForm - template:', template);
  console.log('DocumentForm - formData:', formData);
  console.log('DocumentForm - hasStamp:', hasStamp);
  console.log('DocumentForm - hasSignature:', hasSignature);

  if (!template) return null;

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
    // Clear validation result when user makes changes
    setValidationResult(null);
  };

  const runValidation = () => {
    setIsValidating(true);
    
    // Add stamp and signature data to form data
    const dataWithValidation = {
      ...formData,
      Stamp: hasStamp,
      Signatures: hasSignature,
      Signature: hasSignature // For some document types
    };

    // Run comprehensive validation
    const result = validateDocument(dataWithValidation, type, hasStamp, hasSignature);
    setValidationResult(result);
    setIsValidating(false);
    
    console.log('Validation result:', result);
    return result.status === 'Approved';
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    template.fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }

      if (field.validation && formData[field.id]) {
        const value = formData[field.id];
        
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            newErrors[field.id] = `${field.label} format is invalid`;
          }
        }

        if (field.validation.minLength && value.length < field.validation.minLength) {
          newErrors[field.id] = `${field.label} must be at least ${field.validation.minLength} characters`;
        }

        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          newErrors[field.id] = `${field.label} must not exceed ${field.validation.maxLength} characters`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && runValidation()) {
      onSubmit(formData);
    }
  };

  const getFieldValidationStatus = (fieldId: string) => {
    if (!validationResult) return 'neutral';
    if (validationResult.errors[fieldId]) {
      return 'invalid';
    }
    // Only show valid if the overall status is Approved and no error for this field
    if (validationResult.status === 'Approved' && formData[fieldId] && formData[fieldId].toString().trim() !== '') {
      return 'valid';
    }
    return 'neutral';
  };

  const getFieldBorderClass = (fieldId: string, hasError: boolean) => {
    if (hasError) return 'border-red-500';
    
    const validationStatus = getFieldValidationStatus(fieldId);
    switch (validationStatus) {
      case 'valid':
        return 'border-green-500';
      case 'invalid':
        return 'border-red-500';
      default:
        return 'border-gray-300';
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.id] || '';
    const hasError = !!errors[field.id];
    const borderClass = getFieldBorderClass(field.id, hasError);
    const validationStatus = getFieldValidationStatus(field.id);

    const baseClasses = `w-full p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${borderClass}`;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={baseClasses}
            rows={3}
            placeholder={field.placeholder || field.label}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={baseClasses}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={baseClasses}
            placeholder={field.placeholder}
          />
        );

      case 'tel':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={baseClasses}
            placeholder={field.placeholder || field.label}
          />
        );

      default:
        return (
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className={baseClasses}
            placeholder={field.placeholder || field.label}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="font-medium text-lg mb-4">{template.name} - Validation Form</h4>
      
      {/* Validation Status Display */}
      {validationResult && (
        <div className={`p-4 rounded-md border ${
          validationResult.status === 'Approved' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-3 ${
              validationResult.status === 'Approved' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <div>
              <h5 className={`font-medium ${
                validationResult.status === 'Approved' ? 'text-green-800' : 'text-red-800'
              }`}>
                Status: {validationResult.status}
              </h5>
              {validationResult.status === 'Disapproved' && (
                <p className="text-red-600 text-sm mt-1">
                  {Object.keys(validationResult.errors).length} field(s) need attention
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stamp and Signature Validation */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={hasStamp}
            readOnly
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm font-medium text-gray-700">
            Stamp Valid
          </label>
          <div className={`ml-2 w-3 h-3 rounded-full ${
            hasStamp ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={hasSignature}
            readOnly
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm font-medium text-gray-700">
            Signature Valid
          </label>
          <div className={`ml-2 w-3 h-3 rounded-full ${
            hasSignature ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
        </div>
      </div>
      
      {template.fields.map((field) => {
        const hasError = !!errors[field.id];
        const validationStatus = getFieldValidationStatus(field.id);
        const validationError = validationResult?.errors[field.id];

        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
            
            {/* Error Messages */}
            {(errors[field.id] || validationError) && (
              <p className="text-red-500 text-sm mt-1">
                {errors[field.id] || validationError}
              </p>
            )}
            
            {/* Success Message */}
            {validationStatus === 'valid' && !errors[field.id] && !validationError && (
              <p className="text-green-500 text-sm mt-1">✓ Valid</p>
            )}
            
            {/* Help Text */}
            {field.placeholder && !errors[field.id] && !validationError && validationStatus !== 'valid' && (
              <p className="text-gray-500 text-xs mt-1">{field.placeholder}</p>
            )}
          </div>
        );
      })}

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={isValidating}
          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValidating ? 'Validating...' : 'Save Record'}
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default DocumentForm;