import React from "react";

interface Activity {
  id: number;
  type: "hire" | "review" | "project" | "meeting" | "task" | "milestone";
  message: string;
  time: string;
}

interface RecentActivityWidgetProps {
  activities: Activity[];
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  activities,
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "hire":
        return "🎉";
      case "review":
        return "📋";
      case "project":
        return "🚀";
      case "meeting":
        return "🤝";
      case "task":
        return "✅";
      case "milestone":
        return "🏆";
      default:
        return "📝";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "hire":
        return "bg-green-100 text-green-800";
      case "review":
        return "bg-blue-100 text-blue-800";
      case "project":
        return "bg-purple-100 text-purple-800";
      case "meeting":
        return "bg-orange-100 text-orange-800";
      case "task":
        return "bg-gray-100 text-gray-800";
      case "milestone":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case "hire":
        return "New Hire";
      case "review":
        return "Review";
      case "project":
        return "Project";
      case "meeting":
        return "Meeting";
      case "task":
        return "Task";
      case "milestone":
        return "Milestone";
      default:
        return "Activity";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all →
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No recent activity
          </h3>
          <p className="text-gray-500 text-sm">
            Activities will appear here as they happen
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full ${getActivityColor(
                  activity.type
                )} flex items-center justify-center text-sm font-medium flex-shrink-0`}
              >
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityTypeLabel(activity.type)}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{activity.time}</span>
                  <span>•</span>
                  <span>Just now</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Summary */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">
              {activities.filter((a) => a.type === "hire").length}
            </div>
            <div className="text-xs text-gray-500">New Hires</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {activities.filter((a) => a.type === "review").length}
            </div>
            <div className="text-xs text-gray-500">Reviews</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {activities.filter((a) => a.type === "project").length}
            </div>
            <div className="text-xs text-gray-500">Projects</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">
              {activities.filter((a) => a.type === "meeting").length}
            </div>
            <div className="text-xs text-gray-500">Meetings</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActivityWidget;
