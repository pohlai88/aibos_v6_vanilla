import React, { useState } from 'react';
import { Organization } from '@/types/organization';

// SVG Icon components
const ChartBarIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TrendingUpIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const CurrencyDollarIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const BuildingOfficeIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ClockIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface MultiCompanyAnalyticsProps {
  className?: string;
  organizations?: Organization[];
}

interface MetricData {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  activeUsers: number;
  newOrganizations: number;
  transactionCount: number;
  avgTransactionValue: number;
}

const MultiCompanyAnalytics: React.FC<MultiCompanyAnalyticsProps> = ({ 
  className = '',
  organizations = []
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('last30days');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');

  // Mock analytics data
  const mockAnalytics: MetricData[] = [
    {
      period: '2024-01',
      totalRevenue: 125000,
      totalExpenses: 89000,
      activeUsers: 245,
      newOrganizations: 3,
      transactionCount: 1240,
      avgTransactionValue: 890
    },
    {
      period: '2024-02',
      totalRevenue: 142000,
      totalExpenses: 95000,
      activeUsers: 267,
      newOrganizations: 2,
      transactionCount: 1356,
      avgTransactionValue: 920
    },
    {
      period: '2024-03',
      totalRevenue: 158000,
      totalExpenses: 102000,
      activeUsers: 289,
      newOrganizations: 5,
      transactionCount: 1478,
      avgTransactionValue: 955
    }
  ];

  const currentMetrics = mockAnalytics[mockAnalytics.length - 1];
  const previousMetrics = mockAnalytics[mockAnalytics.length - 2];

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const organizationMetrics = [
    {
      name: 'AI-BOS Demo Organization',
      revenue: 87000,
      expenses: 52000,
      profit: 35000,
      growth: 12.5,
      users: 156,
      transactions: 892
    },
    {
      name: 'Sample Company Ltd',
      revenue: 71000,
      expenses: 50000,
      profit: 21000,
      growth: 8.3,
      users: 133,
      transactions: 586
    }
  ];

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: `$${currentMetrics.totalRevenue.toLocaleString()}`,
      growth: calculateGrowth(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
      icon: CurrencyDollarIcon,
      color: 'green'
    },
    {
      title: 'Total Expenses',
      value: `$${currentMetrics.totalExpenses.toLocaleString()}`,
      growth: calculateGrowth(currentMetrics.totalExpenses, previousMetrics.totalExpenses),
      icon: TrendingUpIcon,
      color: 'red'
    },
    {
      title: 'Active Users',
      value: currentMetrics.activeUsers.toLocaleString(),
      growth: calculateGrowth(currentMetrics.activeUsers, previousMetrics.activeUsers),
      icon: UsersIcon,
      color: 'blue'
    },
    {
      title: 'Organizations',
      value: organizations.length.toString(),
      growth: calculateGrowth(currentMetrics.newOrganizations, previousMetrics.newOrganizations),
      icon: BuildingOfficeIcon,
      color: 'purple'
    },
    {
      title: 'Transactions',
      value: currentMetrics.transactionCount.toLocaleString(),
      growth: calculateGrowth(currentMetrics.transactionCount, previousMetrics.transactionCount),
      icon: ChartBarIcon,
      color: 'indigo'
    },
    {
      title: 'Avg Transaction',
      value: `$${currentMetrics.avgTransactionValue.toLocaleString()}`,
      growth: calculateGrowth(currentMetrics.avgTransactionValue, previousMetrics.avgTransactionValue),
      icon: ClockIcon,
      color: 'yellow'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      yellow: 'bg-yellow-100 text-yellow-800'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Multi-Company Analytics</h2>
          <p className="text-gray-600">Performance metrics and insights across all organizations</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
            <option value="last90days">Last 90 days</option>
            <option value="last12months">Last 12 months</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full ${getColorClasses(kpi.color)}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div className={`text-sm font-medium ${
                kpi.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpi.growth >= 0 ? '+' : ''}{kpi.growth.toFixed(1)}%
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-sm text-gray-600">{kpi.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="revenue">Revenue</option>
              <option value="expenses">Expenses</option>
              <option value="profit">Profit</option>
            </select>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart visualization would go here</p>
              <p className="text-sm text-gray-400">Integration with charting library required</p>
            </div>
          </div>
        </div>

        {/* Organization Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Performance</h3>
          <div className="space-y-4">
            {organizationMetrics.map((org, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{org.name}</h4>
                  <span className={`text-sm font-medium ${
                    org.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {org.growth >= 0 ? '+' : ''}{org.growth}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Revenue</p>
                    <p className="font-medium">${org.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Profit</p>
                    <p className="font-medium">${org.profit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Users</p>
                    <p className="font-medium">{org.users}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Transactions</p>
                    <p className="font-medium">{org.transactions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Analytics Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Analytics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Transaction
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockAnalytics.map((data, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {data.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${data.totalRevenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${data.totalExpenses.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(data.totalRevenue - data.totalExpenses).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {data.activeUsers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {data.transactionCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${data.avgTransactionValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Analytics</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Export to PDF
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Export to Excel
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Export to CSV
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
            Schedule Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiCompanyAnalytics;
