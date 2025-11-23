import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiShield, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiClock,
  FiEye,
  FiDownload,
  FiFilter,
  FiTrendingUp,
  FiFileText,
  FiDatabase,
  FiInfo
} from 'react-icons/fi';
import { auditLogsAPI, assetsAPI, licensesAPI, reportsAPI } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const ComplianceOverview = () => {
  const [timeRange, setTimeRange] = useState('30');

  // Fetch audit logs
  const { data: auditData, isLoading: loadingAudits } = useQuery({
    queryKey: ['audit-logs-compliance', timeRange],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));
      return auditLogsAPI.getAll({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      }).then(res => res.data);
    },
  });

  // Fetch assets for information register
  const { data: assetsData } = useQuery({
    queryKey: ['assets-compliance'],
    queryFn: () => assetsAPI.getAll({ limit: 1000 }).then(res => res.data),
  });

  // Fetch licenses for shadow IT detection
  const { data: licensesData } = useQuery({
    queryKey: ['licenses-compliance'],
    queryFn: () => licensesAPI.getAll({ limit: 1000 }).then(res => res.data),
  });

  // Fetch audit summary for better metrics
  const { data: auditStats } = useQuery({
    queryKey: ['audit-stats-compliance'],
    queryFn: () => auditLogsAPI.getStats().then(res => res.data),
  });

  if (loadingAudits) return <LoadingSpinner />;

  const auditLogs = auditData?.data || [];
  const assets = assetsData?.data || [];
  const licenses = licensesData?.data || [];
  const auditStatsData = auditStats?.data || {};

  // Mock shadow IT detection (in production, this would come from Intune/MDM integration)
  const shadowITApps = [
    { name: 'Dropbox Personal', users: 12, risk: 'high', discovered: '2 days ago', emoji: '📦', category: 'File Sharing' },
    { name: 'Zoom Free Account', users: 8, risk: 'medium', discovered: '5 days ago', emoji: '📹', category: 'Video Conferencing' },
    { name: 'Google Drive Personal', users: 15, risk: 'high', discovered: '1 week ago', emoji: '☁️', category: 'Cloud Storage' },
    { name: 'Trello Free', users: 5, risk: 'low', discovered: '2 weeks ago', emoji: '📋', category: 'Project Management' },
    { name: 'Slack Free Workspace', users: 7, risk: 'medium', discovered: '3 weeks ago', emoji: '💬', category: 'Communication' },
    { name: 'WeTransfer', users: 3, risk: 'high', discovered: '1 month ago', emoji: '📨', category: 'File Transfer' },
  ];

  // Calculate compliance metrics
  const totalAssets = assets.length;
  const assetsWithWarranty = assets.filter(a => a.warrantyExpiry && new Date(a.warrantyExpiry) > new Date()).length;
  const expiredWarranties = assets.filter(a => a.warrantyExpiry && new Date(a.warrantyExpiry) < new Date()).length;
  const licensesActive = licenses.filter(l => l.status === 'active').length;
  const licensesExpiring = licenses.filter(l => {
    if (!l.expirationDate) return false;
    const daysUntilExpiry = Math.ceil((new Date(l.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  }).length;

  const complianceScore = Math.round(
    ((assetsWithWarranty / totalAssets) * 30 +
    (licensesActive / licenses.length) * 40 +
    (shadowITApps.length === 0 ? 30 : Math.max(0, 30 - shadowITApps.length * 5))) || 0
  );

  // Handle export functionality
  const handleExportReport = async () => {
    try {
      // Create CSV content
      let csvContent = 'Compliance Report\n\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Overall Compliance Score,${complianceScore}%\n`;
      csvContent += `Valid Warranties,${assetsWithWarranty}\n`;
      csvContent += `Expired Warranties,${expiredWarranties}\n`;
      csvContent += `Active Licenses,${licensesActive}\n`;
      csvContent += `Licenses Expiring Soon,${licensesExpiring}\n`;
      csvContent += `Shadow IT Detected,${shadowITApps.length}\n`;
      csvContent += '\nShadow IT Applications\n';
      csvContent += 'Name,Category,Risk Level,Users,Discovered\n';
      shadowITApps.forEach(app => {
        csvContent += `"${app.name}","${app.category}","${app.risk}","${app.users}","${app.discovered}"\n`;
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `compliance-report-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Compliance report exported successfully!');
    } catch (error) {
      toast.error('Failed to export compliance report');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">
            Compliance & Risk
          </h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Monitor compliance, detect shadow IT, and manage risk
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button 
            onClick={handleExportReport}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiDownload />
            Export Report
          </button>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Compliance Score</h3>
              <p className="text-sm text-gray-600">
                Based on asset warranties, license compliance, and shadow IT detection
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={complianceScore >= 80 ? '#10b981' : complianceScore >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(complianceScore / 100) * 351.68} 351.68`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{complianceScore}%</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-green-50 border-l-4 border-green-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Valid Warranties</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{assetsWithWarranty}</p>
                <p className="text-xs text-green-600 mt-1">
                  {Math.round((assetsWithWarranty / totalAssets) * 100)}% of assets
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-l-4 border-red-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Expired Warranties</p>
                <p className="text-3xl font-bold text-red-900 mt-1">{expiredWarranties}</p>
                <p className="text-xs text-red-600 mt-1">Requires attention</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FiAlertTriangle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-orange-50 border-l-4 border-orange-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Licenses Expiring Soon</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{licensesExpiring}</p>
                <p className="text-xs text-orange-600 mt-1">Within 30 days</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiClock className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Shadow IT Detected</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">{shadowITApps.length}</p>
                <p className="text-xs text-purple-600 mt-1">Unapproved apps</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiShield className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shadow IT Detection */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-secondary-900 flex items-center gap-2">
              <FiShield className="text-purple-600" />
              Shadow IT Detection
            </h3>
            <Badge variant="warning">{shadowITApps.length} detected</Badge>
          </div>
        </div>
        <div className="card-body">
          {shadowITApps.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiCheckCircle className="mx-auto mb-4 text-green-500" size={48} />
              <p className="font-medium">No shadow IT detected</p>
              <p className="text-sm mt-1">All software usage is approved and compliant</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shadowITApps.map((app, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:shadow-xl hover:border-red-300 transition-all bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
                      <span className="text-3xl">{app.emoji}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{app.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{app.category}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-semibold">{app.users} users</span> • Discovered {app.discovered}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-3">
                      <Badge variant={
                        app.risk === 'high' ? 'danger' :
                        app.risk === 'medium' ? 'warning' : 'default'
                      }>
                        {app.risk.toUpperCase()} RISK
                      </Badge>
                    </div>
                    <button className="btn btn-outline flex items-center gap-2">
                      <FiEye size={16} />
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-secondary-900">Recent Audit Activity</h3>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Timestamp</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Resource</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500">
                      <FiInfo className="mx-auto mb-2 text-gray-400" size={32} />
                      <p className="font-medium">No audit logs found</p>
                      <p className="text-sm mt-1">Activity will appear here as actions are performed</p>
                    </td>
                  </tr>
                ) : (
                  auditLogs.slice(0, 10).map((log) => (
                    <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {log.user?.name || 'System'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          log.actionType === 'create' ? 'success' :
                          log.actionType === 'delete' ? 'danger' :
                          log.actionType === 'update' ? 'warning' : 'default'
                        }>
                          {log.actionType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {log.targetType}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-md truncate">
                        {log.description || log.targetName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Information Security Register */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-secondary-900 flex items-center gap-2">
              <FiDatabase className="text-primary-600" />
              Information Security Register
            </h3>
            <Badge variant="info">{totalAssets} assets</Badge>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <FiCheckCircle className="text-green-600" size={24} />
                <h4 className="font-bold text-gray-900">Covered by Warranty</h4>
              </div>
              <p className="text-3xl font-bold text-green-700">{assetsWithWarranty}</p>
              <p className="text-sm text-green-600 mt-1">
                {Math.round((assetsWithWarranty / Math.max(totalAssets, 1)) * 100)}% compliance
              </p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <FiAlertTriangle className="text-red-600" size={24} />
                <h4 className="font-bold text-gray-900">No Warranty Coverage</h4>
              </div>
              <p className="text-3xl font-bold text-red-700">{expiredWarranties}</p>
              <p className="text-sm text-red-600 mt-1">Requires renewal or replacement</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <FiFileText className="text-blue-600" size={24} />
                <h4 className="font-bold text-gray-900">Total Assets Tracked</h4>
              </div>
              <p className="text-3xl font-bold text-blue-700">{totalAssets}</p>
              <p className="text-sm text-blue-600 mt-1">In compliance register</p>
            </div>
          </div>
        </div>
      </div>

      {/* License Compliance Summary */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-secondary-900 flex items-center gap-2">
              <FiFileText className="text-cyan-600" />
              License Compliance Summary
            </h3>
            <Badge variant="info">{licenses.length} licenses</Badge>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
              <div className="flex items-center gap-3 mb-2">
                <FiCheckCircle className="text-emerald-600" size={24} />
                <h4 className="font-bold text-gray-900">Active Licenses</h4>
              </div>
              <p className="text-3xl font-bold text-emerald-700">{licensesActive}</p>
              <p className="text-sm text-emerald-600 mt-1">
                {Math.round((licensesActive / Math.max(licenses.length, 1)) * 100)}% of total
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <FiClock className="text-orange-600" size={24} />
                <h4 className="font-bold text-gray-900">Expiring Soon</h4>
              </div>
              <p className="text-3xl font-bold text-orange-700">{licensesExpiring}</p>
              <p className="text-sm text-orange-600 mt-1">Within next 30 days</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <FiTrendingUp className="text-slate-600" size={24} />
                <h4 className="font-bold text-gray-900">Compliance Rate</h4>
              </div>
              <p className="text-3xl font-bold text-slate-700">
                {Math.round(((licensesActive + licensesExpiring) / Math.max(licenses.length, 1)) * 100)}%
              </p>
              <p className="text-sm text-slate-600 mt-1">Based on license status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceOverview;

