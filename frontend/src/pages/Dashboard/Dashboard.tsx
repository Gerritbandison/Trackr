import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FiPackage,
  FiUsers,
  FiKey,
  FiAlertCircle,
  FiCheckCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiShield,
  FiActivity,
} from 'react-icons/fi';
import { assetsAPI, usersAPI, licensesAPI, assetGroupsAPI } from '../../config/api';
import StatCard from '../../components/ui/StatCard';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import AlertModal from '../../components/ui/AlertModal';
import ActivityFeed from '../../components/ui/ActivityFeed';
import AvailabilityChart from '../../components/Charts/AvailabilityChart';
import QuickActions from '../../components/Dashboard/QuickActions';
import AlertsWidget from '../../components/Dashboard/AlertsWidget';
import RecentActivity from '../../components/Dashboard/RecentActivity';
import { getAssetsApproachingEOL } from '../../utils/endOfLife';
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
} from 'recharts';
import { ITAMAsset } from '../../types/itam';

interface AssetStats {
  totalAssets?: number;
  availableAssets?: number;
  assignedAssets?: number;
  inMaintenance?: number;
  retired?: number;
  lost?: number;
  stolen?: number;
  utilizationRate?: number;
  expiringWarranties?: number;
  assetsByCategory?: Array<{ _id: string; count: number; totalValue?: number }>;
}

interface UserStats {
  totalUsers?: number;
  activeUsers?: number;
}

interface LicenseStats {
  totalLicenses?: number;
  utilization?: number;
  expiringLicenses?: number;
}

interface AlertData {
  expiringWarranties?: ITAMAsset[];
  expiringLicenses?: any[];
  lowStock?: any[];
  eolAlerts?: ITAMAsset[];
}

interface AssetStatusData {
  name: string;
  value: number;
  color: string;
}

interface AssetCategoryData {
  name: string;
  count: number;
  value: number;
}

