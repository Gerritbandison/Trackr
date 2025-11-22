import { useState, useEffect } from 'react';

/**
 * Custom hook for managing dark mode state
 * Persists preference to localStorage and applies dark class to document
 */
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return stored === 'true';
    }
    
    // Fall back to system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Persist to localStorage
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-update if user hasn't manually set a preference
      const stored = localStorage.getItem('darkMode');
      if (stored === null) {
        setIsDark(e.matches);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const toggle = () => setIsDark((prev) => !prev);
  const enable = () => setIsDark(true);
  const disable = () => setIsDark(false);

  return {
    isDark,
    toggle,
    enable,
    disable,
  };
};

