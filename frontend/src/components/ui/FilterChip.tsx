import React from 'react';
import { FiX } from 'react-icons/fi';
import { IconType } from 'react-icons';

interface FilterChipProps {
  label: string;
  value: string;
  onRemove?: () => void;
  icon?: IconType;
}

/**
 * Filter chip component for displaying active filters
 */
const FilterChip: React.FC<FilterChipProps> = ({ label, value, onRemove, icon: Icon }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-full text-sm font-medium text-primary-700 hover:from-primary-100 hover:to-blue-100 transition-all group">
      {Icon && <Icon className="text-primary-600" size={14} />}
      <span>{label}: {value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 p-0.5 hover:bg-primary-200 rounded-full transition-colors group-hover:scale-110"
          aria-label={`Remove ${label} filter`}
        >
          <FiX size={12} className="text-primary-600" />
        </button>
      )}
    </div>
  );
};

export default FilterChip;
