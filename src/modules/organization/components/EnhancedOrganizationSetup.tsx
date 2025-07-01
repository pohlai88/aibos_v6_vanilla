import React, { useState, useEffect } from 'react';
import MetadataDrivenForm from '../../../components/MetadataDrivenForm';
import { Organization, UserOrganization } from '../../../types/enhanced';

interface EnhancedOrganizationSetupProps {
  userId: string;
  onComplete: (organization: Organization) => void;
  onSkip?: () => void;
}

const EnhancedOrganizationSetup: React.FC<EnhancedOrganizationSetupProps> = ({
  userId,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState<'basic' | 'advanced' | 'complete'>('basic');
  const [organizationData, setOrganizationData] = useState<Partial<Organization>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Smart defaults based on user context
  const generateSmartDefaults = (): Partial<Organization> => {
    const defaults: Partial<Organization> = {
      status: 'active',
      organization_type: 'company',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: 'USD',
      fiscal_year_start: '01-01',
      employee_count: 1,
      industry: 'technology',
      founded_year: new Date().getFullYear(),
      is_public: false,
      has_subsidiaries: false,
      compliance_level: 'basic'
    };

    return defaults;
  };

  useEffect(() => {
    setOrganizationData(generateSmartDefaults());
  }, []);

  const handleBasicSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    
    try {
      // Auto-generate missing fields
      const enhancedData = {
        ...data,
        organization_code: generateOrganizationCode(data.organization_name),
        domain: generateDomain(data.organization_name),
        legal_name: data.legal_name || data.organization_name,
        tax_id: data.tax_id || 'PENDING',
        registration_number: data.registration_number || 'PENDING'
      };

      setOrganizationData(enhancedData);
      
      // Check if we should show advanced fields
      if (shouldShowAdvancedFields(enhancedData)) {
        setCurrentStep('advanced');
      } else {
        await createOrganization(enhancedData);
      }
    } catch (error) {
      console.error('Error in basic setup:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvancedSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    
    try {
      const completeData = { ...organizationData, ...data };
      await createOrganization(completeData);
    } catch (error) {
      console.error('Error in advanced setup:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const createOrganization = async (data: Record<string, any>) => {
    try {
      // Create organization
      const orgResponse = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!orgResponse.ok) throw new Error('Failed to create organization');
      
      const organization: Organization = await orgResponse.json();

      // Create user-organization relationship
      const userOrgData: Partial<UserOrganization> = {
        user_id: userId,
        organization_id: organization.id,
        role: 'owner',
        is_primary: true,
        status: 'active'
      };

      const userOrgResponse = await fetch('/api/user-organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userOrgData)
      });

      if (!userOrgResponse.ok) throw new Error('Failed to create user-organization relationship');

      setCurrentStep('complete');
      onComplete(organization);
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  const generateOrganizationCode = (name: string): string => {
    if (!name) return 'ORG' + Date.now().toString().slice(-6);
    
    const code = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    
    return code + Date.now().toString().slice(-4);
  };

  const generateDomain = (name: string): string => {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) + '.com';
  };

  const shouldShowAdvancedFields = (data: Record<string, any>): boolean => {
    // Show advanced fields for larger organizations or specific industries
    const employeeCount = parseInt(data.employee_count) || 1;
    const industry = data.industry?.toLowerCase();
    
    return employeeCount > 10 || 
           industry === 'finance' || 
           industry === 'healthcare' || 
           industry === 'legal' ||
           data.has_subsidiaries === true ||
           data.is_public === true;
  };

  const renderProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'basic' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
          }`}>
            1
          </div>
          <span className={`text-sm font-medium ${
            currentStep === 'basic' ? 'text-blue-600' : 'text-green-600'
          }`}>
            Basic Information
          </span>
        </div>
        
        <div className="flex-1 mx-4 h-0.5 bg-gray-200">
          <div className={`h-full bg-blue-600 transition-all duration-300 ${
            currentStep === 'basic' ? 'w-0' : 'w-full'
          }`}></div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'advanced' ? 'bg-blue-600 text-white' : 
            currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'
          }`}>
            2
          </div>
          <span className={`text-sm font-medium ${
            currentStep === 'advanced' ? 'text-blue-600' : 
            currentStep === 'complete' ? 'text-green-600' : 'text-gray-500'
          }`}>
            Advanced Settings
          </span>
        </div>
      </div>
    </div>
  );

  const renderBasicStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to AIBOS! Let's set up your organization
        </h2>
        <p className="text-gray-600">
          We'll help you get started in just a few minutes. You can always add more details later.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Quick Setup
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              We've pre-filled some information based on common settings. You can customize everything later.
            </p>
          </div>
        </div>
      </div>

      <MetadataDrivenForm
        entityType="organization"
        organizationId="temp" // Will be replaced after creation
        initialData={organizationData}
        onSubmit={handleBasicSubmit}
        isSubmitting={isSubmitting}
      />

      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  const renderAdvancedStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Additional Configuration
        </h2>
        <p className="text-gray-600">
          Based on your organization size and industry, we recommend configuring these additional settings.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Recommended Settings
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              These settings help with compliance, reporting, and advanced features. You can modify them anytime.
            </p>
          </div>
        </div>
      </div>

      <MetadataDrivenForm
        entityType="organization"
        organizationId="temp"
        initialData={organizationData}
        onSubmit={handleAdvancedSubmit}
        onCancel={() => createOrganization(organizationData)}
        isSubmitting={isSubmitting}
      />
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Organization Setup Complete!
        </h2>
        <p className="text-gray-600">
          Your organization "{organizationData.organization_name}" has been successfully created.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="font-medium text-gray-900 mb-3">What's Next?</h3>
        <ul className="text-sm text-gray-600 space-y-2 text-left">
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Add your first employee
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Configure departments and roles
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Set up custom fields and workflows
          </li>
        </ul>
      </div>

      <button
        onClick={() => window.location.href = '/dashboard'}
        className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderProgressIndicator()}
      
      {currentStep === 'basic' && renderBasicStep()}
      {currentStep === 'advanced' && renderAdvancedStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </div>
  );
};

export default EnhancedOrganizationSetup; 