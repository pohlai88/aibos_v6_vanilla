import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from "../../contexts/AuthContext";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'suggestion' | 'encouragement';
}

interface AIAgentProps {
  onEscalate?: (context: string) => void;
}

const AIAgent: React.FC<AIAgentProps> = ({ onEscalate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey there! 👋 I'm your AI Buddy. Life can be messy, but I'm here to help make your work easier. What's on your mind today?",
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const friendlyResponses = [
    "Got it! Let me tidy that up for you. ✨",
    "Nice job clearing that clutter. Anything else? 🎉",
    "I'm on it! Give me a moment to organize this for you. 🧹",
    "Perfect! Let me help you sort this out. 🤝",
    "You're doing great! Let me handle this for you. 💪",
    "No worries, I've got your back on this one! 🛡️",
    "Excellent question! Let me dig into that for you. 🔍",
    "I love how you're thinking about this! Here's what I found... 💭",
    "You're absolutely right to ask about this. Let me help! 👍",
    "Great timing! I was just thinking about this too. ⏰"
  ];

  const encouragementMessages = [
    "Remember: every expert was once a beginner. You're doing amazing! 🌟",
    "Take a deep breath. You've got this! 💨",
    "Small steps lead to big changes. Keep going! 🚶‍♂️",
    "Your persistence is inspiring! Keep up the great work! 🔥",
    "Don't forget to celebrate your wins, no matter how small! 🎊",
    "You're making progress every day, even if it doesn't feel like it! 📈",
    "It's okay to take breaks. Your brain needs rest too! ☕",
    "You're not alone in this journey. I'm here to help! 🤗",
    "Every challenge is an opportunity to grow. You're handling this beautifully! 🌱",
    "Your dedication is impressive! Keep shining! ✨"
  ];

  const getRandomResponse = (type: 'friendly' | 'encouragement') => {
    const responses = type === 'friendly' ? friendlyResponses : encouragementMessages;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const simulateAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    let aiResponse: Message;

    // Check for specific keywords to provide contextual responses
    if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('stuck')) {
      aiResponse = {
        id: Date.now().toString(),
        text: "I see you need some help! Don't worry, we'll figure this out together. What specific part are you having trouble with? I'm here to guide you through it step by step. 🤝",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
    } else if (userMessage.toLowerCase().includes('tired') || userMessage.toLowerCase().includes('overwhelmed')) {
      aiResponse = {
        id: Date.now().toString(),
        text: "I hear you, and it's completely normal to feel that way! Remember: it's okay to take breaks. Maybe try the 20-20-20 rule: look at something 20 feet away for 20 seconds every 20 minutes. Your well-being matters! 💙",
        sender: 'ai',
        timestamp: new Date(),
        type: 'encouragement'
      };
    } else if (userMessage.toLowerCase().includes('thank') || userMessage.toLowerCase().includes('thanks')) {
      aiResponse = {
        id: Date.now().toString(),
        text: "You're so welcome! It's my pleasure to help make your work life a little easier. Remember, I'm here whenever you need me! 🌟",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
    } else if (userMessage.toLowerCase().includes('how are you')) {
      aiResponse = {
        id: Date.now().toString(),
        text: "I'm doing great, thanks for asking! I'm always excited to help you tackle whatever comes your way. How are you feeling today? 😊",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
    } else {
      // Default friendly response
      aiResponse = {
        id: Date.now().toString(),
        text: getRandomResponse('friendly'),
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
    }

    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    await simulateAIResponse(inputText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFeedback = (messageId: string, helpful: boolean) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, helpful } : msg
      )
    );
    // TODO: Send feedback to analytics
    console.log("Feedback:", { messageId, helpful });
  };

  const handleEscalate = () => {
    const context = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    onEscalate?.(context);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating AI Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          aria-label="Open AI Assistant"
        >
          <div className="w-6 h-6">🤖</div>
        </button>
      )}

      {/* AI Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Buddy</h3>
                    <p className="text-sm opacity-90">Life is messy, but work doesn't have to.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.type === 'encouragement'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isTyping}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ➤
                </button>
              </div>
              
              {/* Quick suggestions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {['Help me with...', 'How do I...', 'I need help with...', 'Show me...'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputText(suggestion)}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAgent; 