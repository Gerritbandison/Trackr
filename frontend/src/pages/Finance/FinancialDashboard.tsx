import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiDollarSign, 
  FiTrendingDown, 
  FiTrendingUp,
  FiPieChart,
  FiBarChart2,
  FiDownload,
} from 'react-icons/fi';
import { assetsAPI, licensesAPI } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { calculateTotalDepreciation } from '../../utils/depreciation';
import { generateTCOReport } from '../../utils/tco';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const FinancialDashboard = () => {
  const [tcoYears, setTcoYears] = useState(5);
  const [electricityCost, setElectricityCost] = useState(0.12);
  const [maintenancePercent, setMaintenancePercent] = useState(10);

  // Fetch all assets
  const { data: allAssetsData, isLoading: loadingAssets } = useQuery({
    queryKey: ['all-assets-financial'],
    queryFn: () => assetsAPI.getAll({ limit: 10000 }).then((res) => res.data.data),
  });

  // Fetch license stats
  const { data: licenseStats, isLoading: loadingLicenses } = useQuery({
    queryKey: ['licenseStats-financial'],
    queryFn: () => licensesAPI.getStats().then((res) => res.data.data),
  });

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    if (!allAssetsData) return null;

    const assets = allAssetsData || [];
    
    // Purchase value
    const totalPurchaseValue = assets.reduce(
      (sum, asset) => sum + (asset.purchasePrice || 0), 
      0
    );

    // Depreciation
    const depreciation = calculateTotalDepreciation(assets);

    // TCO
    const tcoOptions = {
      electricityCostPerKWh: electricityCost,
      annualMaintenancePercent: maintenancePercent / 100,
      yearsToCalculate: tcoYears,
    };
    const tcoReport = generateTCOReport(assets, tcoOptions);

    // By category
    const byCategory = {};
    assets.forEach(asset => {
      const category = asset.category || 'Unknown';
      if (!byCategory[category]) {
        byCategory[category] = {
          count: 0,
          purchaseValue: 0,
          currentValue: 0,
        };
      }
      byCategory[category].count++;
      byCategory[category].purchaseValue += asset.purchasePrice || 0;
    });

    // License costs
    const annualLicenseCost = licenseStats?.totalAnnualCost || 0;
    const total5YearLicenseCost = annualLicenseCost * 5;

    return {
      assets: {
        totalPurchaseValue,
        currentValue: depreciation?.currentValue || 0,
        accumulatedDepreciation: depreciation?.accumulatedDepreciation || 0,
        annualDepreciation: depreciation?.annualDepreciation || 0,
        averageDepreciationPercent: depreciation?.averageDepreciationPercentage || 0,
        fullyDepreciated: depreciation?.fullyDepreciatedCount || 0,
        assetCount: assets.length,
      },
      tco: tcoReport,
      licenses: {
        annual: annualLicenseCost,
        total5Year: total5YearLicenseCost,
        totalLicenses: licenseStats?.totalLicenses || 0,
      },
      byCategory,
      totalValue: totalPurchaseValue + total5YearLicenseCost,
    };
  }, [allAssetsData, licenseStats, electricityCost, maintenancePercent, tcoYears]);

  if (loadingAssets || loadingLicenses) return <LoadingSpinner fullScreen />;
  if (!financialMetrics) return <div>No data available</div>;

  // Prepare chart data
  const valueComparisonData = [
    { 
      name: 'Purchase Value', 
      value: financialMetrics.assets.totalPurchaseValue,
      color: '#3b82f6' 
    },
    { 
      name: 'Current Value', 
      value: financialMetrics.assets.currentValue,
      color: '#10b981' 
    },
    { 
      name: 'Depreciation', 
      value: financialMetrics.assets.accumulatedDepreciation,
      color: '#ef4444' 
    },
  ];

  const categoryData = Object.entries(financialMetrics.byCategory).map(([category, data]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    value: data.purchaseValue,
    count: data.count,
  })).sort((a, b) => b.value - a.value).slice(0, 8); // Top 8 categories

  const tcoBreakdownData = financialMetrics.tco.summary ? [
    { name: 'Purchase Cost', value: financialMetrics.tco.summary.purchasePrice, color: '#6366f1' },
    { name: 'Power', value: financialMetrics.tco.summary.annualPower * tcoYears, color: '#f59e0b' },
    { name: 'Maintenance', value: financialMetrics.tco.summary.annualMaintenance * tcoYears, color: '#10b981' },
    { name: 'Support', value: financialMetrics.tco.summary.annualSupport * tcoYears, color: '#ef4444' },
  ].filter(item => item.value > 0) : [];

  const costTrendData = financialMetrics.tco?.summary?.purchasePrice ? 
    Array.from({ length: tcoYears }, (_, i) => ({
      year: `Year ${i + 1}`,
      cumulative: financialMetrics.tco.summary.purchasePrice + 
                  (financialMetrics.tco.summary.annualOperatingCost * (i + 1)),
    })) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Financial Dashboard</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Comprehensive financial analysis and Total Cost of Ownership
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <FiDownload size={18} />
          Export Report
        </button>
      </div>

      {/* TCO Settings */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">TCO Calculation Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TCO Period (Years)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={tcoYears}
                onChange={(e) => setTcoYears(parseInt(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Electricity Cost ($/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={electricityCost}
                onChange={(e) => setElectricityCost(parseFloat(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Maintenance (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={maintenancePercent}
                onChange={(e) => setMaintenancePercent(parseInt(e.target.value))}
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiDollarSign className="text-blue-600" size={24} />
              </div>
              <FiTrendingUp className="text-blue-600" size={20} />
            </div>
            <h3 className="text-3xl font-bold text-blue-700">
              ${financialMetrics.assets.totalPurchaseValue.toLocaleString()}
            </h3>
            <p className="text-sm text-secondary-600 mt-1">Total Purchase Value</p>
            <p className="text-xs text-secondary-500 mt-1">{financialMetrics.assets.assetCount} assets</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-white border-l-4 border-green-500">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiPieChart className="text-green-600" size={24} />
              </div>
              <span className="text-sm font-semibold text-green-600">
                {(100 - financialMetrics.assets.averageDepreciationPercent).toFixed(0)}%
              </span>
            </div>
            <h3 className="text-3xl font-bold text-green-700">
              ${financialMetrics.assets.currentValue.toLocaleString()}
            </h3>
            <p className="text-sm text-secondary-600 mt-1">Current Book Value</p>
            <p className="text-xs text-secondary-500 mt-1">After depreciation</p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-500">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiBarChart2 className="text-purple-600" size={24} />
              </div>
              <span className="text-sm font-semibold text-purple-600">{tcoYears} years</span>
            </div>
            <h3 className="text-3xl font-bold text-purple-700">
              ${(financialMetrics.tco.summary?.totalTCO || 0).toLocaleString()}
            </h3>
            <p className="text-sm text-secondary-600 mt-1">Total Cost of Ownership</p>
            <p className="text-xs text-secondary-500 mt-1">
              ${(financialMetrics.tco.summary?.annualOperatingCost || 0).toLocaleString()}/year operating
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-500">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-amber-100 rounded-lg">
                <FiTrendingDown className="text-amber-600" size={24} />
              </div>
              <span className="text-sm font-semibold text-amber-600">
                {financialMetrics.assets.averageDepreciationPercent.toFixed(0)}%
              </span>
            </div>
            <h3 className="text-3xl font-bold text-amber-700">
              ${financialMetrics.assets.accumulatedDepreciation.toLocaleString()}
            </h3>
            <p className="text-sm text-secondary-600 mt-1">Total Depreciation</p>
            <p className="text-xs text-secondary-500 mt-1">
              ${financialMetrics.assets.annualDepreciation.toLocaleString()}/year avg
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value Comparison */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">Asset Value Analysis</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valueComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {valueComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TCO Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">
              TCO Breakdown ({tcoYears} Years)
            </h3>
          </div>
          <div className="card-body">
            {tcoBreakdownData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={tcoBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                      }
                      outerRadius={95}
                      innerRadius={50}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {tcoBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {tcoBreakdownData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-gray-700">
                        <span className="font-semibold">${(entry.value / 1000).toFixed(0)}k</span> {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-12">No TCO data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Category */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">Investment by Category</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <YAxis dataKey="category" type="category" tick={{ fill: '#6b7280', fontSize: 12 }} width={100} />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TCO Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">Cumulative TCO Over Time</h3>
          </div>
          <div className="card-body">
            {costTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={costTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No trend data available</p>
            )}
          </div>
        </div>
      </div>

      {/* License Costs */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-secondary-900">Software License Costs</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
              <p className="text-sm text-purple-900 font-medium mb-2">Annual License Cost</p>
              <p className="text-3xl font-bold text-purple-700">
                ${financialMetrics.licenses.annual.toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 mt-2">Per year</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-100">
              <p className="text-sm text-indigo-900 font-medium mb-2">5-Year Projection</p>
              <p className="text-3xl font-bold text-indigo-700">
                ${financialMetrics.licenses.total5Year.toLocaleString()}
              </p>
              <p className="text-xs text-indigo-600 mt-2">Total software investment</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <p className="text-sm text-blue-900 font-medium mb-2">Active Licenses</p>
              <p className="text-3xl font-bold text-blue-700">
                {financialMetrics.licenses.totalLicenses}
              </p>
              <p className="text-xs text-blue-600 mt-2">Total subscriptions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card bg-gradient-to-r from-gray-50 to-white">
        <div className="card-body">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Asset Valuation</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Original Purchase Value:</span>
                  <span className="font-semibold">${financialMetrics.assets.totalPurchaseValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Book Value:</span>
                  <span className="font-semibold text-green-600">${financialMetrics.assets.currentValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Depreciation:</span>
                  <span className="font-semibold text-red-600">-${financialMetrics.assets.accumulatedDepreciation.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-600">Value Retention:</span>
                  <span className="font-semibold">{(100 - financialMetrics.assets.averageDepreciationPercent).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Operating Costs</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Annual Operating Cost:</span>
                  <span className="font-semibold">${(financialMetrics.tco.summary?.annualOperatingCost || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{tcoYears}-Year TCO:</span>
                  <span className="font-semibold text-purple-600">${(financialMetrics.tco.summary?.totalTCO || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Annual License Cost:</span>
                  <span className="font-semibold">${financialMetrics.licenses.annual.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-600">Operating Cost Ratio:</span>
                  <span className="font-semibold">{(financialMetrics.tco.summary?.operatingCostPercentage || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;

