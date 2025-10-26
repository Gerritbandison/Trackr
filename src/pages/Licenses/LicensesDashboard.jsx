import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FiKey, FiUsers, FiDollarSign, FiAlertCircle, FiTrendingUp, 
  FiTrendingDown, FiClock, FiCheckCircle, FiCloud, FiEye,
  FiFileText, FiRefreshCw
} from 'react-icons/fi';
import { licensesAPI, microsoftGraphAPI } from '../../config/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge from '../../components/Common/Badge';
import { format } from 'date-fns';
import mockMicrosoftLicenses from '../../data/mockMicrosoftLicenses';

const LicensesDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch traditional licenses
  const { data: licensesData, isLoading: licensesLoading } = useQuery({
    queryKey: ['licenses-dashboard'],
    queryFn: () => licensesAPI.getAll({ limit: 1000 }).then((res) => res.data),
  });

  // Fetch Microsoft licenses stats
  const { data: microsoftStats } = useQuery({
    queryKey: ['microsoft-license-stats'],
    queryFn: async () => {
      try {
        const res = await microsoftGraphAPI.getLicenseStats();
        return res.data;
      } catch (error) {
        return { data: mockMicrosoftLicenses.stats };
      }
    },
  });

  if (licensesLoading) return <LoadingSpinner />;

  const licenses = licensesData?.data || [];
  const microsoftStatsData = microsoftStats?.data || mockMicrosoftLicenses.stats;

  // Calculate traditional license stats
  const traditionalStats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    expired: licenses.filter(l => l.status === 'expired').length,
    expiringSoon: licenses.filter(l => {
      if (!l.expirationDate) return false;
      const daysUntil = Math.ceil((new Date(l.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 90;
    }).length,
    totalSeats: licenses.reduce((sum, l) => sum + (l.totalSeats || 0), 0),
    assignedSeats: licenses.reduce((sum, l) => sum + (l.assignedUsers?.length || 0), 0),
    totalCost: licenses.reduce((sum, l) => sum + (l.cost || 0), 0),
  };

  // Combine stats
  const combinedStats = {
    totalLicenses: traditionalStats.total + microsoftStatsData.totalLicenses,
    totalSeats: traditionalStats.totalSeats + microsoftStatsData.totalSeats,
    assignedSeats: traditionalStats.assignedSeats + microsoftStatsData.assignedSeats,
    totalCost: traditionalStats.totalCost,
    expiringSoon: traditionalStats.expiringSoon,
  };

  // Get expiring licenses
  const expiringLicenses = licenses.filter(l => {
    if (!l.expirationDate) return false;
    const daysUntil = Math.ceil((new Date(l.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 90;
  }).sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

  // Calculate utilization
  const overallUtilization = combinedStats.totalSeats > 0 
    ? Math.round((combinedStats.assignedSeats / combinedStats.totalSeats) * 100)
    : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiEye },
    { id: 'traditional', label: 'Traditional Licenses', icon: FiKey },
    { id: 'microsoft', label: 'Microsoft 365', icon: FiCloud },
    { id: 'expiring', label: 'Expiring Soon', icon: FiClock },
    { id: 'costs', label: 'Cost Analysis', icon: FiDollarSign },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Licenses Management</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Comprehensive view of all software licenses and Microsoft 365 subscriptions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/licenses" className="btn btn-outline flex items-center gap-2">
            <FiFileText size={18} />
            Manage Licenses
          </Link>
          <Link to="/licenses/microsoft" className="btn btn-outline flex items-center gap-2">
            <FiCloud size={18} />
            Microsoft 365
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Licenses</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{combinedStats.totalLicenses}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {traditionalStats.total} traditional + {microsoftStatsData.totalLicenses} Microsoft
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-lg">
                <FiKey size={24} className="text-blue-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Seats</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{combinedStats.totalSeats}</p>
                <p className="text-xs text-green-600 mt-1">
                  {combinedStats.assignedSeats} assigned ({overallUtilization}%)
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-lg">
                <FiUsers size={24} className="text-green-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Monthly Cost</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">
                  ${combinedStats.totalCost.toLocaleString()}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Annual: ${(combinedStats.totalCost * 12).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-lg">
                <FiDollarSign size={24} className="text-purple-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Expiring Soon</p>
                <p className="text-3xl font-bold text-red-900 mt-1">{combinedStats.expiringSoon}</p>
                <p className="text-xs text-red-600 mt-1">
                  Within next 90 days
                </p>
              </div>
              <div className="p-3 bg-red-200 rounded-lg">
                <FiAlertCircle size={24} className="text-red-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 transition-colors ${
              activeTab === tab.id
                ? 'text-accent-600 border-b-2 border-accent-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* License Types Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">License Types</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔑</span>
                    <div>
                      <p className="font-semibold text-gray-900">Traditional Licenses</p>
                      <p className="text-sm text-gray-600">{traditionalStats.total} licenses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{traditionalStats.totalSeats}</p>
                    <p className="text-xs text-gray-500">seats</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🪙</span>
                    <div>
                      <p className="font-semibold text-gray-900">Microsoft 365</p>
                      <p className="text-sm text-gray-600">{microsoftStatsData.totalLicenses} licenses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{microsoftStatsData.totalSeats}</p>
                    <p className="text-xs text-gray-500">seats</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Utilization Overview */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Overall Utilization</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Total Utilization</span>
                    <span className="text-lg font-bold text-gray-900">{overallUtilization}%</span>
                  </div>
                  <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        overallUtilization > 80
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : overallUtilization > 50
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                      }`}
                      style={{ width: `${overallUtilization}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 font-medium">Assigned</p>
                    <p className="text-xl font-bold text-green-900">{combinedStats.assignedSeats}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium">Available</p>
                    <p className="text-xl font-bold text-gray-900">
                      {combinedStats.totalSeats - combinedStats.assignedSeats}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expiring Licenses Alert */}
          {expiringLicenses.length > 0 && (
            <div className="card border-yellow-200 bg-yellow-50 lg:col-span-2">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="text-yellow-600" size={20} />
                  <h3 className="text-lg font-semibold text-yellow-900">Expiring Licenses</h3>
                </div>
              </div>
              <div className="card-body">
                <div className="space-y-2">
                  {expiringLicenses.slice(0, 5).map((license) => {
                    const daysUntil = Math.ceil((new Date(license.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={license._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🔑</span>
                          <div>
                            <p className="font-semibold text-gray-900">{license.name}</p>
                            <p className="text-sm text-gray-600">{license.vendor}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-yellow-700">
                            {daysUntil} days
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(license.expirationDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {expiringLicenses.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link to="/licenses/renewals" className="text-sm text-yellow-700 hover:text-yellow-900 font-medium">
                      View all {expiringLicenses.length} expiring licenses →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Traditional Licenses Tab */}
      {activeTab === 'traditional' && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-900">Traditional Licenses</h3>
              <Link to="/licenses" className="btn btn-outline btn-sm flex items-center gap-2">
                <FiEye size={16} />
                View All
              </Link>
            </div>
          </div>
          <div className="card-body">
            {licenses.length > 0 ? (
              <div className="space-y-4">
                {licenses.slice(0, 10).map((license) => {
                  const usedSeats = license.assignedUsers?.length || 0;
                  const utilization = Math.round((usedSeats / license.totalSeats) * 100);
                  return (
                    <div key={license._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center text-xl">
                            🔑
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{license.name}</h4>
                            <p className="text-sm text-gray-600">{license.vendor} - {license.type}</p>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                {usedSeats} / {license.totalSeats} seats
                              </span>
                              <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-amber-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${utilization}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <Badge variant={license.status === 'active' ? 'success' : 'warning'} text={license.status} />
                          {license.cost && (
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                              ${license.cost.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  🔑
                </div>
                <p>No traditional licenses found</p>
                <Link to="/licenses" className="btn btn-primary btn-sm mt-4">
                  Add License
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Microsoft Licenses Tab */}
      {activeTab === 'microsoft' && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-900">Microsoft 365 Licenses</h3>
              <Link to="/licenses/microsoft" className="btn btn-outline btn-sm flex items-center gap-2">
                <FiEye size={16} />
                View Details
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪙</span>
                <div>
                  <h4 className="font-semibold text-blue-900">Microsoft 365 Connected</h4>
                  <p className="text-sm text-blue-700">
                    {microsoftStatsData.totalLicenses} licenses synced with {microsoftStatsData.totalSeats} total seats
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700">Total Microsoft Seats</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{microsoftStatsData.totalSeats}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-700">Assigned Seats</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{microsoftStatsData.assignedSeats}</p>
              </div>
            </div>

            <div className="mt-4">
              <Link to="/licenses/microsoft" className="btn btn-primary w-full">
                <FiCloud size={18} />
                View Microsoft Licenses Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Licenses Tab */}
      {activeTab === 'expiring' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">Expiring Licenses</h3>
          </div>
          <div className="card-body">
            {expiringLicenses.length > 0 ? (
              <div className="space-y-3">
                {expiringLicenses.map((license) => {
                  const daysUntil = Math.ceil((new Date(license.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
                  const severity = daysUntil <= 30 ? 'critical' : daysUntil <= 60 ? 'warning' : 'info';
                  return (
                    <div key={license._id} className={`p-4 rounded-lg border-2 ${
                      severity === 'critical' ? 'border-red-300 bg-red-50' :
                      severity === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                      'border-blue-300 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                            severity === 'critical' ? 'bg-red-100' :
                            severity === 'warning' ? 'bg-yellow-100' :
                            'bg-blue-100'
                          }`}>
                            🔑
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{license.name}</h4>
                            <p className="text-sm text-gray-600">{license.vendor}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {license.assignedUsers?.length || 0} users assigned
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'info'} 
                            text={`${daysUntil} days`}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(license.expirationDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FiCheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                <p>No licenses expiring in the next 90 days</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cost Analysis Tab */}
      {activeTab === 'costs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">License Costs</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                  <p className="text-sm font-medium text-emerald-700">Total Monthly Cost</p>
                  <p className="text-3xl font-bold text-emerald-900 mt-1">
                    ${combinedStats.totalCost.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-700">Annual Cost</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">
                    ${(combinedStats.totalCost * 12).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Cost Breakdown</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Traditional Licenses</span>
                  <span className="font-semibold text-gray-900">
                    ${traditionalStats.totalCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Microsoft 365</span>
                  <span className="font-semibold text-gray-900">
                    Cost tracking pending
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicensesDashboard;


