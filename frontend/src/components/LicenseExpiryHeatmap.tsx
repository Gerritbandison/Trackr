import React, { useMemo } from 'react';
import { FiCalendar, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { format, startOfYear, endOfYear, eachMonthOfInterval, differenceInDays } from 'date-fns';

export interface License {
  _id: string;
  name: string;
  expirationDate?: string;
  status?: 'active' | 'expired' | 'expiring-soon';
}

interface LicenseExpiryHeatmapProps {
  licenses: License[];
  year?: number;
  className?: string;
}

type HeatmapCell = {
  month: number;
  monthName: string;
  licenses: License[];
  urgencyLevel: 'expired' | 'critical' | 'warning' | 'normal' | 'safe';
  count: number;
};

const LicenseExpiryHeatmap: React.FC<LicenseExpiryHeatmapProps> = ({
  licenses,
  year = new Date().getFullYear(),
  className = '',
}) => {
  const heatmapData = useMemo(() => {
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 11, 31));
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const today = new Date();

    const cells: HeatmapCell[] = months.map((month, index) => {
      const monthStart = new Date(year, index, 1);
      const monthEnd = new Date(year, index + 1, 0);

      // Find licenses expiring in this month
      const monthLicenses = licenses.filter((license) => {
        if (!license.expirationDate) return false;
        const expiryDate = new Date(license.expirationDate);
        return expiryDate >= monthStart && expiryDate <= monthEnd;
      });

      // Determine urgency level based on expiration dates
      let urgencyLevel: HeatmapCell['urgencyLevel'] = 'safe';
      const expiredCount = monthLicenses.filter((l) => {
        if (!l.expirationDate) return false;
        return new Date(l.expirationDate) < today;
      }).length;

      const criticalCount = monthLicenses.filter((l) => {
        if (!l.expirationDate) return false;
        const daysUntil = differenceInDays(new Date(l.expirationDate), today);
        return daysUntil >= 0 && daysUntil <= 30;
      }).length;

      const warningCount = monthLicenses.filter((l) => {
        if (!l.expirationDate) return false;
        const daysUntil = differenceInDays(new Date(l.expirationDate), today);
        return daysUntil > 30 && daysUntil <= 90;
      }).length;

      if (expiredCount > 0) {
        urgencyLevel = 'expired';
      } else if (criticalCount > 0) {
        urgencyLevel = 'critical';
      } else if (warningCount > 0) {
        urgencyLevel = 'warning';
      } else if (monthLicenses.length > 0) {
        urgencyLevel = 'normal';
      }

      return {
        month: index,
        monthName: format(month, 'MMM'),
        licenses: monthLicenses,
        urgencyLevel,
        count: monthLicenses.length,
      };
    });

    return cells;
  }, [licenses, year]);

  const getCellColor = (urgencyLevel: HeatmapCell['urgencyLevel'], count: number) => {
    if (count === 0) {
      return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }

    switch (urgencyLevel) {
      case 'expired':
        return 'bg-danger-500 dark:bg-danger-600 border-danger-600 dark:border-danger-700 text-white';
      case 'critical':
        return 'bg-danger-400 dark:bg-danger-700 border-danger-500 dark:border-danger-600 text-white';
      case 'warning':
        return 'bg-accent-400 dark:bg-accent-600 border-accent-500 dark:border-accent-700 text-white';
      case 'normal':
        return 'bg-primary-300 dark:bg-primary-700 border-primary-400 dark:border-primary-600 text-white';
      case 'safe':
        return 'bg-success-300 dark:bg-success-700 border-success-400 dark:border-success-600 text-white';
      default:
        return 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100';
    }
  };

  const getCellIntensity = (count: number, maxCount: number) => {
    if (maxCount === 0) return 'opacity-50';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity > 0.7) return 'opacity-100';
    if (intensity > 0.4) return 'opacity-80';
    return 'opacity-60';
  };

  const maxCount = Math.max(...heatmapData.map((cell) => cell.count), 1);

  const totalExpiring = heatmapData.reduce((sum, cell) => sum + cell.count, 0);
  const expiredCount = heatmapData
    .flatMap((cell) => cell.licenses)
    .filter((l) => {
      if (!l.expirationDate) return false;
      return new Date(l.expirationDate) < new Date();
    }).length;
  const criticalCount = heatmapData
    .flatMap((cell) => cell.licenses)
    .filter((l) => {
      if (!l.expirationDate) return false;
      const daysUntil = differenceInDays(new Date(l.expirationDate), new Date());
      return daysUntil >= 0 && daysUntil <= 30;
    }).length;

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
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
            <FiCalendar className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              License Expiry Heatmap
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {year} - {totalExpiring} licenses expiring
            </p>
          </div>
        </div>
        {(expiredCount > 0 || criticalCount > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {expiredCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-danger-100 text-danger-700 border border-danger-200 dark:bg-danger-900/30 dark:text-danger-400 dark:border-danger-800">
                <FiAlertCircle size={14} />
                {expiredCount} Expired
              </span>
            )}
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-100 text-accent-700 border border-accent-200 dark:bg-accent-900/30 dark:text-accent-400 dark:border-accent-800">
                <FiAlertCircle size={14} />
                {criticalCount} Critical
              </span>
            )}
          </div>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 sm:gap-3">
          {heatmapData.map((cell) => (
            <div
              key={cell.month}
              className={`
                relative aspect-square
                rounded-lg
                border-2
                flex flex-col items-center justify-center
                transition-all duration-200
                hover:scale-110 hover:z-10
                ${getCellColor(cell.urgencyLevel, cell.count)}
                ${getCellIntensity(cell.count, maxCount)}
                ${cell.count > 0 ? 'cursor-pointer' : 'cursor-default'}
              `}
              title={`${cell.monthName}: ${cell.count} license${cell.count !== 1 ? 's' : ''} expiring`}
            >
              <span className="text-xs sm:text-sm font-bold">
                {cell.monthName}
              </span>
              {cell.count > 0 && (
                <span className="text-xs sm:text-sm font-bold mt-0.5">
                  {cell.count}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 sm:gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <FiInfo size={14} />
          <span className="font-medium">Legend:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 bg-danger-500 border-danger-600 dark:bg-danger-600 dark:border-danger-700" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Expired</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 bg-danger-400 border-danger-500 dark:bg-danger-700 dark:border-danger-600" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Critical (≤30 days)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 bg-accent-400 border-accent-500 dark:bg-accent-600 dark:border-accent-700" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Warning (≤90 days)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 bg-primary-300 border-primary-400 dark:bg-primary-700 dark:border-primary-600" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">No Expirations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseExpiryHeatmap;

