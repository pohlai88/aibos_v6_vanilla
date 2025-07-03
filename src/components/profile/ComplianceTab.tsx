import React from "react";
import AdminConfigTab from "./AdminConfigTab";
import ViewOnlyEye from "../ui/ViewOnlyEye";
import { useAuth } from "../../contexts/AuthContext";

const ComplianceTab: React.FC = () => {
  const { user } = useAuth();
  // TODO: Replace with real admin check
  const isAdmin = user?.role === "admin";

  const features = [
    "Document management",
    "Policy versioning",
    "Compliance dashboard",
    "Audit trail integration",
    "Certification tracking",
    "Regulatory reporting",
    "Policy enforcement",
    "Compliance monitoring",
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Compliance</h2>
        <ViewOnlyEye />
        {isAdmin && (
          <a
            href="#/admin-config/compliance"
            className="ml-3 px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition"
            title="Edit in Admin Config"
          >
            Edit in Admin Config
          </a>
        )}
      </div>
      <AdminConfigTab
        title="Compliance"
        description="Manage compliance documentation, policies, and regulatory requirements"
        icon="📋"
        features={features}
        adminNote="Compliance documentation and policies are organizational requirements. Contact your system administrator to access compliance documents, update policies, or generate regulatory reports."
      >
        {/* Compliance Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="font-medium text-green-900">
                    GDPR Compliance
                  </div>
                </div>
                <div className="text-sm text-green-700">
                  All requirements met
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Last reviewed: 2 weeks ago
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="font-medium text-green-900">
                    Data Protection
                  </div>
                </div>
                <div className="text-sm text-green-700">
                  Encryption and security measures active
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Last reviewed: 1 month ago
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="font-medium text-yellow-900">
                    SOC 2 Type II
                  </div>
                </div>
                <div className="text-sm text-yellow-700">
                  In progress - 75% complete
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  Target completion: Q2 2025
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="font-medium text-blue-900">ISO 27001</div>
                </div>
                <div className="text-sm text-blue-700">Planning phase</div>
                <div className="text-xs text-blue-600 mt-1">
                  Target: Q3 2025
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Documents */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available Documents
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-blue-600 text-lg">📄</div>
                <div>
                  <div className="font-medium text-gray-900">
                    Privacy Policy
                  </div>
                  <div className="text-sm text-gray-500">
                    Last updated: January 2025
                  </div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-green-600 text-lg">📋</div>
                <div>
                  <div className="font-medium text-gray-900">
                    Terms of Service
                  </div>
                  <div className="text-sm text-gray-500">
                    Last updated: January 2025
                  </div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-purple-600 text-lg">🔒</div>
                <div>
                  <div className="font-medium text-gray-900">
                    Data Processing Agreement
                  </div>
                  <div className="text-sm text-gray-500">
                    Last updated: December 2024
                  </div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-orange-600 text-lg">📊</div>
                <div>
                  <div className="font-medium text-gray-900">
                    Security Policy
                  </div>
                  <div className="text-sm text-gray-500">
                    Last updated: November 2024
                  </div>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View
              </button>
            </div>
          </div>
        </div>

        {/* Compliance Calendar */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Compliance Events
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-blue-600 text-lg">📅</div>
                <div>
                  <div className="font-medium text-blue-900">
                    GDPR Annual Review
                  </div>
                  <div className="text-sm text-blue-700">
                    Annual compliance assessment
                  </div>
                </div>
              </div>
              <div className="text-sm text-blue-600 font-medium">
                March 15, 2025
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-yellow-600 text-lg">📅</div>
                <div>
                  <div className="font-medium text-yellow-900">SOC 2 Audit</div>
                  <div className="text-sm text-yellow-700">
                    External security audit
                  </div>
                </div>
              </div>
              <div className="text-sm text-yellow-600 font-medium">
                April 30, 2025
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-gray-600 text-lg">📅</div>
                <div>
                  <div className="font-medium text-gray-900">Policy Review</div>
                  <div className="text-sm text-gray-700">
                    Quarterly policy updates
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 font-medium">
                June 15, 2025
              </div>
            </div>
          </div>
        </div>
      </AdminConfigTab>
    </div>
  );
};

export default ComplianceTab;
