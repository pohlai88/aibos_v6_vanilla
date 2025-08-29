import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AIAgent from "./AIAgent";
import AdvancedAIAgent from "./AdvancedAIAgent";
import ReleaseNotes from "./ReleaseNotes";
import FeatureRequests from "./FeatureRequests";
import SupportAnalytics from "./SupportAnalytics";
import KnowledgeBase from "./KnowledgeBase";
import CommunityForum from "./CommunityForum";

interface SupportDashboardProps {
  onNavigate?: (section: string) => void;
}

const SupportDashboard: React.FC<SupportDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [ticketContext, setTicketContext] = useState("");

  // Proactive help suggestions based on user behavior
  const [proactiveSuggestions, setProactiveSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Simulate proactive help based on user context
    const suggestions = [
      "Need help with your profile? Check our quick guide",
      "New to AIBOS? Start with our getting started tutorial",
      "Having trouble? Our AI assistant can help instantly"
    ];
    setProactiveSuggestions(suggestions);
  }, []);

  const handleAIEscalate = (context: string) => {
    setTicketContext(context);
    setActiveSection("tickets");
  };

  const sections = [
    {
      id: "overview",
      title: "Support Overview",
      icon: "🏠",
      description: "Quick access to all support resources"
    },
    {
      id: "ai-agent",
      title: "AI Assistant",
      icon: "🤖",
      description: "Get instant help from our AI"
    },
    {
      id: "knowledge-base",
      title: "Knowledge Base",
      icon: "📚",
      description: "Guides, tutorials, and documentation"
    },
    {
      id: "forum",
      title: "Community Forum",
      icon: "💬",
      description: "Connect with other users"
    },
    {
      id: "tickets",
      title: "Support Tickets",
      icon: "🎫",
      description: "Submit and track support requests"
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
      id: "analytics",
      title: "Analytics",
      icon: "📊",
      description: "Support performance insights"
    }
  ];

  const quickActions = [
    {
      title: "Reset Password",
      icon: "🔐",
      action: () => onNavigate?.("password-reset"),
      color: "bg-blue-50 border-blue-200 text-blue-700"
    },
    {
      title: "Change Avatar",
      icon: "👤",
      action: () => onNavigate?.("profile"),
      color: "bg-green-50 border-green-200 text-green-700"
    },
    {
      title: "Enable 2FA",
      icon: "🛡️",
      action: () => onNavigate?.("security"),
      color: "bg-purple-50 border-purple-200 text-purple-700"
    },
    {
      title: "Submit Bug Report",
      icon: "🐛",
      action: () => setActiveSection("tickets"),
      color: "bg-red-50 border-red-200 text-red-700"
    }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "ai-agent":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant</h2>
              <p className="text-gray-600">Get instant help from our AI-powered assistant</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold">Advanced AI Assistant</h3>
                <p className="text-gray-600">Our AI assistant provides intelligent, contextual help with confidence scoring and suggested actions</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <button
                    onClick={() => setShowAIAgent(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Open Basic AI Assistant
                  </button>
                  <button
                    onClick={() => setShowAIAgent(true)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Open Advanced AI Assistant
                  </button>
                </div>
              </div>
            </div>
            <AdvancedAIAgent onEscalate={handleAIEscalate} />
          </div>
        );

      case "knowledge-base":
        return <KnowledgeBase />;

      case "forum":
        return <CommunityForum />;

      case "tickets":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Support Tickets</h2>
              <p className="text-gray-600">Submit and track support requests</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-6">
                {ticketContext && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Context from AI Assistant</h4>
                    <p className="text-blue-800 text-sm whitespace-pre-line">{ticketContext}</p>
                  </div>
                )}
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="low">Low - General question</option>
                      <option value="medium">Medium - Feature request</option>
                      <option value="high">High - Bug report</option>
                      <option value="urgent">Urent - System issue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please provide detailed information about your issue..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Ticket
                  </button>
                </form>
              </div>
            </div>
          </div>
        );

      case "feature-requests":
        return <FeatureRequests />;

      case "release-notes":
        return <ReleaseNotes />;

      case "analytics":
        return <SupportAnalytics />;

      default:
        return (
          <div className="space-y-8">
            {/* Proactive Help */}
            {proactiveSuggestions.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Proactive Help</h3>
                <div className="space-y-2">
                  {proactiveSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${action.color}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{action.icon}</span>
                      <span className="font-medium">{action.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Support Channels */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Support Channels</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.slice(1).map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{section.icon}</span>
                      <h3 className="font-semibold text-gray-900">{section.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-green-900">All Systems Operational</div>
                      <div className="text-sm text-green-700">Last updated: 2 minutes ago</div>
                    </div>
                  </div>
                  <div className="text-sm text-green-600 font-medium">100%</div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {renderSection()}
      </div>

      {/* AI Agent */}
      <AIAgent onEscalate={handleAIEscalate} />
    </div>
  );
};

export default SupportDashboard; 