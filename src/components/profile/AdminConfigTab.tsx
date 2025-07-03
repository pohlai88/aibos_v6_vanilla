import React from "react";

interface AdminConfigTabProps {
  title: string;
  description: string;
  icon: string;
  features: string[];
  adminNote: string;
  children?: React.ReactNode;
}

const AdminConfigTab: React.FC<AdminConfigTabProps> = ({
  title,
  description,
  icon,
  features,
  adminNote,
  children,
}) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl">{icon}</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>

        {/* Admin Configuration Notice */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-lg">⚙️</div>
            <div>
              <div className="font-medium text-yellow-900">
                Admin Configuration Required
              </div>
              <div className="text-sm text-yellow-700 mt-1">{adminNote}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Available Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Content */}
      {children && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {children}
        </div>
      )}

      {/* Coming Soon */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Admin Configuration Portal
          </h3>
          <p className="text-gray-600 mb-4">
            Full configuration capabilities will be available in the Admin
            Configuration Portal.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <span className="text-sm font-medium">
              Phase 3 - Advanced Features
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConfigTab;
