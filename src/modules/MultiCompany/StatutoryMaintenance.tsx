import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { statutoryMaintenanceService } from '@/lib/statutoryService';
import { EnhancedOrganization, ComplianceSummary } from '@/types/statutory';
import TabNavigation from '@/components/ui/TabNavigation';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

// Import tab components (we'll create these next)
import StatutoryItemsTab from './tabs/StatutoryItemsTab';
import DocumentsTab from './tabs/DocumentsTab';
import ShareholdingTab from './tabs/ShareholdingTab';
import IntercompanyTab from './tabs/IntercompanyTab';
import ComplianceCalendarTab from './tabs/ComplianceCalendarTab';
import AuditTrailTab from './tabs/AuditTrailTab';

interface StatutoryMaintenanceProps {
  organizationId: string;
  className?: string;
}

const StatutoryMaintenance: React.FC<StatutoryMaintenanceProps> = ({
  organizationId,
  className = ""
}) => {
  const [organization, setOrganization] = useState<EnhancedOrganization | null>(null);
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('statutory');
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    {
      id: 'statutory',
      label: 'Statutory Items',
      icon: '📋',
      description: 'Compliance requirements and maintenance tasks'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: '📄',
      description: 'Document repository and file management'
    },
    {
      id: 'shareholding',
      label: 'Ownership',
      icon: '👥',
      description: 'Shareholding structure and history'
    },
    {
      id: 'intercompany',
      label: 'Relationships',
      icon: '🔗',
      description: 'Intercompany relationships and structure'
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: '📅',
      description: 'Compliance calendar and deadlines'
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: '🔍',
      description: 'Change history and audit logs'
    }
  ];

  useEffect(() => {
    fetchOrganizationData();
  }, [organizationId]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch organization details and compliance summary in parallel
      const [orgData, summaryData] = await Promise.all([
        statutoryMaintenanceService.organizations.getEnhancedOrganization(organizationId),
        statutoryMaintenanceService.statutory.getComplianceSummary(organizationId)
      ]);

      setOrganization(orgData);
      setComplianceSummary(summaryData);
    } catch (err) {
      console.error('Error fetching organization data:', err);
      setError('Failed to load organization data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (!organization) return null;

    switch (activeTab) {
      case 'statutory':
        return <StatutoryItemsTab organizationId={organizationId} />;
      case 'documents':
        return <DocumentsTab organizationId={organizationId} />;
      case 'shareholding':
        return <ShareholdingTab organizationId={organizationId} />;
      case 'intercompany':
        return <IntercompanyTab organizationId={organizationId} />;
      case 'calendar':
        return <ComplianceCalendarTab organizationId={organizationId} />;
      case 'audit':
        return <AuditTrailTab organization={organization} />;
      default:
        return <StatutoryItemsTab organizationId={organizationId} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'dormant': return 'text-yellow-600 bg-yellow-100';
      case 'struck_off': return 'text-red-600 bg-red-100';
      case 'liquidated': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'group': return 'text-purple-600 bg-purple-100';
      case 'regional': return 'text-blue-600 bg-blue-100';
      case 'operating': return 'text-green-600 bg-green-100';
      case 'dormant': return 'text-yellow-600 bg-yellow-100';
      case 'special_purpose': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 ${className}`}>
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner message="Loading statutory maintenance system..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={fetchOrganizationData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 ${className}`}>
        <div className="max-w-7xl mx-auto">
          <EmptyState
            title="Organization Not Found"
            message="The specified organization could not be found or you don't have access to it."
            icon="🏢"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Statutory Maintenance
              </h1>
              <p className="text-gray-600">
                Group Entity Management Hub for {organization.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => window.history.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                ← Back
              </Button>
            </div>
          </div>

          {/* Organization Overview Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Organization Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Organization</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <p className="text-gray-900">{organization.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Type:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEntityTypeColor(organization.entity_type)}`}>
                      {organization.entity_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(organization.entity_status)}`}>
                      {organization.entity_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Details</h3>
                <div className="space-y-2">
                  {organization.registration_number && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Reg. No:</span>
                      <p className="text-gray-900">{organization.registration_number}</p>
                    </div>
                  )}
                  {organization.country_of_incorporation && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Country:</span>
                      <p className="text-gray-900">{organization.country_of_incorporation}</p>
                    </div>
                  )}
                  {organization.incorporation_date && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Incorporated:</span>
                      <p className="text-gray-900">{new Date(organization.incorporation_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance</h3>
                {complianceSummary && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Items:</span>
                      <span className="font-medium">{complianceSummary.total_items}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Pending:</span>
                      <span className="font-medium text-yellow-600">{complianceSummary.pending_items}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Overdue:</span>
                      <span className="font-medium text-red-600">{complianceSummary.overdue_items}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Completed:</span>
                      <span className="font-medium text-green-600">{complianceSummary.completed_items}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => setActiveTab('statutory')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    + Add Statutory Item
                  </Button>
                  <Button
                    onClick={() => setActiveTab('documents')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    + Upload Document
                  </Button>
                  <Button
                    onClick={() => setActiveTab('calendar')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    View Calendar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="border-b border-gray-200"
          />
          
          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatutoryMaintenance; 