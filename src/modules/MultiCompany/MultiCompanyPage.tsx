import React from "react";
import { useSearchParams } from "react-router-dom";
import SimpleDashboard from "./SimpleDashboard";
import OrganizationRegistry from "./OrganizationRegistry";
import OrganizationHierarchy from "./OrganizationHierarchy";
import MultiCompanySettings from "./MultiCompanySettings";
import MultiCompanyReporting from "./MultiCompanyReporting";
import MultiCompanyCompliance from "./MultiCompanyCompliance";
import { Organization } from "@/types/organization";

interface MultiCompanyPageProps {
  className?: string;
}

type TabType = 'dashboard' | 'registry' | 'hierarchy' | 'compliance' | 'reporting' | 'settings';

// Mock data for organizations
const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'AI-BOS Demo Organization',
    slug: 'aibos-demo',
    legal_name: 'AI-BOS Demo Organization LLC',
    industry: 'Technology',
    size_category: 'sme',
    org_type: 'independent',
    status: 'active',
    website_url: 'https://aibos-demo.com',
    timezone: 'UTC',
    locale: 'en-US',
    tax_id: '12-3456789',
    registration_number: 'REG123456',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_organization_id: undefined
  },
  {
    id: '2',
    name: 'Sample Company Ltd',
    slug: 'sample-company',
    legal_name: 'Sample Company Limited',
    industry: 'Manufacturing',
    size_category: 'enterprise',
    org_type: 'independent',
    status: 'active',
    website_url: 'https://sample-company.com',
    timezone: 'UTC',
    locale: 'en-US',
    tax_id: '98-7654321',
    registration_number: 'REG654321',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_organization_id: undefined
  }
];

export const MultiCompanyPage: React.FC<MultiCompanyPageProps> = ({
  className = "",
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as TabType) || 'dashboard';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'registry', label: 'Organization Registry', icon: '🏢' },
    { id: 'hierarchy', label: 'Hierarchy', icon: '🌳' },
    { id: 'compliance', label: 'Compliance', icon: '✅' },
    { id: 'reporting', label: 'Reporting', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const handleTabChange = (tabId: TabType) => {
    setSearchParams({ tab: tabId });
  };

  const handleNavigate = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleOrganizationUpdate = () => {
    // Mock organization update handler
    // In a real app, this would refresh the organization data
  };

  const handleOrganizationSelect = (org: Organization) => {
    // Mock organization select handler
    // In a real app, this would handle organization selection
    void org; // Silence unused variable warning
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <SimpleDashboard 
            organizations={mockOrganizations}
            onNavigate={handleNavigate}
          />
        );
      case 'registry':
        return (
          <OrganizationRegistry 
            organizations={mockOrganizations}
            onOrganizationUpdate={handleOrganizationUpdate}
          />
        );
      case 'hierarchy':
        return (
          <OrganizationHierarchy 
            organizations={mockOrganizations}
            onOrganizationSelect={handleOrganizationSelect}
          />
        );
      case 'compliance':
        return <MultiCompanyCompliance />;
      case 'reporting':
        return <MultiCompanyReporting />;
      case 'settings':
        return <MultiCompanySettings />;
      default:
        return (
          <SimpleDashboard 
            organizations={mockOrganizations}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Multi-Company Management
          </h1>
          <p className="text-gray-600">
            Comprehensive management of your multi-company setup
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-lg">
            <nav className="-mb-px flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={`
                    whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2
                    ${currentTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg rounded-t-none shadow-sm border border-gray-200 border-t-0">
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
