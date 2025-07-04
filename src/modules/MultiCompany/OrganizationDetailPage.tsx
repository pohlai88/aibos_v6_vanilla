import React, { useState } from 'react';
import { Organization } from '@/types/organization';
import { 
  StatutoryItemsTab, 
  DocumentsTab, 
  ComplianceCalendarTab, 
  IntercompanyTab, 
  ShareholdingTab, 
  AuditTrailTab 
} from './StatutoryTabs';
import Button from '@/components/ui/Button';

interface OrganizationDetailPageProps {
  organization: Organization;
  onBack: () => void;
}

type TabType = 'statutory' | 'documents' | 'calendar' | 'intercompany' | 'shareholding' | 'audit';

export const OrganizationDetailPage: React.FC<OrganizationDetailPageProps> = ({
  organization,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('statutory');

  const tabs = [
    { id: 'statutory', label: 'Statutory Items', icon: '📋' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'calendar', label: 'Compliance Calendar', icon: '📅' },
    { id: 'intercompany', label: 'Intercompany', icon: '🔗' },
    { id: 'shareholding', label: 'Shareholding', icon: '👥' },
    { id: 'audit', label: 'Audit Trail', icon: '🔍' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'statutory':
        return <StatutoryItemsTab organizationId={organization.id} />;
      case 'documents':
        return <DocumentsTab organizationId={organization.id} />;
      case 'calendar':
        return <ComplianceCalendarTab organizationId={organization.id} />;
      case 'intercompany':
        return <IntercompanyTab organizationId={organization.id} />;
      case 'shareholding':
        return <ShareholdingTab organizationId={organization.id} />;
      case 'audit':
        return <AuditTrailTab organizationId={organization.id} />;
      default:
        return <StatutoryItemsTab organizationId={organization.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization.name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {organization.industry} • {organization.locale}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                Status: <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetailPage;
