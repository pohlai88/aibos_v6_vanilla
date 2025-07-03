import React from "react";

interface StatsWidgetProps {
  employeeCount: number;
  recentHires: number;
  upcomingReviews: number;
  activeProjects: number;
}

const StatsWidget: React.FC<StatsWidgetProps> = ({
  employeeCount,
  recentHires,
  upcomingReviews,
  activeProjects,
}) => {
  const stats = [
    {
      label: "Total Employees",
      value: employeeCount,
      icon: "👥",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      label: "Recent Hires",
      value: recentHires,
      icon: "🎉",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      label: "Upcoming Reviews",
      value: upcomingReviews,
      icon: "📋",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      label: "Active Projects",
      value: activeProjects,
      icon: "🚀",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Organization Overview
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border ${stat.bgColor} ${stat.borderColor} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-xs font-medium ${stat.color}`}>
                {index === 0
                  ? "Total"
                  : index === 1
                  ? "30d"
                  : index === 2
                  ? "This Week"
                  : "Active"}
              </span>
            </div>
            <div className={`text-2xl font-bold ${stat.color} mb-1`}>
              {stat.value.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Growth Indicators */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Growth</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Stable</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Attention</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              +{Math.floor(Math.random() * 15) + 5}% from last month
            </div>
            <div className="text-xs text-gray-500">Overall growth trend</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsWidget;
