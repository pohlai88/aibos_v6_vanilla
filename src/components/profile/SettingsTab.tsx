import React from "react";
import AdminConfigTab from "./AdminConfigTab";
import ViewOnlyEye from "../ui/ViewOnlyEye";
import { useAuth } from "../../contexts/AuthContext";

const SettingsTab: React.FC = () => {
  const { user } = useAuth();
  // TODO: Replace with real admin check
  const isAdmin = user?.role === "admin";

  const features = [
    "Organization-wide preferences",
    "Data retention policies",
    "Export/import functionality",
    "Notification templates",
    "Branding customization",
    "Timezone and language settings",
    "System configuration",
    "Backup and restore options",
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <ViewOnlyEye />
        {isAdmin && (
          <a
            href="#/admin-config/settings"
            className="ml-3 px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition"
            title="Edit in Admin Config"
          >
            Edit in Admin Config
          </a>
        )}
      </div>
      <AdminConfigTab
        title="Settings"
        description="Configure organization-wide settings, preferences, and system configurations"
        icon="⚙️"
        features={features}
        adminNote="Organization settings affect all users and require admin privileges. Contact your system administrator to modify timezone, language, notification policies, or other system-wide configurations."
      >
        {/* Current Settings Preview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Organization Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">
                  General Settings
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timezone:</span>
                    <span className="text-gray-900">
                      Asia/Kuala_Lumpur (UTC+8)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language:</span>
                    <span className="text-gray-900">English</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date Format:</span>
                    <span className="text-gray-900">DD/MM/YYYY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Format:</span>
                    <span className="text-gray-900">24-hour</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">
                  Notification Settings
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email Notifications:</span>
                    <span className="text-green-600">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Push Notifications:</span>
                    <span className="text-green-600">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weekly Digest:</span>
                    <span className="text-red-600">Disabled</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">
                  Data Management
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Retention:</span>
                    <span className="text-gray-900">7 years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Auto Backup:</span>
                    <span className="text-green-600">Daily</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Export Format:</span>
                    <span className="text-gray-900">CSV, JSON</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">Branding</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company Logo:</span>
                    <span className="text-green-600">Set</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Color:</span>
                    <span className="text-gray-900">Blue (#3B82F6)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Custom Domain:</span>
                    <span className="text-red-600">Not set</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminConfigTab>
    </div>
  );
};

export default SettingsTab;
