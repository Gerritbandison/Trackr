/**
 * React Hook for Test Data Management
 * 
 * Provides a React hook to manage and access test data in components
 */

import { useState, useEffect } from 'react';
import { 
  shouldLoadTestData, 
  enableTestData, 
  disableTestData,
  getTestData,
  getAllTestData,
  getTestDataStats,
  isAPIAvailable,
} from '../utils/testDataLoader';

/**
 * Hook to manage test data loading
 */
export const useTestData = () => {
  const [isEnabled, setIsEnabled] = useState(shouldLoadTestData());
  const [isAPIConnected, setIsAPIConnected] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Check API availability on mount
    checkAPIConnection();
    
    // Load stats
    setStats(getTestDataStats());
  }, []);

  const checkAPIConnection = async () => {
    const available = await isAPIAvailable();
    setIsAPIConnected(available);
  };

  const toggleTestData = (enabled) => {
    if (enabled) {
      enableTestData();
    } else {
      disableTestData();
    }
    setIsEnabled(enabled);
  };

  const getData = (resourceType) => {
    if (!isEnabled) return null;
    return getTestData(resourceType);
  };

  const getAllData = () => {
    if (!isEnabled) return null;
    return getAllTestData();
  };

  return {
    isEnabled,
    isAPIConnected,
    stats,
    toggleTestData,
    getData,
    getAllData,
    checkAPIConnection,
  };
};

export default useTestData;