const Dashboard = () => {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertData, setAlertData] = useState<AlertData>({});
  const [selectedDeviceType, setSelectedDeviceType] = useState('all');

  // Fetch statistics
  const { data: assetStats, isLoading: loadingAssets } = useQuery<AssetStats>({
    queryKey: ['assetStats'],
    queryFn: () => assetsAPI.getStats().then((res) => res.data.data),
  });

  const { data: userStats, isLoading: loadingUsers } = useQuery<UserStats>({
    queryKey: ['userStats'],
    queryFn: () => usersAPI.getStats().then((res) => res.data.data),
  });

  const { data: licenseStats, isLoading: loadingLicenses } = useQuery<LicenseStats>({
    queryKey: ['licenseStats'],
    queryFn: () => licensesAPI.getStats().then((res) => res.data.data),
  });

  // Fetch low stock alerts
  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock-dashboard'],
    queryFn: () => assetGroupsAPI.getLowStockAlerts().then((res) => res.data.data),
  });

  // Fetch all assets and licenses for expiry checks
  const { data: allAssetsData } = useQuery<ITAMAsset[]>({
    queryKey: ['all-assets-dashboard'],
    queryFn: () => assetsAPI.getAll({ limit: 1000 }).then((res) => res.data.data),
  });

  const { data: allLicensesData } = useQuery({
    queryKey: ['all-licenses-dashboard'],
    queryFn: () => licensesAPI.getAll({ limit: 1000 }).then((res) => res.data.data),
  });

  // Auto-show alert modal if there are critical alerts
  useEffect(() => {
    if (!allAssetsData || !allLicensesData) return;

    const expiringWarranties = (allAssetsData || []).filter((asset) => {
      if (!asset.warranty?.end) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(asset.warranty.end) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 14;
    });

    const expiringLicenses = (allLicensesData || []).filter((license: any) => {
      if (!license.expirationDate) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(license.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 14;
    });

    // Get EOL alerts (assets approaching end-of-life within 6 months)
    const eolAlerts = getAssetsApproachingEOL(allAssetsData || [], 6);

    const alerts: AlertData = {
      expiringWarranties,
      expiringLicenses,
      lowStock: lowStockData || [],
      eolAlerts,
    };

    setAlertData(alerts);

    const totalCritical = expiringWarranties.length + expiringLicenses.length + (lowStockData || []).length + eolAlerts.length;
    if (totalCritical > 0) {
      setTimeout(() => setShowAlertModal(true), 1000);
    }
  }, [allAssetsData, allLicensesData, lowStockData]);

  if (loadingAssets || loadingUsers || loadingLicenses) {
    return <LoadingSkeleton type="dashboard" />;
  }

  const totalCriticalAlerts =
    (alertData.expiringWarranties?.length || 0) +
    (alertData.expiringLicenses?.length || 0) +
    (alertData.lowStock?.length || 0) +
    (alertData.eolAlerts?.length || 0);

  // Prepare chart data - Filter out zero values for cleaner pie chart
  const assetStatusData: AssetStatusData[] = [
    { name: 'Available', value: assetStats?.availableAssets || 0, color: '#10b981' },
    { name: 'Assigned', value: assetStats?.assignedAssets || 0, color: '#3b82f6' },
    { name: 'Maintenance', value: assetStats?.inMaintenance || 0, color: '#f59e0b' },
    { name: 'Retired', value: assetStats?.retired || 0, color: '#6b7280' },
    { name: 'Lost/Stolen', value: (assetStats?.lost || 0) + (assetStats?.stolen || 0), color: '#ef4444' },
  ].filter(item => item.value > 0); // Only show non-zero values

  const assetCategoryData: AssetCategoryData[] =
    assetStats?.assetsByCategory?.map((item) => ({
      name: item._id ? (item._id.charAt(0).toUpperCase() + item._id.slice(1)) : 'Unknown',
      count: item.count,
      value: item.totalValue || 0,
    })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alert Modal */}
      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        alerts={alertData}
      />

      {/* Critical Alerts Banner */}
      {totalCriticalAlerts > 0 && (
        <div
          onClick={() => setShowAlertModal(true)}
          className="relative overflow-hidden bg-gradient-to-r from-red-50 via-red-50 to-red-50 rounded-3xl border-2 border-red-200 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-0.5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-transparent"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-lg">
                    <FiAlertCircle className="text-white" size={28} strokeWidth={2.5} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white animate-ping"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">
                    {totalCriticalAlerts} Action Item{totalCriticalAlerts !== 1 ? 's' : ''} Requiring Attention
                  </h3>
                  <p className="text-sm text-red-700 mt-1 font-medium">
                    Click to view details and take action
                  </p>
                </div>
              </div>
              <button className="btn bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all">
                View All Alerts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Dashboard</h1>
          <p className="text-secondary-600 mt-2">
            Welcome back! Here's your IT overview
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/licenses/optimization" className="btn btn-outline flex items-center gap-2 btn-sm">
            <FiTrendingUp size={18} />
            <span className="hidden sm:inline">Optimization</span>
          </Link>
          <Link to="/spend" className="btn btn-outline flex items-center gap-2 btn-sm">
            <FiDollarSign size={18} />
            <span className="hidden sm:inline">Spend</span>
          </Link>
          <Link to="/compliance" className="btn btn-outline flex items-center gap-2 btn-sm">
            <FiShield size={18} />
            <span className="hidden sm:inline">Compliance</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
          <StatCard
            title="Total Assets"
            value={assetStats?.totalAssets || 0}
            icon={FiPackage}
            color="primary"
            link="/assets"
            trend="up"
            trendValue={`${assetStats?.utilizationRate || 0}% Utilized`}
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <StatCard
            title="Total Users"
            value={userStats?.totalUsers || 0}
            icon={FiUsers}
            color="success"
            link="/users"
            trend="up"
            trendValue={`${userStats?.activeUsers || 0} Active`}
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <StatCard
            title="Total Licenses"
            value={licenseStats?.totalLicenses || 0}
            icon={FiKey}
            color="purple"
            link="/licenses"
            trendValue={`${licenseStats?.utilization || 0}% Utilized`}
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <StatCard
            title="Expiring Soon"
            value={
              (assetStats?.expiringWarranties || 0) +
              (licenseStats?.expiringLicenses || 0)
            }
            icon={FiAlertCircle}
            color="warning"
          />
        </div>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <div>
          <AlertsWidget />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Status Chart */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Asset Status</h3>
                  <p className="text-sm text-slate-600 mt-1">Current distribution</p>
                </div>
                <Link to="/assets" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                  View All →
                </Link>
              </div>
            </div>
            <div className="card-body">
              {assetStatusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={assetStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, value }) =>
                          percent > 0.05 ? `${name}: ${value}` : ''
                        }
                        outerRadius={85}
                        innerRadius={45}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={400}
                        animationDuration={800}
                        paddingAngle={3}
                      >
                        {assetStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        }}
                        formatter={(value: number) => [`${value} assets`, 'Count']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                    {assetStatusData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-slate-700 font-medium">
                          <span className="font-bold text-slate-900">{entry.value}</span> {entry.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FiPackage className="mx-auto mb-3 opacity-30" size={56} />
                  <p className="font-medium">No asset data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Asset Availability Chart */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Availability by Device Type</h3>
                  <p className="text-sm text-slate-600 mt-1">Monitor asset availability</p>
                </div>
                <Link to="/assets" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                  Manage →
                </Link>
              </div>
            </div>
            <div className="card-body">
              <AvailabilityChart
                assets={allAssetsData || []}
                onDeviceTypeChange={setSelectedDeviceType}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <FiActivity className="text-white" size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                    <p className="text-xs text-slate-600">Latest updates</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <ActivityFeed limit={6} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Quick Stats</h3>
                <Badge variant="success" text="All Systems Operational" />
              </div>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-success-50 to-emerald-50 rounded-xl border border-success-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></div>
                  <span className="text-sm font-semibold text-success-900">System Status</span>
                </div>
                <span className="text-sm font-bold text-success-700">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-semibold text-blue-900">Data Sync</span>
                </div>
                <span className="text-sm font-bold text-blue-700">Current</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-semibold text-purple-900">Compliance</span>
                </div>
                <span className="text-sm font-bold text-purple-700">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Categories Bar Chart */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Assets by Category</h3>
              <p className="text-sm text-slate-600 mt-1">
                {assetCategoryData.reduce((sum, item) => sum + item.count, 0)} total items
              </p>
            </div>
          </div>
        </div>
        <div className="card-body">
          {assetCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assetCategoryData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'count') return [value, 'Quantity'];
                    return [value, name];
                  }}
                  labelFormatter={(label: string) => `Category: ${label}`}
                />
                <Bar
                  dataKey="count"
                  fill="url(#colorGradient)"
                  radius={[8, 8, 0, 0]}
                  animationBegin={600}
                  animationDuration={800}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity={1} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <FiPackage className="mx-auto mb-3 opacity-30" size={56} />
              <p className="font-medium">No category data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

