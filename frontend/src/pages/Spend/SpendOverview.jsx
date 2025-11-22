import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiFilter,
} from 'react-icons/fi';
import { reportsAPI } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const SpendOverview = () => {
  const [dateRange, setDateRange] = useState('90');

  // Fetch spend analytics
  const { data: spendData, isLoading } = useQuery({
    queryKey: ['spend-overview'],
    queryFn: () => reportsAPI.getSpendAnalytics().then((res) => res.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  // Mock time series data (in production, this would come from the API)
  const spendOverTime = [
    { month: 'Jan', hardware: 45000, software: 28000, total: 73000 },
    { month: 'Feb', hardware: 38000, software: 32000, total: 70000 },
    { month: 'Mar', hardware: 52000, software: 35000, total: 87000 },
    { month: 'Apr', hardware: 41000, software: 38000, total: 79000 },
    { month: 'May', hardware: 47000, software: 41000, total: 88000 },
    { month: 'Jun', hardware: 55000, software: 45000, total: 100000 },
  ];

  // Mock transaction data
  const recentTransactions = [
    { id: 1, date: '2024-01-15', description: 'Microsoft 365 E3 - Annual Renewal', amount: 45000, department: 'IT', type: 'software' },
    { id: 2, date: '2024-01-12', description: 'Dell Latitude 7490 x10', amount: 12000, department: 'Engineering', type: 'hardware' },
    { id: 3, date: '2024-01-10', description: 'Slack Enterprise - Monthly', amount: 3200, department: 'Marketing', type: 'software' },
    { id: 4, date: '2024-01-08', description: 'LG 27" Monitors x15', amount: 4500, department: 'Design', type: 'hardware' },
    { id: 5, date: '2024-01-05', description: 'Figma Professional', amount: 1800, department: 'Design', type: 'software' },
    { id: 6, date: '2024-01-03', description: 'iPhone 15 Pro x8', amount: 9600, department: 'Sales', type: 'hardware' },
  ];

  // Premium gradient colors for charts
  const COLORS = ['#0284c7', '#06b6d4', '#0ea5e9', '#06b6d4', '#0284c7', '#0369a1']; // Cyan spectrum
  const CHART_COLORS = {
    primary: '#0284c7',
    secondary: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    accent: '#ec4899',
    gradient1: 'url(#primaryGradient)',
    gradient2: 'url(#secondaryGradient)',
  };

  // Calculate cost drivers
  const departmentSpend = spendData?.assets?.byDepartment || [];
  const topDepartments = departmentSpend.slice(0, 5);

  const currentMonthSpend = spendOverTime[spendOverTime.length - 1]?.total || 0;
  const previousMonthSpend = spendOverTime[spendOverTime.length - 2]?.total || 0;
  const spendChange = ((currentMonthSpend - previousMonthSpend) / previousMonthSpend) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">
            Spend & Finance
          </h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Track IT spending, analyze costs, and optimize budget
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
          <button className="btn btn-outline flex items-center gap-2">
            <FiDownload />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total IT Spend</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  ${(spendData?.summary?.totalSpend || 0).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {spendChange > 0 ? (
                    <FiTrendingUp className="text-red-600" size={16} />
                  ) : (
                    <FiTrendingDown className="text-green-600" size={16} />
                  )}
                  <span className={`text-xs font-medium ${spendChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs(spendChange).toFixed(1)}% from last month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiDollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Hardware Spend</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">
                  ${(spendData?.summary?.totalAssetSpend || 0).toLocaleString()}
                </p>
                <p className="text-xs text-purple-600 mt-2">
                  {((spendData?.summary?.totalAssetSpend / spendData?.summary?.totalSpend) * 100 || 0).toFixed(0)}% of total
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiTrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Software Spend</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  ${(spendData?.summary?.totalLicenseSpend || 0).toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-2">
                  {((spendData?.summary?.totalLicenseSpend / spendData?.summary?.totalSpend) * 100 || 0).toFixed(0)}% of total
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiTrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-l-4 border-orange-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Cost per Employee</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">
                  ${(spendData?.summary?.costPerUser || 0).toLocaleString()}
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  Monthly average
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiDollarSign className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spend Over Time Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-secondary-900">IT Spend Over Time</h3>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={spendOverTime}>
              <defs>
                <linearGradient id="colorHardware" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSoftware" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
              <YAxis tick={{ fill: '#6b7280' }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="hardware"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorHardware)"
                name="Hardware"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="software"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorSoftware)"
                name="Software"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">Top Spending Departments</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDepartments} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fill: '#6b7280' }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <YAxis dataKey="_id" type="category" tick={{ fill: '#6b7280' }} width={100} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="totalSpend" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">Spend by Category</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendData?.assets?.byCategory || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="totalSpend"
                >
                  {(spendData?.assets?.byCategory || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-secondary-900">Recent Transactions</h3>
            <button className="btn btn-outline btn-sm flex items-center gap-2">
              <FiFilter />
              Filter
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {transaction.department}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        transaction.type === 'hardware'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-right text-gray-900">
                      ${transaction.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendOverview;

