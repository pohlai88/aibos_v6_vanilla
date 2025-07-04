import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import SupportDashboard from "../../components/support/SupportDashboard";
import AdvancedAIAgent from "../../components/support/AdvancedAIAgent";

const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAIAgent, setShowAIAgent] = useState(false);

  // Handle URL parameters for direct tab navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'ai-assistant', 'knowledge-base', 'community', 'feature-requests', 'release-notes', 'feedback'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Get current page context for contextual help
  const getCurrentPageContext = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return "dashboard";
    if (path.includes("/profile")) return "profile";
    if (path.includes("/admin")) return "admin";
    if (path.includes("/hrm")) return "hrm";
    if (path.includes("/multi-company")) return "multi-company";
    return "general";
  };

  const currentContext = getCurrentPageContext();

  // Contextual help suggestions based on current page
  const contextualHelp = {
    dashboard: [
      {
        title: "Customize Your Dashboard",
        description: "Learn how to arrange widgets and personalize your dashboard",
        icon: "🎨",
        link: "#dashboard-customization"
      },
      {
        title: "Understanding Widgets",
        description: "Get to know your dashboard widgets and their features",
        icon: "📊",
        link: "#widgets"
      },
      {
        title: "Quick Actions",
        description: "Use the quick add menu for common tasks",
        icon: "⚡",
        link: "#quick-actions"
      }
    ],
    profile: [
      {
        title: "Update Your Profile",
        description: "Learn how to edit your personal information and avatar",
        icon: "👤",
        link: "#profile-update"
      },
      {
        title: "Manage Skills",
        description: "Add and organize your skills and expertise",
        icon: "💡",
        link: "#skills-management"
      },
      {
        title: "Security Settings",
        description: "Set up 2FA and manage your account security",
        icon: "🔐",
        link: "#security"
      }
    ],
    admin: [
      {
        title: "User Management",
        description: "Manage users, roles, and permissions",
        icon: "👥",
        link: "#user-management"
      },
      {
        title: "System Settings",
        description: "Configure system-wide settings and preferences",
        icon: "⚙️",
        link: "#system-settings"
      },
      {
        title: "Module Management",
        description: "Enable and configure different modules",
        icon: "🧩",
        link: "#module-management"
      }
    ],
    hrm: [
      {
        title: "Employee Database",
        description: "Add, edit, and manage employee records",
        icon: "👨‍💼",
        link: "#employee-database"
      },
      {
        title: "Bulk Operations",
        description: "Import and manage multiple employees at once",
        icon: "📁",
        link: "#bulk-operations"
      },
      {
        title: "Data Export",
        description: "Export employee data for reporting",
        icon: "📤",
        link: "#data-export"
      }
    ],
    "multi-company": [
      {
        title: "Organization Setup",
        description: "Create and configure organizations",
        icon: "🏢",
        link: "#organization-setup"
      },
      {
        title: "Company Switching",
        description: "Switch between different organizations",
        icon: "🔄",
        link: "#company-switching"
      },
      {
        title: "Multi-Company Management",
        description: "Manage multiple companies and their relationships",
        icon: "🌐",
        link: "#multi-company-management"
      }
    ],
    general: [
      {
        title: "Getting Started",
        description: "Complete guide for new users",
        icon: "🚀",
        link: "#getting-started"
      },
      {
        title: "Account Security",
        description: "Secure your account with best practices",
        icon: "🛡️",
        link: "#security"
      },
      {
        title: "Common Issues",
        description: "Solutions to frequently encountered problems",
        icon: "🔧",
        link: "#troubleshooting"
      }
    ]
  };

  const quickActions = [
    {
      title: "Reset Password",
      icon: "🔐",
      description: "Forgot your password? Reset it here",
      action: () => window.open("/password-reset", "_blank")
    },
    {
      title: "Enable 2FA",
      icon: "🛡️",
      description: "Add an extra layer of security",
      action: () => window.location.href = "/profile?tab=security"
    },
    {
      title: "Update Profile",
      icon: "👤",
      description: "Edit your personal information",
      action: () => window.location.href = "/profile"
    },
    {
      title: "Submit Feedback",
      icon: "💬",
      description: "Share your thoughts and suggestions",
      action: () => setActiveTab("feedback")
    }
  ];

  const helpCategories = [
    {
      id: "overview",
      title: "Help Overview",
      icon: "🏠",
      description: "Quick access to all help resources"
    },
    {
      id: "ai-assistant",
      title: "AI Assistant",
      icon: "🤖",
      description: "Get instant help from our AI"
    },
    {
      id: "knowledge-base",
      title: "Knowledge Base",
      icon: "📚",
      description: "Searchable documentation and guides"
    },
    {
      id: "community",
      title: "Community Forum",
      icon: "👥",
      description: "Connect with other users"
    },
    {
      id: "feature-requests",
      title: "Feature Requests",
      icon: "💡",
      description: "Suggest new features and improvements"
    },
    {
      id: "release-notes",
      title: "Release Notes",
      icon: "📋",
      description: "Latest updates and changes"
    },
    {
      id: "feedback",
      title: "Feedback",
      icon: "💬",
      description: "Share your thoughts with us"
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to AIBOS Support! 🎉
              </h2>
              <p className="text-gray-600 mb-4">
                We're here to help you get the most out of AIBOS. Whether you're a new user or a power user, 
                you'll find the resources you need right here.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  New User? Start here
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Need help? AI Assistant available
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  Community-driven support
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.title}
                    onClick={action.action}
                    className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
                  >
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <h4 className="font-medium text-gray-800 mb-1">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Contextual Help */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Help for {currentContext === 'general' ? 'General' : currentContext.charAt(0).toUpperCase() + currentContext.slice(1)} 
                {currentContext !== 'general' && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Based on your current page)
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contextualHelp[currentContext as keyof typeof contextualHelp].map((help) => (
                  <div
                    key={help.title}
                    className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => window.location.hash = help.link}
                  >
                    <div className="text-2xl mb-2">{help.icon}</div>
                    <h4 className="font-medium text-gray-800 mb-1">{help.title}</h4>
                    <p className="text-sm text-gray-600">{help.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Dashboard */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Support System Overview
              </h3>
              <SupportDashboard />
            </div>
          </div>
        );

      case "ai-assistant":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                AI Assistant 🤖
              </h2>
              <p className="text-gray-600 mb-4">
                Our AI assistant is here to help you 24/7. Ask questions, get instant answers, 
                and receive personalized guidance for your AIBOS experience.
              </p>
              <button
                onClick={() => setShowAIAgent(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-medium"
              >
                Start AI Chat
              </button>
            </div>
            
            {showAIAgent && (
              <AdvancedAIAgent onClose={() => setShowAIAgent(false)} />
            )}
          </div>
        );

      case "knowledge-base":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Knowledge Base 📚
              </h2>
              <p className="text-gray-600 mb-4">
                Comprehensive documentation, tutorials, and guides to help you master AIBOS.
              </p>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search knowledge base..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                  Search
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Getting Started", icon: "🚀", count: 15 },
                { title: "User Guide", icon: "📖", count: 45 },
                { title: "Troubleshooting", icon: "🔧", count: 23 },
                { title: "API Documentation", icon: "🔌", count: 12 },
                { title: "Best Practices", icon: "⭐", count: 18 },
                { title: "Video Tutorials", icon: "🎥", count: 8 }
              ].map((category) => (
                <div key={category.title} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h4 className="font-medium text-gray-800 mb-1">{category.title}</h4>
                  <p className="text-sm text-gray-600">{category.count} articles</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "community":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Community Forum 👥
              </h2>
              <p className="text-gray-600 mb-4">
                Connect with other AIBOS users, share experiences, and get help from the community.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  Join Discussion
                </button>
                <button className="px-6 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors">
                  View Topics
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Discussions</h3>
                <div className="space-y-3">
                  {[
                    { title: "Best practices for employee onboarding", author: "Sarah M.", replies: 12 },
                    { title: "Multi-company setup tips", author: "John D.", replies: 8 },
                    { title: "Dashboard customization ideas", author: "Mike R.", replies: 15 }
                  ].map((topic) => (
                    <div key={topic.title} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 text-sm">{topic.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        by {topic.author} • {topic.replies} replies
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Community Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Members</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Topics Today</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Posts</span>
                    <span className="font-semibold">5,892</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "feature-requests":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Feature Requests 💡
              </h2>
              <p className="text-gray-600 mb-4">
                Have an idea for a new feature? Share it with us and vote on existing requests.
              </p>
              <button className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                Submit Request
              </button>
            </div>
            
            <div className="space-y-4">
              {[
                { title: "Dark mode support", votes: 156, status: "planned" },
                { title: "Mobile app", votes: 89, status: "in-progress" },
                { title: "Advanced reporting", votes: 234, status: "planned" },
                { title: "Integration with Slack", votes: 67, status: "under-review" }
              ].map((request) => (
                <div key={request.title} className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">{request.title}</h4>
                      <p className="text-sm text-gray-600">{request.votes} votes</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "release-notes":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Release Notes 📋
              </h2>
              <p className="text-gray-600 mb-4">
                Stay updated with the latest features, improvements, and bug fixes.
              </p>
            </div>
            
            <div className="space-y-6">
              {[
                { version: "v1.2.0", date: "2024-01-15", type: "major" },
                { version: "v1.1.5", date: "2024-01-10", type: "patch" },
                { version: "v1.1.0", date: "2024-01-05", type: "minor" }
              ].map((release) => (
                <div key={release.version} className="p-6 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{release.version}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      release.type === 'major' ? 'bg-red-100 text-red-800' :
                      release.type === 'minor' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {release.type}
                    </span>
                    <span className="text-sm text-gray-600">{release.date}</span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">What's New</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Enhanced dashboard performance</li>
                      <li>• New employee management features</li>
                      <li>• Improved mobile responsiveness</li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "feedback":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Feedback 💬
              </h2>
              <p className="text-gray-600 mb-4">
                We value your feedback! Share your thoughts, suggestions, and experiences with us.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Submit Feedback</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                      <option>General Feedback</option>
                      <option>Bug Report</option>
                      <option>Feature Request</option>
                      <option>Usability Issue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Brief description of your feedback"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Please provide detailed feedback..."
                    />
                  </div>
                  <button className="w-full px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors">
                    Submit Feedback
                  </button>
                </form>
              </div>
              
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Feedback</h3>
                <div className="space-y-3">
                  {[
                    { subject: "Great user experience!", type: "positive", date: "2 days ago" },
                    { subject: "Need better mobile support", type: "suggestion", date: "1 week ago" },
                    { subject: "Dashboard loading issue", type: "bug", date: "2 weeks ago" }
                  ].map((feedback) => (
                    <div key={feedback.subject} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 text-sm">{feedback.subject}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {feedback.type} • {feedback.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Help & Support
          </h1>
          <p className="text-gray-600">
            Get help, find answers, and connect with the AIBOS community
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-2 p-4">
            {helpCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === category.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 