import React, { useState, useEffect } from "react";

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState({
    temperature: 72,
    condition: "Sunny",
    location: "San Francisco",
    icon: "☀️",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate weather data loading
    const timer = setTimeout(() => {
      setWeather({
        temperature: Math.floor(Math.random() * 30) + 50, // 50-80°F
        condition: ["Sunny", "Cloudy", "Partly Cloudy", "Rainy"][
          Math.floor(Math.random() * 4)
        ],
        location: "San Francisco",
        icon: ["☀️", "☁️", "⛅", "🌧️"][Math.floor(Math.random() * 4)],
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getWeatherColor = (condition: string) => {
    switch (condition) {
      case "Sunny":
        return "from-yellow-400 to-orange-500";
      case "Cloudy":
        return "from-gray-400 to-gray-600";
      case "Partly Cloudy":
        return "from-blue-400 to-gray-500";
      case "Rainy":
        return "from-blue-500 to-gray-700";
      default:
        return "from-blue-400 to-purple-500";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br ${getWeatherColor(
        weather.condition
      )} rounded-2xl shadow-lg p-6 text-white relative overflow-hidden`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-16 h-16 bg-white rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-white rounded-full"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Weather</h3>
            <p className="text-sm opacity-90">{weather.location}</p>
          </div>
          <div className="text-4xl">{weather.icon}</div>
        </div>

        <div className="text-3xl font-bold mb-2">{weather.temperature}°F</div>

        <div className="text-sm opacity-90 mb-4">{weather.condition}</div>

        <div className="flex items-center justify-between text-xs opacity-75">
          <div>
            <div>Humidity</div>
            <div className="font-semibold">65%</div>
          </div>
          <div>
            <div>Wind</div>
            <div className="font-semibold">8 mph</div>
          </div>
          <div>
            <div>UV Index</div>
            <div className="font-semibold">Medium</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
