import React from "react";
import AdminConfigTab from "./AdminConfigTab";
import ViewOnlyEye from "../ui/ViewOnlyEye";
import { useAuth } from "../../contexts/AuthContext";

const IntegrationsTab: React.FC = () => {
  const { user } = useAuth();
  // TODO: Replace with real admin check
  const isAdmin = user?.role === "admin";

  const features = [
    "API key management",
    "Webhook configuration",
    "Third-party app connections",
    "Integration health monitoring",
    "OAuth provider setup",
    "Data synchronization",
    "Custom integrations",
    "Integration analytics",
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
        <ViewOnlyEye />
        {isAdmin && (
          <a
            href="#/admin-config/integrations"
            className="ml-3 px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition"
            title="Edit in Admin Config"
          >
            Edit in Admin Config
          </a>
        )}
      </div>
      <AdminConfigTab
        title="Integrations"
        description="Manage connected applications, API configurations, and third-party services"
        icon="🔗"
        features={features}
        adminNote="System integrations affect the entire organization and require admin privileges. Contact your system administrator to add, remove, or configure integrations."
      >
        {/* Current Integrations Preview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Integrations
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-green-900">Supabase</div>
                    <div className="text-sm text-green-700">
                      Database & Authentication
                    </div>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">
                  Active
                </span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-blue-900">
                      Email Service
                    </div>
                    <div className="text-sm text-blue-700">
                      SMTP Configuration
                    </div>
                  </div>
                </div>
                <span className="text-sm text-blue-600 font-medium">
                  Active
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div>
                    <div className="font-medium text-gray-900">Slack</div>
                    <div className="text-sm text-gray-700">
                      Team Communication
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  Not Connected
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Google Workspace
                    </div>
                    <div className="text-sm text-gray-700">
                      Calendar & Drive
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  Not Connected
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 text-lg">💡</div>
              <div>
                <div className="font-medium text-yellow-900">
                  Integration Benefits
                </div>
                <div className="text-sm text-yellow-700 mt-1">
                  Connect with popular tools to streamline workflows, automate
                  processes, and enhance productivity across your organization.
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminConfigTab>
    </div>
  );
};

export default IntegrationsTab;
