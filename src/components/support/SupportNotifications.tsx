import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface Notification {
  id: string;
  type: "feature_request" | "high_upvote" | "ai_feedback" | "release_note" | "system_alert";
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  read: boolean;
  created_at: string;
  data?: any;
}

interface SupportNotificationsProps {
  onNotificationClick?: (notification: Notification) => void;
}

const SupportNotifications: React.FC<SupportNotificationsProps> = ({ onNotificationClick }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('support_notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'feature_requests' },
        (payload) => {
          handleNewFeatureRequest(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Simulate notifications for demo
      const mockNotifications: Notification[] = [
        {
          id: "1",
          type: "feature_request",
          title: "New Feature Request",
          message: "User requested 'Dark Mode' feature",
          priority: "medium",
          read: false,
          created_at: new Date().toISOString(),
          data: { requestId: 1, title: "Dark Mode" }
        },
        {
          id: "2",
          type: "high_upvote",
          title: "High Upvote Alert",
          message: "Feature request 'Mobile App' reached 15 upvotes",
          priority: "high",
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          data: { requestId: 2, title: "Mobile App", upvotes: 15 }
        },
        {
          id: "3",
          type: "ai_feedback",
          title: "AI Feedback Alert",
          message: "User marked AI response as unhelpful",
          priority: "medium",
          read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          data: { query: "password reset", feedback: "not_helpful" }
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewFeatureRequest = (request: any) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type: "feature_request",
      title: "New Feature Request",
      message: `User requested '${request.title}' feature`,
      priority: "medium",
      read: false,
      created_at: new Date().toISOString(),
      data: { requestId: request.id, title: request.title }
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature_request":
        return "💡";
      case "high_upvote":
        return "🔥";
      case "ai_feedback":
        return "🤖";
      case "release_note":
        return "📋";
      case "system_alert":
        return "⚠️";
      default:
        return "📢";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      handleMarkAsRead(notification.id);
                      onNotificationClick?.(notification);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg">{getTypeIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowNotifications(false)}
                className="w-full text-sm text-blue-600 hover:text-blue-700"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupportNotifications; 