import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  helpful?: boolean;
  confidence?: number;
  sources?: string[];
  suggestedActions?: string[];
}

interface AIResponse {
  answer: string;
  confidence: number;
  sources: string[];
  suggestedActions: string[];
  followUpQuestions: string[];
}

interface AdvancedAIAgentProps {
  onEscalate?: (context: string) => void;
  onFeedback?: (messageId: string, feedback: 'helpful' | 'not_helpful' | 'improve', details?: string) => void;
}

const AdvancedAIAgent: React.FC<AdvancedAIAgentProps> = ({ onEscalate, onFeedback }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'basic' | 'advanced'>('basic');
  const [context, setContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Knowledge base for advanced responses
  const knowledgeBase = {
    "password": {
      answer: "To reset your password:\n\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your email for reset instructions\n5. Click the reset link and create a new password\n\nPassword requirements:\n- Minimum 8 characters\n- Include uppercase and lowercase letters\n- Include numbers and special characters",
      confidence: 0.95,
      sources: ["User Manual", "Security Guide"],
      suggestedActions: ["Reset Password", "Contact Support"],
      followUpQuestions: ["What if I don't receive the email?", "Can I change my password from settings?"]
    },
    "avatar": {
      answer: "To change your avatar:\n\n1. Go to your Profile (Overview tab)\n2. Click on the avatar section\n3. Select from available avatars or upload a custom one\n4. Your choice will be saved automatically\n\nNote: Custom avatars should be square images under 2MB.",
      confidence: 0.90,
      sources: ["Profile Guide", "User Manual"],
      suggestedActions: ["Go to Profile", "Upload Custom Avatar"],
      followUpQuestions: ["What image formats are supported?", "How do I upload a custom avatar?"]
    },
    "2fa": {
      answer: "To enable Two-Factor Authentication:\n\n1. Go to the Security tab in your profile\n2. Click 'Enable 2FA'\n3. Choose your preferred method (SMS or authenticator app)\n4. Follow the setup instructions\n5. Enter the verification code\n6. Save your backup codes\n\n2FA adds an extra layer of security to your account.",
      confidence: 0.92,
      sources: ["Security Guide", "2FA Setup Guide"],
      suggestedActions: ["Enable 2FA", "View Security Settings"],
      followUpQuestions: ["What if I lose my 2FA device?", "Can I disable 2FA later?"]
    },
    "profile": {
      answer: "To update your profile information:\n\n1. Go to the Overview tab in your profile\n2. Click 'Edit Profile'\n3. Update your information:\n   - Full name\n   - Email address\n   - Job title\n   - Department\n   - Contact information\n4. Click 'Save Changes'\n\nYour profile information is visible to your team members.",
      confidence: 0.88,
      sources: ["Profile Guide", "User Manual"],
      suggestedActions: ["Edit Profile", "View Profile"],
      followUpQuestions: ["Who can see my profile?", "How do I change my email?"]
    },
    "feature": {
      answer: "To submit a feature request:\n\n1. Go to the Support tab\n2. Click on 'Feature Requests'\n3. Click 'Submit New Request'\n4. Fill in the form:\n   - Title: Brief description\n   - Description: Detailed explanation\n   - Category: Select appropriate category\n5. Click 'Submit'\n\nOther users can upvote your request. High-upvoted features are prioritized for development.",
      confidence: 0.85,
      sources: ["Feature Request Guide", "Support Documentation"],
      suggestedActions: ["Submit Feature Request", "View Existing Requests"],
      followUpQuestions: ["How are features prioritized?", "When will my feature be implemented?"]
    },
    "support": {
      answer: "I'm here to help! Here are your support options:\n\n🤖 **AI Assistant** (me): Instant answers to common questions\n📚 **Knowledge Base**: Comprehensive guides and tutorials\n💬 **Community Forum**: Ask other users for help\n🎫 **Support Tickets**: Submit issues for human support\n📋 **Release Notes**: Latest updates and changes\n\nWhat would you like help with?",
      confidence: 0.90,
      sources: ["Support Guide", "Help Documentation"],
      suggestedActions: ["Browse Knowledge Base", "Submit Ticket", "Visit Forum"],
      followUpQuestions: ["How do I contact human support?", "Where can I find tutorials?"]
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Proactive help based on user context
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        type: "ai",
        content: `Hi! I'm your advanced AI assistant. I can help you with:\n\n🔐 **Account & Security**: Passwords, 2FA, profile settings\n💡 **Features**: How to use AIBOS features\n📋 **Support**: Getting help and submitting requests\n🚀 **Getting Started**: New user guidance\n\nWhat can I help you with today?`,
        timestamp: new Date(),
        confidence: 0.95,
        sources: ["AI Assistant Guide"],
        suggestedActions: ["Browse Knowledge Base", "Submit Feature Request", "Contact Support"]
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const getAdvancedAIResponse = async (userMessage: string): Promise<AIResponse> => {
    // Simulate AI processing with more sophisticated logic
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for keywords and provide advanced responses
    for (const [keyword, data] of Object.entries(knowledgeBase)) {
      if (lowerMessage.includes(keyword)) {
        return {
          answer: data.answer,
          confidence: data.confidence,
          sources: data.sources,
          suggestedActions: data.suggestedActions,
          followUpQuestions: data.followUpQuestions
        };
      }
    }
    
    // Fuzzy matching for common misspellings
    const fuzzyMatches = {
      "passwrd": "password",
      "pass": "password",
      "avtar": "avatar",
      "profile": "profile",
      "twofa": "2fa",
      "2 factor": "2fa",
      "feature": "feature",
      "help": "support"
    };

    for (const [misspelling, correct] of Object.entries(fuzzyMatches)) {
      if (lowerMessage.includes(misspelling)) {
        const data = knowledgeBase[correct as keyof typeof knowledgeBase];
        return {
          answer: `I think you might be asking about "${correct}". ${data.answer}`,
          confidence: 0.75,
          sources: data.sources,
          suggestedActions: data.suggestedActions,
          followUpQuestions: data.followUpQuestions
        };
      }
    }
    
    // Default response with suggestions
    return {
      answer: `I understand you're asking about "${userMessage}". While I don't have a specific answer for that, here are some options:\n\n📚 **Knowledge Base**: Search our comprehensive guides\n💬 **Community Forum**: Ask other users for help\n🎫 **Support Ticket**: Submit a specific issue\n🤖 **Try rephrasing**: I might understand better with different words\n\nWould you like me to help you with any of these options?`,
      confidence: 0.60,
      sources: ["General Support Guide"],
      suggestedActions: ["Search Knowledge Base", "Submit Ticket", "Visit Forum"],
      followUpQuestions: ["Can you help me search the knowledge base?", "How do I submit a support ticket?"]
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const aiResponse = await getAdvancedAIResponse(input.trim());
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse.answer,
        timestamp: new Date(),
        confidence: aiResponse.confidence,
        sources: aiResponse.sources,
        suggestedActions: aiResponse.suggestedActions
      };
      setMessages(prev => [...prev, aiMessage]);

      // Add follow-up questions if confidence is low
      if (aiResponse.confidence < 0.7 && aiResponse.followUpQuestions.length > 0) {
        const followUpMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "ai",
          content: `💡 **Follow-up questions that might help:**\n\n${aiResponse.followUpQuestions.map(q => `• ${q}`).join('\n')}`,
          timestamp: new Date(),
          confidence: 0.8
        };
        setMessages(prev => [...prev, followUpMessage]);
      }
    } catch (error) {
      console.error("AI response error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "system",
        content: "I'm having trouble processing your request. Please try again or contact support.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFeedback = (messageId: string, helpful: boolean) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, helpful } : msg
      )
    );
    onFeedback?.(messageId, helpful ? 'helpful' : 'not_helpful');
  };

  const handleSuggestedAction = (action: string) => {
    const actionMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: `I'd like to ${action.toLowerCase()}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, actionMessage]);
    setInput(`I'd like to ${action.toLowerCase()}`);
  };

  const handleEscalate = () => {
    const context = messages.map(m => `${m.type}: ${m.content}`).join('\n');
    onEscalate?.(context);
    setIsOpen(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <>
      {/* Floating AI Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
          aria-label="Open Advanced AI Assistant"
        >
          <div className="w-6 h-6">🤖</div>
        </button>
      )}

      {/* AI Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white">
                🤖
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Advanced AI Assistant</h3>
                <p className="text-xs text-gray-500">Powered by AI • Always learning</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value as 'basic' | 'advanced')}
                className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="basic">Basic</option>
                <option value="advanced">Advanced</option>
              </select>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
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
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : message.type === 'system'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-line">{message.content}</div>
                  
                  {/* AI Message Metadata */}
                  {message.type === 'ai' && (
                    <div className="mt-3 space-y-2">
                      {/* Confidence Score */}
                      {message.confidence && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">Confidence:</span>
                          <span className={`font-medium ${getConfidenceColor(message.confidence)}`}>
                            {Math.round(message.confidence * 100)}%
                          </span>
                        </div>
                      )}
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="text-xs text-gray-500">
                          Sources: {message.sources.join(', ')}
                        </div>
                      )}
                      
                      {/* Suggested Actions */}
                      {message.suggestedActions && message.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.suggestedActions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestedAction(action)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Feedback */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleFeedback(message.id, true)}
                          className={`text-xs px-2 py-1 rounded ${
                            message.helpful === true
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          👍 Helpful
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, false)}
                          className={`text-xs px-2 py-1 rounded ${
                            message.helpful === false
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          👎 Not helpful
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Send
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInput("How do I reset my password?")}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                >
                  Password Reset
                </button>
                <button
                  type="button"
                  onClick={() => setInput("How do I enable 2FA?")}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                >
                  2FA Setup
                </button>
                <button
                  type="button"
                  onClick={() => setInput("How do I submit a feature request?")}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                >
                  Feature Request
                </button>
              </div>
              
              {/* Escalate Button */}
              <button
                type="button"
                onClick={handleEscalate}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Need human help? Submit a ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdvancedAIAgent; 