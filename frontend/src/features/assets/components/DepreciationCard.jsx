import { useState } from 'react';
import { FiTrendingDown, FiDollarSign, FiCalendar, FiInfo } from 'react-icons/fi';
import { 
  calculateAssetDepreciation, 
  getDepreciationSchedule,
  DEPRECIATION_METHODS 
} from '../../utils/depreciation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import Tooltip from './Tooltip';
import Badge from './Badge';

const DepreciationCard = ({ asset }) => {
  const [selectedMethod, setSelectedMethod] = useState(DEPRECIATION_METHODS.STRAIGHT_LINE);
  const [showSchedule, setShowSchedule] = useState(false);

  if (!asset.purchasePrice || !asset.purchaseDate) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <FiInfo className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-600">
            Purchase price and date required for depreciation calculation
          </p>
        </div>
      </div>
    );
  }

  const depreciationData = calculateAssetDepreciation(asset, selectedMethod);
  const schedule = getDepreciationSchedule(asset, selectedMethod);

  // Prepare chart data
  const chartData = schedule.map((item) => ({
    year: `Year ${item.year}`,
    'Book Value': item.bookValue,
    'Accumulated Depreciation': item.accumulatedDepreciation,
  }));

  const methodLabels = {
    [DEPRECIATION_METHODS.STRAIGHT_LINE]: 'Straight Line',
    [DEPRECIATION_METHODS.DECLINING_BALANCE]: 'Declining Balance (200%)',
    [DEPRECIATION_METHODS.SUM_OF_YEARS]: 'Sum of Years Digits',
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiTrendingDown className="text-purple-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Asset Depreciation</h3>
              <p className="text-sm text-gray-500">Financial value tracking over time</p>
            </div>
          </div>

          {/* Depreciation Method Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Method:</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="input input-sm"
            >
              {Object.entries(methodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card-body space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Original Value */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <FiDollarSign className="text-blue-600" size={18} />
              <span className="text-sm font-medium text-blue-900">Original Value</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              ${depreciationData.originalValue.toLocaleString()}
            </div>
          </div>

          {/* Current Value */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <FiDollarSign className="text-green-600" size={18} />
              <span className="text-sm font-medium text-green-900">Current Value</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              ${depreciationData.currentValue.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {depreciationData.depreciationPercentage}% depreciated
            </div>
          </div>

          {/* Accumulated Depreciation */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <FiTrendingDown className="text-orange-600" size={18} />
              <span className="text-sm font-medium text-orange-900">Total Depreciation</span>
            </div>
            <div className="text-2xl font-bold text-orange-700">
              ${depreciationData.accumulatedDepreciation.toLocaleString()}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              ${depreciationData.annualDepreciation.toLocaleString()}/year avg
            </div>
          </div>

          {/* Remaining Life */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <FiCalendar className="text-purple-600" size={18} />
              <span className="text-sm font-medium text-purple-900">Remaining Life</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {depreciationData.remainingLifeYears} years
            </div>
            {depreciationData.isFullyDepreciated && (
              <Badge variant="warning" size="sm" className="mt-2">
                Fully Depreciated
              </Badge>
            )}
          </div>
        </div>

        {/* Depreciation Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Depreciation Timeline</h4>
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {showSchedule ? 'Hide' : 'Show'} Schedule
            </button>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBookValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorDepreciation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Book Value"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorBookValue)"
              />
              <Area
                type="monotone"
                dataKey="Accumulated Depreciation"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorDepreciation)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Depreciation Schedule Table */}
        {showSchedule && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Date</th>
                  <th>Book Value</th>
                  <th>Yearly Depreciation</th>
                  <th>Accumulated Depreciation</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((item, index) => (
                  <tr key={index}>
                    <td className="font-medium">{item.year}</td>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td className="font-semibold text-green-600">
                      ${item.bookValue.toLocaleString()}
                    </td>
                    <td className="text-orange-600">
                      ${item.yearlyDepreciation.toLocaleString()}
                    </td>
                    <td className="text-gray-700">
                      ${item.accumulatedDepreciation.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Footer */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <FiInfo className="text-gray-500 mt-0.5 flex-shrink-0" size={16} />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">About {methodLabels[selectedMethod]} Depreciation</p>
              {selectedMethod === DEPRECIATION_METHODS.STRAIGHT_LINE && (
                <p>
                  This method spreads the cost evenly over the asset's useful life. 
                  It's the most common and straightforward depreciation method.
                </p>
              )}
              {selectedMethod === DEPRECIATION_METHODS.DECLINING_BALANCE && (
                <p>
                  This method applies a higher depreciation rate in the early years. 
                  It's useful for assets that lose value quickly, like technology.
                </p>
              )}
              {selectedMethod === DEPRECIATION_METHODS.SUM_OF_YEARS && (
                <p>
                  This method provides accelerated depreciation but less aggressive than declining balance. 
                  It's a middle ground between straight-line and declining balance methods.
                </p>
              )}
              <p className="mt-2 text-xs">
                Useful Life: {depreciationData.usefulLifeYears} years • 
                Salvage Value: ${depreciationData.salvageValue.toLocaleString()} • 
                Purchase Date: {new Date(asset.purchaseDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepreciationCard;

