import React, { useState } from "react";
import Button from "@/components/ui/Button";

interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft" | "archived";
  category: string;
  lastUpdated: string;
  nextReview: string;
  complianceLevel: "high" | "medium" | "low";
}

const ComplianceSettings: React.FC = () => {
  const [policies] = useState<CompliancePolicy[]>([
    {
      id: "gdpr",
      name: "GDPR Compliance",
      description: "General Data Protection Regulation compliance policy",
      status: "active",
      category: "Data Protection",
      lastUpdated: "2024-01-10",
      nextReview: "2024-04-10",
      complianceLevel: "high",
    },
    {
      id: "sox",
      name: "SOX Compliance",
      description: "Sarbanes-Oxley Act compliance requirements",
      status: "active",
      category: "Financial",
      lastUpdated: "2024-01-05",
      nextReview: "2024-07-05",
      complianceLevel: "high",
    },
    {
      id: "hipaa",
      name: "HIPAA Compliance",
      description: "Health Insurance Portability and Accountability Act",
      status: "draft",
      category: "Healthcare",
      lastUpdated: "2024-01-08",
      nextReview: "2024-03-08",
      complianceLevel: "medium",
    },
    {
      id: "iso27001",
      name: "ISO 27001",
      description: "Information Security Management System",
      status: "active",
      category: "Security",
      lastUpdated: "2024-01-12",
      nextReview: "2024-10-12",
      complianceLevel: "high",
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      draft: { color: "bg-yellow-100 text-yellow-800", label: "Draft" },
      archived: { color: "bg-gray-100 text-gray-800", label: "Archived" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getComplianceLevelBadge = (level: string) => {
    const levelConfig = {
      high: { color: "bg-red-100 text-red-800", label: "High" },
      medium: { color: "bg-yellow-100 text-yellow-800", label: "Medium" },
      low: { color: "bg-green-100 text-green-800", label: "Low" },
    };

    const config =
      levelConfig[level as keyof typeof levelConfig] || levelConfig.low;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Compliance Settings
          </h2>
          <p className="text-gray-600">
            Manage compliance policies and governance
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          + Add Policy
        </Button>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">
            {policies.length}
          </div>
          <div className="text-sm text-gray-500">Total Policies</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-green-600">
            {policies.filter((p) => p.status === "active").length}
          </div>
          <div className="text-sm text-gray-500">Active Policies</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-red-600">
            {policies.filter((p) => p.complianceLevel === "high").length}
          </div>
          <div className="text-sm text-gray-500">High Priority</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-yellow-600">
            {
              policies.filter(
                (p) =>
                  new Date(p.nextReview) <
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              ).length
            }
          </div>
          <div className="text-sm text-gray-500">Due for Review</div>
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {policy.name}
                </h3>
                <p className="text-sm text-gray-600">{policy.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(policy.status)}
                {getComplianceLevelBadge(policy.complianceLevel)}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Category</span>
                <span className="font-medium">{policy.category}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Last Updated</span>
                <span className="font-medium">
                  {new Date(policy.lastUpdated).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Next Review</span>
                <span
                  className={`font-medium ${
                    new Date(policy.nextReview) < new Date()
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {new Date(policy.nextReview).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
                View Details
              </Button>
              <Button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Checklist */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Compliance Checklist
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-900">
              Data encryption at rest and in transit
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-900">
              Regular security audits and penetration testing
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-900">
              Employee training on data protection
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-900">
              Incident response plan in place
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceSettings;
