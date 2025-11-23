import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FiShield, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiClock,
  FiTrendingUp,
  FiDollarSign,
  FiCalendar,
  FiRefreshCw
} from 'react-icons/fi';
import { assetsAPI } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { format, differenceInDays } from 'date-fns';

const WarrantyDashboard = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');

  // Fetch all assets
  const { data: allAssetsData, isLoading } = useQuery({
    queryKey: ['all-assets-warranty'],
    queryFn: () => assetsAPI.getAll({ limit: 10000 }).then((res) => res.data.data),
  });

  // Process warranty data
  const warrantyStats = useMemo(() => {
    if (!allAssetsData) return null;

    const now = new Date();
    const assets = allAssetsData || [];
    const assetsWithWarranty = assets.filter(a => a.warrantyExpiry);

    // Categorize by status
    const active = assetsWithWarranty.filter(a => new Date(a.warrantyExpiry) > now);
    const expired = assetsWithWarranty.filter(a => new Date(a.warrantyExpiry) <= now);
    
    // Expiring soon (within 90 days)
    const expiringSoon = active.filter(a => {
      const daysUntil = differenceInDays(new Date(a.warrantyExpiry), now);
      return daysUntil <= 90;
    });

    // By provider
    const byProvider = {};
    assetsWithWarranty.forEach(asset => {
      const provider = asset.warrantyProvider || 'Unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = {
          total: 0,
          active: 0,
          expired: 0,
          expiringSoon: 0,
        };
      }
      byProvider[provider].total++;
      if (expired.includes(asset)) byProvider[provider].expired++;
      else if (expiringSoon.includes(asset)) byProvider[provider].expiringSoon++;
      else if (active.includes(asset)) byProvider[provider].active++;
    });

    // By category
    const byCategory = {};
    assetsWithWarranty.forEach(asset => {
      const category = asset.category || 'Unknown';
      if (!byCategory[category]) {
        byCategory[category] = {
          total: 0,
          active: 0,
          expired: 0,
        };
      }
      byCategory[category].total++;
      if (expired.includes(asset)) {
        byCategory[category].expired++;
      } else {
        byCategory[category].active++;
      }
    });

    // Expiring by month (next 12 months)
    const expiringByMonth = {};
    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = format(month, 'MMM yyyy');
      expiringByMonth[monthKey] = 0;
    }

    active.forEach(asset => {
      const expiryDate = new Date(asset.warrantyExpiry);
      const monthKey = format(expiryDate, 'MMM yyyy');
      if (expiringByMonth[monthKey] !== undefined) {
        expiringByMonth[monthKey]++;
      }
    });

    return {
      total: assets.length,
      withWarranty: assetsWithWarranty.length,
      withoutWarranty: assets.length - assetsWithWarranty.length,
      active: active.length,
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      byProvider,
      byCategory,
      expiringByMonth,
      activeAssets: active,
      expiredAssets: expired,
      expiringSoonAssets: expiringSoon,
    };
  }, [allAssetsData]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    if (!warrantyStats) return [];

    let assets = [];
    
    if (filterStatus === 'active') {
      assets = warrantyStats.activeAssets;
    } else if (filterStatus === 'expired') {
      assets = warrantyStats.expiredAssets;
    } else if (filterStatus === 'expiring') {
      assets = warrantyStats.expiringSoonAssets;
    } else {
      assets = [
        ...warrantyStats.activeAssets,
        ...warrantyStats.expiredAssets,
      ];
    }

    if (filterProvider !== 'all') {
      assets = assets.filter(a => 
        (a.warrantyProvider || 'Unknown') === filterProvider
      );
    }

    return assets;
  }, [warrantyStats, filterStatus, filterProvider]);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!warrantyStats) return <div>No data available</div>;

  // Prepare chart data
  const statusChartData = [
    { name: 'Active', value: warrantyStats.active, color: '#10b981' },
    { name: 'Expiring Soon', value: warrantyStats.expiringSoon, color: '#f59e0b' },
    { name: 'Expired', value: warrantyStats.expired, color: '#ef4444' },
    { name: 'No Warranty', value: warrantyStats.withoutWarranty, color: '#6b7280' },
  ].filter(item => item.value > 0);

  const providerChartData = Object.entries(warrantyStats.byProvider).map(([provider, data]) => ({
    provider,
    ...data,
  }));

  const categoryChartData = Object.entries(warrantyStats.byCategory).map(([category, data]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    active: data.active,
    expired: data.expired,
  }));

  const expiringTimelineData = Object.entries(warrantyStats.expiringByMonth).map(([month, count]) => ({
    month,
    count,
  }));

  const providers = ['all', ...Object.keys(warrantyStats.byProvider)];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Warranty Dashboard</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Comprehensive warranty tracking and management
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-emerald-50 to-white border-l-4 border-emerald-500">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <FiCheckCircle className="text-emerald-600" size={24} />
              </div>
              <span className="text-sm font-semibold text-emerald-600">
                {warrantyStats.withWarranty > 0 
                  ? Math.round((warrantyStats.active / warrantyStats.withWarranty) * 100)
                  : 0}%
              </span>
            </div>
            <h3 className="text-3xl font-bold text-emerald-700">{warrantyStats.active}</h3>
            <p className="text-sm text-secondary-600 mt-1">Active Warranties</p>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-500">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-amber-100 rounded-lg">
                <FiClock className="text-amber-600" size={24} />
              </div>
              <span className="text-sm font-semibold text-amber-600">Next 90 days</span>
            </div>
            <h3 className="text-3xl font-bold text-amber-700">{warrantyStats.expiringSoon}</h3>
            <p className="text-sm text-secondary-600 mt-1">Expiring Soon</p>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-white border-l-4 border-red-500">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-red-100 rounded-lg">
                <FiAlertCircle className="text-red-600" size={24} />
              </div>
              <span className="text-sm font-semibold text-red-600">Action Needed</span>
            </div>
            <h3 className="text-3xl font-bold text-red-700">{warrantyStats.expired}</h3>
            <p className="text-sm text-secondary-600 mt-1">Expired Warranties</p>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiShield className="text-blue-600" size={24} />
              </div>
              <span className="text-sm font-semibold text-blue-600">Coverage</span>
            </div>
            <h3 className="text-3xl font-bold text-blue-700">
              {Math.round((warrantyStats.withWarranty / warrantyStats.total) * 100)}%
            </h3>
            <p className="text-sm text-secondary-600 mt-1">Assets with Warranty</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">Warranty Status Distribution</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) =>
                    percent > 0.05 ? `${name}: ${value}` : ''
                  }
                  outerRadius={95}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {statusChartData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">{entry.value}</span> {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expiring Timeline */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">Expiring Next 12 Months</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={expiringTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* By Provider and Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Provider */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">Warranties by Provider</h3>
          </div>
          <div className="card-body">
            {providerChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={providerChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="provider" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" fill="#10b981" name="Active" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expiringSoon" fill="#f59e0b" name="Expiring Soon" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expired" fill="#ef4444" name="Expired" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No provider data available</p>
            )}
          </div>
        </div>

        {/* By Category */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">Warranties by Asset Type</h3>
          </div>
          <div className="card-body">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" fill="#3b82f6" name="Active" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expired" fill="#ef4444" name="Expired" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No category data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-xl font-semibold text-secondary-900">Warranty Details</h3>
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input input-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>

              {/* Provider Filter */}
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="input input-sm"
              >
                {providers.map(provider => (
                  <option key={provider} value={provider}>
                    {provider === 'all' ? 'All Providers' : provider}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Provider</th>
                  <th>Expiry Date</th>
                  <th>Days Remaining</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => {
                  const daysUntil = differenceInDays(
                    new Date(asset.warrantyExpiry), 
                    new Date()
                  );
                  const isExpired = daysUntil < 0;
                  const isExpiring = daysUntil >= 0 && daysUntil <= 90;

                  return (
                    <tr key={asset._id} className="hover:bg-gray-50">
                      <td>
                        <Link 
                          to={`/assets/${asset._id}`}
                          className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          {asset.name}
                        </Link>
                        <div className="text-xs text-gray-500 mt-1">
                          {asset.assetTag || asset.serialNumber}
                        </div>
                      </td>
                      <td className="capitalize">{asset.category}</td>
                      <td>{asset.warrantyProvider || 'Unknown'}</td>
                      <td>{format(new Date(asset.warrantyExpiry), 'MMM dd, yyyy')}</td>
                      <td>
                        <span className={`font-semibold ${
                          isExpired ? 'text-red-600' : 
                          isExpiring ? 'text-amber-600' : 
                          'text-gray-700'
                        }`}>
                          {isExpired ? `${Math.abs(daysUntil)} days ago` : `${daysUntil} days`}
                        </span>
                      </td>
                      <td>
                        <Badge 
                          variant={
                            isExpired ? 'danger' : 
                            isExpiring ? 'warning' : 
                            'success'
                          }
                          size="sm"
                        >
                          {isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Active'}
                        </Badge>
                      </td>
                      <td>
                        <Link 
                          to={`/assets/${asset._id}`}
                          className="btn btn-sm btn-outline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredAssets.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FiShield className="mx-auto mb-3" size={48} opacity={0.3} />
                <p>No assets match the selected filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarrantyDashboard;

