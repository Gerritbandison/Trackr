import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiRefreshCw, FiUsers, FiDollarSign, FiAlertCircle, FiTrendingUp, FiTrendingDown, FiInfo } from 'react-icons/fi';
import { microsoftGraphAPI } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import mockMicrosoftLicenses from '../../data/mockMicrosoftLicenses';

const MicrosoftLicenses = () => {
  const [credentials, setCredentials] = useState({
    tenantId: '',
    clientId: '',
    clientSecret: '',
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // overview, licenses, users, pricing
  const { canManage } = useAuth();
  const queryClient = useQueryClient();

  // Fetch license stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['microsoft-license-stats'],
    queryFn: async () => {
      // Use mock data for now
      return { data: mockMicrosoftLicenses.stats };
    },
    enabled: !showConfigModal,
  });

  // Fetch licenses
  const { data: licensesData, isLoading: licensesLoading } = useQuery({
    queryKey: ['microsoft-licenses'],
    queryFn: async () => {
      // Use mock data for now
      return { data: { licenses: mockMicrosoftLicenses.licenses, assignments: [], syncedAt: new Date() } };
    },
    enabled: !showConfigModal,
    retry: false,
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['microsoft-license-users'],
    queryFn: async () => {
      // Use mock data for now
      return mockMicrosoftLicenses.users;
    },
    enabled: viewMode === 'users',
    retry: false,
  });

  // Fetch pricing
  const { data: pricingData, isLoading: pricingLoading } = useQuery({
    queryKey: ['microsoft-license-pricing'],
    queryFn: async () => {
      // Use mock data for now
      return mockMicrosoftLicenses.pricing;
    },
    enabled: viewMode === 'pricing',
    retry: false,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: (data) => microsoftGraphAPI.syncLicenses(data),
    onSuccess: () => {
      toast.success('Microsoft licenses synced successfully');
      queryClient.invalidateQueries(['microsoft-license-stats']);
      queryClient.invalidateQueries(['microsoft-licenses']);
      setShowConfigModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to sync Microsoft licenses');
    },
  });

  const handleSync = () => {
    if (!credentials.tenantId || !credentials.clientId || !credentials.clientSecret) {
      setShowConfigModal(true);
      return;
    }
    syncMutation.mutate(credentials);
  };

  const handleSaveConfig = () => {
    localStorage.setItem('microsoft_credentials', JSON.stringify(credentials));
    toast.success('Microsoft credentials saved');
    setShowConfigModal(false);
    handleSync();
  };

  const handleViewUsers = (license) => {
    setSelectedLicense(license);
    setShowUsersModal(true);
  };

  const getAssignedUsers = (skuId) => {
    if (!mockMicrosoftLicenses.users) return [];
    return mockMicrosoftLicenses.users.filter(user => 
      user.licenses.some(l => l.skuId === skuId)
    );
  };

  const categoryColors = {
    office365: 'bg-blue-100 text-blue-800',
    windows: 'bg-purple-100 text-purple-800',
    security: 'bg-red-100 text-red-800',
    powerplatform: 'bg-green-100 text-green-800',
    dynamics: 'bg-yellow-100 text-yellow-800',
    teams: 'bg-indigo-100 text-indigo-800',
    visio: 'bg-pink-100 text-pink-800',
    project: 'bg-teal-100 text-teal-800',
    exchange: 'bg-cyan-100 text-cyan-800',
    sharepoint: 'bg-emerald-100 text-emerald-800',
    azuread: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const categoryIcons = {
    office365: '📧',
    windows: '🪟',
    security: '🔒',
    powerplatform: '⚡',
    dynamics: '💼',
    teams: '💬',
    visio: '📊',
    project: '📅',
    exchange: '📮',
    sharepoint: '🌐',
    azuread: '☁️',
    other: '📦',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight flex items-center gap-3">
            <span className="text-accent-500">🪙</span>
            Microsoft 365 Licenses
          </h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Track Microsoft licenses, assignments, and billing across your tenant
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <>
              <button
                onClick={() => setShowConfigModal(true)}
                className="btn btn-outline flex items-center gap-2"
              >
                <FiInfo size={18} />
                Configure
              </button>
              <button
                onClick={handleSync}
                disabled={syncMutation.isLoading}
                className="btn btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
              >
                <FiRefreshCw size={18} className={syncMutation.isLoading ? 'animate-spin' : ''} />
                Sync Licenses
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mock Data Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FiInfo size={20} className="text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-900">Using Mock Data</h3>
            <p className="text-sm text-yellow-700">
              Displaying sample Microsoft license data for demonstration. Configure Azure AD credentials to sync real license data from your tenant.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Licenses</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{stats.data.totalLicenses}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <FiDollarSign size={24} className="text-blue-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Seats</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{stats.data.totalSeats}</p>
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
                  <p className="text-sm font-medium text-purple-700">Assigned Seats</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">{stats.data.assignedSeats}</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <FiTrendingUp size={24} className="text-purple-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Available Seats</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">{stats.data.availableSeats}</p>
                </div>
                <div className="p-3 bg-red-200 rounded-lg">
                  <FiTrendingDown size={24} className="text-red-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {stats?.data?.lowStock?.length > 0 && (
        <div className="card border-yellow-200 bg-yellow-50">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <FiAlertCircle size={24} className="text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">Low Stock Alert</h3>
                <p className="text-sm text-yellow-700">
                  {stats.data.lowStock.length} license{stats.data.lowStock.length > 1 ? 's' : ''} running low on available seats
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {['overview', 'licenses', 'users', 'pricing'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              viewMode === mode
                ? 'text-accent-600 border-b-2 border-accent-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* License Categories */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">License Categories</h3>
            </div>
            <div className="card-body">
              {stats?.data?.byCategory && Object.entries(stats.data.byCategory).map(([category, data]) => (
                <div key={category} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoryIcons[category] || '📦'}</span>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{category}</p>
                      <p className="text-sm text-gray-500">{data.count} license{data.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{data.assignedSeats} / {data.totalSeats}</p>
                    <p className="text-xs text-gray-500">assigned</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Quick Stats</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Utilization Rate</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-accent-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${stats?.data?.totalSeats > 0 ? (stats.data.assignedSeats / stats.data.totalSeats) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {stats?.data?.totalSeats > 0
                      ? Math.round((stats.data.assignedSeats / stats.data.totalSeats) * 100)
                      : 0}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Total Cost</p>
                  <p className="text-lg font-bold text-blue-900 mt-1">$0</p>
                  <p className="text-xs text-blue-600">per month</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Savings Potential</p>
                  <p className="text-lg font-bold text-green-900 mt-1">
                    {stats?.data?.availableSeats || 0}
                  </p>
                  <p className="text-xs text-green-600">unused seats</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Licenses Tab */}
      {viewMode === 'licenses' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">Microsoft Licenses</h3>
          </div>
          <div className="card-body">
            {licensesLoading ? (
              <LoadingSpinner />
            ) : licensesData?.data?.licenses ? (
              <div className="space-y-4">
                {licensesData.data.licenses.map((license) => (
                  <div
                    key={license.skuId}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{categoryIcons[license.category] || '📦'}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{license.name}</h4>
                            <p className="text-sm text-gray-500">{license.skuPartNumber}</p>
                          </div>
                          <Badge
                            variant={license.status === 'active' ? 'success' : 'warning'}
                            text={license.status}
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Total Seats</p>
                            <p className="text-lg font-semibold text-gray-900">{license.enabled}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Assigned</p>
                            <p className="text-lg font-semibold text-blue-600">{license.consumedUnits}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Available</p>
                            <p className="text-lg font-semibold text-green-600">{license.available}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handleViewUsers(license)}
                          className="btn btn-outline btn-sm flex items-center gap-2"
                        >
                          <FiUsers size={16} />
                          View Users ({license.consumedUnits})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No licenses synced yet. Click "Sync Licenses" to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {viewMode === 'users' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">License Assignments</h3>
          </div>
          <div className="card-body">
            {usersLoading ? (
              <LoadingSpinner />
            ) : usersData?.data ? (
              <div className="space-y-4">
                {usersData.data.map((user) => (
                  <div
                    key={user.userId}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{user.displayName}</h4>
                        <p className="text-sm text-gray-500">{user.mail || user.userPrincipalName}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {user.licenses.map((license) => (
                            <Badge
                              key={license.skuId}
                              variant="info"
                              text={license.name}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{user.licenses.length}</p>
                        <p className="text-xs text-gray-500">license{user.licenses.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No users loaded. Syncing licenses will populate this data.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing Tab */}
      {viewMode === 'pricing' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-secondary-900">License Pricing & Billing</h3>
          </div>
          <div className="card-body">
            {pricingLoading ? (
              <LoadingSpinner />
            ) : pricingData?.data?.pricing ? (
              <div className="space-y-4">
                {pricingData.data.pricing.map((license) => (
                  <div
                    key={license.skuId}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{license.name}</h4>
                        <p className="text-sm text-gray-500">{license.skuPartNumber}</p>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Unit Price</p>
                            <p className="text-lg font-semibold text-gray-900">${license.unitPrice}/month</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Cost</p>
                            <p className="text-lg font-semibold text-blue-600">${license.totalCost}/month</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{license.consumedUnits} seats</p>
                        <p className="text-xs text-gray-400">{license.billingCycle}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Monthly Cost</p>
                      <p className="text-2xl font-bold text-blue-900 mt-1">
                        ${pricingData.data.pricing.reduce((sum, l) => sum + l.totalCost, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-600">Next Billing Date</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No pricing data available. Syncing licenses will populate this data.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Microsoft Graph Configuration"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Enter your Microsoft Azure AD app credentials to sync licenses. You'll need to create an app registration in Azure Portal.
            </p>
          </div>
          <div>
            <label className="label">Tenant ID</label>
            <input
              type="text"
              value={credentials.tenantId}
              onChange={(e) => setCredentials({ ...credentials, tenantId: e.target.value })}
              className="input"
              placeholder="your-tenant-id"
            />
          </div>
          <div>
            <label className="label">Client ID (Application ID)</label>
            <input
              type="text"
              value={credentials.clientId}
              onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
              className="input"
              placeholder="your-client-id"
            />
          </div>
          <div>
            <label className="label">Client Secret</label>
            <input
              type="password"
              value={credentials.clientSecret}
              onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
              className="input"
              placeholder="your-client-secret"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveConfig} className="btn btn-primary flex-1">
              Save & Sync
            </button>
            <button onClick={() => setShowConfigModal(false)} className="btn btn-outline">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Users Modal */}
      <Modal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        title={`Users Assigned to ${selectedLicense?.name || 'License'}`}
      >
        <div className="space-y-4">
          {selectedLicense && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">{selectedLicense.name}</h3>
                    <p className="text-sm text-blue-700">{selectedLicense.skuPartNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600">Total Seats</p>
                    <p className="text-lg font-bold text-blue-900">{selectedLicense.enabled}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Assigned Users ({selectedLicense.consumedUnits})
                </h4>
                {getAssignedUsers(selectedLicense.skuId).length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getAssignedUsers(selectedLicense.skuId).map((user) => (
                      <div
                        key={user.userId}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{user.displayName}</p>
                            <p className="text-sm text-gray-500">{user.mail || user.userPrincipalName}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="info" text={`${user.licenses.length} license${user.licenses.length > 1 ? 's' : ''}`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiUsers size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>No users assigned to this license</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                <button onClick={() => setShowUsersModal(false)} className="btn btn-outline flex-1">
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MicrosoftLicenses;

