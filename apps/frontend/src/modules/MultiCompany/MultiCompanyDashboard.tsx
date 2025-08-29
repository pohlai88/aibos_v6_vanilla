import React, { useState, useEffect } from 'react';
import { Organization } from '@/types/organization';

interface DashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalEmployees: number;
  totalRevenue: number;
  complianceScore: number;
  pendingTasks: number;
}

interface Activity {
  id: string;
  type: 'organization' | 'compliance' | 'user' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  organization?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  action: () => void;
  icon: string;
  color: string;
}

interface MultiCompanyDashboardProps {
  organizations: Organization[];
  onNavigate: (tab: string) => void;
}

const MultiCompanyDashboard: React.FC<MultiCompanyDashboardProps> = ({ 
  organizations, 
  onNavigate 
}) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalEmployees: 0,
    totalRevenue: 0,
    complianceScore: 0,
    pendingTasks: 0
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);

  useEffect(() => {
    // Mock data for demonstration
    setStats({
      totalOrganizations: organizations.length,
      activeOrganizations: organizations.filter(org => org.status === 'active').length,
      totalEmployees: 145,
      totalRevenue: 2500000,
      complianceScore: 92,
      pendingTasks: 8
    });

    // Mock recent activities
    setActivities([
      {
        id: '1',
        type: 'organization',
        title: 'New Organization Created',
        description: 'Sample Company Ltd was successfully added to the system',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'success',
        organization: 'Sample Company Ltd'
      },
      {
        id: '2',
        type: 'compliance',
        title: 'Tax Filing Due',
        description: 'Annual tax filing due for AI-BOS Demo Organization',
        timestamp: '2024-01-14T14:15:00Z',
        status: 'warning',
        organization: 'AI-BOS Demo Organization'
      },
      {
        id: '3',
        type: 'user',
        title: 'User Role Updated',
        description: 'John Doe assigned as Admin for Sample Company Ltd',
        timestamp: '2024-01-13T09:45:00Z',
        status: 'info',
        organization: 'Sample Company Ltd'
      },
      {
        id: '4',
        type: 'system',
        title: 'System Update',
        description: 'Multi-company module updated to v2.1.0',
        timestamp: '2024-01-12T16:20:00Z',
        status: 'success'
      }
    ]);

    // Mock quick actions
    setQuickActions([
      {
        id: '1',
        title: 'Add Organization',
        description: 'Create a new organization',
        action: () => onNavigate('registry'),
        icon: '🏢',
        color: 'bg-blue-500'
      },
      {
        id: '2',
        title: 'View Compliance',
        description: 'Check compliance status',
        action: () => onNavigate('compliance'),
        icon: '✅',
        color: 'bg-green-500'
      },
      {
        id: '3',
        title: 'Generate Report',
        description: 'Create multi-company report',
        action: () => onNavigate('reporting'),
        icon: '📊',
        color: 'bg-purple-500'
      },
      {
        id: '4',
        title: 'Settings',
        description: 'Configure system settings',
        action: () => onNavigate('settings'),
        icon: '⚙️',
        color: 'bg-gray-500'
      }
    ]);
  }, [organizations, onNavigate]);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'organization': return '🏢';
      case 'compliance': return '⚠️';
      case 'user': return '👥';
      case 'system': return '✅';
      default: return '📄';
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Multi-Company Dashboard</h2>
        <p className="text-gray-600">Overview of your multi-company operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Organizations"
          value={stats.totalOrganizations}
          icon="🏢"
          color="bg-blue-100"
        />
        <StatCard
          title="Active Organizations"
          value={stats.activeOrganizations}
          subtitle={`${stats.activeOrganizations} of ${stats.totalOrganizations} active`}
          icon="🟢"
          color="bg-green-100"
        />
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon="👥"
          color="bg-purple-100"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 1000000).toFixed(1)}M`}
          icon="💰"
          color="bg-yellow-100"
        />
        <StatCard
          title="Compliance Score"
          value={`${stats.complianceScore}%`}
          subtitle="Overall compliance rating"
          icon="✅"
          color="bg-green-100"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          subtitle="Require attention"
          icon="⏰"
          color="bg-red-100"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-full ${action.color} text-white mr-3`}>
                  <span className="text-lg">{action.icon}</span>
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900">{action.title}</h4>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getActivityColor(activity.status)}`}>
                  <span className="text-sm">{getActivityIcon(activity.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <time className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </time>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  {activity.organization && (
                    <p className="text-xs text-gray-500 mt-1">
                      Organization: {activity.organization}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Organization Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Organization Overview</h3>
          <button 
            onClick={() => onNavigate('registry')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Registry
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <div key={org.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{org.name}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {org.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{org.industry}</p>
              <p className="text-xs text-gray-500">
                Size: {org.size_category?.toUpperCase()}
              </p>
              <p className="text-xs text-gray-500">
                Type: {org.org_type?.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Overview</h3>
          <button 
            onClick={() => onNavigate('compliance')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Details
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Compliant</p>
                <p className="text-2xl font-bold text-green-900">4</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <p className="text-sm text-green-700 mt-2">All requirements met</p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">At Risk</p>
                <p className="text-2xl font-bold text-yellow-900">2</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <p className="text-sm text-yellow-700 mt-2">Requires attention</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Non-Compliant</p>
                <p className="text-2xl font-bold text-red-900">1</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <span className="text-2xl">❌</span>
              </div>
            </div>
            <p className="text-sm text-red-700 mt-2">Immediate action required</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MultiCompanyDashboard };
export default MultiCompanyDashboard;
