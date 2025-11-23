/**
 * Contract Health Score Component
 * 
 * Displays and calculates contract health scores
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiTrendingUp, FiTrendingDown, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import LoadingSpinner from '../ui/LoadingSpinner';

interface HealthFactor {
  name: string;
  positive: boolean;
  impact: number;
}

interface ContractHealthData {
  healthScore: number;
  factors?: HealthFactor[];
  recommendations?: string[];
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Unknown';
}

interface ContractHealthScoreProps {
  contractId?: string;
}

const ContractHealthScore: React.FC<ContractHealthScoreProps> = ({ contractId }) => {
  const { data, isLoading } = useQuery<{ data: ContractHealthData }>({
    queryKey: ['contract', contractId, 'health-score'],
    queryFn: () => itamAPI.contracts.getHealthScore(contractId || ''),
    enabled: !!contractId,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const healthScore = data?.data?.healthScore || 0;
  const factors = data?.data?.factors || [];
  const recommendations = data?.data?.recommendations || [];
  const riskLevel = data?.data?.riskLevel || 'Unknown';

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'Low':
        return 'text-green-600 bg-green-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'High':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`p-6 rounded-lg border-2 ${getScoreBg(healthScore)}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Contract Health Score</h3>
          <p className="text-sm text-gray-600">Overall contract health assessment</p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${getScoreColor(healthScore)}`}>
            {healthScore}
          </div>
          <div className="text-xs text-gray-500 uppercase">out of 100</div>
        </div>
      </div>

      {/* Risk Level */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Risk Level:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(riskLevel)}`}
          >
            {riskLevel}
          </span>
        </div>
      </div>

      {/* Factors */}
      {factors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Health Factors</h4>
          <div className="space-y-2">
            {factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{factor.name}</span>
                <div className="flex items-center gap-2">
                  {factor.positive ? (
                    <FiTrendingUp className="text-green-600" />
                  ) : (
                    <FiTrendingDown className="text-red-600" />
                  )}
                  <span className={factor.positive ? 'text-green-600' : 'text-red-600'}>
                    {factor.impact > 0 ? '+' : ''}
                    {factor.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FiAlertCircle className="text-blue-600" />
            Recommendations
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ContractHealthScore;

