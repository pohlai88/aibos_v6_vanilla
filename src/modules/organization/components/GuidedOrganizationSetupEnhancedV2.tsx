import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGuidance, TourProgressBar, TourFeedback, AnimatedPointer, useFocusTrap } from '../../../components/OnboardingGuidanceEnhanced';
import FormField from '../../../components/ui/FormField';
import { LoadingSpinner, ButtonLoadingSpinner } from '../../../components/ui/LoadingSpinner';
import useStepNavigation from '../../../hooks/useStepNavigation';
import { getUserTimezone, getTimezoneOptions } from '../../../utils/timezoneUtils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface OrganizationData {
  name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  size: string;
  timezone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  skipped?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

// ============================================================================
// ENHANCED GUIDED ORGANIZATION SETUP V2
// ============================================================================

export const GuidedOrganizationSetupEnhancedV2: React.FC = () => {
  const { startTour, markTourComplete, submitFeedback } = useGuidance();
  
  // Form state with proper defaults
  const [organization, setOrganization] = useState<OrganizationData>({
    name: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    size: '',
    timezone: getUserTimezone(),
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  // Setup steps
  const initialSteps: SetupStep[] = useMemo(() => [
    { id: 'welcome', title: 'Welcome', description: 'Get started with AIBOS', required: true, completed: false },
    { id: 'basic', title: 'Basic Information', description: 'Organization details', required: true, completed: false },
    { id: 'advanced', title: 'Advanced Settings', description: 'Optional configuration', required: false, completed: false },
    { id: 'complete', title: 'Complete', description: 'You\'re all set!', required: true, completed: false }
  ], []);

  // Use custom step navigation hook
  const {
    currentStep,
    steps,
    isFirstStep,
    isLastStep,
    progress,
    nextStep,
    previousStep,
    skipStep,
    markStepComplete,
    canProceed,
    completedSteps,
    totalSteps
  } = useStepNavigation({
    steps: initialSteps,
    onStepChange: useCallback((stepIndex: number) => {
      // Analytics tracking
      console.log(`Step changed to: ${stepIndex}`);
    }, []),
    onStepComplete: useCallback((stepId: string) => {
      // Analytics tracking
      console.log(`Step completed: ${stepId}`);
    }, []),
    onStepSkip: useCallback((stepId: string) => {
      // Analytics tracking
      console.log(`Step skipped: ${stepId}`);
    }, [])
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPointer, setShowPointer] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  // Refs for field targeting
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const websiteRef = useRef<HTMLInputElement>(null);

  // Focus trap for modals
  const feedbackTrapRef = useFocusTrap(showFeedback);
  const successTrapRef = useFocusTrap(showSuccess);

  // Auto-start tour on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startTour('organization-setup');
    }, 1000);
    return () => clearTimeout(timer);
  }, [startTour]);

  // Handle field focus for tour integration with enhanced highlighting
  const handleFieldFocus = useCallback((fieldId: string) => {
    setActiveField(fieldId);
    setShowPointer(true);
    
    // Add visual highlight to the field
    const field = document.getElementById(fieldId);
    if (field) {
      field.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
    }
  }, []);

  const handleFieldBlur = useCallback(() => {
    setActiveField(null);
    setShowPointer(false);
    
    // Remove visual highlight
    const field = document.getElementById(activeField || '');
    if (field) {
      field.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
    }
  }, [activeField]);

  // Enhanced validation with better error messages
  const validateStep = useCallback((stepId: string): boolean => {
    const newErrors: FormErrors = {};

    switch (stepId) {
      case 'basic':
        if (!organization.name.trim()) {
          newErrors.name = 'Organization name is required';
        } else if (organization.name.trim().length < 2) {
          newErrors.name = 'Organization name must be at least 2 characters';
        }
        
        if (!organization.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organization.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;
      
      case 'advanced':
        if (organization.website && !/^https?:\/\/.+/.test(organization.website)) {
          newErrors.website = 'Please enter a valid website URL (include http:// or https://)';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [organization]);

  // Enhanced form submission with robust error handling
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(organization)
      });

      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        // Fallback to text if JSON parsing fails
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }

      if (!response.ok) {
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Mark tour as complete
      markTourComplete('organization-setup');
      
      // Show success and feedback
      setShowSuccess(true);
      setTimeout(() => setShowFeedback(true), 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ submit: errorMessage });
      
      // Analytics tracking for errors
      console.error('Organization creation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [organization, markTourComplete]);

  // Handle feedback submission
  const handleFeedbackSubmit = useCallback((rating: number, comment?: string) => {
    submitFeedback('organization-setup', rating, comment);
    setShowFeedback(false);
    
    // Analytics tracking
    console.log('Feedback submitted:', { rating, comment });
  }, [submitFeedback]);

  // Handle keyboard navigation (Enter key to advance)
  const handleKeyPress = useCallback((e: React.KeyboardEvent, stepId: string) => {
    if (e.key === 'Enter' && validateStep(stepId)) {
      markStepComplete(stepId);
      nextStep();
    }
  }, [validateStep, markStepComplete, nextStep]);

  // Memoized step rendering for performance
  const renderStep = useMemo(() => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to AIBOS
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Let's set up your organization in just a few minutes. We'll guide you through each step to get you up and running quickly.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  markStepComplete('welcome');
                  nextStep();
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Get started with organization setup"
              >
                Get Started
              </button>
            </div>
          </div>
        );

      case 'basic':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
              <p className="text-gray-600">Tell us about your organization</p>
            </div>
            
            <div className="space-y-6">
              <FormField
                ref={nameRef}
                id="organization-name"
                label="Organization Name"
                type="text"
                value={organization.name}
                onChange={(value) => setOrganization(prev => ({ ...prev, name: value }))}
                onFocus={() => handleFieldFocus('organization-name')}
                onBlur={handleFieldBlur}
                onKeyPress={(e) => handleKeyPress(e, 'basic')}
                placeholder="Enter your organization name"
                required={true}
                error={errors.name}
                autoComplete="organization"
              />

              <FormField
                ref={emailRef}
                id="organization-email"
                label="Primary Email"
                type="email"
                value={organization.email}
                onChange={(value) => setOrganization(prev => ({ ...prev, email: value }))}
                onFocus={() => handleFieldFocus('organization-email')}
                onBlur={handleFieldBlur}
                onKeyPress={(e) => handleKeyPress(e, 'basic')}
                placeholder="contact@yourcompany.com"
                required={true}
                error={errors.email}
                autoComplete="email"
              />

              <FormField
                ref={phoneRef}
                id="organization-phone"
                label="Phone Number"
                type="tel"
                value={organization.phone}
                onChange={(value) => setOrganization(prev => ({ ...prev, phone: value }))}
                onFocus={() => handleFieldFocus('organization-phone')}
                onBlur={handleFieldBlur}
                placeholder="+1 (555) 123-4567"
                autoComplete="tel"
              />

              <FormField
                ref={websiteRef}
                id="organization-website"
                label="Website"
                type="url"
                value={organization.website}
                onChange={(value) => setOrganization(prev => ({ ...prev, website: value }))}
                onFocus={() => handleFieldFocus('organization-website')}
                onBlur={handleFieldBlur}
                placeholder="https://yourcompany.com"
                error={errors.website}
                autoComplete="url"
              />
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Settings</h2>
              <p className="text-gray-600">Optional configuration for better experience</p>
            </div>
            
            <div className="space-y-6">
              <FormField
                id="organization-industry"
                label="Industry"
                type="select"
                value={organization.industry}
                onChange={(value) => setOrganization(prev => ({ ...prev, industry: value }))}
                options={[
                  { value: 'technology', label: 'Technology' },
                  { value: 'healthcare', label: 'Healthcare' },
                  { value: 'finance', label: 'Finance' },
                  { value: 'education', label: 'Education' },
                  { value: 'retail', label: 'Retail' },
                  { value: 'manufacturing', label: 'Manufacturing' },
                  { value: 'other', label: 'Other' }
                ]}
              />

              <FormField
                id="organization-size"
                label="Company Size"
                type="select"
                value={organization.size}
                onChange={(value) => setOrganization(prev => ({ ...prev, size: value }))}
                options={[
                  { value: '1-10', label: '1-10 employees' },
                  { value: '11-50', label: '11-50 employees' },
                  { value: '51-200', label: '51-200 employees' },
                  { value: '201-1000', label: '201-1000 employees' },
                  { value: '1000+', label: '1000+ employees' }
                ]}
              />

              <FormField
                id="organization-timezone"
                label="Timezone"
                type="select"
                value={organization.timezone}
                onChange={(value) => setOrganization(prev => ({ ...prev, timezone: value }))}
                options={getTimezoneOptions()}
              />
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              You're All Set!
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Your organization has been created successfully. You can now start using AIBOS to manage your business operations.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={isSubmitting ? 'Creating organization...' : 'Complete setup'}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <ButtonLoadingSpinner size="sm" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
            {errors.submit && (
              <p className="mt-4 text-sm text-red-600" role="alert">{errors.submit}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  }, [currentStep, steps, organization, errors, isSubmitting, handleFieldFocus, handleFieldBlur, handleKeyPress, handleSubmit, markStepComplete, nextStep]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Organization Setup</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          
          {/* Desktop Progress Bar */}
          <div className="hidden md:block">
            <TourProgressBar current={currentStep} total={totalSteps} />
          </div>
          
          {/* Mobile Progress Bar */}
          <div className="md:hidden">
            <div className="flex items-center space-x-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex-1 h-2 rounded-full ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {renderStep}
          
          {/* Navigation */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={previousStep}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Go to previous step"
              >
                Previous
              </button>
              
              <div className="flex space-x-3">
                {!steps[currentStep].required && (
                  <button
                    onClick={skipStep}
                    className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Skip this step"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={() => {
                    if (validateStep(steps[currentStep].id)) {
                      markStepComplete(steps[currentStep].id);
                      nextStep();
                    }
                  }}
                  disabled={!canProceed}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Go to next step"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animated Pointer */}
      {showPointer && activeField && (
        <AnimatedPointer
          targetSelector={`#${activeField}`}
          visible={showPointer}
          onComplete={() => setShowPointer(false)}
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div 
            ref={successTrapRef}
            className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6 text-center"
            role="dialog"
            aria-labelledby="success-title"
            aria-describedby="success-description"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 id="success-title" className="text-xl font-semibold text-gray-900 mb-2">Setup Complete!</h3>
            <p id="success-description" className="text-gray-600 mb-6">
              Your organization has been created successfully. You'll be redirected to your dashboard shortly.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Go to dashboard"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div 
            ref={feedbackTrapRef}
            className="bg-white rounded-lg shadow-xl max-w-md mx-4"
            role="dialog"
            aria-labelledby="feedback-title"
          >
            <TourFeedback
              tourId="organization-setup"
              onSubmit={handleFeedbackSubmit}
              onSkip={() => setShowFeedback(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidedOrganizationSetupEnhancedV2; 