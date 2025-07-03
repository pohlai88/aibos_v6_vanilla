import React from "react";

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalOrganizations: number;
  systemHealth: string;
  lastBackup: string;
  storageUsed: number;
  storageLimit: number;
}

interface SystemOverviewProps {
  stats: SystemStats;
}

const SystemOverview: React.FC<SystemOverviewProps> = ({ stats }) => {
  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "text-green-600 bg-green-100";
      case "good":
        return "text-blue-600 bg-blue-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "excellent":
        return "🟢";
      case "good":
        return "🔵";
      case "warning":
        return "🟡";
      case "critical":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const storagePercentage = (stats.storageUsed / stats.storageLimit) * 100;

  const recentActivities = [
    {
      id: 1,
      type: "user",
      message: "New user registration",
      time: "2 minutes ago",
      status: "success",
    },
    {
      id: 2,
      type: "backup",
      message: "Daily backup completed",
      time: "1 hour ago",
      status: "success",
    },
    {
      id: 3,
      type: "security",
      message: "Security scan completed",
      time: "3 hours ago",
      status: "success",
    },
    {
      id: 4,
      type: "update",
      message: "System update available",
      time: "1 day ago",
      status: "warning",
    },
  ];

  const quickActions = [
    {
      id: 1,
      label: "Run Backup",
      icon: "💾",
      action: () => console.log("Backup"),
    },
    {
      id: 2,
      label: "Security Scan",
      icon: "🔍",
      action: () => console.log("Security scan"),
    },
    {
      id: 3,
      label: "System Update",
      icon: "🔄",
      action: () => console.log("Update"),
    },
    {
      id: 4,
      label: "Generate Report",
      icon: "📊",
      action: () => console.log("Report"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl">👥</div>
            <div
              className={`text-xs px-2 py-1 rounded-full ${getHealthColor(
                "excellent"
              )}`}
            >
              Active
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.activeUsers}
          </div>
          <div className="text-sm text-gray-500">Active Users</div>
          <div className="text-xs text-green-600 mt-1">
            +12% from last month
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl">🏢</div>
            <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
              Total
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalOrganizations}
          </div>
          <div className="text-sm text-gray-500">Organizations</div>
          <div className="text-xs text-blue-600 mt-1">+3 new this week</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl">{getHealthIcon(stats.systemHealth)}</div>
            <div
              className={`text-xs px-2 py-1 rounded-full ${getHealthColor(
                stats.systemHealth
              )}`}
            >
              {stats.systemHealth}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">99.9%</div>
          <div className="text-sm text-gray-500">Uptime</div>
          <div className="text-xs text-green-600 mt-1">
            All systems operational
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl">💾</div>
            <div
              className={`text-xs px-2 py-1 rounded-full ${
                storagePercentage > 80
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {Math.round(storagePercentage)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatBytes(stats.storageUsed)}
          </div>
          <div className="text-sm text-gray-500">Storage Used</div>
          <div className="text-xs text-gray-600 mt-1">
            of {formatBytes(stats.storageLimit)}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="text-sm font-medium text-gray-900">
                {action.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.status === "success"
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                ></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Database</span>
              </div>
              <span className="text-xs text-green-600">Online</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Authentication</span>
              </div>
              <span className="text-xs text-green-600">Online</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">File Storage</span>
              </div>
              <span className="text-xs text-green-600">Online</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Email Service</span>
              </div>
              <span className="text-xs text-yellow-600">Maintenance</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Last backup: {new Date(stats.lastBackup).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold text-gray-900">245ms</div>
            <div className="text-sm text-gray-500">Average Response Time</div>
            <div className="text-xs text-green-600 mt-1">↓ 12% improvement</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">1,247</div>
            <div className="text-sm text-gray-500">Requests per Minute</div>
            <div className="text-xs text-blue-600 mt-1">↑ 8% increase</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">99.9%</div>
            <div className="text-sm text-gray-500">Success Rate</div>
            <div className="text-xs text-green-600 mt-1">Stable</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;
