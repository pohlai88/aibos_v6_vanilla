import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import TabNavigation, { TabItem } from "../../components/ui/TabNavigation";
import OverviewTab from "../../components/profile/OverviewTab";
import SecurityTab from "../../components/profile/SecurityTab";
import HelpTab from "../../components/profile/HelpTab";
import DivisionDepartmentTab from "../../components/profile/DivisionDepartmentTab";
import SettingsTab from "../../components/profile/SettingsTab";
import ActivityLogTab from "../../components/profile/ActivityLogTab";
import IntegrationsTab from "../../components/profile/IntegrationsTab";
import ComplianceTab from "../../components/profile/ComplianceTab";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Define tabs based on priority matrix
  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Overview",
      icon: "👤",
    },
    {
      id: "security",
      label: "Security",
      icon: "🔒",
    },
    {
      id: "help",
      label: "Help & Support",
      icon: "❓",
    },
    {
      id: "division",
      label: "Division/Department",
      icon: "🏢",
      disabled: true, // Phase 2
      badge: "Phase 2",
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙️",
      disabled: true, // Phase 2
      badge: "Phase 2",
    },
    {
      id: "activity",
      label: "Activity Log",
      icon: "📊",
      disabled: true, // Phase 2
      badge: "Phase 2",
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: "🔗",
      disabled: true, // Phase 3
      badge: "Phase 3",
    },
    {
      id: "compliance",
      label: "Compliance",
      icon: "📋",
      disabled: true, // Phase 3
      badge: "Phase 3",
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "security":
        return <SecurityTab />;
      case "help":
        return <HelpTab />;
      case "division":
        return <DivisionDepartmentTab />;
      case "settings":
        return <SettingsTab />;
      case "activity":
        return <ActivityLogTab />;
      case "integrations":
        return <IntegrationsTab />;
      case "compliance":
        return <ComplianceTab />;
      default:
        return <OverviewTab />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">
            Access Denied
          </div>
          <div className="text-gray-600">
            Please log in to access your profile.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="p-6"
          />
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">{renderTabContent()}</div>
        </div>

        {/* Phase Information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-lg">📋</div>
            <div>
              <div className="font-medium text-blue-900">
                Development Phases
              </div>
              <div className="text-sm text-blue-700 mt-1">
                <strong>Phase 1 (MVP):</strong> Overview, Security, Support •
                <strong>Phase 2:</strong> Division/Department, Settings,
                Activity Log •<strong>Phase 3:</strong> Integrations, Compliance
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 