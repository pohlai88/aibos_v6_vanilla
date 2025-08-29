import React from "react";

interface AdminSidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
}) => {
  const navItems: NavItem[] = [
    {
      id: "overview",
      label: "System Overview",
      icon: "📊",
      description: "System health and statistics",
    },
    {
      id: "users",
      label: "User Management",
      icon: "👥",
      description: "Manage users and roles",
      badge: "New",
      badgeColor: "bg-green-100 text-green-800",
    },
    {
      id: "modules",
      label: "Module Management",
      icon: "🧩",
      description: "Enable and configure modules",
    },
    {
      id: "compliance",
      label: "Compliance",
      icon: "🛡️",
      description: "Compliance and governance",
      badge: "Critical",
      badgeColor: "bg-red-100 text-red-800",
    },
    {
      id: "security",
      label: "Security",
      icon: "🔒",
      description: "Security settings and policies",
    },
    {
      id: "audit",
      label: "Audit Logs",
      icon: "📋",
      description: "System audit trail",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: "🔔",
      description: "Send and manage notifications",
      badge: "RLS",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    {
      id: "settings",
      label: "System Settings",
      icon: "⚙️",
      description: "General system configuration",
    },
  ];

  return (
    <aside
      className={`bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-500">System Administration</p>
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                currentSection === item.id
                  ? "bg-blue-50 border border-blue-200 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="flex-shrink-0 text-lg">{item.icon}</div>

              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {item.description}
                  </p>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {!collapsed && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">System Online</span>
              </div>
              <div className="text-xs text-gray-400">AIBOS v6.0.0</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
