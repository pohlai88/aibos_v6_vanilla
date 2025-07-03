import React from "react";

interface WelcomeWidgetProps {
  userName: string;
  greeting: string;
  currentTime: Date;
}

const WelcomeWidget: React.FC<WelcomeWidgetProps> = ({
  userName,
  greeting,
  currentTime,
}) => {
  const getMotivationalMessage = () => {
    const hour = currentTime.getHours();
    const messages = [
      "Ready to make today amazing? ✨",
      "Your potential is limitless! 🚀",
      "Every day is a new opportunity! 🌟",
      "You've got this! 💪",
      "Time to shine! ⭐",
      "Let's create something wonderful! 🎨",
    ];

    // Use hour to select different messages throughout the day
    const index = hour % messages.length;
    return messages[index];
  };

  const getProductivityTip = () => {
    const tips = [
      "Take a 5-minute break every hour to stay fresh",
      "Prioritize your top 3 tasks for maximum impact",
      "Celebrate small wins - they add up to big success",
      "Connect with a colleague today - teamwork makes the dream work",
      "Remember to hydrate and stretch throughout the day",
    ];

    const dayOfYear = Math.floor(
      (currentTime.getTime() -
        new Date(currentTime.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return tips[dayOfYear % tips.length];
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white rounded-full"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {greeting}, {userName}! 👋
            </h2>
            <p className="text-blue-100 text-lg">{getMotivationalMessage()}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="text-blue-100 text-sm">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              💡
            </div>
            <div>
              <p className="text-sm font-medium">Today's Tip</p>
              <p className="text-xs text-blue-100">{getProductivityTip()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">5</div>
              <div className="text-xs text-blue-100">Tasks Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">3</div>
              <div className="text-xs text-blue-100">Hours Focused</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">92%</div>
              <div className="text-xs text-blue-100">Productivity</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-blue-100 mb-1">Week Progress</div>
            <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: "75%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeWidget;
