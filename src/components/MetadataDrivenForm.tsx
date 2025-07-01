import React, { useState, useEffect } from 'react';
import type { 
  MetadataDrivenForm as MetadataDrivenFormType, 
  MetadataDrivenFormField, 
  FieldMetadata
} from '../types/enhanced';

interface MetadataDrivenFormProps {
  entityType: 'employee' | 'organization' | 'department';
  organizationId: string;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const MetadataDrivenForm: React.FC<MetadataDrivenFormProps> = ({
  entityType,
  organizationId,
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const [form, setForm] = useState<MetadataDrivenFormType>({
    entity_type: entityType,
    fields: [],
    is_loading: true,
    errors: {}
  });

  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  // Load metadata fields
  useEffect(() => {
    loadMetadataFields();
  }, [entityType, organizationId]);

  const loadMetadataFields = async () => {
    try {
      setForm(prev => ({ ...prev, is_loading: true }));
      
      // TODO: Replace with actual API call
      const response = await fetch(`/api/metadata/${organizationId}/${entityType}`);
      const metadata: { fields: FieldMetadata[] } = await response.json();
      
      // Sort fields by display_order
      const sortedFields = metadata.fields
        .filter(field => !field.is_hidden)
        .sort((a, b) => a.display_order - b.display_order)
        .map(field => ({
          ...field,
          value: initialData[field.field_name] || '',
          error: ''
        }));

      setForm({
        entity_type: entityType,
        fields: sortedFields,
        is_loading: false,
        errors: {}
      });
    } catch (error) {
      console.error('Failed to load metadata fields:', error);
      setForm(prev => ({ 
        ...prev, 
        is_loading: false, 
        errors: { general: 'Failed to load form fields' }
      }));
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear field error when user starts typing
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.field_name === fieldName 
          ? { ...field, value, error: '' }
          : field
      )
    }));
  };

  const validateField = (field: MetadataDrivenFormField, value: any): string => {
    const rules = field.validation_rules;
    if (!rules) return '';

    // Required validation
    if (field.is_required && (!value || value.toString().trim() === '')) {
      return `${field.field_label} is required`;
    }

    // Length validation
    if (value && rules.minLength && value.toString().length < rules.minLength) {
      return `${field.field_label} must be at least ${rules.minLength} characters`;
    }

    if (value && rules.maxLength && value.toString().length > rules.maxLength) {
      return `${field.field_label} must be no more than ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (value && rules.pattern) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value.toString())) {
        return rules.custom || `${field.field_label} format is invalid`;
      }
    }

    // Number validation
    if (field.field_type === 'number' && value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return `${field.field_label} must be a valid number`;
      }
      if (rules.min !== undefined && numValue < rules.min) {
        return `${field.field_label} must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && numValue > rules.max) {
        return `${field.field_label} must be no more than ${rules.max}`;
      }
    }

    // Email validation
    if (field.field_type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return `${field.field_label} must be a valid email address`;
      }
    }

    return '';
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    form.fields.forEach(field => {
      const error = validateField(field, formData[field.field_name]);
      if (error) {
        errors[field.field_name] = error;
        isValid = false;
      }
    });

    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(field => ({
        ...field,
        error: errors[field.field_name] || ''
      })),
      errors
    }));

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field: MetadataDrivenFormField) => {
    const commonProps = {
      id: field.field_name,
      name: field.field_name,
      value: formData[field.field_name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
        handleFieldChange(field.field_name, e.target.value),
      className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        field.error ? 'border-red-500' : 'border-gray-300'
      }`,
      required: field.is_required,
      disabled: isSubmitting
    };

    switch (field.field_type) {
      case 'text':
        return (
          <input
            {...commonProps}
            type="text"
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        );

      case 'email':
        return (
          <input
            {...commonProps}
            type="email"
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        );

      case 'phone':
        return (
          <input
            {...commonProps}
            type="tel"
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        );

      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
          />
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={field.validation_rules?.min_value}
            max={field.validation_rules?.max_value}
            step="any"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              {...commonProps}
              type="checkbox"
              checked={formData[field.field_name] || false}
              onChange={(e) => handleFieldChange(field.field_name, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={field.field_name} className="ml-2 text-sm text-gray-700">
              {field.field_label}
            </label>
          </div>
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {field.field_label.toLowerCase()}</option>
            {field.field_options?.map((option, index) => (
              <option key={index} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <select {...commonProps} multiple>
            {field.field_options?.map((option, index) => (
              <option key={index} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        );

      default:
        return (
          <input
            {...commonProps}
            type="text"
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        );
    }
  };

  if (form.is_loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading form fields...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {form.errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{form.errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {form.fields.map((field) => (
          <div key={field.field_name} className={field.field_type === 'boolean' ? 'col-span-2' : ''}>
            {field.field_type !== 'boolean' && (
              <label htmlFor={field.field_name} className="block text-sm font-medium text-gray-700 mb-1">
                {field.field_label}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            
            {renderField(field)}
            
            {field.error && (
              <p className="mt-1 text-sm text-red-600">{field.error}</p>
            )}
            
            {field.validation_rules?.custom_message && !field.error && (
              <p className="mt-1 text-sm text-gray-500">{field.validation_rules.custom_message}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default MetadataDrivenForm; 