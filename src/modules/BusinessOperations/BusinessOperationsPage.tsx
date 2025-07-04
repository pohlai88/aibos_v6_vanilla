import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { OrganizationSwitcher } from '../MultiCompany';
import { AdminConfigPage } from '../AdminConfig/AdminConfigPage';
import { MultiCompanyPage } from '../MultiCompany/MultiCompanyPage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import HRMPage from '../HRM/HRMPage';

// Types for business operations
interface BusinessStats {
  totalOrganizations: number;
  totalEmployees: number;
  activeUsers: number;
  systemHealth: string;
  recentActivity: number;
  pendingTasks: number;
}

interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  path: string;
}

const BusinessOperationsPage: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'overview' | 'admin' | 'hrm' | 'organizations'>('overview');
  const [stats, setStats] = useState<BusinessStats>({
    totalOrganizations: 0,
    totalEmployees: 0,
    activeUsers: 0,
    systemHealth: 'excellent',
    recentActivity: 0,
    pendingTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [currentOrg, setCurrentOrg] = useState<any>(null);

  const modules: Module[] = [
    {
      id: 'admin',
      name: 'Admin & Config',
      description: 'System administration, user management, and configuration',
      icon: '⚙️',
      color: 'blue',
      enabled: true,
      path: 'admin'
    },
    {
      id: 'hrm',
      name: 'HR Management',
      description: 'Employee database, payroll, and HR operations',
      icon: '👥',
      color: 'green',
      enabled: true,
      path: 'hrm'
    },
    {
      id: 'organizations',
      name: 'Multi-Company',
      description: 'Organization management and multi-tenant setup',
      icon: '🏢',
      color: 'purple',
      enabled: true,
      path: 'organizations'
    },
    {
      id: 'finance',
      name: 'Finance & Accounting',
      description: 'Financial management, invoicing, and reporting',
      icon: '💰',
      color: 'yellow',
      enabled: false,
      path: 'finance'
    },
    {
      id: 'crm',
      name: 'Customer Relations',
      description: 'Customer management and relationship tracking',
      icon: '🤝',
      color: 'indigo',
      enabled: false,
      path: 'crm'
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      description: 'Stock management and supply chain operations',
      icon: '📦',
      color: 'orange',
      enabled: false,
      path: 'inventory'
    }
  ];

  useEffect(() => {
    fetchBusinessStats();
    fetchOrganizations();
  }, []);

  const fetchBusinessStats = async () => {
    try {
      setLoading(true);

      // Fetch organizations count
      const { count: totalOrganizations } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      // Fetch employees count
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Fetch active users
      const { count: activeUsers } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('employment_status', 'active');

      setStats({
        totalOrganizations: totalOrganizations || 0,
        totalEmployees: totalEmployees || 0,
        activeUsers: activeUsers || 0,
        systemHealth: 'excellent',
        recentActivity: 12,
        pendingTasks: 5
      });
    } catch (error) {
      console.error('Error fetching business stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;
      setOrganizations(orgs || []);
      if (orgs && orgs.length > 0) {
        setCurrentOrg(orgs[0]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleModuleClick = (module: Module) => {
    if (!module.enabled) {
      alert(`${module.name} module is coming soon!`);
      return;
    }
    setCurrentView(module.path as any);
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      yellow: 'bg-yellow-500 hover:bg-yellow-600',
      indigo: 'bg-indigo-500 hover:bg-indigo-600',
      orange: 'bg-orange-500 hover:bg-orange-600'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500 hover:bg-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner variant="fun" size="large" />
      </div>
    );
  }

  // Render specific module views
  if (currentView === 'admin') {
    return <AdminConfigPage />;
  }

  if (currentView === 'organizations') {
    return <MultiCompanyPage />;
  }

  if (currentView === 'hrm') {
    return <HRMPage />;
  }

  // Main overview dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Business Operations
          </h1>
          <p className="text-gray-600">
            Manage your business modules and operations
          </p>
        </div>

        {/* Organization Switcher */}
        {organizations.length > 0 && (
          <div className="mb-6">
            <OrganizationSwitcher
              organizations={organizations}
              userOrganizations={[]} // TODO: Add user organizations
              onSwitch={() => {}} // TODO: Add switch handler
              currentOrg={currentOrg}
              onOrgChange={setCurrentOrg}
            />
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrganizations}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">👤</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all cursor-pointer ${
                module.enabled
                  ? 'border-transparent hover:border-blue-200 hover:shadow-md'
                  : 'border-gray-200 opacity-60'
              }`}
              onClick={() => handleModuleClick(module)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{module.icon}</div>
                {!module.enabled && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {module.name}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4">
                {module.description}
              </p>

              {module.enabled && (
                <button
                  className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors ${getColorClasses(module.color)}`}
                >
                  Access Module
                </button>
              )}
            </div>
          ))}
        </div>

        {/* System Health */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            System Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {stats.systemHealth}
              </div>
              <div className="text-sm text-gray-600">System Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {stats.recentActivity}
              </div>
              <div className="text-sm text-gray-600">Recent Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {stats.pendingTasks}
              </div>
              <div className="text-sm text-gray-600">Pending Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                99.9%
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessOperationsPage; 