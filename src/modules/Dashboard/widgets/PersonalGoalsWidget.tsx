import React, { useState } from "react";

interface Goal {
  id: number;
  title: string;
  progress: number;
  target: number;
  unit: string;
  category: "work" | "personal" | "health" | "learning";
  deadline?: string;
}

const PersonalGoalsWidget: React.FC = () => {
  const [goals] = useState<Goal[]>([
    {
      id: 1,
      title: "Complete Q4 Review",
      progress: 75,
      target: 100,
      unit: "%",
      category: "work",
      deadline: "2024-12-31",
    },
    {
      id: 2,
      title: "Read 12 Books",
      progress: 8,
      target: 12,
      unit: "books",
      category: "learning",
    },
    {
      id: 3,
      title: "Exercise 3x/week",
      progress: 2,
      target: 3,
      unit: "times",
      category: "health",
    },
    {
      id: 4,
      title: "Learn React",
      progress: 60,
      target: 100,
      unit: "%",
      category: "learning",
    },
  ]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "work":
        return "💼";
      case "personal":
        return "🎯";
      case "health":
        return "💪";
      case "learning":
        return "📚";
      default:
        return "🎯";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "work":
        return "bg-blue-100 text-blue-800";
      case "personal":
        return "bg-purple-100 text-purple-800";
      case "health":
        return "bg-green-100 text-green-800";
      case "learning":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const overallProgress = Math.round(
    goals.reduce((sum, goal) => sum + (goal.progress / goal.target) * 100, 0) /
      goals.length
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Personal Goals</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Manage →
        </button>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Overall Progress
          </span>
          <span className="text-lg font-bold text-gray-900">
            {overallProgress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getProgressColor(
              overallProgress
            )} transition-all duration-300`}
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <div
                className={`w-8 h-8 rounded-full ${getCategoryColor(
                  goal.category
                )} flex items-center justify-center text-sm font-medium flex-shrink-0`}
              >
                {getCategoryIcon(goal.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {goal.title}
                  </h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
                      goal.category
                    )}`}
                  >
                    {goal.category}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500">
                    {goal.progress} / {goal.target} {goal.unit}
                  </div>
                  <div className="text-xs font-medium text-gray-900">
                    {Math.round((goal.progress / goal.target) * 100)}%
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full ${getProgressColor(
                      (goal.progress / goal.target) * 100
                    )} transition-all duration-300`}
                    style={{ width: `${(goal.progress / goal.target) * 100}%` }}
                  ></div>
                </div>

                {goal.deadline && (
                  <div className="text-xs text-gray-500">
                    {getDaysUntilDeadline(goal.deadline)} days remaining
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Add Goal */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">+</span>
            <span className="text-sm font-medium">Add Goal</span>
          </div>
        </button>
      </div>

      {/* Goal Categories Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-blue-600">
            {goals.filter((g) => g.category === "work").length}
          </div>
          <div className="text-xs text-gray-500">Work Goals</div>
        </div>
        <div>
          <div className="text-lg font-bold text-green-600">
            {goals.filter((g) => g.category === "learning").length}
          </div>
          <div className="text-xs text-gray-500">Learning</div>
        </div>
      </div>
    </div>
  );
};

export default PersonalGoalsWidget;
