import React, { useState } from "react";
import Button from "@/components/ui/Button";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failure" | "warning";
}

const AuditLogs: React.FC = () => {
  const [logs] = useState<AuditLog[]>([
    {
      id: "1",
      timestamp: "2024-01-15T10:30:00Z",
      user: "john.doe@company.com",
      action: "LOGIN",
      resource: "Authentication",
      details: "Successful login from desktop browser",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
    },
    {
      id: "2",
      timestamp: "2024-01-15T10:25:00Z",
      user: "admin@company.com",
      action: "UPDATE_USER",
      resource: "User Management",
      details: "Updated user permissions for jane.smith@company.com",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      status: "success",
    },
    {
      id: "3",
      timestamp: "2024-01-15T10:20:00Z",
      user: "unknown",
      action: "LOGIN_ATTEMPT",
      resource: "Authentication",
      details: "Failed login attempt with invalid credentials",
      ipAddress: "203.0.113.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "failure",
    },
    {
      id: "4",
      timestamp: "2024-01-15T10:15:00Z",
      user: "jane.smith@company.com",
      action: "EXPORT_DATA",
      resource: "Employee Database",
      details: "Exported employee data to CSV format",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      status: "success",
    },
    {
      id: "5",
      timestamp: "2024-01-15T10:10:00Z",
      user: "admin@company.com",
      action: "SYSTEM_CONFIG",
      resource: "System Settings",
      details: "Modified security policy settings",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      status: "success",
    },
  ]);

  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const actions = [
    "all",
    ...Array.from(new Set(logs.map((log) => log.action))),
  ];
  const statuses = ["all", "success", "failure", "warning"];

  const filteredLogs = logs.filter((log) => {
    const matchesAction =
      selectedAction === "all" || log.action === selectedAction;
    const matchesStatus =
      selectedStatus === "all" || log.status === selectedStatus;
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesAction && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { color: "bg-green-100 text-green-800", label: "Success" },
      failure: { color: "bg-red-100 text-red-800", label: "Failure" },
      warning: { color: "bg-yellow-100 text-yellow-800", label: "Warning" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.success;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getActionIcon = (action: string) => {
    const actionIcons: { [key: string]: string } = {
      LOGIN: "🔐",
      LOGOUT: "🚪",
      LOGIN_ATTEMPT: "⚠️",
      UPDATE_USER: "👤",
      DELETE_USER: "🗑️",
      EXPORT_DATA: "📤",
      IMPORT_DATA: "📥",
      SYSTEM_CONFIG: "⚙️",
      SECURITY_SCAN: "🔍",
      BACKUP: "💾",
    };

    return actionIcons[action] || "📝";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600">
            System audit trail and activity monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Export Logs
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Clear Old Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action === "all" ? "All Actions" : action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "all"
                    ? "All Status"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedAction("all");
                setSelectedStatus("all");
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Log Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
          <div className="text-sm text-gray-500">Total Logs</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-green-600">
            {logs.filter((log) => log.status === "success").length}
          </div>
          <div className="text-sm text-gray-500">Successful</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-red-600">
            {logs.filter((log) => log.status === "failure").length}
          </div>
          <div className="text-sm text-gray-500">Failed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-yellow-600">
            {logs.filter((log) => log.status === "warning").length}
          </div>
          <div className="text-sm text-gray-500">Warnings</div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.user}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getActionIcon(log.action)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.resource}
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className="text-sm text-gray-900 max-w-xs truncate"
                      title={log.details}
                    >
                      {log.details}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No logs found
            </h3>
            <p className="text-gray-500 text-sm">
              Try adjusting your filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Log Retention */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Log Retention Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retention Period
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>30 days</option>
              <option>90 days</option>
              <option>180 days</option>
              <option>1 year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archive After
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>7 days</option>
              <option>30 days</option>
              <option>90 days</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              Update Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
