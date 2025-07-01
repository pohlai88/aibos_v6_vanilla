import React, { forwardRef } from 'react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'select' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  rows?: number;
  autoComplete?: string;
  description?: string;
  tooltip?: string;
  ariaDescribedBy?: string;
}

// ============================================================================
// ENHANCED REUSABLE FORM FIELD COMPONENT
// ============================================================================

export const FormField = forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, FormFieldProps>(
  (
    {
      id,
      label,
      type = 'text',
      value,
      onChange,
      onFocus,
      onBlur,
      onKeyPress,
      placeholder,
      required = false,
      error,
      disabled = false,
      className = '',
      options = [],
      rows = 3,
      autoComplete,
      description,
      tooltip,
      ariaDescribedBy
    },
    ref
  ) => {
    const baseInputClasses = `
      w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
      transition-colors duration-200
      ${error ? 'border-red-300' : 'border-gray-300'}
      ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
      ${className}
    `;

    // Build aria-describedby for accessibility
    const describedBy = [
      error && `${id}-error`,
      description && `${id}-description`,
      ariaDescribedBy
    ].filter(Boolean).join(' ');

    const renderInput = () => {
      const commonProps = {
        id,
        ref: ref as any,
        value,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
          onChange(e.target.value),
        onFocus,
        onBlur,
        onKeyPress,
        placeholder,
        disabled,
        autoComplete,
        className: baseInputClasses,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required
      };

      switch (type) {
        case 'select':
          return (
            <select {...commonProps}>
              <option value="" disabled>
                Select {label.toLowerCase()}
              </option>
              {options.map(option => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'textarea':
          return (
            <textarea
              {...commonProps}
              rows={rows}
              ref={ref as React.Ref<HTMLTextAreaElement>}
            />
          );

        default:
          return (
            <input
              {...commonProps}
              type={type}
              ref={ref as React.Ref<HTMLInputElement>}
            />
          );
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label 
            htmlFor={id} 
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
          
          {tooltip && (
            <div className="relative group">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                aria-label={`Help for ${label}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Tooltip */}
              <div className="absolute right-0 top-6 w-64 p-2 bg-gray-900 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                {tooltip}
                <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
              </div>
            </div>
          )}
        </div>
        
        {renderInput()}
        
        {description && (
          <p 
            id={`${id}-description`}
            className="text-sm text-gray-500"
          >
            {description}
          </p>
        )}
        
        {error && (
          <p 
            id={`${id}-error`}
            className="text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField; 