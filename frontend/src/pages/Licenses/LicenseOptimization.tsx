import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FiTrendingDown,
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiUsers,
  FiPieChart,
  FiZap,
  FiLayers,
} from 'react-icons/fi';
import { licensesAPI } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import {
  generateOptimizationReport,
  calculateLicenseUtilization,
} from '../../utils/licenseOptimization';
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

const LicenseOptimization = () => {
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Fetch all licenses
  const { data: allLicensesData, isLoading } = useQuery({
    queryKey: ['all-licenses-optimization'],
    queryFn: () => licensesAPI.getAll({ limit: 1000 }).then((res) => res.data.data),
  });

  // Generate optimization report
  const optimizationReport = useMemo(() => {
    if (!allLicensesData) return null;
    return generateOptimizationReport(allLicensesData || []);
  }, [allLicensesData]);

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    if (!optimizationReport) return [];
    if (selectedPriority === 'all') return optimizationReport.recommendations;
    return optimizationReport.recommendations.filter(r => r.priority === selectedPriority);
  }, [optimizationReport, selectedPriority]);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!optimizationReport) return <div>No data available</div>;

  // Prepare chart data
  const utilizationDistribution = [
    { 
      name: 'Optimal (80-95%)', 
      value: optimizationReport.utilizationData.filter(l => l.status === 'optimal').length,
      color: '#10b981'
    },
    { 
      name: 'Underutilized (50-80%)', 
      value: optimizationReport.utilizationData.filter(l => l.status === 'underutilized').length,
      color: '#f59e0b'
    },
    { 
      name: 'Poor (<50%)', 
      value: optimizationReport.utilizationData.filter(l => l.status === 'poor').length,
      color: '#ef4444'
    },
    { 
      name: 'Over-utilized (>95%)', 
      value: optimizationReport.utilizationData.filter(l => l.status === 'overutilized').length,
      color: '#8b5cf6'
    },
  ].filter(item => item.value > 0);

  const topUnderutilized = optimizationReport.utilizationData
    .filter(l => l.status === 'poor' || l.status === 'underutilized')
    .sort((a, b) => a.utilization - b.utilization)
    .slice(0, 10);

  const savingsByType = [
    { name: 'Unused Seats', value: optimizationReport.savings.savingsBreakdown.unusedSeats, color: '#3b82f6' },
    { name: 'Consolidation', value: optimizationReport.savings.savingsBreakdown.consolidation, color: '#8b5cf6' },
  ].filter(item => item.value > 0);

  const priorityColors = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'secondary',
  };

  const typeIcons = {
    downgrade: FiTrendingDown,
    reclaim: FiUsers,
    upgrade: FiAlertCircle,
    harvest: FiZap,
    consolidate: FiLayers,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">License Optimization</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Maximize license value and minimize waste
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/licenses" className="btn btn-outline">
            View All Licenses
          </Link>
          <button className="btn btn-primary flex items-center gap-2">
            <FiDollarSign size={18} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-white border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiDollarSign className="text-green-600" size={24} />
              </div>
              <span className="text-sm font-semibold text-green-600">Annual</span>
            </div>
            <h3 className="text-3xl font-bold text-green-700">
              ${optimizationReport.summary.potentialSavings.toLocaleString()}
            </h3>
            <p className="text-sm text-secondary-600 mt-1">Potential Savings</p>
            <p className="text-xs text-secondary-500 mt-1">
              {optimizationReport.summary.savingsPercentage}% of total cost
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiPieChart className="text-blue-600" size={24} />
              </div>
              <span className="text-sm font-semibold text-blue-600">
                {optimizationReport.summary.overallUtilization.toFixed(0)}%
              </span>
            </div>
            <h3 className="text-3xl font-bold text-blue-700">
              {optimizationReport.summary.totalUsedSeats.toLocaleString()}
            </h3>
            <p className="text-sm text-secondary-600 mt-1">Seats in Use</p>
            <p className="text-xs text-secondary-500 mt-1">
              of {optimizationReport.summary.totalSeats.toLocaleString()} total
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiCheckCircle className="text-purple-600" size={24} />
              </div>
              <span className="text-sm font-semibold text-purple-600">Score</span>
            </div>
            <h3 className="text-3xl font-bold text-purple-700">
              {optimizationReport.compliance.complianceScore}%
            </h3>
            <p className="text-sm text-secondary-600 mt-1">Compliance Score</p>
            <p className="text-xs text-secondary-500 mt-1">
              {optimizationReport.compliance.compliant} of {optimizationReport.compliance.totalLicenses}
            </p>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-500 hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-amber-100 rounded-lg">
                <FiAlertCircle className="text-amber-600" size={24} />
              </div>
              <span className="text-sm font-semibold text-amber-600">Actions</span>
            </div>
            <h3 className="text-3xl font-bold text-amber-700">
              {optimizationReport.recommendations.length}
            </h3>
            <p className="text-sm text-secondary-600 mt-1">Recommendations</p>
            <p className="text-xs text-secondary-500 mt-1">
              {optimizationReport.recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length} high priority
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">License Utilization Distribution</h3>
          </div>
          <div className="card-body">
            {utilizationDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={utilizationDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={95}
                      innerRadius={50}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {utilizationDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {utilizationDistribution.map((entry, index) => (
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
              <p className="text-center text-gray-500 py-12">No utilization data</p>
            )}
          </div>
        </div>

        {/* Top Underutilized */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">Most Underutilized Licenses</h3>
          </div>
          <div className="card-body">
            {topUnderutilized.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topUnderutilized} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="utilization" fill="#ef4444" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">All licenses well-utilized!</p>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Issues */}
      {optimizationReport.compliance.issues.critical > 0 && (
        <div className="card border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-white">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <FiAlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Critical Compliance Issues</h3>
                <p className="text-sm text-red-700">
                  {optimizationReport.compliance.issues.critical} license{optimizationReport.compliance.issues.critical !== 1 ? 's' : ''} require immediate attention
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {optimizationReport.compliance.details.complianceIssues.map((issue, index) => (
                <div key={index} className="bg-white border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{issue.name}</h4>
                      <p className="text-sm text-red-600 mt-1">{issue.message}</p>
                    </div>
                    <Badge variant="danger" size="sm">{issue.issue}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Under-licensed Warning */}
      {optimizationReport.compliance.details.underLicensed.length > 0 && (
        <div className="card border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-white">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiAlertCircle className="text-purple-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-900">Under-Licensed Software</h3>
                <p className="text-sm text-purple-700">
                  {optimizationReport.compliance.details.underLicensed.length} license{optimizationReport.compliance.details.underLicensed.length !== 1 ? 's' : ''} with more users than purchased seats
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {optimizationReport.compliance.details.underLicensed.map((issue, index) => (
                <div key={index} className="bg-white border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{issue.name}</h4>
                      <p className="text-sm text-purple-600 mt-1">
                        {issue.usedSeats} seats in use, only {issue.totalSeats} purchased (shortfall: {issue.shortfall})
                      </p>
                    </div>
                    <Badge variant="danger" size="sm">Compliance Risk</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">Optimization Recommendations</h3>
              <p className="text-sm text-secondary-600 mt-1">
                Actionable insights to reduce costs and improve compliance
              </p>
            </div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="input input-sm"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
        <div className="card-body p-0">
          {filteredRecommendations.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredRecommendations.map((rec, index) => {
                const TypeIcon = typeIcons[rec.type] || FiAlertCircle;
                return (
                  <div 
                    key={index} 
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        rec.priority === 'critical' ? 'bg-red-100' :
                        rec.priority === 'high' ? 'bg-amber-100' :
                        rec.priority === 'medium' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        <TypeIcon className={`${
                          rec.priority === 'critical' ? 'text-red-600' :
                          rec.priority === 'high' ? 'text-amber-600' :
                          rec.priority === 'medium' ? 'text-blue-600' :
                          'text-gray-600'
                        }`} size={24} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{rec.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={priorityColors[rec.priority]} size="sm">
                              {rec.priority.toUpperCase()}
                            </Badge>
                            {rec.estimatedSavings > 0 && (
                              <div className="text-right">
                                <div className="text-green-600 font-bold">
                                  ${rec.estimatedSavings.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">savings/year</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Effort:</span>
                            <Badge variant={rec.effort === 'low' ? 'success' : rec.effort === 'medium' ? 'warning' : 'danger'} size="sm">
                              {rec.effort}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Impact:</span>
                            <Badge variant={rec.impact === 'critical' || rec.impact === 'high' ? 'success' : 'info'} size="sm">
                              {rec.impact}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Type:</span>
                            <span className="font-medium text-gray-700 capitalize">{rec.type}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Link 
                            to={`/licenses/${rec.licenseId}`}
                            className="btn btn-sm btn-outline"
                          >
                            View License
                          </Link>
                          <button className="btn btn-sm btn-primary">
                            Take Action
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FiCheckCircle className="mx-auto mb-3 text-green-500" size={48} />
              <p className="font-medium">No recommendations for selected priority</p>
              <p className="text-sm mt-1">Try selecting "All Priorities" to see more</p>
            </div>
          )}
        </div>
      </div>

      {/* Downgrade Candidates */}
      {optimizationReport.savings.downgradeCandidates.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">
              Downgrade Opportunities
            </h3>
            <p className="text-sm text-secondary-600 mt-1">
              Reduce seat counts to match actual usage
            </p>
          </div>
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>License</th>
                    <th>Current Seats</th>
                    <th>Used Seats</th>
                    <th>Recommended</th>
                    <th>Potential Savings</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizationReport.savings.downgradeCandidates.map((candidate) => (
                    <tr key={candidate.licenseId}>
                      <td className="font-medium">{candidate.name}</td>
                      <td>{candidate.currentSeats}</td>
                      <td className="text-blue-600 font-semibold">{candidate.usedSeats}</td>
                      <td className="text-green-600 font-semibold">{candidate.recommendedSeats}</td>
                      <td className="text-green-600 font-bold">
                        ${candidate.potentialSavings.toLocaleString()}/yr
                      </td>
                      <td>
                        <Link 
                          to={`/licenses/${candidate.licenseId}`}
                          className="btn btn-sm btn-outline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* True-Up Costs */}
      {optimizationReport.trueUp.licensesNeedingTrueUp > 0 && (
        <div className="card border-l-4 border-red-500">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiAlertCircle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Audit True-Up Exposure</h3>
                <p className="text-sm text-red-700">
                  Potential true-up costs if audited today
                </p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="bg-red-50 rounded-lg p-6 mb-4">
              <div className="text-center">
                <p className="text-sm text-red-800 mb-2">Estimated True-Up Cost</p>
                <p className="text-4xl font-bold text-red-600">
                  ${optimizationReport.trueUp.totalTrueUpCost.toLocaleString()}
                </p>
                <p className="text-xs text-red-700 mt-2">
                  for {optimizationReport.trueUp.licensesNeedingTrueUp} license{optimizationReport.trueUp.licensesNeedingTrueUp !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              {optimizationReport.trueUp.details.map((item, index) => (
                <div key={index} className="bg-white border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Purchased: {item.purchased} | In Use: {item.inUse} | Shortfall: {item.shortfall}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600 font-bold">
                        ${item.trueUpCost.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        @${item.costPerSeat}/seat
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Savings Breakdown */}
      {savingsByType.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">Savings Breakdown</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={savingsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}k`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {savingsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium mb-1">Unused Seats Savings</p>
                  <p className="text-2xl font-bold text-blue-700">
                    ${optimizationReport.savings.savingsBreakdown.unusedSeats.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {optimizationReport.savings.reclaimableSeats} reclaimable seats
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-purple-900 font-medium mb-1">Consolidation Savings</p>
                  <p className="text-2xl font-bold text-purple-700">
                    ${optimizationReport.savings.savingsBreakdown.consolidation.toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {optimizationReport.savings.consolidationOpportunities.length} opportunities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseOptimization;

