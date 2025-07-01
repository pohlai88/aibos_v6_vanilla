import React, { useState, useEffect } from 'react';
import { OrganizationFormData } from '../../../types/organization';

interface OrganizationSetupProps {
  onComplete: (orgData: OrganizationFormData) => void;
  onCancel?: () => void;
}

const OrganizationSetup: React.FC<OrganizationSetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'basic' | 'details' | 'settings' | 'complete'>('basic');
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    slug: '',
    legal_name: '',
    industry: '',
    size_category: 'sme',
    parent_organization_id: undefined,
    org_type: 'independent',
    website_url: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language || 'en-US'
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name]);

  const handleInputChange = (field: keyof OrganizationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 'basic') setStep('details');
    else if (step === 'details') setStep('settings');
    else if (step === 'settings') {
      setStep('complete');
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (step === 'details') setStep('basic');
    else if (step === 'settings') setStep('details');
  };

  const isStepValid = () => {
    switch (step) {
      case 'basic':
        return formData.name.trim().length > 0;
      case 'details':
        return formData.name.trim().length > 0 && formData.slug.trim().length > 0;
      case 'settings':
        return true; // Settings are optional
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['basic', 'details', 'settings', 'complete'].map((s, index) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === s ? 'bg-blue-600 text-white' : 
                  ['basic', 'details', 'settings', 'complete'].indexOf(step) > index ? 
                  'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`
                  w-16 h-1 mx-2
                  ${['basic', 'details', 'settings', 'complete'].indexOf(step) > index ? 
                    'bg-green-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Basic Info</span>
          <span>Details</span>
          <span>Settings</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {step === 'basic' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AIBOS!</h2>
            <p className="text-gray-600">Let's set up your organization. We'll start with the basics.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your organization name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select industry</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="retail">Retail</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Size
              </label>
              <select
                value={formData.size_category}
                onChange={(e) => handleInputChange('size_category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="startup">Startup (1-50 employees)</option>
                <option value="sme">SME (51-500 employees)</option>
                <option value="enterprise">Enterprise (500+ employees)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Additional Details */}
      {step === 'details' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Details</h2>
            <p className="text-gray-600">Tell us more about your organization.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-organization"
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be used in your organization URL: aibos.com/{formData.slug}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Name
              </label>
              <input
                type="text"
                value={formData.legal_name}
                onChange={(e) => handleInputChange('legal_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Legal business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-website.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Type
              </label>
              <select
                value={formData.org_type}
                onChange={(e) => handleInputChange('org_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="independent">Independent Organization</option>
                <option value="mother">Parent Company</option>
                <option value="subsidiary">Subsidiary</option>
                <option value="branch">Branch Office</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Settings */}
      {step === 'settings' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Preferences</h2>
            <p className="text-gray-600">Configure your organization's default settings.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language & Region
              </label>
              <select
                value={formData.locale}
                onChange={(e) => handleInputChange('locale', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="ja-JP">Japanese</option>
                <option value="zh-CN">Chinese (Simplified)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleBack}
          disabled={step === 'basic'}
          className={`
            px-4 py-2 rounded-md text-sm font-medium
            ${step === 'basic' 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          Back
        </button>

        <div className="flex space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className={`
              px-6 py-2 rounded-md text-sm font-medium
              ${isStepValid()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {step === 'settings' ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSetup; 