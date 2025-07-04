import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'fun' | 'minimal';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message, 
  size = 'medium', 
  variant = 'fun' 
}) => {
  const [currentMessage, setCurrentMessage] = useState(message || '');
  const [messageIndex, setMessageIndex] = useState(0);

  const funMessages = [
    "Tidying up your workspace... 🧹",
    "Sweeping away the mess... ✨",
    "Organizing your chaos... 📁",
    "Sorting through the clutter... 🔍",
    "Making order from disorder... 🌟",
    "Cleaning up the digital desk... 💻",
    "Arranging your thoughts... 💭",
    "Putting things in their place... 📌",
    "Creating calm from chaos... 🧘",
    "Building your perfect workspace... 🏗️"
  ];

  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const spinnerSizes = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  useEffect(() => {
    if (variant === 'fun' && !message) {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % funMessages.length);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [variant, message, funMessages.length]);

  useEffect(() => {
    if (variant === 'fun' && !message) {
      setCurrentMessage(funMessages[messageIndex]);
    } else {
      setCurrentMessage(message || 'Loading...');
    }
  }, [messageIndex, message, variant, funMessages]);

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}></div>
      </div>
    );
  }

  if (variant === 'default') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}></div>
        {currentMessage && (
          <p className="text-gray-600 font-medium text-center">{currentMessage}</p>
        )}
      </div>
    );
  }

  // Fun variant with animated elements
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      {/* Animated spinner with floating elements */}
      <div className="relative">
        <div className={`animate-spin rounded-full border-4 border-blue-200 ${sizeClasses[size]}`}></div>
        <div className={`absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500 ${sizeClasses[size]}`}></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
          <div className="absolute top-1/4 right-0 transform translate-x-1/2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-300"></div>
          </div>
          <div className="absolute bottom-1/4 left-0 transform -translate-x-1/2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse delay-600"></div>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse delay-900"></div>
          </div>
        </div>
      </div>

      {/* Animated message */}
      <div className="text-center">
        <p className="text-gray-700 font-medium text-lg animate-fade-in">
          {currentMessage}
        </p>
        <div className="flex justify-center space-x-1 mt-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>

      {/* Motivational quote */}
      <div className="text-center max-w-md">
        <p className="text-gray-500 italic text-sm">
          "Life is messy, but work doesn't have to."
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner; 