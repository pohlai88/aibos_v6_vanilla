import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  variant?: 'default' | 'fun' | 'minimal';
  actionText?: string;
  onAction?: () => void;
  showIllustration?: boolean;

  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = '📭',
  variant = 'fun',
  actionText,
  onAction,
  showIllustration = true
}) => {
  const funMessages = {
    messages: "It's quiet today — maybe enjoy a coffee? ☕",
    tasks: "No pending tasks! Time to focus on you. ✨",
    notifications: "All caught up! Your inbox is zen. 🧘",
    search: "No matches… but life's messy. Want me to help dig deeper? 🔍",
    files: "Your digital desk is spotless! 📁",
    activity: "Nothing to see here yet. Your story is just beginning! 📖",
    default: "Looks like we have a clean slate here! 🎨"
  };

  const getMessage = () => {
    if (message) return message;
    
    // Try to match based on title
    const lowerTitle = title?.toLowerCase() || '';
    if (lowerTitle.includes('message')) return funMessages.messages;
    if (lowerTitle.includes('task')) return funMessages.tasks;
    if (lowerTitle.includes('notification')) return funMessages.notifications;
    if (lowerTitle.includes('search')) return funMessages.search;
    if (lowerTitle.includes('file')) return funMessages.files;
    if (lowerTitle.includes('activity')) return funMessages.activity;
    
    return funMessages.default;
  };

  const getTitle = () => {
    if (title) return title;
    return "Nothing here yet";
  };

  if (variant === 'minimal') {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">{icon}</div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">{getTitle()}</h3>
        <p className="text-gray-500 text-sm">{getMessage()}</p>
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {actionText}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'default') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{getTitle()}</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{getMessage()}</p>
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {actionText}
          </button>
        )}
      </div>
    );
  }

  // Fun variant with animated elements
  return (
    <div className="text-center py-12 px-4">
      {/* Animated illustration */}
      {showIllustration && (
        <div className="relative mb-8">
          <div className="text-8xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>
            {icon}
          </div>
          
          {/* Floating elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="absolute top-8 right-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute bottom-4 left-1/3 w-1 h-1 bg-green-400 rounded-full animate-pulse delay-2000"></div>
            <div className="absolute bottom-8 right-1/3 w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse delay-1500"></div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-md mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-3 animate-fade-in">
          {getTitle()}
        </h3>
        
        <p className="text-gray-600 mb-6 text-lg leading-relaxed animate-fade-in-delay">
          {getMessage()}
        </p>

        {/* Motivational quote */}
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <p className="text-gray-700 italic text-sm">
            "Life is messy, but work doesn't have to."
          </p>
        </div>

        {/* Action button */}
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            {actionText}
          </button>
        )}

        {/* Decorative elements */}
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-300"></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-600"></div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse delay-900"></div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
};

export default EmptyState; 