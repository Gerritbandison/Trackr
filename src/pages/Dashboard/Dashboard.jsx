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
} from 'react-icons/fi';
import { assetsAPI, usersAPI, licensesAPI, assetGroupsAPI } from '../../config/api';
import StatCard from '../../components/Common/StatCard';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge from '../../components/Common/Badge';
import AlertModal from '../../components/Common/AlertModal';
import ActivityFeed from '../../components/Common/ActivityFeed';
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

const Dashboard = () => {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertData, setAlertData] = useState({});
  const [selectedDeviceType, setSelectedDeviceType] = useState('all');

  // Fetch statistics
  const { data: assetStats, isLoading: loadingAssets } = useQuery({
    queryKey: ['assetStats'],
    queryFn: () => assetsAPI.getStats().then((res) => res.data.data),
  });

  const { data: userStats, isLoading: loadingUsers } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => usersAPI.getStats().then((res) => res.data.data),
  });

  const { data: licenseStats, isLoading: loadingLicenses } = useQuery({
    queryKey: ['licenseStats'],
    queryFn: () => licensesAPI.getStats().then((res) => res.data.data),
  });

  // Fetch low stock alerts
  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock-dashboard'],
    queryFn: () => assetGroupsAPI.getLowStockAlerts().then((res) => res.data.data),
  });

  // Fetch all assets and licenses for expiry checks
  const { data: allAssetsData } = useQuery({
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
      if (!asset.warrantyExpiry) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(asset.warrantyExpiry) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 14;
    });

    const expiringLicenses = (allLicensesData || []).filter((license) => {
      if (!license.expirationDate) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(license.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 14;
    });

    // Get EOL alerts (assets approaching end-of-life within 6 months)
    const eolAlerts = getAssetsApproachingEOL(allAssetsData || [], 6);

    const alerts = {
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
    return <LoadingSpinner fullScreen />;
  }

  const totalCriticalAlerts = 
    (alertData.expiringWarranties?.length || 0) +
    (alertData.expiringLicenses?.length || 0) +
    (alertData.lowStock?.length || 0) +
    (alertData.eolAlerts?.length || 0);

  // Prepare chart data - Filter out zero values for cleaner pie chart
  const assetStatusData = [
    { name: 'Available', value: assetStats?.availableAssets || 0, color: '#10b981' },
    { name: 'Assigned', value: assetStats?.assignedAssets || 0, color: '#3b82f6' },
    { name: 'Maintenance', value: assetStats?.inMaintenance || 0, color: '#f59e0b' },
    { name: 'Retired', value: assetStats?.retired || 0, color: '#6b7280' },
    { name: 'Lost/Stolen', value: (assetStats?.lost || 0) + (assetStats?.stolen || 0), color: '#ef4444' },
  ].filter(item => item.value > 0); // Only show non-zero values

  const assetCategoryData =
    assetStats?.assetsByCategory?.map((item) => ({
      name: item._id?.charAt(0).toUpperCase() + item._id?.slice(1) || 'Unknown',
      count: item.count,
      value: item.totalValue || 0,
    })) || [];

  // Filter assets based on selected device type
  const filteredAssets = selectedDeviceType === 'all' 
    ? allAssetsData || []
    : (allAssetsData || []).filter(
        asset => asset.category?.toLowerCase() === selectedDeviceType
      );

  // Calculate device-specific stats
  const deviceSpecificStats = {
    total: filteredAssets.length,
    available: filteredAssets.filter(a => a.status?.toLowerCase() === 'available').length,
    assigned: filteredAssets.filter(a => a.status?.toLowerCase() === 'assigned').length,
    inRepair: filteredAssets.filter(a => a.status?.toLowerCase() === 'maintenance' || a.status?.toLowerCase() === 'repair').length,
    expiringWarranties: filteredAssets.filter(asset => {
      if (!asset.warrantyExpiry) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(asset.warrantyExpiry) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 14;
    }).length,
    totalValue: filteredAssets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0),
  };

  // Get device type label
  const getDeviceTypeLabel = () => {
    const deviceTypes = {
      all: 'All Assets',
      laptop: 'Laptops',
      desktop: 'Desktops',
      monitor: 'Monitors',
      phone: 'Phones',
      tablet: 'Tablets',
      dock: 'Docks',
      server: 'Servers',
      printer: 'Printers',
    };
    return deviceTypes[selectedDeviceType] || 'Assets';
  };

  return (
    <div className="space-y-8 animate-fade-in">
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
          className="card bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FiAlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">
                    {totalCriticalAlerts} Action Item{totalCriticalAlerts !== 1 ? 's' : ''} Requiring Attention
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Click to view expiring licenses, warranties, and stock alerts
                  </p>
                </div>
              </div>
              <button className="btn btn-sm bg-red-600 text-white hover:bg-red-700">
                View Alerts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Dashboard</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Comprehensive overview of your IT assets and licenses
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-6">
          <Link to="/licenses/optimization" className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium">
            <FiTrendingUp size={16} />
            License Optimization
          </Link>
          <Link to="/spend" className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
            <FiDollarSign size={16} />
            Spend Analytics
          </Link>
          <Link to="/compliance" className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
            <FiShield size={16} />
            Compliance Status
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

      {/* Quick Actions & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <div>
          <AlertsWidget />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <RecentActivity />
        </div>
        <div className="card">
          <div className="card-header bg-gradient-to-r from-green-50 to-transparent">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FiTrendingUp className="text-green-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">System Health</h3>
                <p className="text-sm text-secondary-600">Overall status</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-700">Systems Operational</span>
                <Badge variant="success" text="100%" />
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-700">Data Sync Status</span>
                <Badge variant="info" text="Online" />
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-purple-700">License Compliance</span>
                <Badge variant="success" text="Compliant" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Availability by Device Type */}
      <div className="card animate-scale-in">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">Asset Availability by Device Type</h3>
              <p className="text-sm text-secondary-600 mt-1">
                Monitor available assets across different device categories
              </p>
            </div>
            <Link to="/assets" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Manage Assets →
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Status Distribution */}
        <div className="card animate-scale-in">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-secondary-900">Asset Status Distribution</h3>
              <span className="text-sm text-secondary-500 font-medium">Total: {assetStats?.totalAssets || 0}</span>
            </div>
          </div>
          <div className="card-body">
            {assetStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={assetStatusData}
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
                      animationBegin={400}
                      animationDuration={800}
                      paddingAngle={2}
                    >
                      {assetStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        padding: '12px'
                      }}
                      formatter={(value) => [`${value} assets`, 'Count']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {assetStatusData.map((entry, index) => (
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
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FiPackage className="mx-auto mb-2" size={48} opacity={0.3} />
                <p>No asset data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Assets by Category */}
        <div className="card animate-scale-in" style={{ animationDelay: '100ms' }}>
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-secondary-900">Assets by Category</h3>
              <span className="text-sm text-secondary-500 font-medium">
                {assetCategoryData.reduce((sum, item) => sum + item.count, 0)} items
              </span>
            </div>
          </div>
          <div className="card-body">
            {assetCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
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
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      padding: '12px'
                    }}
                    formatter={(value, name) => {
                      if (name === 'count') return [value, 'Quantity'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Category: ${label}`}
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
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FiPackage className="mx-auto mb-2" size={48} opacity={0.3} />
                <p>No category data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Stats */}
        <div className="card animate-scale-in" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">
                  {getDeviceTypeLabel()} Overview
                </h3>
                {selectedDeviceType !== 'all' && (
                  <p className="text-xs text-secondary-500 mt-1">
                    Filtered by selected device type
                  </p>
                )}
              </div>
              <Link to="/assets" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View All →
              </Link>
            </div>
          </div>
          <div className="card-body space-y-1">
            <div className="flex justify-between items-center py-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded px-3 -mx-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-secondary-700 font-medium">
                  Available {selectedDeviceType !== 'all' ? getDeviceTypeLabel() : 'Assets'}
                </span>
              </div>
              <span className="font-bold text-emerald-600 text-lg">
                {deviceSpecificStats.available}
              </span>
            </div>
            <div className="flex justify-between items-center py-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded px-3 -mx-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-secondary-700 font-medium">
                  Assigned {selectedDeviceType !== 'all' ? getDeviceTypeLabel() : 'Assets'}
                </span>
              </div>
              <span className="font-bold text-blue-600 text-lg">
                {deviceSpecificStats.assigned}
              </span>
            </div>
            <div className="flex justify-between items-center py-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded px-3 -mx-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-secondary-700 font-medium">In Repair</span>
              </div>
              <span className="font-bold text-amber-600 text-lg">
                {deviceSpecificStats.inRepair}
              </span>
            </div>
            <div className="flex justify-between items-center py-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded px-3 -mx-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-secondary-700 font-medium">Expiring Warranties</span>
              </div>
              <span className="font-bold text-red-600 text-lg">
                {deviceSpecificStats.expiringWarranties}
              </span>
            </div>
            <div className="flex justify-between items-center py-3.5 pt-4 px-3 -mx-3">
              <span className="text-secondary-700 font-semibold">Total Value</span>
              <span className="font-bold text-secondary-900 text-xl">
                ${deviceSpecificStats.totalValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* License Stats */}
        <div className="card animate-scale-in" style={{ animationDelay: '300ms' }}>
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-secondary-900">License Overview</h3>
              <Link to="/licenses" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View All →
              </Link>
            </div>
          </div>
          <div className="card-body space-y-1">
            <div className="flex justify-between items-center py-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded px-3 -mx-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-secondary-700 font-medium">Active Licenses</span>
              </div>
              <span className="font-bold text-emerald-600 text-lg">
                {licenseStats?.activeLicenses || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded px-3 -mx-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-secondary-700 font-medium">Total Seats</span>
              </div>
              <span className="font-bold text-blue-600 text-lg">
                {licenseStats?.totalSeats || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded px-3 -mx-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                <span className="text-secondary-700 font-medium">Used Seats</span>
              </div>
              <span className="font-bold text-primary-600 text-lg">
                {licenseStats?.usedSeats || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded px-3 -mx-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-secondary-700 font-medium">Expiring Soon</span>
              </div>
              <span className="font-bold text-red-600 text-lg">
                {licenseStats?.expiringLicenses || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-3.5 pt-4 px-3 -mx-3">
              <span className="text-secondary-700 font-semibold">Annual Cost</span>
              <span className="font-bold text-secondary-900 text-xl">
                ${(licenseStats?.totalAnnualCost || 0).toLocaleString()}
              </span>
            </div>
            
            {/* Optimization CTA */}
            {licenseStats?.utilization < 80 && (
              <Link 
                to="/licenses/optimization"
                className="block mt-4 -mx-6 -mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200 hover:from-green-100 hover:to-emerald-100 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiTrendingDown className="text-green-600 group-hover:scale-110 transition-transform" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-green-900">
                        Optimization Available
                      </p>
                      <p className="text-xs text-green-700">
                        {licenseStats?.utilization || 0}% utilization - potential savings
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-700 group-hover:text-green-800">
                    View →
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-secondary-900">Recent Activity</h3>
              <Link to="/compliance" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View All →
              </Link>
            </div>
          </div>
          <div className="card-body">
            <ActivityFeed limit={8} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

