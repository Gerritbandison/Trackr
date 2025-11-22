/**
 * Test Data Initializer Component
 * 
 * This component initializes test data when the app starts in development mode.
 * It can be used to seed the backend API or provide fallback data.
 */

import { useEffect, useState } from 'react';
import { useTestData } from '../../hooks/useTestData';
import toast from 'react-hot-toast';
import { FiInfo, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const TestDataInitializer = () => {
  const { isEnabled, isAPIConnected, stats, toggleTestData, checkAPIConnection } = useTestData();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if test data should be loaded
    if (isEnabled) {
      initializeTestData();
    }

    // Check API connection status
    checkAPIConnection();

    // Show banner if test data is enabled or API is not connected
    if (isEnabled || !isAPIConnected) {
      setShowBanner(true);
    }
  }, [isEnabled, isAPIConnected]);

  const initializeTestData = async () => {
    try {
      // Here you could send test data to the backend API to seed it
      // For now, we'll just mark as initialized since mock data is already available
      
      // Example: If you want to seed the backend:
      // await seedBackendWithTestData();
      
      setIsInitialized(true);
      
      if (!isAPIConnected) {
        toast.success('Test data loaded successfully');
      }
    } catch (error) {
      console.error('Failed to initialize test data:', error);
      toast.error('Failed to load test data');
    }
  };

  const handleToggleTestData = () => {
    toggleTestData(!isEnabled);
    toast.success(`Test data ${!isEnabled ? 'enabled' : 'disabled'}`);
  };

  if (!showBanner && isAPIConnected) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div
        className={`p-4 rounded-lg shadow-lg border ${
          !isAPIConnected
            ? 'bg-yellow-50 border-yellow-200'
            : isEnabled
            ? 'bg-blue-50 border-blue-200'
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {!isAPIConnected ? (
            <FiXCircle className="text-yellow-600 mt-0.5" size={20} />
          ) : (
            <FiInfo className="text-blue-600 mt-0.5" size={20} />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {!isAPIConnected ? 'API Not Connected' : 'Test Data Mode'}
            </h3>
            <p className="text-sm text-gray-700 mb-2">
              {!isAPIConnected
                ? 'Using mock data. Connect to the backend API to sync real data.'
                : isEnabled
                ? 'Test data is enabled. Using mock data for development and testing.'
                : 'Test data is disabled. Using API data.'}
            </p>
            {stats && (
              <div className="text-xs text-gray-600 mb-2">
                <span className="font-medium">Test Data:</span>{' '}
                {stats.users} users, {stats.assets} assets, {stats.licenses} licenses
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleTestData}
                className="text-xs px-3 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {isEnabled ? 'Disable' : 'Enable'} Test Data
              </button>
              {!isAPIConnected && (
                <button
                  onClick={checkAPIConnection}
                  className="text-xs px-3 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Check API
                </button>
              )}
              <button
                onClick={() => setShowBanner(false)}
                className="text-xs px-3 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDataInitializer;

