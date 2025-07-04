import React, { useState } from "react";
import Button from "@/components/ui/Button";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "enabled" | "disabled" | "beta";
  version: string;
  category: string;
  dependencies: string[];
  lastUpdated: string;
}

const ModuleManagement: React.FC = () => {
  const [modules] = useState<Module[]>([
    {
      id: "dashboard",
      name: "Dashboard",
      description: "Personalized dashboard with widgets and analytics",
      icon: "📊",
      status: "enabled",
      version: "1.0.0",
      category: "Core",
      dependencies: [],
      lastUpdated: "2024-01-15",
    },
    {
      id: "hrm",
      name: "HR Management",
      description: "Employee database, profiles, and HR workflows",
      icon: "👥",
      status: "enabled",
      version: "1.2.0",
      category: "HR",
      dependencies: [],
      lastUpdated: "2024-01-10",
    },
    {
      id: "multicompany",
      name: "Multi-Company",
      description: "Multi-tenant organization management",
      icon: "🏢",
      status: "enabled",
      version: "1.0.0",
      category: "Enterprise",
      dependencies: [],
      lastUpdated: "2024-01-12",
    },
    {
      id: "compliance",
      name: "Compliance",
      description: "Compliance tracking and audit trails",
      icon: "🛡️",
      status: "beta",
      version: "0.9.0",
      category: "Security",
      dependencies: ["audit"],
      lastUpdated: "2024-01-08",
    },
    {
      id: "audit",
      name: "Audit Logs",
      description: "System audit trail and logging",
      icon: "📋",
      status: "enabled",
      version: "1.1.0",
      category: "Security",
      dependencies: [],
      lastUpdated: "2024-01-05",
    },
    {
      id: "analytics",
      name: "Analytics",
      description: "Advanced analytics and reporting",
      icon: "📈",
      status: "disabled",
      version: "1.0.0",
      category: "Analytics",
      dependencies: ["dashboard"],
      lastUpdated: "2024-01-03",
    },
    {
      id: "workflow",
      name: "Workflow Engine",
      description: "Custom workflow automation",
      icon: "⚙️",
      status: "beta",
      version: "0.8.0",
      category: "Automation",
      dependencies: [],
      lastUpdated: "2024-01-01",
    },
    {
      id: "support",
      name: "Support System",
      description: "AI agent, feature requests, release notes, and analytics",
      icon: "🤖",
      status: "enabled",
      version: "1.0.0",
      category: "Support",
      dependencies: [],
      lastUpdated: "2024-01-20",
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const categories = [
    "all",
    ...Array.from(new Set(modules.map((m) => m.category))),
  ];
  const statuses = ["all", "enabled", "disabled", "beta"];

  const filteredModules = modules.filter((module) => {
    const matchesCategory =
      selectedCategory === "all" || module.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || module.status === selectedStatus;
    return matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      enabled: { color: "bg-green-100 text-green-800", label: "Enabled" },
      disabled: { color: "bg-gray-100 text-gray-800", label: "Disabled" },
      beta: { color: "bg-yellow-100 text-yellow-800", label: "Beta" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.disabled;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      Core: "bg-blue-100 text-blue-800",
      HR: "bg-purple-100 text-purple-800",
      Enterprise: "bg-indigo-100 text-indigo-800",
      Security: "bg-red-100 text-red-800",
      Analytics: "bg-green-100 text-green-800",
      Automation: "bg-orange-100 text-orange-800",
    };

    const color =
      categoryColors[category as keyof typeof categoryColors] ||
      "bg-gray-100 text-gray-800";

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}
      >
        {category}
      </span>
    );
  };

  const handleToggleModule = (moduleId: string, currentStatus: string) => {
    console.log(`Toggling module ${moduleId} from ${currentStatus}`);
    // TODO: Implement module toggle logic
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Module Management
          </h2>
          <p className="text-gray-600">
            Enable, disable, and configure system modules
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          Check for Updates
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
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
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Module Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">
            {modules.length}
          </div>
          <div className="text-sm text-gray-500">Total Modules</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-green-600">
            {modules.filter((m) => m.status === "enabled").length}
          </div>
          <div className="text-sm text-gray-500">Enabled</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-yellow-600">
            {modules.filter((m) => m.status === "beta").length}
          </div>
          <div className="text-sm text-gray-500">Beta</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-600">
            {modules.filter((m) => m.status === "disabled").length}
          </div>
          <div className="text-sm text-gray-500">Disabled</div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => (
          <div
            key={module.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{module.icon}</div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(module.status)}
                {getCategoryBadge(module.category)}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {module.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{module.description}</p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Version</span>
                <span className="font-medium">{module.version}</span>
              </div>

              {module.dependencies.length > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Dependencies</span>
                  <span className="font-medium">
                    {module.dependencies.join(", ")}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Updated</span>
                <span className="font-medium">
                  {new Date(module.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {module.status === "enabled" ? (
                <Button
                  onClick={() => handleToggleModule(module.id, module.status)}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                >
                  Disable
                </Button>
              ) : (
                <Button
                  onClick={() => handleToggleModule(module.id, module.status)}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                >
                  Enable
                </Button>
              )}

              <Button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                Configure
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🧩</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No modules found
          </h3>
          <p className="text-gray-500 text-sm">
            Try adjusting your filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default ModuleManagement;
