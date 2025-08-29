import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

interface QuickHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickHelpModal: React.FC<QuickHelpModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Quick help options based on current page
  const contextualHelp = {
    dashboard: [
      { title: "Customize Dashboard", icon: "🎨", link: "/help#dashboard-customization" },
      { title: "Widget Management", icon: "📊", link: "/help#widgets" },
      { title: "Quick Actions", icon: "⚡", link: "/help#quick-actions" }
    ],
    profile: [
      { title: "Update Profile", icon: "👤", link: "/help#profile-update" },
      { title: "Manage Skills", icon: "💡", link: "/help#skills-management" },
      { title: "Security Settings", icon: "🔐", link: "/help#security" }
    ],
    admin: [
      { title: "User Management", icon: "👥", link: "/help#user-management" },
      { title: "System Settings", icon: "⚙️", link: "/help#system-settings" },
      { title: "Module Management", icon: "🧩", link: "/help#module-management" }
    ],
    hrm: [
      { title: "Employee Database", icon: "👨‍💼", link: "/help#employee-database" },
      { title: "Bulk Operations", icon: "📁", link: "/help#bulk-operations" },
      { title: "Data Export", icon: "📤", link: "/help#data-export" }
    ],
    "multi-company": [
      { title: "Organization Setup", icon: "🏢", link: "/help#organization-setup" },
      { title: "Company Switching", icon: "🔄", link: "/help#company-switching" },
      { title: "Multi-Company Management", icon: "🌐", link: "/help#multi-company-management" }
    ],
    general: [
      { title: "Getting Started", icon: "🚀", link: "/help#getting-started" },
      { title: "Account Security", icon: "🛡️", link: "/help#security" },
      { title: "Common Issues", icon: "🔧", link: "/help#troubleshooting" }
    ]
  };

  const quickActions = [
    {
      title: "Reset Password",
      icon: "🔐",
      description: "Forgot your password?",
      action: () => window.open("/password-reset", "_blank")
    },
    {
      title: "Enable 2FA",
      icon: "🛡️",
      description: "Add extra security",
      action: () => window.location.href = "/profile?tab=security"
    },
    {
      title: "Update Profile",
      icon: "👤",
      description: "Edit your information",
      action: () => window.location.href = "/profile"
    },
    {
      title: "Submit Feedback",
      icon: "💬",
      description: "Share your thoughts",
      action: () => window.location.href = "/help?tab=feedback"
    }
  ];

  const commonHelpTopics = [
    { title: "Knowledge Base", icon: "📚", link: "/help?tab=knowledge-base" },
    { title: "Community Forum", icon: "💬", link: "/help?tab=community" },
    { title: "Feature Requests", icon: "💡", link: "/help?tab=feature-requests" },
    { title: "Release Notes", icon: "📋", link: "/help?tab=release-notes" },
    { title: "AI Assistant", icon: "🤖", link: "/help?tab=ai-assistant" },
    { title: "Contact Support", icon: "🎯", link: "/help?tab=feedback" }
  ];

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Support</h2>
              <p className="text-gray-600">Get help for {currentContext} or browse all resources</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] p-6">
            <div className="space-y-8">
              {/* Contextual Help */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Help for {currentContext.charAt(0).toUpperCase() + currentContext.slice(1)} 📍
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {contextualHelp[currentContext as keyof typeof contextualHelp].map((item, index) => (
                    <Link
                      key={index}
                      to={item.link}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium text-gray-900">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions ⚡
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.action();
                        onClose();
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                    >
                      <span className="text-xl">{action.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{action.title}</div>
                        <div className="text-sm text-gray-600">{action.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* All Help Resources */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  All Help Resources 📚
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {commonHelpTopics.map((topic, index) => (
                    <Link
                      key={index}
                      to={topic.link}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <span className="text-xl">{topic.icon}</span>
                      <span className="font-medium text-gray-900">{topic.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* AI Assistant CTA */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">🤖</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Need instant help?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Our AI assistant can answer questions and guide you through any task
                  </p>
                  <Link
                    to="/help?tab=ai-assistant"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                  >
                    <span>🤖</span>
                    <span>Ask AI Assistant</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Can't find what you're looking for? 
                <Link 
                  to="/help" 
                  onClick={onClose}
                  className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                >
                  Visit our full Help Center
                </Link>
              </div>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickHelpModal; 