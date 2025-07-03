import React from "react";
import AdminConfigTab from "./AdminConfigTab";
import ViewOnlyEye from "../ui/ViewOnlyEye";
import { useAuth } from "../../contexts/AuthContext";

const DivisionDepartmentTab: React.FC = () => {
  const { user } = useAuth();
  // TODO: Replace with real admin check
  const isAdmin = user?.role === "admin";

  const features = [
    "Organizational chart visualization",
    "Department hierarchy management",
    "Role assignment interface",
    "Reporting structure configuration",
    "Member transfer between departments",
    "Department-specific permissions",
    "Team management tools",
    "Performance tracking by division",
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Division / Department
        </h2>
        <ViewOnlyEye />
        {isAdmin && (
          <a
            href="#/admin-config/division"
            className="ml-3 px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition"
            title="Edit in Admin Config"
          >
            Edit in Admin Config
          </a>
        )}
      </div>
      <AdminConfigTab
        title="Division / Department"
        description="Manage organizational structure, department hierarchy, and member assignments"
        icon="🏢"
        features={features}
        adminNote="Organizational structure management requires admin privileges. Contact your system administrator to modify department settings, assign roles, or restructure the organization."
      >
        {/* Current Organization Structure Preview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Organization Structure
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-900">
                  De Lettuce Bear Berhad
                </span>
              </div>
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">└──</span>
                  <span className="text-gray-700">Engineering Department</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Your Department
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">└──</span>
                  <span className="text-gray-700">Marketing Department</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">└──</span>
                  <span className="text-gray-700">Finance Department</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">└──</span>
                  <span className="text-gray-700">Human Resources</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">Your Role</div>
                <div className="text-sm text-gray-700">Software Developer</div>
                <div className="text-xs text-gray-500 mt-1">
                  Engineering Department
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">
                  Your Manager
                </div>
                <div className="text-sm text-gray-700">John Smith</div>
                <div className="text-xs text-gray-500 mt-1">
                  Engineering Lead
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminConfigTab>
    </div>
  );
};

export default DivisionDepartmentTab;
