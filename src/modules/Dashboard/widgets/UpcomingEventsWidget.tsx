import React from "react";

interface Event {
  id: number;
  type: "review" | "meeting" | "deadline" | "birthday" | "anniversary";
  title: string;
  date: string;
  time: string;
}

interface UpcomingEventsWidgetProps {
  events: Event[];
}

const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({
  events,
}) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "review":
        return "📋";
      case "meeting":
        return "🤝";
      case "deadline":
        return "⏰";
      case "birthday":
        return "🎂";
      case "anniversary":
        return "🎉";
      default:
        return "📅";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "review":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "meeting":
        return "bg-green-100 text-green-800 border-green-200";
      case "deadline":
        return "bg-red-100 text-red-800 border-red-200";
      case "birthday":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "anniversary":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "review":
        return "Review";
      case "meeting":
        return "Meeting";
      case "deadline":
        return "Deadline";
      case "birthday":
        return "Birthday";
      case "anniversary":
        return "Anniversary";
      default:
        return "Event";
    }
  };

  const getPriorityColor = (type: string) => {
    switch (type) {
      case "deadline":
        return "text-red-600";
      case "review":
        return "text-blue-600";
      case "meeting":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View calendar →
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No upcoming events
          </h3>
          <p className="text-gray-500 text-sm">
            Your scheduled events will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`p-4 rounded-xl border ${getEventColor(
                event.type
              )} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">
                  {getEventIcon(event.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getEventColor(
                        event.type
                      )}`}
                    >
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{event.date}</span>
                    <span>•</span>
                    <span className={getPriorityColor(event.type)}>
                      {event.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Add Event */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg">+</span>
            <span className="text-sm font-medium">Add Event</span>
          </div>
        </button>
      </div>

      {/* Event Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-blue-600">
            {events.filter((e) => e.type === "meeting").length}
          </div>
          <div className="text-xs text-gray-500">Meetings</div>
        </div>
        <div>
          <div className="text-lg font-bold text-red-600">
            {events.filter((e) => e.type === "deadline").length}
          </div>
          <div className="text-xs text-gray-500">Deadlines</div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingEventsWidget;
