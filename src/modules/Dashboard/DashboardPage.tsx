import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import WelcomeWidget from "./widgets/WelcomeWidget";
import StatsWidget from "./widgets/StatsWidget";
import QuickActionsWidget from "./widgets/QuickActionsWidget";
import RecentActivityWidget from "./widgets/RecentActivityWidget";
import TeamOverviewWidget from "./widgets/TeamOverviewWidget";
import UpcomingEventsWidget from "./widgets/UpcomingEventsWidget";
import PersonalGoalsWidget from "./widgets/PersonalGoalsWidget";
import WeatherWidget from "./widgets/WeatherWidget";
import { OrganizationSwitcher } from "@/modules/MultiCompany";

interface DashboardData {
  employeeCount: number;
  recentHires: number;
  upcomingReviews: number;
  activeProjects: number;
  teamMembers: any[];
  recentActivities: any[];
  upcomingEvents: any[];
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    employeeCount: 0,
    recentHires: 0,
    upcomingReviews: 0,
    activeProjects: 0,
    teamMembers: [],
    recentActivities: [],
    upcomingEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch employee count
      const { count: employeeCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });

      // Fetch recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentHires } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .gte("hire_date", thirtyDaysAgo.toISOString().split("T")[0]);

      // Fetch team members (limit to 5)
      const { data: teamMembers } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position, department, hire_date")
        .eq("employment_status", "active")
        .limit(5)
        .order("hire_date", { ascending: false });

      // Mock data for demo purposes
      const mockRecentActivities = [
        {
          id: 1,
          type: "hire",
          message: "Sarah Johnson joined as Senior Developer",
          time: "2 hours ago",
        },
        {
          id: 2,
          type: "review",
          message: "Performance review completed for Mike Chen",
          time: "1 day ago",
        },
        {
          id: 3,
          type: "project",
          message: "Project Alpha milestone reached",
          time: "2 days ago",
        },
        {
          id: 4,
          type: "meeting",
          message: "Team standup completed",
          time: "3 days ago",
        },
      ];

      const mockUpcomingEvents = [
        {
          id: 1,
          type: "review",
          title: "Performance Review",
          date: "Tomorrow",
          time: "10:00 AM",
        },
        {
          id: 2,
          type: "meeting",
          title: "All-Hands Meeting",
          date: "Friday",
          time: "2:00 PM",
        },
        {
          id: 3,
          type: "deadline",
          title: "Q4 Goals Deadline",
          date: "Next Week",
          time: "5:00 PM",
        },
      ];

      setDashboardData({
        employeeCount: employeeCount || 0,
        recentHires: recentHires || 0,
        upcomingReviews: 3, // Mock data
        activeProjects: 5, // Mock data
        teamMembers: teamMembers || [],
        recentActivities: mockRecentActivities,
        upcomingEvents: mockUpcomingEvents,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getUserName = () => {
    if (!user) return "there";
    return user.email?.split("@")[0] || "there";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                {getGreeting()}, {getUserName()}! 👋
              </h1>
              <p className="text-xl text-gray-600">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <OrganizationSwitcher
                organizations={[]}
                userOrganizations={[]}
                onSwitch={() => {}}
              />
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Main Widgets Row */}
        <div className="flex flex-wrap gap-8 mb-8">
          <div className="flex-1 min-w-[340px]">
            <div className="p-8 min-h-[180px] rounded-2xl shadow-lg bg-white flex flex-col justify-center">
              <WelcomeWidget
                userName={getUserName()}
                greeting={getGreeting()}
                currentTime={currentTime}
              />
            </div>
          </div>
          <div className="w-[340px] max-w-full">
            <div className="p-8 min-h-[180px] rounded-2xl shadow-lg bg-white flex flex-col justify-center">
              <WeatherWidget />
            </div>
          </div>
        </div>
        {/* Organization Overview and Quick Actions Row */}
        <div className="flex flex-wrap gap-8 mb-8">
          <div className="flex-1 min-w-[540px]">
            <div className="p-8 min-h-[180px] rounded-2xl shadow-lg bg-white flex flex-col justify-center">
              <StatsWidget {...dashboardData} />
            </div>
          </div>
          <div className="w-[340px] max-w-full">
            <div className="p-8 min-h-[180px] rounded-2xl shadow-lg bg-white flex flex-col justify-center">
              <QuickActionsWidget />
            </div>
          </div>
        </div>
        {/* Team Overview and Recent Activity Row */}
        <div className="flex flex-wrap gap-8">
          <div className="flex-1 min-w-[540px]">
            <div className="p-8 min-h-[180px] rounded-2xl shadow-lg bg-white flex flex-col justify-center">
              <TeamOverviewWidget teamMembers={dashboardData.teamMembers} />
            </div>
          </div>
          <div className="flex-1 min-w-[540px]">
            <div className="p-8 min-h-[180px] rounded-2xl shadow-lg bg-white flex flex-col justify-center">
              <RecentActivityWidget
                activities={dashboardData.recentActivities}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
