import React from "react";

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  position?: string;
  department?: string;
  hire_date?: string;
}

interface TeamOverviewWidgetProps {
  teamMembers: TeamMember[];
}

const TeamOverviewWidget: React.FC<TeamOverviewWidgetProps> = ({
  teamMembers,
}) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getTimeSinceHire = (hireDate: string) => {
    const hire = new Date(hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Team Overview</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-500">
            {teamMembers.length} active members
          </span>
        </div>
      </div>

      {teamMembers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No team members yet
          </h3>
          <p className="text-gray-500 text-sm">
            Start building your team by adding employees
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {teamMembers.slice(0, 5).map((member) => (
            <div
              key={member.id}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full ${getRandomColor(
                  member.first_name
                )} flex items-center justify-center text-white font-semibold text-sm`}
              >
                {getInitials(member.first_name, member.last_name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {member.first_name} {member.last_name}
                  </h4>
                  {member.hire_date && (
                    <span className="text-xs text-gray-500">
                      {getTimeSinceHire(member.hire_date)}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-1">
                  {member.position && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      {member.position}
                    </span>
                  )}
                  {member.department && (
                    <span className="text-xs text-gray-500">
                      {member.department}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">Active</span>
              </div>
            </div>
          ))}

          {teamMembers.length > 5 && (
            <div className="text-center pt-4 border-t border-gray-100">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all {teamMembers.length} team members →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {teamMembers.length}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {teamMembers.length}
            </div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {
                teamMembers.filter(
                  (m) =>
                    m.hire_date &&
                    new Date(m.hire_date) >
                      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ).length
              }
            </div>
            <div className="text-xs text-gray-500">New (30d)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamOverviewWidget;
