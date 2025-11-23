import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiDownload, FiFileText, FiUpload, FiDollarSign, FiPieChart } from 'react-icons/fi';
import { reportsAPI, assetGroupsAPI } from '../../config/api';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Reports = () => {
  const [generating, setGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // Fetch spend analytics
  const { data: spendData, isLoading: loadingSpend } = useQuery({
    queryKey: ['spend-analytics'],
    queryFn: () => reportsAPI.getSpendAnalytics().then((res) => res.data.data),
  });

  // Fetch utilization report
  const { data: utilizationData } = useQuery({
    queryKey: ['utilization-report'],
    queryFn: () => reportsAPI.getUtilization().then((res) => res.data.data),
  });

  // Fetch low stock alerts
  const { data: stockAlerts } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: () => assetGroupsAPI.getLowStockAlerts().then((res) => res.data.data),
  });

  const handleExport = async (type) => {
    setGenerating(true);
    try {
      let response;
      switch (type) {
        case 'assets':
          response = await reportsAPI.exportAssets();
          break;
        case 'users':
          response = await reportsAPI.exportUsers();
          break;
        case 'licenses':
          response = await reportsAPI.exportLicenses();
          break;
        default:
          throw new Error('Unknown export type');
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export');
    } finally {
      setGenerating(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    setImporting(true);
    try {
      const response = await reportsAPI.importAssets(selectedFile);
      toast.success(response.data.message);
      setSelectedFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import assets');
    } finally {
      setImporting(false);
    }
  };

  const reports = [
    {
      title: 'Asset Inventory Report',
      description: 'Complete list of all assets with details',
      type: 'assets',
      icon: FiFileText,
      color: 'primary',
    },
    {
      title: 'User Directory Report',
      description: 'All users with assigned resources',
      type: 'users',
      icon: FiFileText,
      color: 'success',
    },
    {
      title: 'License Utilization Report',
      description: 'License usage and seat availability',
      type: 'licenses',
      icon: FiFileText,
      color: 'purple',
    },
  ];

  if (loadingSpend) return <LoadingSpinner />;

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Reports & Analytics</h1>
        <p className="text-secondary-600 mt-2 text-lg">
          Comprehensive insights and data exports
        </p>
      </div>

      {/* Stock Alerts */}
      {stockAlerts && stockAlerts.length > 0 && (
        <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500">
          <div className="card-body">
            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2 mb-4">
              <span>⚠️</span> Low Stock Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockAlerts.map((alert) => (
                <div key={alert.groupId} className="bg-white rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold text-gray-900">{alert.group}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Only {alert.availableCount} available (threshold: {alert.threshold})
                  </p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${
                    alert.severity === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {alert.severity?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spend Analytics */}
      {spendData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-secondary-900 flex items-center gap-2">
                <FiDollarSign className="text-green-600" />
                Spend Summary
              </h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Assets</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${((spendData.summary?.totalAssetSpend) || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Total Licenses</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ${((spendData.summary?.totalLicenseSpend) || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Cost per User</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${((spendData.summary?.costPerUser) || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Monthly Recurring</p>
                  <p className="text-2xl font-bold text-orange-900">
                    ${((spendData.summary?.monthlyRecurring) || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-secondary-900 flex items-center gap-2">
                <FiPieChart className="text-primary-600" />
                Spend by Category
              </h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={spendData.assets?.byCategory || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, percent }) => `${_id}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalSpend"
                  >
                    {(spendData.assets?.byCategory || []).map((entry, index) => (
                      <Cell key={`cell-${entry._id || entry.id || entry.category || `category-${index}`}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Export Reports */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-secondary-900">Export Reports</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reports.map((report) => (
              <div key={report.type} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all">
              <div className="flex items-start gap-3 mb-4">
                  <div className={`p-3 bg-${report.color}-50 rounded-lg`}>
                    <report.icon className={`text-${report.color}-600`} size={24} />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{report.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                </div>
              </div>
              <button
                  onClick={() => handleExport(report.type)}
                disabled={generating}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <FiDownload />
                Export CSV
              </button>
            </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import Assets */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-secondary-900 flex items-center gap-2">
            <FiUpload />
            Import Assets
          </h3>
        </div>
        <div className="card-body">
          <p className="text-gray-600 mb-4">
            Upload a CSV file to bulk import assets. Make sure your file includes columns for name, category, manufacturer, model, etc.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="flex-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <button
              onClick={handleImport}
              disabled={!selectedFile || importing}
              className="btn btn-primary flex items-center gap-2"
            >
              <FiUpload />
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

