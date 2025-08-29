import React, { useState, useEffect } from 'react';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  variant?: 'default' | 'fun';
  showSuggestions?: boolean;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  onSearch,
  onClear,
  variant = 'fun',
  showSuggestions = true,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);

  const funPlaceholders = [
    "What are you looking for? 🔍",
    "Search through the chaos... ✨",
    "Let me help you find that... 🕵️",
    "Digging through your workspace... ⛏️",
    "Hunting for answers... 🎯",
    "Exploring your digital space... 🚀",
    "Finding order in the mess... 📁",
    "What's on your mind? 💭"
  ];

  const [currentPlaceholder, setCurrentPlaceholder] = useState(funPlaceholders[0]);

  useEffect(() => {
    if (variant === 'fun') {
      const interval = setInterval(() => {
        setCurrentPlaceholder(funPlaceholders[Math.floor(Math.random() * funPlaceholders.length)]);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [variant, funPlaceholders]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    onSearch(searchQuery);
    
    // Show no results message after a delay if query is long enough
    if (searchQuery.length > 2) {
      setTimeout(() => {
        setShowNoResults(true);
      }, 2000);
    } else {
      setShowNoResults(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowNoResults(false);
    onClear?.();
  };

  const getNoResultsMessage = () => {
    const messages = [
      "No matches… but life's messy. Want me to help dig deeper? 🔍",
      "Hmm, not finding that. Maybe try different words? 🤔",
      "Nothing here yet. Want to try a different search? 🔄",
      "No results found. Let's explore together! 🗺️",
      "Empty search results. Time to get creative! 🎨"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const suggestions = [
    "How do I...",
    "Where can I find...",
    "Help me with...",
    "Show me...",
    "I need help with..."
  ];

  if (variant === 'default') {
    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {query && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Fun variant
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={currentPlaceholder}
          className="w-full px-4 py-3 pl-12 pr-12 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 text-lg"
        />
        
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <div className="text-xl">🔍</div>
        </div>
        
        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform duration-200"
          >
            <div className="text-xl hover:text-red-500 transition-colors">✕</div>
          </button>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && isFocused && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-2">
          <div className="text-sm text-gray-500 mb-2 px-3">Quick suggestions:</div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSearch(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-700 hover:text-blue-600"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showNoResults && query.length > 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-lg z-10 p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-gray-700 font-medium mb-2">{getNoResultsMessage()}</p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => handleSearch('help')}
                className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors"
              >
                Get Help
              </button>
              <button
                onClick={() => handleSearch('tutorial')}
                className="px-3 py-1 bg-purple-500 text-white rounded-full text-sm hover:bg-purple-600 transition-colors"
              >
                View Tutorials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Motivational quote when focused */}
      {isFocused && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-3">
          <p className="text-gray-600 italic text-sm text-center">
            "Life is messy, but work doesn't have to."
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchInput; 