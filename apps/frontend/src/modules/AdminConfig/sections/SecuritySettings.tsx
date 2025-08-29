import React, { useState } from "react";
import Button from "@/components/ui/Button";

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  status: "enabled" | "disabled";
  category: string;
  lastUpdated: string;
}

const SecuritySettings: React.FC = () => {
  const [policies] = useState<SecurityPolicy[]>([
    {
      id: "mfa",
      name: "Multi-Factor Authentication",
      description: "Require MFA for all user accounts",
      status: "enabled",
      category: "Authentication",
      lastUpdated: "2024-01-15",
    },
    {
      id: "password",
      name: "Password Policy",
      description: "Strong password requirements and expiration",
      status: "enabled",
      category: "Authentication",
      lastUpdated: "2024-01-10",
    },
    {
      id: "session",
      name: "Session Management",
      description: "Session timeout and concurrent login limits",
      status: "enabled",
      category: "Access Control",
      lastUpdated: "2024-01-12",
    },
    {
      id: "ip",
      name: "IP Whitelisting",
      description: "Restrict access to specific IP addresses",
      status: "disabled",
      category: "Network Security",
      lastUpdated: "2024-01-08",
    },
  ]);

  const [securityScore, setSecurityScore] = useState(85);

  const getStatusBadge = (status: string) => {
    return status === "enabled" ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Enabled
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Disabled
      </span>
    );
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Security Settings
          </h2>
          <p className="text-gray-600">
            Configure security policies and access controls
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          Run Security Scan
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div
            className={`text-2xl font-bold ${getSecurityScoreColor(
              securityScore
            )}`}
          >
            {securityScore}/100
          </div>
          <div className="text-sm text-gray-500">Security Score</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-green-600">
            {policies.filter((p) => p.status === "enabled").length}
          </div>
          <div className="text-sm text-gray-500">Active Policies</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-blue-600">24/7</div>
          <div className="text-sm text-gray-500">Monitoring</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-purple-600">0</div>
          <div className="text-sm text-gray-500">Active Threats</div>
        </div>
      </div>

      {/* Security Policies */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Security Policies
        </h3>
        <div className="space-y-4">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    {policy.name}
                  </h4>
                  {getStatusBadge(policy.status)}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {policy.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated:{" "}
                  {new Date(policy.lastUpdated).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                  Configure
                </Button>
                <Button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                  {policy.status === "enabled" ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Security Events
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Successful login
                </div>
                <div className="text-xs text-gray-500">
                  User: john.doe@company.com • 2 minutes ago
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Failed login attempt
                </div>
                <div className="text-xs text-gray-500">
                  IP: 192.168.1.100 • 5 minutes ago
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  Security scan completed
                </div>
                <div className="text-xs text-gray-500">
                  No vulnerabilities found • 1 hour ago
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Security Recommendations
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Enable IP Whitelisting
                </div>
                <div className="text-xs text-gray-500">
                  Restrict access to known IP addresses for enhanced security
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  MFA is enabled
                </div>
                <div className="text-xs text-gray-500">
                  Multi-factor authentication is protecting all accounts
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Update password policy
                </div>
                <div className="text-xs text-gray-500">
                  Consider increasing minimum password length
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Access Control */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Access Control
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Session Timeout
            </h4>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>4 hours</option>
              <option>8 hours</option>
            </select>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Max Login Attempts
            </h4>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>3 attempts</option>
              <option>5 attempts</option>
              <option>10 attempts</option>
            </select>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Account Lockout
            </h4>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>24 hours</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
