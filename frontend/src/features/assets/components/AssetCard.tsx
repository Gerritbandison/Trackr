import React from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiUser, FiMapPin, FiCalendar, FiDollarSign, FiShield } from 'react-icons/fi';
import { format } from 'date-fns';

export interface Asset {
  _id: string;
  name: string;
  category: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  assetTag?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'retired' | 'lost' | 'stolen';
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  location?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface AssetCardProps {
  asset: Asset;
  onCardClick?: (asset: Asset) => void;
  className?: string;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, onCardClick, className = '' }) => {
  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'available':
        return 'bg-success-100 text-success-700 border-success-200 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800';
      case 'assigned':
        return 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800';
      case 'maintenance':
        return 'bg-accent-100 text-accent-700 border-accent-200 dark:bg-accent-900/30 dark:text-accent-400 dark:border-accent-800';
      case 'retired':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'lost':
      case 'stolen':
        return 'bg-danger-100 text-danger-700 border-danger-200 dark:bg-danger-900/30 dark:text-danger-400 dark:border-danger-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getConditionColor = (condition?: Asset['condition']) => {
    switch (condition) {
      case 'excellent':
        return 'bg-success-500';
      case 'good':
        return 'bg-primary-500';
      case 'fair':
        return 'bg-accent-500';
      case 'poor':
        return 'bg-danger-500';
      default:
        return 'bg-slate-400';
    }
  };

  const daysUntilWarrantyExpiry = asset.warrantyExpiry
    ? Math.ceil((new Date(asset.warrantyExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isWarrantyExpiringSoon = daysUntilWarrantyExpiry !== null && daysUntilWarrantyExpiry > 0 && daysUntilWarrantyExpiry <= 30;

  return (
    <div
      className={`
        group relative
        bg-white dark:bg-slate-800
        border-2 border-slate-200 dark:border-slate-700
        rounded-2xl
        p-4 sm:p-5 md:p-6
        transition-all duration-300
        hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600
        hover:-translate-y-1
        cursor-pointer
        ${className}
      `}
      onClick={() => onCardClick?.(asset)}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
            <FiPackage className="text-white" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate mb-1">
              {asset.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {asset.category && (
                <span className="capitalize font-medium">{asset.category}</span>
              )}
              {asset.manufacturer && asset.model && (
                <>
                  <span>•</span>
                  <span>{asset.manufacturer} {asset.model}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`
              inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border
              ${getStatusColor(asset.status)}
            `}
          >
            {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
          </span>
          {asset.condition && (
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${getConditionColor(asset.condition)}`} />
              <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                {asset.condition}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Asset Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        {asset.assetTag && (
          <div className="flex items-center gap-2 text-sm">
            <FiPackage className="text-slate-400 dark:text-slate-500 flex-shrink-0" size={16} />
            <span className="text-slate-600 dark:text-slate-400 truncate">
              <span className="font-semibold">Tag:</span> {asset.assetTag}
            </span>
          </div>
        )}
        {asset.serialNumber && (
          <div className="flex items-center gap-2 text-sm">
            <FiPackage className="text-slate-400 dark:text-slate-500 flex-shrink-0" size={16} />
            <span className="text-slate-600 dark:text-slate-400 truncate">
              <span className="font-semibold">SN:</span> {asset.serialNumber}
            </span>
          </div>
        )}
        {asset.location && (
          <div className="flex items-center gap-2 text-sm">
            <FiMapPin className="text-slate-400 dark:text-slate-500 flex-shrink-0" size={16} />
            <span className="text-slate-600 dark:text-slate-400 truncate">
              {asset.location}
            </span>
          </div>
        )}
        {asset.purchasePrice && (
          <div className="flex items-center gap-2 text-sm">
            <FiDollarSign className="text-slate-400 dark:text-slate-500 flex-shrink-0" size={16} />
            <span className="text-slate-600 dark:text-slate-400">
              ${asset.purchasePrice.toLocaleString()}
            </span>
          </div>
        )}
        {asset.assignedTo && (
          <div className="flex items-center gap-2 text-sm sm:col-span-2">
            <FiUser className="text-slate-400 dark:text-slate-500 flex-shrink-0" size={16} />
            <span className="text-slate-600 dark:text-slate-400 truncate">
              <span className="font-semibold">Assigned to:</span> {asset.assignedTo.name}
            </span>
          </div>
        )}
        {asset.purchaseDate && (
          <div className="flex items-center gap-2 text-sm">
            <FiCalendar className="text-slate-400 dark:text-slate-500 flex-shrink-0" size={16} />
            <span className="text-slate-600 dark:text-slate-400">
              Purchased: {format(new Date(asset.purchaseDate), 'MMM d, yyyy')}
            </span>
          </div>
        )}
        {asset.warrantyExpiry && (
          <div className="flex items-center gap-2 text-sm">
            <FiShield className="text-slate-400 dark:text-slate-500 flex-shrink-0" size={16} />
            <span className={`${isWarrantyExpiringSoon ? 'text-danger-600 dark:text-danger-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
              Warranty: {format(new Date(asset.warrantyExpiry), 'MMM d, yyyy')}
              {isWarrantyExpiringSoon && daysUntilWarrantyExpiry !== null && (
                <span className="ml-1">({daysUntilWarrantyExpiry} days)</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <Link
          to={`/assets/${asset._id}`}
          className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          View Details →
        </Link>
        {isWarrantyExpiringSoon && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-danger-100 text-danger-700 border border-danger-200 dark:bg-danger-900/30 dark:text-danger-400 dark:border-danger-800">
            Warranty Expiring Soon
          </span>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-primary-500/10 transition-all duration-300 pointer-events-none" />
    </div>
  );
};

export default AssetCard;

