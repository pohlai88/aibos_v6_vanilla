import React from "react";
import AdminConfigTab from "./AdminConfigTab";
import ViewOnlyEye from "../ui/ViewOnlyEye";
import { useAuth } from "../../contexts/AuthContext";

const ActivityLogTab: React.FC = () => {
  const { user } = useAuth();
  // TODO: Replace with real admin check
  const isAdmin = user?.role === "admin";

  const features = [
    "Advanced filtering and search",
    "Export capabilities",
    "Real-time monitoring",
    "Alert configuration",
    "Compliance reporting",
    "User activity tracking",
    "System event logging",
    "Audit trail management",
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>
        <ViewOnlyEye />
        {isAdmin && (
          <a
            href="#/admin-config/activity"
            className="ml-3 px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition"
            title="Edit in Admin Config"
          >
            Edit in Admin Config
          </a>
        )}
      </div>
      <AdminConfigTab
        title="Activity Log"
        description="Monitor user actions, system events, and audit trails for compliance and security"
        icon="📊"
        features={features}
        adminNote="Activity logs and audit trails are administrative functions. Contact your system administrator to access detailed logs, configure alerts, or generate compliance reports."
      >
        {/* Recent Activity Preview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">
                    Profile Updated
                  </div>
                  <div className="text-sm text-gray-500">
                    Avatar changed to Female Avatar
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">2 minutes ago</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">
                    Login Successful
                  </div>
                  <div className="text-sm text-gray-500">
                    Chrome • 192.168.1.100
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">1 hour ago</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">
                    Password Changed
                  </div>
                  <div className="text-sm text-gray-500">
                    Password policy compliance
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">3 days ago</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">
                    Settings Viewed
                  </div>
                  <div className="text-sm text-gray-500">
                    Security settings accessed
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">1 week ago</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-2">
                Activity Summary
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Today:</span>
                  <span className="text-gray-900">5 actions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">This Week:</span>
                  <span className="text-gray-900">23 actions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">This Month:</span>
                  <span className="text-gray-900">89 actions</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-2">Event Types</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Logins:</span>
                  <span className="text-gray-900">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profile Updates:</span>
                  <span className="text-gray-900">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Security Events:</span>
                  <span className="text-gray-900">3</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-2">
                Security Status
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed Logins:</span>
                  <span className="text-red-600">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Suspicious Activity:</span>
                  <span className="text-green-600">None</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Audit:</span>
                  <span className="text-gray-900">Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminConfigTab>
    </div>
  );
};

export default ActivityLogTab;
