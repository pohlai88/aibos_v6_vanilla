import React, { useState, useEffect, useRef } from 'react';
import { useGuidance, TourProgressBar, TourFeedback, AnimatedPointer } from '../../../components/OnboardingGuidanceEnhanced';
import { getTimezoneOptions } from '../../../utils/timezoneUtils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface OrganizationData {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  size?: string;
  timezone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  teamMembers?: Array<{
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  }>;
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
// ENHANCED GUIDED ORGANIZATION SETUP
// ============================================================================

export const GuidedOrganizationSetupEnhanced: React.FC = () => {
  const { startTour, markTourComplete, submitFeedback } = useGuidance();
  
  // Form state
  const [organization, setOrganization] = useState<OrganizationData>({
    name: '',
    email: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  // Setup progress
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<SetupStep[]>([
    { id: 'welcome', title: 'Welcome', description: 'Get started with AIBOS', required: true, completed: false },
    { id: 'basic', title: 'Basic Information', description: 'Organization details', required: true, completed: false },
    { id: 'advanced', title: 'Advanced Settings', description: 'Optional configuration', required: false, completed: false },
    { id: 'team', title: 'Team Setup', description: 'Invite team members', required: false, completed: false },
    { id: 'complete', title: 'Complete', description: 'You\'re all set!', required: true, completed: false }
  ]);

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

  // Timezone options
  const [timezoneOptions, setTimezoneOptions] = useState<Array<{value: string, label: string}>>([]);

  // Load timezone options
  useEffect(() => {
    const loadTimezones = async () => {
      try {
        const options = await getTimezoneOptions();
        setTimezoneOptions(options);
      } catch (error) {
        console.warn('Failed to load timezones, using fallback:', error);
        // Fallback to common timezones
        setTimezoneOptions([
          { value: 'UTC', label: 'UTC' },
          { value: 'America/New_York', label: 'Eastern Time' },
          { value: 'America/Chicago', label: 'Central Time' },
          { value: 'America/Denver', label: 'Mountain Time' },
          { value: 'America/Los_Angeles', label: 'Pacific Time' },
          { value: 'Europe/London', label: 'London' },
          { value: 'Europe/Paris', label: 'Paris' },
          { value: 'Asia/Tokyo', label: 'Tokyo' },
          { value: 'Asia/Shanghai', label: 'Shanghai' },
          { value: 'Australia/Sydney', label: 'Sydney' }
        ]);
      }
    };
    loadTimezones();
  }, []);

  // Auto-start tour on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startTour('organization-setup');
    }, 1000);
    return () => clearTimeout(timer);
  }, [startTour]);

  // Handle field focus for tour integration
  const handleFieldFocus = (fieldId: string) => {
    setActiveField(fieldId);
    setShowPointer(true);
  };

  const handleFieldBlur = () => {
    setActiveField(null);
    setShowPointer(false);
  };

  // Validation
  const validateStep = (stepId: string): boolean => {
    const newErrors: FormErrors = {};

    switch (stepId) {
      case 'basic':
        if (!organization.name.trim()) {
          newErrors.name = 'Organization name is required';
        }
        if (!organization.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organization.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;
      
      case 'advanced':
        if (organization.website && !/^https?:\/\/.+/.test(organization.website)) {
          newErrors.website = 'Please enter a valid website URL';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step navigation
  const nextStep = () => {
    const currentStepData = steps[currentStep];
    
    if (currentStepData.required && !validateStep(currentStepData.id)) {
      return;
    }

    // Mark current step as completed
    const updatedSteps = steps.map((step, index) => 
      index === currentStep ? { ...step, completed: true } : step
    );
    setSteps(updatedSteps);

    // Move to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipStep = () => {
    const updatedSteps = steps.map((step, index) => 
      index === currentStep ? { ...step, skipped: true, completed: true } : step
    );
    setSteps(updatedSteps);
    nextStep();
  };

  // Form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(organization)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create organization');
      }

      // Mark tour as complete
      markTourComplete('organization-setup');
      
      // Show success and feedback
      setShowSuccess(true);
      setTimeout(() => setShowFeedback(true), 2000);

    } catch (error) {
      console.error('Error creating organization:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create organization' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = (rating: number, comment?: string) => {
    submitFeedback('organization-setup', rating, comment);
    setShowFeedback(false);
  };

  // Render current step
  const renderStep = () => {
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
                onClick={nextStep}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
              <div>
                <label htmlFor="organization-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  ref={nameRef}
                  id="organization-name"
                  type="text"
                  value={organization.name}
                  onChange={(e) => setOrganization(prev => ({ ...prev, name: e.target.value }))}
                  onFocus={() => handleFieldFocus('organization-name')}
                  onBlur={handleFieldBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your organization name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="organization-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Email *
                </label>
                <input
                  ref={emailRef}
                  id="organization-email"
                  type="email"
                  value={organization.email}
                  onChange={(e) => setOrganization(prev => ({ ...prev, email: e.target.value }))}
                  onFocus={() => handleFieldFocus('organization-email')}
                  onBlur={handleFieldBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="contact@yourcompany.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="organization-phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  ref={phoneRef}
                  id="organization-phone"
                  type="tel"
                  value={organization.phone || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, phone: e.target.value }))}
                  onFocus={() => handleFieldFocus('organization-phone')}
                  onBlur={handleFieldBlur}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="organization-website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  ref={websiteRef}
                  id="organization-website"
                  type="url"
                  value={organization.website || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, website: e.target.value }))}
                  onFocus={() => handleFieldFocus('organization-website')}
                  onBlur={handleFieldBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.website ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://yourcompany.com"
                />
                {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website}</p>}
              </div>
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
              <div>
                <label htmlFor="organization-industry" className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  id="organization-industry"
                  value={organization.industry || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select industry</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="organization-size" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select
                  id="organization-size"
                  value={organization.size || ''}
                  onChange={(e) => setOrganization(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div>
                <label htmlFor="organization-timezone" className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  id="organization-timezone"
                  value={organization.timezone}
                  onChange={(e) => setOrganization(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timezoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Setup</h2>
              <p className="text-gray-600">Invite team members to collaborate</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invite Your Team</h3>
              <p className="text-gray-600 mb-6">
                You can invite team members now or do it later from your dashboard.
              </p>
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Skip for Now
              </button>
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
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Complete Setup'}
              </button>
            </div>
            {errors.submit && (
              <p className="mt-4 text-sm text-red-600">{errors.submit}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Organization Setup</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          {/* Desktop Progress Bar */}
          <div className="hidden md:block">
            <TourProgressBar current={currentStep} total={steps.length} />
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
          {renderStep()}
          
          {/* Navigation */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={previousStep}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Previous
              </button>
              
              <div className="flex space-x-3">
                {!steps[currentStep].required && (
                  <button
                    onClick={skipStep}
                    className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Setup Complete!</h3>
            <p className="text-gray-600 mb-6">
              Your organization has been created successfully. You'll be redirected to your dashboard shortly.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md mx-4">
            <TourFeedback
              onSubmit={handleFeedbackSubmit}
              onSkip={() => setShowFeedback(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidedOrganizationSetupEnhanced; 