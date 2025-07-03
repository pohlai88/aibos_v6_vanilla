import React, { useState, useEffect } from "react";
import {
  notificationService,
  Notification,
  NotificationTemplate,
} from "../../../lib/notificationService";
import { supabase } from "../../../lib/supabase";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

const NotificationManagement: React.FC = () => {
  // State for notification creation
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info" as Notification["type"],
    priority: "medium" as Notification["priority"],
    targetType: "global" as Notification["target_type"],
    targetIds: [] as string[],
    expiresAt: "",
  });

  // State for templates
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateForm, setTemplateForm] = useState({
    name: "",
    titleTemplate: "",
    messageTemplate: "",
    type: "info" as Notification["type"],
    priority: "medium" as Notification["priority"],
    targetType: "global" as Notification["target_type"],
    isActive: true,
  });

  // State for users and groups
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"send" | "templates" | "settings">(
    "send"
  );
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load templates
      const templatesData =
        await notificationService.getNotificationTemplates();
      setTemplates(templatesData);

      // Load users (simplified - you might want to add pagination)
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .limit(100);
      setUsers(usersData || []);

      // Load groups (if you have a groups table)
      const { data: groupsData } = await supabase
        .from("departments")
        .select("id, name, description")
        .limit(50);
      setGroups(groupsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      setError("Title and message are required");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      let result: Notification | Notification[];

      if (notificationForm.targetType === "global") {
        result = await notificationService.sendGlobal(
          notificationForm.title,
          notificationForm.message,
          notificationForm.type,
          notificationForm.priority,
          { expiresAt: notificationForm.expiresAt }
        );
      } else if (notificationForm.targetType === "user") {
        result = await notificationService.sendToUsers(
          selectedUsers,
          notificationForm.title,
          notificationForm.message,
          notificationForm.type,
          notificationForm.priority,
          { expiresAt: notificationForm.expiresAt }
        );
      } else {
        // For groups, you'd need to get user IDs from the group
        const groupUserIds = await getGroupUserIds(selectedGroups);
        result = await notificationService.sendToUsers(
          groupUserIds,
          notificationForm.title,
          notificationForm.message,
          notificationForm.type,
          notificationForm.priority,
          { expiresAt: notificationForm.expiresAt }
        );
      }

      setSuccess(
        `Notification sent successfully! ${
          Array.isArray(result)
            ? `${result.length} notifications created`
            : "1 notification created"
        }`
      );

      // Reset form
      setNotificationForm({
        title: "",
        message: "",
        type: "info",
        priority: "medium",
        targetType: "global",
        targetIds: [],
        expiresAt: "",
      });
      setSelectedUsers([]);
      setSelectedGroups([]);
    } catch (error) {
      console.error("Error sending notification:", error);
      setError("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const getGroupUserIds = async (groupIds: string[]): Promise<string[]> => {
    // This is a simplified implementation
    // You might want to implement this based on your actual group structure
    const { data } = await supabase
      .from("employee_profiles")
      .select("id")
      .in("department", groupIds);

    return data?.map((user) => user.id) || [];
  };

  const handleCreateTemplate = async () => {
    if (
      !templateForm.name.trim() ||
      !templateForm.titleTemplate.trim() ||
      !templateForm.messageTemplate.trim()
    ) {
      setError(
        "Template name, title template, and message template are required"
      );
      return;
    }

    try {
      await notificationService.createNotificationTemplate(templateForm);
      setSuccess("Template created successfully!");
      setTemplateForm({
        name: "",
        titleTemplate: "",
        messageTemplate: "",
        type: "info",
        priority: "medium",
        targetType: "global",
        isActive: true,
      });
      loadData(); // Reload templates
    } catch (error) {
      console.error("Error creating template:", error);
      setError("Failed to create template");
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setNotificationForm({
        ...notificationForm,
        title: template.title_template,
        message: template.message_template,
        type: template.type,
        priority: template.priority,
        targetType: template.target_type,
      });
      setSelectedTemplate(templateId);
    }
  };

  const getTypeIcon = (type: Notification["type"]) => {
    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      system: "🔧",
    };
    return icons[type];
  };

  const getPriorityColor = (priority: Notification["priority"]) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colors[priority];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading notification management...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Notification Management
          </h2>
          <p className="text-gray-600">
            Send notifications to users and manage notification templates
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-400">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("send")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "send"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Send Notifications
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "templates"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "settings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Send Notifications Tab */}
      {activeTab === "send" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Send Notification</h3>

            {/* Template Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Use Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    title: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notification title"
              />
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                value={notificationForm.message}
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    message: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notification message"
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={notificationForm.type}
                  onChange={(e) =>
                    setNotificationForm({
                      ...notificationForm,
                      type: e.target.value as Notification["type"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={notificationForm.priority}
                  onChange={(e) =>
                    setNotificationForm({
                      ...notificationForm,
                      priority: e.target.value as Notification["priority"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Target Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target
              </label>
              <select
                value={notificationForm.targetType}
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    targetType: e.target.value as Notification["target_type"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="global">All Users (Global)</option>
                <option value="user">Specific Users</option>
                <option value="group">User Groups</option>
              </select>
            </div>

            {/* Expiration */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires At (Optional)
              </label>
              <input
                type="datetime-local"
                value={notificationForm.expiresAt}
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    expiresAt: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendNotification}
              disabled={
                sending ||
                !notificationForm.title.trim() ||
                !notificationForm.message.trim()
              }
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>

          {/* Target Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Select Targets</h3>

            {notificationForm.targetType === "user" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Users
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(
                              selectedUsers.filter((id) => id !== user.id)
                            );
                          }
                        }}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">
                          {user.full_name || user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {selectedUsers.length} user(s) selected
                </div>
              </div>
            )}

            {notificationForm.targetType === "group" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Groups
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {groups.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroups([...selectedGroups, group.id]);
                          } else {
                            setSelectedGroups(
                              selectedGroups.filter((id) => id !== group.id)
                            );
                          }
                        }}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{group.name}</div>
                        {group.description && (
                          <div className="text-sm text-gray-500">
                            {group.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {selectedGroups.length} group(s) selected
                </div>
              </div>
            )}

            {notificationForm.targetType === "global" && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🌍</div>
                <div className="font-medium">Global Notification</div>
                <div className="text-sm">
                  This notification will be sent to all users
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          {/* Create Template Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Create Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., System Maintenance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Type
                </label>
                <select
                  value={templateForm.targetType}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      targetType: e.target.value as Notification["target_type"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="global">Global</option>
                  <option value="user">User</option>
                  <option value="group">Group</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title Template *
              </label>
              <input
                type="text"
                value={templateForm.titleTemplate}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    titleTemplate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., System Maintenance - {date}"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Template *
              </label>
              <textarea
                value={templateForm.messageTemplate}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    messageTemplate: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Scheduled maintenance will occur on {date} from {start_time} to {end_time}."
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={templateForm.type}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      type: e.target.value as Notification["type"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={templateForm.priority}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      priority: e.target.value as Notification["priority"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={templateForm.isActive}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      isActive: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <button
              onClick={handleCreateTemplate}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
            >
              Create Template
            </button>
          </div>

          {/* Templates List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">
              Notification Templates
            </h3>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {getTypeIcon(template.type)}
                    </span>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-500">
                        {template.titleTemplate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        template.priority
                      )}`}
                    >
                      {template.priority}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No templates created yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-blue-400">ℹ️</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    RLS Integration
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    All notifications are automatically filtered by Row Level
                    Security (RLS) policies. Users will only see notifications
                    they have permission to access based on their organization,
                    role, and group memberships.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-green-400">✅</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">
                    Real-time Notifications
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    Notifications are delivered in real-time using Supabase's
                    real-time subscriptions. Users will receive instant
                    notifications without needing to refresh the page.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Database Schema Required
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Make sure to run the notification database migrations to
                    create the required tables (notifications,
                    notification_templates, notification_settings) with proper
                    RLS policies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;
