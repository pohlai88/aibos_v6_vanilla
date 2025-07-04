import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const HelpTab: React.FC = () => {
  const { user } = useAuth();

  const quickHelpItems = [
    {
      title: "AI Assistant",
      description: "Get instant help from our AI-powered assistant",
      icon: "🤖",
      link: "/help?tab=ai-assistant",
      color: "bg-blue-50 border-blue-200 text-blue-700"
    },
    {
      title: "Knowledge Base",
      description: "Browse guides, tutorials, and documentation",
      icon: "📚",
      link: "/help?tab=knowledge-base",
      color: "bg-green-50 border-green-200 text-green-700"
    },
    {
      title: "Community Forum",
      description: "Connect with other users and share experiences",
      icon: "💬",
      link: "/help?tab=community",
      color: "bg-purple-50 border-purple-200 text-purple-700"
    },
    {
      title: "Feature Requests",
      description: "Suggest new features and improvements",
      icon: "💡",
      link: "/help?tab=feature-requests",
      color: "bg-yellow-50 border-yellow-200 text-yellow-700"
    },
    {
      title: "Release Notes",
      description: "Stay updated with latest changes",
      icon: "📋",
      link: "/help?tab=release-notes",
      color: "bg-indigo-50 border-indigo-200 text-indigo-700"
    },
    {
      title: "Contact Support",
      description: "Get personalized help from our team",
      icon: "🎯",
      link: "/help?tab=feedback",
      color: "bg-red-50 border-red-200 text-red-700"
    }
  ];

  const commonIssues = [
    {
      question: "How do I change my avatar?",
      answer: "Go to the Overview tab in your profile and click on the avatar you want to select. Your choice will be saved automatically.",
      category: "Profile"
    },
    {
      question: "How do I enable two-factor authentication?",
      answer: "Navigate to the Security tab and click 'Enable 2FA'. Follow the setup instructions to complete the process.",
      category: "Security"
    },
    {
      question: "I forgot my password. What should I do?",
      answer: "Click the 'Forgot Password' link on the login page. You will receive an email with instructions to reset your password.",
      category: "Account"
    },
    {
      question: "How do I update my profile information?",
      answer: "Go to the Overview tab and edit your full name in the Profile Information section. Click 'Save Changes' to update.",
      category: "Profile"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Help & Support Center</h2>
        <p className="text-gray-600">
          Get help, find answers, and learn how to use AIBOS effectively
        </p>
      </div>

      {/* Quick Access to Help Center */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Centralized Help Center
          </h3>
          <p className="text-gray-600 mb-6">
            We've consolidated all help and support resources into one comprehensive center for better organization and easier access.
          </p>
          <Link
            to="/help"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            <span>🚀</span>
            Go to Help Center
          </Link>
        </div>
      </div>

      {/* Quick Help Options */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Help Options
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickHelpItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className={`block p-6 rounded-lg border-2 hover:shadow-md transition-all duration-200 ${item.color}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{item.icon}</span>
                <h4 className="font-semibold">{item.title}</h4>
              </div>
              <p className="text-sm opacity-80">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Common Issues */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Common Issues
        </h3>
        <div className="space-y-4">
          {commonIssues.map((issue, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {issue.category}
                </span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{issue.question}</h4>
                  <p className="text-sm text-gray-600">{issue.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Still Need Help?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📧</span>
            <div>
              <div className="font-medium text-gray-900">Email Support</div>
              <div className="text-sm text-gray-600">support@aibos.com</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕒</span>
            <div>
              <div className="font-medium text-gray-900">Response Time</div>
              <div className="text-sm text-gray-600">Within 24 hours</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpTab; 