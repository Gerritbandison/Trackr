import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  FiArrowLeft, FiMail, FiPhone, FiMapPin, FiMonitor, FiPackage,
  FiHardDrive, FiKey, FiRefreshCw, FiCheck, FiClock, FiAlertCircle,
  FiChevronDown, FiChevronUp, FiCpu, FiActivity, FiShield
} from 'react-icons/fi';
import { usersAPI, integrationsAPI } from '../../config/api';
import mockMicrosoftLicenses from '../../data/mockMicrosoftLicenses';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge, { getStatusVariant } from '../../components/Common/Badge';
import WarrantyTimeline from '../../components/Common/WarrantyTimeline';
import { format } from 'date-fns';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    workstationSpecs: false,
    monitorDetails: {},
    apps: false,
  });

  const toggleSection = (section, id = null) => {
    if (id) {
      setExpandedSections(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [id]: !prev[section]?.[id]
        }
      }));
    } else {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    }
  };

  // Fetch user data - skip if creating new user
  const isNewUser = location.pathname === '/users/new';
  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.getById(id).then((res) => res.data.data),
    enabled: !!id && !isNewUser,
  });

  // Fetch synced devices for this user
  const { data: syncedDevicesData } = useQuery({
    queryKey: ['user-synced-devices', id],
    queryFn: () => integrationsAPI.getSyncedDevices({ userId: id }).then(res => res.data.data),
    enabled: !!id && !isNewUser,
  });

  // Fetch Microsoft licenses for this user
  const { data: microsoftLicensesData } = useQuery({
    queryKey: ['user-microsoft-licenses', id],
    queryFn: async () => {
      try {
        const res = await usersAPI.getUserMicrosoftLicenses(id);
        return res.data.data;
      } catch (error) {
        // Use mock data as fallback
        const mockUser = mockMicrosoftLicenses.users.find(u => 
          u.displayName.toLowerCase().includes(userData?.name?.toLowerCase() || '')
        );
        return mockUser?.licenses || [];
      }
    },
    enabled: !!id && !!userData,
  });

  if (loadingUser && !isNewUser) return <LoadingSpinner />;

  // Handle new user creation
  if (isNewUser) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/users')} 
            className="btn btn-outline"
          >
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Create New User</h1>
            <p className="text-secondary-600 text-lg mt-1">Add a new user to the system</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <p className="text-center text-secondary-600 py-8">
              User creation form will be displayed here
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where user doesn't exist
  if (!userData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/users')} 
            className="btn btn-outline"
          >
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">User Not Found</h1>
            <p className="text-secondary-600 text-lg mt-1">The user you're looking for doesn't exist</p>
          </div>
        </div>
      </div>
    );
  }

  const user = userData;
  const syncedDevices = syncedDevicesData || [];

  // Categorize assets
  const workstation = user.assignedAssets?.find(a => ['laptop', 'desktop'].includes(a.category)) || null;
  const monitors = user.assignedAssets?.filter(a => a.category === 'monitor') || [];
  const dock = user.assignedAssets?.find(a => a.category === 'dock') || null;
  const peripherals = user.assignedAssets?.filter(a => 
    ['keyboard', 'mouse', 'headset', 'webcam', 'accessory'].includes(a.category)
  ) || [];

  // Get sync info for workstation
  const workstationSync = syncedDevices.find(d => 
    d.serialNumber === workstation?.serialNumber
  );

  const getSyncBadge = (device, size = 'md') => {
    const syncInfo = syncedDevices.find(d => d.serialNumber === device?.serialNumber);
    if (!syncInfo) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-300">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-xs font-medium">Not Synced</span>
        </div>
      );
    }

    const source = syncInfo.source;
    const lastSync = syncInfo.lastSyncedAt;
    const minutesAgo = Math.floor((new Date() - new Date(lastSync)) / 60000);
    const isRecent = minutesAgo < 60;

    const sourceConfig = {
      intune: {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        text: 'text-white',
        icon: '📱',
        name: 'Intune'
      },
      lansweeper: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
        text: 'text-white',
        icon: '🔍',
        name: 'Lansweeper'
      }
    };

    const config = sourceConfig[source] || sourceConfig.intune;

    if (size === 'sm') {
      return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${config.bg} ${config.text} shadow-sm`}>
          <span className="text-xs">{config.icon}</span>
          <span className="text-[10px] font-bold">{config.name}</span>
          {isRecent && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${config.bg} ${config.text} shadow-lg`}>
        <span className="text-lg">{config.icon}</span>
        <div className="flex flex-col">
          <span className="text-xs font-bold">{config.name}</span>
          <div className="flex items-center gap-1.5">
            <FiRefreshCw size={10} className={isRecent ? 'animate-spin' : ''} />
            <span className="text-[10px] opacity-90">
              {minutesAgo < 1 ? 'Just now' : minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.floor(minutesAgo / 60)}h ago`}
            </span>
          </div>
        </div>
        {isRecent && <FiCheck size={14} className="ml-1" />}
      </div>
    );
  };

  const getWarrantyStatus = (asset) => {
    if (!asset?.warrantyExpiry) return { status: 'unknown', color: 'gray', text: 'No warranty data' };
    
    const daysLeft = Math.ceil((new Date(asset.warrantyExpiry) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', color: 'red', text: `Expired ${Math.abs(daysLeft)}d ago` };
    if (daysLeft < 30) return { status: 'expiring', color: 'orange', text: `${daysLeft} days left` };
    if (daysLeft < 90) return { status: 'warning', color: 'yellow', text: `${daysLeft} days left` };
    return { status: 'active', color: 'green', text: `Active (${daysLeft} days)` };
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiPackage },
    { id: 'workstation', label: 'Workstation', icon: FiMonitor, count: workstation ? 1 : 0 },
    { id: 'monitors', label: 'Monitors', icon: FiMonitor, count: monitors.length },
    { id: 'peripherals', label: 'Peripherals', icon: FiHardDrive, count: (dock ? 1 : 0) + peripherals.length },
    { id: 'software', label: 'Software & Apps', icon: FiKey, count: (user.licenses?.length || 0) + (microsoftLicensesData?.length || 0) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/users')} className="btn btn-outline mt-1">
            <FiArrowLeft />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">{user.name}</h1>
              <p className="text-secondary-600 text-lg mt-1">{user.jobTitle || user.email}</p>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
                <Badge variant="primary">{user.role}</Badge>
                {user.department && (
                  <span className="text-sm text-secondary-600">{user.department.name}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{user.assignedAssets?.length || 0}</div>
            <div className="text-xs text-blue-700 font-medium">Assets</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">{user.licenses?.length || 0}</div>
            <div className="text-xs text-purple-700 font-medium">Licenses</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="text-2xl font-bold text-green-600">{syncedDevices.length}</div>
            <div className="text-xs text-green-700 font-medium">Synced</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl sticky top-0 z-10 shadow-sm">
        <nav className="flex gap-1 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-semibold transition-all ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Info */}
            <div className="card">
              <div className="card-header bg-gradient-to-r from-primary-50 to-transparent">
                <h3 className="text-lg font-semibold">Contact Information</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <FiMail className="text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="font-medium text-sm">{user.email}</p>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <FiPhone className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Phone</p>
                      <p className="font-medium text-sm">{user.phone}</p>
                    </div>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <FiMapPin className="text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Location</p>
                      <p className="font-medium text-sm">{user.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hardware Summary */}
            <div className="lg:col-span-2 space-y-4">
              {workstation && (
                <div className="card border-l-4 border-blue-500">
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                          💻
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">Primary Workstation</h4>
                          <p className="text-sm text-gray-600">{workstation.name}</p>
                        </div>
                      </div>
                      {getSyncBadge(workstation)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Model:</span>
                        <span className="ml-2 font-semibold">{workstation.manufacturer} {workstation.model}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Serial:</span>
                        <span className="ml-2 font-mono text-xs">{workstation.serialNumber}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {monitors.length > 0 && (
                <div className="card border-l-4 border-purple-500">
                  <div className="card-body">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                        📺
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{monitors.length} Monitor{monitors.length > 1 ? 's' : ''}</h4>
                        <p className="text-sm text-gray-600">External displays</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(dock || peripherals.length > 0) && (
                <div className="card border-l-4 border-green-500">
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                        🔌
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Peripherals</h4>
                        <p className="text-sm text-gray-600">
                          {dock ? 'Dock + ' : ''}{peripherals.length} device{peripherals.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Workstation Tab */}
        {activeTab === 'workstation' && (
          <div>
            {workstation ? (
              <div className="space-y-4">
                {/* Main Card */}
                <div className="card overflow-hidden">
                  {/* Header with Gradient */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
                          💻
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">{workstation.name}</h3>
                          <p className="text-blue-100 text-sm mt-1">{workstation.manufacturer} {workstation.model}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={workstation.status === 'assigned' ? 'success' : 'warning'}>
                              {workstation.status}
                            </Badge>
                            <span className="text-xs text-blue-100">•</span>
                            <span className="text-xs text-blue-100 font-mono">{workstation.serialNumber}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getSyncBadge(workstation)}
                        <Link to={`/assets/${workstation._id}`} className="btn btn-sm bg-white text-blue-600 hover:bg-blue-50">
                          View Full Details →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Bar */}
                  <div className="grid grid-cols-4 gap-px bg-gray-200">
                    <div className="bg-white p-4 text-center">
                      <div className="text-xs text-gray-600 mb-1">Category</div>
                      <div className="font-bold text-gray-900 capitalize text-sm">{workstation.category}</div>
                    </div>
                    <div className="bg-white p-4 text-center">
                      <div className="text-xs text-gray-600 mb-1">Condition</div>
                      <div className="font-bold text-green-600 text-sm">{workstation.condition || 'Good'}</div>
                    </div>
                    <div className="bg-white p-4 text-center">
                      <div className="text-xs text-gray-600 mb-1">Purchase</div>
                      <div className="font-bold text-gray-900 text-sm">
                        {workstation.purchaseDate ? format(new Date(workstation.purchaseDate), 'MMM yyyy') : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white p-4 text-center">
                      <div className="text-xs text-gray-600 mb-1">Value</div>
                      <div className="font-bold text-gray-900 text-sm">
                        ${workstation.purchasePrice?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Specifications */}
                  <div className="border-t border-gray-200">
                    <button
                      onClick={() => toggleSection('workstationSpecs')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FiCpu className="text-blue-600" size={20} />
                        <span className="font-semibold text-gray-900">Technical Specifications</span>
                      </div>
                      {expandedSections.workstationSpecs ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                    
                    {expandedSections.workstationSpecs && workstationSync && (
                      <div className="px-4 pb-4 animate-fade-in">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                          {workstationSync.osVersion && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Operating System</div>
                              <div className="font-semibold text-sm">{workstationSync.osVersion}</div>
                            </div>
                          )}
                          {workstation.specifications?.cpu && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Processor</div>
                              <div className="font-semibold text-sm">{workstation.specifications.cpu}</div>
                            </div>
                          )}
                          {workstation.specifications?.ram && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Memory</div>
                              <div className="font-semibold text-sm">{workstation.specifications.ram}</div>
                            </div>
                          )}
                          {workstation.specifications?.storage && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Storage</div>
                              <div className="font-semibold text-sm">{workstation.specifications.storage}</div>
                            </div>
                          )}
                          {workstationSync.complianceStatus && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Compliance</div>
                              <Badge variant={workstationSync.complianceStatus === 'compliant' ? 'success' : 'danger'}>
                                {workstationSync.complianceStatus}
                              </Badge>
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Last Synced</div>
                            <div className="font-semibold text-sm">
                              {workstationSync ? format(new Date(workstationSync.lastSyncedAt), 'MMM dd, HH:mm') : 'Never'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warranty Card */}
                {workstation.warrantyExpiry && (
                  <div className="card">
                    <div className="card-header bg-gradient-to-r from-amber-50 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FiShield className="text-amber-600" size={20} />
                          <h4 className="font-semibold text-gray-900">Warranty Protection</h4>
                        </div>
                        {(() => {
                          const warranty = getWarrantyStatus(workstation);
                          const iconMap = {
                            active: <FiCheck className="text-green-600" size={18} />,
                            expired: <FiAlertCircle className="text-red-600" size={18} />,
                            expiring: <FiClock className="text-orange-600" size={18} />,
                            warning: <FiClock className="text-yellow-600" size={18} />
                          };
                          return (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-md ${
                              warranty.color === 'green' ? 'bg-green-100 text-green-800' :
                              warranty.color === 'red' ? 'bg-red-100 text-red-800' :
                              warranty.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {iconMap[warranty.status]}
                              <span>{warranty.text}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="card-body">
                      <WarrantyTimeline
                        purchaseDate={workstation.purchaseDate}
                        warrantyStart={workstation.purchaseDate}
                        warrantyEnd={workstation.warrantyExpiry}
                      />
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600">Warranty Provider</div>
                        <div className="font-semibold text-gray-900">{workstation.warrantyProvider || 'Standard Manufacturer Warranty'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <div className="card-body text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    💻
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Workstation Assigned</h3>
                  <p className="text-gray-600">This user doesn't have a laptop or desktop assigned yet.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Monitors Tab */}
        {activeTab === 'monitors' && (
          <div>
            {monitors.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {monitors.map((monitor) => {
                  const warranty = getWarrantyStatus(monitor);
                  const isExpanded = expandedSections.monitorDetails?.[monitor._id];
                  
                  return (
                    <div key={monitor._id} className="card overflow-hidden">
                      {/* Monitor Header */}
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
                              📺
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">{monitor.name}</h4>
                              <p className="text-purple-100 text-sm">{monitor.manufacturer} {monitor.model}</p>
                            </div>
                          </div>
                          {getSyncBadge(monitor, 'sm')}
                        </div>
                      </div>

                      {/* Quick Info Bar */}
                      <div className="grid grid-cols-3 gap-px bg-gray-200">
                        <div className="bg-white p-3 text-center">
                          <div className="text-[10px] text-gray-600">Serial #</div>
                          <div className="font-mono text-xs font-bold text-gray-900 truncate">
                            {monitor.serialNumber || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-white p-3 text-center">
                          <div className="text-[10px] text-gray-600">Status</div>
                          <Badge variant={getStatusVariant(monitor.status)} className="text-xs">
                            {monitor.status}
                          </Badge>
                        </div>
                        <div className="bg-white p-3 text-center">
                          <div className="text-[10px] text-gray-600">Warranty</div>
                          <div className={`text-xs font-bold ${
                            warranty.color === 'green' ? 'text-green-600' :
                            warranty.color === 'red' ? 'text-red-600' :
                            warranty.color === 'orange' ? 'text-orange-600' :
                            'text-yellow-600'
                          }`}>
                            {warranty.status === 'active' ? '✓ Active' :
                             warranty.status === 'expired' ? '✗ Expired' :
                             warranty.status === 'expiring' ? '⚠ Expiring' : 'Unknown'}
                          </div>
                        </div>
                      </div>

                      {/* Warranty Details */}
                      {monitor.warrantyExpiry && (
                        <div className="border-t border-gray-200">
                          <button
                            onClick={() => toggleSection('monitorDetails', monitor._id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FiShield className="text-purple-600" size={16} />
                              <span className="font-semibold text-sm">Warranty Details</span>
                            </div>
                            {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                          </button>
                          
                          {isExpanded && (
                            <div className="px-4 pb-4 animate-fade-in">
                              <WarrantyTimeline
                                purchaseDate={monitor.purchaseDate}
                                warrantyStart={monitor.purchaseDate}
                                warrantyEnd={monitor.warrantyExpiry}
                              />
                              <div className="mt-3 text-xs text-gray-600">
                                {warranty.text} • {monitor.warrantyProvider || 'Standard warranty'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="p-4 bg-gray-50">
                        <Link to={`/assets/${monitor._id}`} className="btn btn-outline btn-sm w-full">
                          View Full Details →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card">
                <div className="card-body text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    📺
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Monitors Assigned</h3>
                  <p className="text-gray-600">This user doesn't have any external monitors assigned.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Peripherals Tab */}
        {activeTab === 'peripherals' && (
          <div className="space-y-6">
            {dock && (
              <div className="card border-l-4 border-green-500">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🔌</div>
                      <div>
                        <h4 className="font-bold">{dock.name}</h4>
                        <p className="text-sm text-gray-600">Docking Station</p>
                      </div>
                    </div>
                    {getSyncBadge(dock)}
                  </div>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Model:</span>
                      <p className="font-semibold mt-1">{dock.manufacturer} {dock.model}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Serial:</span>
                      <p className="font-mono text-xs mt-1">{dock.serialNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="mt-1">
                        <Badge variant={getStatusVariant(dock.status)}>{dock.status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {peripherals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {peripherals.map((peripheral) => (
                  <div key={peripheral._id} className="card">
                    <div className="card-body">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">
                          {peripheral.category === 'keyboard' && '⌨️'}
                          {peripheral.category === 'mouse' && '🖱️'}
                          {peripheral.category === 'headset' && '🎧'}
                          {peripheral.category === 'webcam' && '📹'}
                          {peripheral.category === 'accessory' && '🔗'}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-sm">{peripheral.name}</h5>
                          <p className="text-xs text-gray-600 capitalize">{peripheral.category}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-mono">{peripheral.serialNumber || 'No S/N'}</span>
                      </div>
                      {getSyncBadge(peripheral)}
                    </div>
                  </div>
                ))}
              </div>
            ) : !dock && (
              <div className="card">
                <div className="card-body text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    🔌
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Peripherals Assigned</h3>
                  <p className="text-gray-600">This user doesn't have any peripherals assigned.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Software & Apps Tab */}
        {activeTab === 'software' && (
          <div className="space-y-6">
            {/* Licenses */}
            <div className="card">
              <div className="card-header bg-gradient-to-r from-accent-50 to-transparent">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Assigned Licenses</h3>
                  <span className="text-sm text-gray-600">{user.licenses?.length || 0} licenses</span>
                </div>
              </div>
              <div className="card-body">
                {user.licenses && user.licenses.length > 0 ? (
                  <div className="space-y-3">
                    {user.licenses.map((license) => (
                      <Link
                        key={license._id}
                        to={`/licenses/${license._id}`}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200 hover:border-accent-300 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center text-xl">
                            🔑
                          </div>
                          <div>
                            <h5 className="font-semibold">{license.name}</h5>
                            <p className="text-sm text-gray-600">{license.vendor} - {license.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {license.expirationDate && (
                            <p className="text-xs text-gray-600">
                              Expires {format(new Date(license.expirationDate), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      🔑
                    </div>
                    <p>No software licenses assigned</p>
                  </div>
                )}
              </div>
            </div>

            {/* Microsoft 365 Licenses */}
            <div className="card">
              <div className="card-header bg-gradient-to-r from-blue-50 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    <div>
                      <h3 className="text-xl font-semibold">Microsoft 365 Licenses</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Assigned licenses from your Microsoft tenant
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {microsoftLicensesData?.length || 0} licenses
                  </span>
                </div>
              </div>
              <div className="card-body">
                {microsoftLicensesData && microsoftLicensesData.length > 0 ? (
                  <div className="space-y-3">
                    {microsoftLicensesData.map((license) => (
                      <div
                        key={license.skuId}
                        className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
                              {categoryIcons[license.category] || '🪙'}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{license.name}</h5>
                              <p className="text-sm text-gray-600">{license.skuPartNumber}</p>
                              {license.servicePlans && license.servicePlans.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {license.servicePlans.slice(0, 3).map((plan, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                                    >
                                      {plan.servicePlanName}
                                    </span>
                                  ))}
                                  {license.servicePlans.length > 3 && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                      +{license.servicePlans.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <Badge variant="success" text={license.status || 'Active'} />
                            {license.assignedDate && (
                              <p className="text-xs text-gray-600 mt-1">
                                Assigned {format(new Date(license.assignedDate), 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      🪙
                    </div>
                    <p>No Microsoft licenses assigned</p>
                    <p className="text-xs mt-2">Configure Microsoft Graph integration to sync licenses</p>
                  </div>
                )}
              </div>
            </div>

            {/* Installed Apps from Sync */}
            {workstationSync?.installedApps && workstationSync.installedApps.length > 0 && (
              <div className="card">
                <div className="card-header bg-gradient-to-r from-blue-50 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiActivity className="text-blue-600" size={20} />
                      <div>
                        <h3 className="text-xl font-semibold">Installed Applications</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {workstationSync.installedApps.length} apps detected from {getSyncBadge(workstation, 'sm')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSection('apps')}
                      className="btn btn-outline btn-sm"
                    >
                      {expandedSections.apps ? 'Collapse' : 'Expand All'}
                      {expandedSections.apps ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {expandedSections.apps ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
                      {workstationSync.installedApps.map((app, idx) => (
                        <div key={idx} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all hover:border-blue-300">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-lg">
                              📦
                            </div>
                            <div className="flex-1 min-w-0">
                              <h6 className="font-semibold text-sm truncate">{app.name}</h6>
                              <p className="text-xs text-gray-600 truncate">{app.publisher || 'Unknown'}</p>
                              {app.version && (
                                <div className="mt-1 inline-block px-2 py-0.5 bg-blue-50 rounded text-[10px] font-mono text-blue-700">
                                  v{app.version}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-3">
                        {workstationSync.installedApps.length} applications installed
                      </p>
                      <button
                        onClick={() => toggleSection('apps')}
                        className="btn btn-primary btn-sm"
                      >
                        Show All Apps
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
