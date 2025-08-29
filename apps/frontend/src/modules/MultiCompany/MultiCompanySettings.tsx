import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface MultiCompanySettingsProps {
  className?: string;
}

export const MultiCompanySettings: React.FC<MultiCompanySettingsProps> = ({ className = '' }) => {
  const [settings, setSettings] = useState({
    defaultCurrency: 'USD',
    defaultTimezone: 'UTC',
    allowCrossCompanyTransactions: true,
    requireApprovalForNewOrgs: false,
    autoAssignUserRoles: true,
    enableAuditLog: true,
    retentionPeriod: '7',
    maxOrganizations: '10',
    enableNotifications: true,
    enableReporting: true,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Mock save functionality
    // In a real app, this would make an API call
    // For now, just update the settings state
    setSettings(prev => ({ ...prev }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Multi-Company Settings</h2>
        <p className="text-gray-600">Configure global settings for your multi-company setup</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Timezone
              </label>
              <select
                value={settings.defaultTimezone}
                onChange={(e) => handleChange('defaultTimezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Organizations
              </label>
              <Input
                type="number"
                value={settings.maxOrganizations}
                onChange={(e) => handleChange('maxOrganizations', e.target.value)}
                min="1"
                max="100"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Security & Permissions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security & Permissions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Allow Cross-Company Transactions
                </label>
                <p className="text-sm text-gray-500">Enable transactions between organizations</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowCrossCompanyTransactions}
                onChange={(e) => handleChange('allowCrossCompanyTransactions', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Require Approval for New Organizations
                </label>
                <p className="text-sm text-gray-500">Admin approval required for new orgs</p>
              </div>
              <input
                type="checkbox"
                checked={settings.requireApprovalForNewOrgs}
                onChange={(e) => handleChange('requireApprovalForNewOrgs', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Auto-assign User Roles
                </label>
                <p className="text-sm text-gray-500">Automatically assign default roles to new users</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAssignUserRoles}
                onChange={(e) => handleChange('autoAssignUserRoles', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Audit & Compliance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit & Compliance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enable Audit Log
                </label>
                <p className="text-sm text-gray-500">Track all multi-company activities</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableAuditLog}
                onChange={(e) => handleChange('enableAuditLog', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Log Retention Period (years)
              </label>
              <Input
                type="number"
                value={settings.retentionPeriod}
                onChange={(e) => handleChange('retentionPeriod', e.target.value)}
                min="1"
                max="10"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Notifications & Reporting */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications & Reporting</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enable Notifications
                </label>
                <p className="text-sm text-gray-500">Send notifications for key events</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enable Reporting
                </label>
                <p className="text-sm text-gray-500">Generate cross-company reports</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableReporting}
                onChange={(e) => handleChange('enableReporting', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default MultiCompanySettings;
