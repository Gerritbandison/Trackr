import {
  FiFileText,      // Claims
  FiServer,        // IT
  FiTrendingUp,    // Sales
  FiHeadphones,    // Client Services
  FiSettings,      // Operations
  FiBriefcase,     // M&A
  FiUsers,         // HR
  FiShield,        // Underwriters
  FiTarget,        // Placement
  FiGrid,          // Default
} from 'react-icons/fi';

/**
 * Department icon and color mapping
 * Maps department names/codes to appropriate icons and brand colors
 */
export const departmentConfig = {
  'Claims': {
    icon: FiFileText,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    borderColor: 'border-red-500',
  },
  'IT': {
    icon: FiServer,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500',
  },
  'Sales': {
    icon: FiTrendingUp,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    borderColor: 'border-green-500',
  },
  'Client Services': {
    icon: FiHeadphones,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-500',
  },
  'Operations': {
    icon: FiSettings,
    color: 'from-gray-600 to-gray-700',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-500',
  },
  'M&A': {
    icon: FiBriefcase,
    color: 'from-indigo-500 to-violet-500',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-500',
  },
  'HR': {
    icon: FiUsers,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-500',
  },
  'Underwriters': {
    icon: FiShield,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500',
  },
  'Placement': {
    icon: FiTarget,
    color: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-600',
    borderColor: 'border-teal-500',
  },
};

/**
 * Get department configuration
 * @param {string} departmentName - Name of the department
 * @returns {object} Icon component and colors
 */
export const getDepartmentConfig = (departmentName) => {
  return departmentConfig[departmentName] || {
    icon: FiGrid,
    color: 'from-primary-500 to-primary-600',
    bgColor: 'bg-primary-100',
    textColor: 'text-primary-600',
    borderColor: 'border-primary-500',
  };
};

/**
 * Get department icon component
 * @param {string} departmentName - Name of the department
 * @returns {Component} React icon component
 */
export const getDepartmentIcon = (departmentName) => {
  return getDepartmentConfig(departmentName).icon;
};

/**
 * Get department gradient classes
 * @param {string} departmentName - Name of the department
 * @returns {string} Tailwind gradient classes
 */
export const getDepartmentGradient = (departmentName) => {
  return getDepartmentConfig(departmentName).color;
};

export default {
  departmentConfig,
  getDepartmentConfig,
  getDepartmentIcon,
  getDepartmentGradient,
};

