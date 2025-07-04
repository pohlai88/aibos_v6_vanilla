import React from 'react';
import { Organization } from '@/types/organization';

interface SimpleDashboardProps {
  organizations: Organization[];
  onNavigate: (tab: string) => void;
}

const SimpleDashboard: React.FC<SimpleDashboardProps> = ({ 
  organizations, 
  onNavigate 
}) => {
  const stats = {
    totalOrganizations: organizations.length,
    activeOrganizations: organizations.filter(org => org.status === 'active').length,
    totalEmployees: 145,
    totalRevenue: 2500000,
    complianceScore: 92,
    pendingTasks: 8
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Multi-Company Dashboard</h2>
        <p className="text-gray-600">Overview of your multi-company operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Organizations</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">🟢</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Organizations</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.activeOrganizations}</p>
          <p className="text-sm text-gray-500 mt-1">{stats.activeOrganizations} of {stats.totalOrganizations} active</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Employees</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-yellow-100">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">${(stats.totalRevenue / 1000000).toFixed(1)}M</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Compliance Score</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.complianceScore}%</p>
          <p className="text-sm text-gray-500 mt-1">Overall compliance rating</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-red-100">
              <span className="text-2xl">⏰</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Tasks</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
          <p className="text-sm text-gray-500 mt-1">Require attention</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('registry')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 rounded-full bg-blue-500 text-white mr-3">
              <span className="text-lg">🏢</span>
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Add Organization</h4>
              <p className="text-sm text-gray-500">Create a new organization</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('compliance')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 rounded-full bg-green-500 text-white mr-3">
              <span className="text-lg">✅</span>
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">View Compliance</h4>
              <p className="text-sm text-gray-500">Check compliance status</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('reporting')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 rounded-full bg-purple-500 text-white mr-3">
              <span className="text-lg">📊</span>
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Generate Report</h4>
              <p className="text-sm text-gray-500">Create multi-company report</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 rounded-full bg-gray-500 text-white mr-3">
              <span className="text-lg">⚙️</span>
            </div>
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Settings</h4>
              <p className="text-sm text-gray-500">Configure system settings</p>
            </div>
          </button>
        </div>
      </div>

      {/* Organization Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Organization Overview</h3>
          <button 
            onClick={() => onNavigate('registry')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Registry
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <div key={org.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{org.name}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {org.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{org.industry}</p>
              <p className="text-xs text-gray-500">
                Size: {org.size_category?.toUpperCase()}
              </p>
              <p className="text-xs text-gray-500">
                Type: {org.org_type?.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;
