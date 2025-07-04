import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface AnalyticsData {
  aiResponses: {
    total: number;
    helpful: number;
    notHelpful: number;
    satisfactionRate: number;
  };
  supportChannels: {
    ai: number;
    tickets: number;
    forum: number;
    knowledgeBase: number;
  };
  commonIssues: Array<{
    topic: string;
    count: number;
    percentage: number;
  }>;
  responseTimes: {
    ai: number;
    tickets: number;
  };
  userSatisfaction: {
    overall: number;
    ai: number;
    human: number;
  };
}

const SupportAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    // Simulate analytics data
    const mockData: AnalyticsData = {
      aiResponses: {
        total: 1247,
        helpful: 1123,
        notHelpful: 124,
        satisfactionRate: 90.1
      },
      supportChannels: {
        ai: 1247,
        tickets: 89,
        forum: 156,
        knowledgeBase: 234
      },
      commonIssues: [
        { topic: "Password Reset", count: 156, percentage: 12.5 },
        { topic: "Avatar Change", count: 134, percentage: 10.8 },
        { topic: "2FA Setup", count: 98, percentage: 7.9 },
        { topic: "Profile Update", count: 87, percentage: 7.0 },
        { topic: "Feature Request", count: 76, percentage: 6.1 }
      ],
      responseTimes: {
        ai: 1.2,
        tickets: 4.5
      },
      userSatisfaction: {
        overall: 4.6,
        ai: 4.7,
        human: 4.5
      }
    };

    setTimeout(() => {
      setAnalytics(mockData);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center text-gray-500">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Analytics</h2>
          <p className="text-gray-600">Performance insights and user satisfaction</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">AI Satisfaction</h3>
            <span className="text-green-600">📈</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics.aiResponses.satisfactionRate}%
          </div>
          <div className="text-sm text-gray-600">
            {analytics.aiResponses.helpful} helpful / {analytics.aiResponses.total} total
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">AI Response Time</h3>
            <span className="text-blue-600">⚡</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics.responseTimes.ai}s
          </div>
          <div className="text-sm text-gray-600">
            Average response time
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Ticket Volume</h3>
            <span className="text-orange-600">🎫</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics.supportChannels.tickets}
          </div>
          <div className="text-sm text-gray-600">
            Human support needed
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Overall Satisfaction</h3>
            <span className="text-purple-600">⭐</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics.userSatisfaction.overall}/5
          </div>
          <div className="text-sm text-gray-600">
            User satisfaction score
          </div>
        </div>
      </div>

      {/* Support Channel Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Channel Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(analytics.supportChannels).map(([channel, count]) => (
            <div key={channel} className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{channel}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Issues */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Issues</h3>
        <div className="space-y-3">
          {analytics.commonIssues.map((issue, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900">{issue.topic}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{issue.count}</div>
                  <div className="text-sm text-gray-500">{issue.percentage}%</div>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${issue.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Satisfaction Comparison */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Satisfaction Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {analytics.userSatisfaction.ai}/5
            </div>
            <div className="text-lg font-medium text-gray-900 mb-1">AI Support</div>
            <div className="text-sm text-gray-600">Average satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {analytics.userSatisfaction.human}/5
            </div>
            <div className="text-lg font-medium text-gray-900 mb-1">Human Support</div>
            <div className="text-sm text-gray-600">Average satisfaction</div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Key Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-green-600 mt-1">✅</span>
            <div>
              <div className="font-medium text-gray-900">AI is performing excellently</div>
              <div className="text-sm text-gray-600">
                {analytics.aiResponses.satisfactionRate}% satisfaction rate shows users find AI responses helpful
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-600 mt-1">📊</span>
            <div>
              <div className="font-medium text-gray-900">Password reset is the top issue</div>
              <div className="text-sm text-gray-600">
                Consider adding more prominent password reset guidance
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-600 mt-1">⚡</span>
            <div>
              <div className="font-medium text-gray-900">Fast AI response times</div>
              <div className="text-sm text-gray-600">
                {analytics.responseTimes.ai}s average response time keeps users engaged
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportAnalytics; 