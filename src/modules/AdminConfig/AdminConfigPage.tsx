import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { OrganizationSwitcher } from "@/modules/MultiCompany";
import AdminSidebar from "./AdminSidebar";
import SystemOverview from "./sections/SystemOverview";
import UserManagement from "./sections/UserManagement";
import ModuleManagement from "./sections/ModuleManagement";
import ComplianceSettings from "./sections/ComplianceSettings";
import SecuritySettings from "./sections/SecuritySettings";
import AuditLogs from "./sections/AuditLogs";
import SystemSettings from "./sections/SystemSettings";
import NotificationManagement from "./sections/NotificationManagement";
import SupportNotifications from "@/components/support/SupportNotifications";

type AdminSection =
  | "overview"
  | "users"
  | "modules"
  | "compliance"
  | "security"
  | "audit"
  | "settings"
  | "notifications";

interface AdminConfigPageProps {
  className?: string;
}

export const AdminConfigPage: React.FC<AdminConfigPageProps> = ({
  className = "",
}) => {
  const { user } = useAuth();
  const [currentSection, setCurrentSection] =
    useState<AdminSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalOrganizations: 0,
    systemHealth: "excellent",
    lastBackup: new Date().toISOString(),
    storageUsed: 0,
    storageLimit: 1000000000, // 1GB
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Fetch user statistics
      const { count: totalUsers } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });

      const { count: activeUsers } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("employment_status", "active");

      // Fetch organization statistics
      const { count: totalOrganizations } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true });

      setAdminStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalOrganizations: totalOrganizations || 0,
        systemHealth: "excellent",
        lastBackup: new Date().toISOString(),
        storageUsed: 250000000, // Mock data
        storageLimit: 1000000000,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case "overview":
        return <SystemOverview stats={adminStats} />;
      case "users":
        return <UserManagement />;
      case "modules":
        return <ModuleManagement />;
      case "compliance":
        return <ComplianceSettings />;
      case "security":
        return <SecuritySettings />;
      case "audit":
        return <AuditLogs />;
      case "settings":
        return <SystemSettings />;
      case "notifications":
        return <NotificationManagement />;
      default:
        return <SystemOverview stats={adminStats} />;
    }
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case "overview":
        return "System Overview";
      case "users":
        return "User Management";
      case "modules":
        return "Module Management";
      case "compliance":
        return "Compliance Settings";
      case "security":
        return "Security Settings";
      case "audit":
        return "Audit Logs";
      case "settings":
        return "System Settings";
      case "notifications":
        return "Notification Management";
      default:
        return "Admin Panel";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <div className="w-64 bg-white shadow-sm">
            <div className="animate-pulse p-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded mb-3"></div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar
          currentSection={currentSection}
          onSectionChange={(section: string) =>
            setCurrentSection(section as AdminSection)
          }
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getSectionTitle()}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Administrative controls and system configuration
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <SupportNotifications 
                  onNotificationClick={(notification) => {
                    if (notification.type === "feature_request") {
                      setCurrentSection("modules");
                    }
                  }}
                />
                <OrganizationSwitcher
                  organizations={[]}
                  userOrganizations={[]}
                  onSwitch={() => {}}
                />
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-500">System Online</span>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">{renderSection()}</div>
          </main>
        </div>
      </div>
    </div>
  );
};
