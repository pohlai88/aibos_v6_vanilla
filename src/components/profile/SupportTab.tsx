import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const SupportTab: React.FC = () => {
  const { user } = useAuth();
  const [activeFAQ, setActiveFAQ] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    priority: "medium",
  });
  const [submitting, setSubmitting] = useState(false);

  const faqData: FAQItem[] = [
    {
      id: "1",
      question: "How do I change my avatar?",
      answer:
        "Go to the Overview tab in your profile and click on the avatar you want to select. Your choice will be saved automatically.",
      category: "Profile",
    },
    {
      id: "2",
      question: "How do I enable two-factor authentication?",
      answer:
        'Navigate to the Security tab and click "Enable 2FA". Follow the setup instructions to complete the process.',
      category: "Security",
    },
    {
      id: "3",
      question: "I forgot my password. What should I do?",
      answer:
        'Click the "Forgot Password" link on the login page. You will receive an email with instructions to reset your password.',
      category: "Account",
    },
    {
      id: "4",
      question: "How do I update my profile information?",
      answer:
        'Go to the Overview tab and edit your full name in the Profile Information section. Click "Save Changes" to update.',
      category: "Profile",
    },
    {
      id: "5",
      question: "What are the password requirements?",
      answer:
        "Passwords must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.",
      category: "Security",
    },
    {
      id: "6",
      question: "How do I contact support?",
      answer:
        "Use the contact form in this Support tab or email support@aibos.com for assistance.",
      category: "Support",
    },
  ];

  const categories = ["All", "Profile", "Security", "Account", "Support"];

  const handleFAQToggle = (id: string) => {
    setActiveFAQ(activeFAQ === id ? null : id);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // TODO: Implement contact form submission
      console.log("Contact form submission:", contactForm);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form
      setContactForm({
        subject: "",
        message: "",
        priority: "medium",
      });

      alert("Your message has been sent successfully!");
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Help */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Help</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-blue-600 text-xl">📚</div>
              <div className="font-medium text-blue-900">Documentation</div>
            </div>
            <div className="text-sm text-blue-700">
              Browse our comprehensive guides and tutorials
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-green-600 text-xl">🎥</div>
              <div className="font-medium text-green-900">Video Tutorials</div>
            </div>
            <div className="text-sm text-green-700">
              Watch step-by-step video guides
            </div>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-purple-600 text-xl">💬</div>
              <div className="font-medium text-purple-900">Live Chat</div>
            </div>
            <div className="text-sm text-purple-700">
              Chat with our support team
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqData.map((faq) => (
            <div key={faq.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => handleFAQToggle(faq.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {faq.category}
                  </span>
                  <span className="font-medium text-gray-900">
                    {faq.question}
                  </span>
                </div>
                <div
                  className={`text-gray-400 transition-transform ${
                    activeFAQ === faq.id ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </div>
              </button>
              {activeFAQ === faq.id && (
                <div className="px-4 pb-4">
                  <div className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Contact Support
        </h2>
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={contactForm.subject}
              onChange={(e) =>
                setContactForm({ ...contactForm, subject: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={contactForm.priority}
              onChange={(e) =>
                setContactForm({ ...contactForm, priority: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low - General question</option>
              <option value="medium">Medium - Feature request</option>
              <option value="high">High - Bug report</option>
              <option value="urgent">Urgent - System issue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={contactForm.message}
              onChange={(e) =>
                setContactForm({ ...contactForm, message: e.target.value })
              }
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please provide detailed information about your issue..."
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </div>
              ) : (
                "Send Message"
              )}
            </button>

            <div className="text-sm text-gray-500">
              Response time: Usually within 24 hours
            </div>
          </div>
        </form>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          System Status
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-green-900">
                  All Systems Operational
                </div>
                <div className="text-sm text-green-700">
                  Last updated: 2 minutes ago
                </div>
              </div>
            </div>
            <div className="text-sm text-green-600 font-medium">100%</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">
                  Authentication
                </span>
              </div>
              <div className="text-xs text-gray-500">Operational</div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">
                  Database
                </span>
              </div>
              <div className="text-xs text-gray-500">Operational</div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">API</span>
              </div>
              <div className="text-xs text-gray-500">Operational</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Additional Resources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="#"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-blue-600 text-xl">📖</div>
              <div>
                <div className="font-medium text-gray-900">User Manual</div>
                <div className="text-sm text-gray-500">
                  Complete guide to using AIBOS
                </div>
              </div>
            </div>
          </a>

          <a
            href="#"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-green-600 text-xl">🔧</div>
              <div>
                <div className="font-medium text-gray-900">
                  API Documentation
                </div>
                <div className="text-sm text-gray-500">
                  Developer resources and guides
                </div>
              </div>
            </div>
          </a>

          <a
            href="#"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-purple-600 text-xl">📋</div>
              <div>
                <div className="font-medium text-gray-900">Release Notes</div>
                <div className="text-sm text-gray-500">
                  Latest updates and changes
                </div>
              </div>
            </div>
          </a>

          <a
            href="#"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-orange-600 text-xl">💡</div>
              <div>
                <div className="font-medium text-gray-900">
                  Feature Requests
                </div>
                <div className="text-sm text-gray-500">
                  Suggest new features
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupportTab;
