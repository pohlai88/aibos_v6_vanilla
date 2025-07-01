import React from 'react';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'white';
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
  status?: 'loading' | 'success' | 'error';
  overlay?: boolean;
  fullScreen?: boolean;
  className?: string;
  'aria-label'?: string;
}

// ============================================================================
// ENHANCED LOADING SPINNER COMPONENT
// ============================================================================

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  variant = 'spinner',
  status = 'loading',
  overlay = false,
  fullScreen = false,
  className = '',
  'aria-label': ariaLabel
}) => {
  
  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  // Color classes
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    error: 'text-red-600',
    white: 'text-white'
  };

  // Status-specific colors
  const statusColors = {
    loading: colorClasses[color],
    success: 'text-green-600',
    error: 'text-red-600'
  };

  // Status icons
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <svg className={`${sizeClasses[size]} ${statusColors[status]}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${sizeClasses[size]} ${statusColors[status]}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Spinner variants
  const getSpinnerContent = () => {
    if (status !== 'loading') {
      return getStatusIcon();
    }

    switch (variant) {
      case 'dots':
        return (
          <div className={`${sizeClasses[size]} flex space-x-1`}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} rounded-full ${statusColors[status]} animate-pulse`} />
        );
      
      default: // spinner
        return (
          <svg 
            className={`${sizeClasses[size]} ${statusColors[status]} animate-spin`} 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
    }
  };

  // Status messages for screen readers
  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return text || 'Operation completed successfully';
      case 'error':
        return text || 'An error occurred';
      default:
        return text || 'Loading...';
    }
  };

  // Accessibility attributes
  const accessibilityProps = {
    role: 'status' as const,
    'aria-live': (status === 'loading' ? 'polite' : 'assertive') as 'polite' | 'assertive',
    'aria-label': ariaLabel || getStatusMessage()
  };

  const spinnerContent = (
    <div 
      className={`flex flex-col items-center justify-center space-y-2 ${className}`}
      {...accessibilityProps}
    >
      {getSpinnerContent()}
      {text && (
        <p className={`text-sm ${statusColors[status]}`}>
          {text}
        </p>
      )}
    </div>
  );

  // Overlay wrapper
  if (overlay) {
    return (
      <div className={`
        fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50
        ${fullScreen ? 'w-screen h-screen' : ''}
      `}>
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

export const SuccessSpinner: React.FC<Omit<LoadingSpinnerProps, 'status'>> = (props) => (
  <LoadingSpinner {...props} status="success" />
);

export const ErrorSpinner: React.FC<Omit<LoadingSpinnerProps, 'status'>> = (props) => (
  <LoadingSpinner {...props} status="error" />
);

export const ButtonSpinner: React.FC<Omit<LoadingSpinnerProps, 'size' | 'overlay'>> = (props) => (
  <LoadingSpinner {...props} size="sm" overlay={false} />
);

export default LoadingSpinner; 