import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface ProactiveSuggestion {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  priority: "low" | "medium" | "high";
  context: string;
}

interface ProactiveHelpProps {
  currentPage?: string;
  userAction?: string;
  onSuggestionClick?: (suggestion: ProactiveSuggestion) => void;
}

const ProactiveHelp: React.FC<ProactiveHelpProps> = ({
  currentPage,
  userAction,
  onSuggestionClick
}) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateSuggestions();
  }, [currentPage, userAction]);

  const generateSuggestions = () => {
    const newSuggestions: ProactiveSuggestion[] = [];

    // Context-based suggestions
    if (currentPage === "profile") {
      newSuggestions.push({
        id: "profile-avatar",
        title: "Change Your Avatar",
        description: "Personalize your profile with a custom avatar",
        icon: "👤",
        action: () => onSuggestionClick?.(newSuggestions[newSuggestions.length - 1]),
        priority: "medium",
        context: "profile"
      });
    }

    if (currentPage === "security") {
      newSuggestions.push({
        id: "security-2fa",
        title: "Enable Two-Factor Authentication",
        description: "Add an extra layer of security to your account",
        icon: "🛡️",
        action: () => onSuggestionClick?.(newSuggestions[newSuggestions.length - 1]),
        priority: "high",
        context: "security"
      });
    }

    if (userAction === "failed-login") {
      newSuggestions.push({
        id: "password-reset",
        title: "Reset Your Password",
        description: "Having trouble logging in? Reset your password",
        icon: "🔐",
        action: () => onSuggestionClick?.(newSuggestions[newSuggestions.length - 1]),
        priority: "high",
        context: "authentication"
      });
    }

    // General suggestions for new users
    if (!user?.created_at || new Date(user.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      newSuggestions.push({
        id: "getting-started",
        title: "Getting Started Guide",
        description: "Learn the basics of AIBOS in 5 minutes",
        icon: "🚀",
        action: () => onSuggestionClick?.(newSuggestions[newSuggestions.length - 1]),
        priority: "medium",
        context: "onboarding"
      });
    }

    // Feature discovery suggestions
    if (currentPage === "dashboard") {
      newSuggestions.push({
        id: "quick-actions",
        title: "Quick Actions",
        description: "Discover shortcuts to common tasks",
        icon: "⚡",
        action: () => onSuggestionClick?.(newSuggestions[newSuggestions.length - 1]),
        priority: "low",
        context: "discovery"
      });
    }

    // Filter out dismissed suggestions
    const filteredSuggestions = newSuggestions.filter(
      suggestion => !dismissedSuggestions.has(suggestion.id)
    );

    setSuggestions(filteredSuggestions);
  };

  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => {
      const newSet = new Set(prev);
      newSet.add(suggestionId);
      return newSet;
    });
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 border-red-200 text-red-700";
      case "medium":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "low":
        return "bg-gray-50 border-gray-200 text-gray-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 max-w-sm z-40">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className={`mb-3 p-4 rounded-lg border shadow-lg ${getPriorityColor(suggestion.priority)}`}
        >
          <div className="flex items-start gap-3">
            <div className="text-xl">{suggestion.icon}</div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">{suggestion.title}</h4>
              <p className="text-sm opacity-90 mb-3">{suggestion.description}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={suggestion.action}
                  className="px-3 py-1 bg-white bg-opacity-20 rounded text-sm font-medium hover:bg-opacity-30 transition-colors"
                >
                  Learn More
                </button>
                <button
                  onClick={() => handleDismiss(suggestion.id)}
                  className="px-3 py-1 text-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProactiveHelp; 