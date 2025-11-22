import React from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';
import { useDarkMode } from '../../hooks/useDarkMode';

interface DarkModeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { isDark, toggle } = useDarkMode();

  const sizeConfig = {
    sm: {
      button: 'w-8 h-8',
      icon: 16,
      text: 'text-xs',
    },
    md: {
      button: 'w-10 h-10',
      icon: 20,
      text: 'text-sm',
    },
    lg: {
      button: 'w-12 h-12',
      icon: 24,
      text: 'text-base',
    },
  };

  const config = sizeConfig[size];

  return (
    <button
      onClick={toggle}
      className={`
        ${config.button}
        relative
        flex items-center justify-center
        rounded-xl
        bg-slate-100 dark:bg-slate-800
        border-2 border-slate-200 dark:border-slate-700
        text-slate-700 dark:text-slate-300
        hover:bg-slate-200 dark:hover:bg-slate-700
        hover:border-primary-300 dark:hover:border-primary-600
        transition-all duration-200
        hover:scale-105
        active:scale-95
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative">
        <FiSun
          className={`absolute inset-0 transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
          size={config.icon}
        />
        <FiMoon
          className={`transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`}
          size={config.icon}
        />
      </div>
      {showLabel && (
        <span className={`ml-2 font-semibold ${config.text}`}>
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};

export default DarkModeToggle;

