import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

interface SystemSetting {
  id: string;
  name: string;
  description: string;
  value: string | boolean | number;
  type: "text" | "number" | "boolean" | "select";
  category: string;
  options?: string[];
}

interface SearchExclusion {
  id: number;
  keyword: string;
  path_pattern?: string;
}

const SystemSettings: React.FC = () => {
  const [settings] = useState<SystemSetting[]>([
    {
      id: "company_name",
      name: "Company Name",
      description: "The name of your organization",
      value: "AIBOS Corporation",
      type: "text",
      category: "General",
    },
    {
      id: "timezone",
      name: "Default Timezone",
      description: "System default timezone",
      value: "UTC",
      type: "select",
      category: "General",
      options: ["UTC", "EST", "PST", "GMT", "CET"],
    },
    {
      id: "language",
      name: "Default Language",
      description: "System default language",
      value: "English",
      type: "select",
      category: "General",
      options: ["English", "Spanish", "French", "German", "Chinese"],
    },
    {
      id: "maintenance_mode",
      name: "Maintenance Mode",
      description: "Enable maintenance mode to restrict access",
      value: false,
      type: "boolean",
      category: "System",
    },
    {
      id: "debug_mode",
      name: "Debug Mode",
      description: "Enable debug logging and error reporting",
      value: false,
      type: "boolean",
      category: "System",
    },
    {
      id: "max_file_size",
      name: "Maximum File Upload Size",
      description: "Maximum file size for uploads (MB)",
      value: 10,
      type: "number",
      category: "File Management",
    },
    {
      id: "allowed_file_types",
      name: "Allowed File Types",
      description: "Comma-separated list of allowed file extensions",
      value: "jpg,jpeg,png,pdf,doc,docx,xls,xlsx",
      type: "text",
      category: "File Management",
    },
    {
      id: "email_notifications",
      name: "Email Notifications",
      description: "Enable system email notifications",
      value: true,
      type: "boolean",
      category: "Notifications",
    },
    {
      id: "backup_frequency",
      name: "Backup Frequency",
      description: "How often to perform automatic backups",
      value: "daily",
      type: "select",
      category: "Backup",
      options: ["hourly", "daily", "weekly", "monthly"],
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hasChanges, setHasChanges] = useState(false);

  // --- Search Exclusions State ---
  const [exclusions, setExclusions] = useState<SearchExclusion[]>([]);
  const [exclusionLoading, setExclusionLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newPath, setNewPath] = useState("");

  const categories = [
    "all",
    ...Array.from(new Set(settings.map((s) => s.category))),
  ];

  const filteredSettings = settings.filter(
    (setting) =>
      selectedCategory === "all" || setting.category === selectedCategory
  );

  const renderSettingValue = (setting: SystemSetting) => {
    switch (setting.type) {
      case "text":
        return (
          <input
            type="text"
            defaultValue={setting.value as string}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={() => setHasChanges(true)}
          />
        );
      case "number":
        return (
          <input
            type="number"
            defaultValue={setting.value as number}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={() => setHasChanges(true)}
          />
        );
      case "boolean":
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              defaultChecked={setting.value as boolean}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              onChange={() => setHasChanges(true)}
            />
            <span className="ml-2 text-sm text-gray-700">
              {setting.value ? "Enabled" : "Disabled"}
            </span>
          </label>
        );
      case "select":
        return (
          <select
            defaultValue={setting.value as string}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={() => setHasChanges(true)}
          >
            {setting.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      default:
        return <span className="text-gray-500">Unknown type</span>;
    }
  };

  const handleSave = () => {
    // TODO: Implement save logic
    console.log("Saving settings...");
    setHasChanges(false);
  };

  const handleReset = () => {
    // TODO: Implement reset logic
    console.log("Resetting settings...");
    setHasChanges(false);
  };

  // Fetch exclusions from Supabase
  const fetchExclusions = useCallback(async () => {
    setExclusionLoading(true);
    const { data, error } = await supabase
      .from("search_exclusions")
      .select("id, keyword, path_pattern")
      .order("id", { ascending: true });
    if (!error) setExclusions(data || []);
    setExclusionLoading(false);
  }, []);

  useEffect(() => {
    fetchExclusions();
  }, [fetchExclusions]);

  // Add new exclusion
  const handleAddExclusion = async () => {
    if (!newKeyword.trim() && !newPath.trim()) return;
    await supabase.from("search_exclusions").insert({
      keyword: newKeyword.trim(),
      path_pattern: newPath.trim() || null,
    });
    setNewKeyword("");
    setNewPath("");
    fetchExclusions();
  };

  // Remove exclusion
  const handleRemoveExclusion = async (id: number) => {
    await supabase.from("search_exclusions").delete().eq("id", id);
    fetchExclusions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">
            Configure general system settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Reset
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-lg ${
              hasChanges
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Filter by Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSettings.map((setting) => (
          <div
            key={setting.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {setting.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {setting.description}
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {setting.category}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value
                </label>
                {renderSettingValue(setting)}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Setting ID: {setting.id}</span>
                <span>Type: {setting.type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSettings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚙️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No settings found
          </h3>
          <p className="text-gray-500 text-sm">
            Try selecting a different category
          </p>
        </div>
      )}

      {/* System Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-500">Version</div>
            <div className="text-lg font-semibold text-gray-900">6.0.0</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Build Date</div>
            <div className="text-lg font-semibold text-gray-900">
              2024-01-15
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Environment</div>
            <div className="text-lg font-semibold text-gray-900">
              Production
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Database</div>
            <div className="text-lg font-semibold text-gray-900">
              PostgreSQL 15
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-sm font-medium text-gray-900">Clear Cache</div>
          </Button>
          <Button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">💾</div>
            <div className="text-sm font-medium text-gray-900">
              Create Backup
            </div>
          </Button>
          <Button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium text-gray-900">
              System Health Check
            </div>
          </Button>
        </div>
      </div>

      {/* Search Exclusions Control (Live) */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <h3 className="font-semibold text-lg text-yellow-800 mb-2">Search Exclusions</h3>
        <p className="text-yellow-700 text-sm mb-2">
          Admins can manage forbidden keywords and paths for global search here. These exclusions prevent certain content from appearing in search results, even if it exists in the system.
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Keyword (e.g. pornography)"
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Path pattern (optional)"
            value={newPath}
            onChange={e => setNewPath(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded"
          />
          <Button onClick={handleAddExclusion} className="bg-yellow-600 text-white px-3 py-1 rounded">
            Add
          </Button>
        </div>
        {exclusionLoading ? (
          <div className="text-yellow-700 text-sm">Loading exclusions...</div>
        ) : exclusions.length === 0 ? (
          <div className="text-yellow-700 text-sm">No exclusions set.</div>
        ) : (
          <ul className="list-disc pl-6 text-yellow-800 text-sm">
            {exclusions.map(ex => (
              <li key={ex.id} className="flex items-center gap-2">
                <span>{ex.keyword || <em>(no keyword)</em>}</span>
                {ex.path_pattern && <span className="ml-2 text-xs text-yellow-600">[{ex.path_pattern}]</span>}
                <Button onClick={() => handleRemoveExclusion(ex.id)} className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded">
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 text-xs text-yellow-700">
          <strong>Note:</strong> This list is live and will be used by the global search engine. More advanced controls and audit logging will be added in future upgrades.
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
