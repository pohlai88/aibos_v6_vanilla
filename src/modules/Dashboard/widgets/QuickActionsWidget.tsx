import React from "react";

const QuickActionsWidget: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow p-6 min-h-[140px] flex flex-col justify-center">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Quick Actions
      </h2>
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition">
          <span className="text-xl mr-1 align-middle">
            <svg
              width="20"
              height="20"
              viewBox="0 0 22 22"
              fill="currentColor"
              aria-hidden="true"
              className="inline align-middle"
            >
              <rect x="10" y="4" width="2" height="14" rx="1" />
              <rect x="4" y="10" width="14" height="2" rx="1" />
            </svg>
          </span>
          Add Task (SVG)
        </button>
        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition">
          + Add Task (Old)
        </button>
        <button className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium shadow hover:bg-green-700 transition">
          Schedule Meeting
        </button>
        <button className="px-4 py-2 rounded-lg bg-purple-600 text-white font-medium shadow hover:bg-purple-700 transition">
          New Note
        </button>
      </div>
    </div>
  );
};

export default QuickActionsWidget;
