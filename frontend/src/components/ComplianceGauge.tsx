import React from 'react';
import { FiShield, FiCheckCircle, FiAlertTriangle, FiXCircle } from 'react-icons/fi';

export interface ComplianceMetrics {
  overallScore: number; // 0-100
  totalAssets: number;
  compliantAssets: number;
  nonCompliantAssets: number;
  pendingReview: number;
  categories?: {
    software: number;
    hardware: number;
    licenses: number;
    warranties: number;
  };
}

interface ComplianceGaugeProps {
  metrics: ComplianceMetrics;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

const ComplianceGauge: React.FC<ComplianceGaugeProps> = ({
  metrics,
  size = 'md',
  showDetails = true,
  className = '',
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) {
      return {
        gauge: 'text-success-500 dark:text-success-400',
        bg: 'bg-success-100 dark:bg-success-900/30',
        border: 'border-success-200 dark:border-success-800',
        label: 'text-success-700 dark:text-success-400',
      };
    } else if (score >= 70) {
      return {
        gauge: 'text-primary-500 dark:text-primary-400',
        bg: 'bg-primary-100 dark:bg-primary-900/30',
        border: 'border-primary-200 dark:border-primary-800',
        label: 'text-primary-700 dark:text-primary-400',
      };
    } else if (score >= 50) {
      return {
        gauge: 'text-accent-500 dark:text-accent-400',
        bg: 'bg-accent-100 dark:bg-accent-900/30',
        border: 'border-accent-200 dark:border-accent-800',
        label: 'text-accent-700 dark:text-accent-400',
      };
    } else {
      return {
        gauge: 'text-danger-500 dark:text-danger-400',
        bg: 'bg-danger-100 dark:bg-danger-900/30',
        border: 'border-danger-200 dark:border-danger-800',
        label: 'text-danger-700 dark:text-danger-400',
      };
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <FiCheckCircle className="text-success-500 dark:text-success-400" size={20} />;
    if (score >= 70) return <FiCheckCircle className="text-primary-500 dark:text-primary-400" size={20} />;
    if (score >= 50) return <FiAlertTriangle className="text-accent-500 dark:text-accent-400" size={20} />;
    return <FiXCircle className="text-danger-500 dark:text-danger-400" size={20} />;
  };

  const sizeConfig = {
    sm: {
      gaugeSize: 120,
      strokeWidth: 12,
      fontSize: 'text-2xl',
      iconSize: 16,
    },
    md: {
      gaugeSize: 160,
      strokeWidth: 16,
      fontSize: 'text-3xl',
      iconSize: 20,
    },
    lg: {
      gaugeSize: 200,
      strokeWidth: 20,
      fontSize: 'text-4xl',
      iconSize: 24,
    },
  };

  const config = sizeConfig[size];
  const colors = getScoreColor(metrics.overallScore);
  const circumference = 2 * Math.PI * (config.gaugeSize / 2 - config.strokeWidth / 2);
  const offset = circumference - (metrics.overallScore / 100) * circumference;

  const compliancePercentage = metrics.totalAssets > 0
    ? Math.round((metrics.compliantAssets / metrics.totalAssets) * 100)
    : 0;

  return (
    <div
      className={`
        bg-white dark:bg-slate-800
        border-2 border-slate-200 dark:border-slate-700
        rounded-2xl
        p-4 sm:p-5 md:p-6
        transition-all duration-300
        hover:shadow-xl
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-md">
            <FiShield className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              Compliance Status
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Overall compliance score
            </p>
          </div>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${colors.bg} ${colors.border} ${colors.label}`}>
          {getScoreIcon(metrics.overallScore)}
          {getScoreLabel(metrics.overallScore)}
        </div>
      </div>

      {/* Gauge Chart */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative" style={{ width: config.gaugeSize, height: config.gaugeSize }}>
          {/* SVG Gauge */}
          <svg
            width={config.gaugeSize}
            height={config.gaugeSize}
            className="transform -rotate-90"
          >
            {/* Background Circle */}
            <circle
              cx={config.gaugeSize / 2}
              cy={config.gaugeSize / 2}
              r={config.gaugeSize / 2 - config.strokeWidth / 2}
              fill="none"
              stroke="currentColor"
              strokeWidth={config.strokeWidth}
              className="text-slate-200 dark:text-slate-700"
            />
            {/* Progress Circle */}
            <circle
              cx={config.gaugeSize / 2}
              cy={config.gaugeSize / 2}
              r={config.gaugeSize / 2 - config.strokeWidth / 2}
              fill="none"
              stroke="currentColor"
              strokeWidth={config.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={colors.gauge}
              style={{
                transition: 'stroke-dashoffset 0.8s ease-in-out',
              }}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-bold ${colors.gauge} ${config.fontSize}`}>
              {Math.round(metrics.overallScore)}%
            </div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
              Score
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className="space-y-3 sm:space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-success-50 to-emerald-50 dark:from-success-900/20 dark:to-emerald-900/20 border border-success-200 dark:border-success-800">
              <div className="text-xs sm:text-sm text-success-700 dark:text-success-400 font-semibold mb-1">
                Compliant
              </div>
              <div className="text-lg sm:text-xl font-bold text-success-900 dark:text-success-300">
                {metrics.compliantAssets}
              </div>
              <div className="text-xs text-success-600 dark:text-success-500 mt-1">
                {compliancePercentage}%
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-danger-50 to-red-50 dark:from-danger-900/20 dark:to-red-900/20 border border-danger-200 dark:border-danger-800">
              <div className="text-xs sm:text-sm text-danger-700 dark:text-danger-400 font-semibold mb-1">
                Non-Compliant
              </div>
              <div className="text-lg sm:text-xl font-bold text-danger-900 dark:text-danger-300">
                {metrics.nonCompliantAssets}
              </div>
              <div className="text-xs text-danger-600 dark:text-danger-500 mt-1">
                {metrics.totalAssets > 0
                  ? Math.round((metrics.nonCompliantAssets / metrics.totalAssets) * 100)
                  : 0}%
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-accent-50 to-yellow-50 dark:from-accent-900/20 dark:to-yellow-900/20 border border-accent-200 dark:border-accent-800">
              <div className="text-xs sm:text-sm text-accent-700 dark:text-accent-400 font-semibold mb-1">
                Pending
              </div>
              <div className="text-lg sm:text-xl font-bold text-accent-900 dark:text-accent-300">
                {metrics.pendingReview}
              </div>
              <div className="text-xs text-accent-600 dark:text-accent-500 mt-1">
                Review
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800">
              <div className="text-xs sm:text-sm text-primary-700 dark:text-primary-400 font-semibold mb-1">
                Total
              </div>
              <div className="text-lg sm:text-xl font-bold text-primary-900 dark:text-primary-300">
                {metrics.totalAssets}
              </div>
              <div className="text-xs text-primary-600 dark:text-primary-500 mt-1">
                Assets
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {metrics.categories && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                By Category
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(metrics.categories).map(([category, score]) => (
                  <div
                    key={category}
                    className="flex flex-col items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                  >
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1 capitalize">
                      {category}
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplianceGauge;

