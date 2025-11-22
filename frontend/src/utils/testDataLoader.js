/**
 * Test Data Loader Utility
 * 
 * This utility helps load test data into the application for development and testing.
 * It can be used to seed the backend API or provide mock data when the API is unavailable.
 */

import { testData } from '../data/testData';
import { mockMicrosoftLicenses } from '../data/mockMicrosoftLicenses';
import { itamMockData } from '../data/itamMockData';

/**
 * Check if we're in development mode and should use test data
 */
export const isDevelopmentMode = () => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

/**
 * Check if test data should be loaded
 */
export const shouldLoadTestData = () => {
  // In development, default to enabled unless explicitly disabled
  if (isDevelopmentMode()) {
    const testDataEnabled = localStorage.getItem('enableTestData');
    // If not set, default to true in development
    if (testDataEnabled === null) {
      localStorage.setItem('enableTestData', 'true');
      return true;
    }
    return testDataEnabled !== 'false';
  }
  
  // In production, only load if explicitly enabled
  const testDataEnabled = localStorage.getItem('enableTestData');
  return testDataEnabled === 'true';
};

/**
 * Enable test data loading
 */
export const enableTestData = () => {
  localStorage.setItem('enableTestData', 'true');
};

/**
 * Disable test data loading
 */
export const disableTestData = () => {
  localStorage.setItem('enableTestData', 'false');
};

/**
 * Get test data for a specific resource type
 */
export const getTestData = (resourceType) => {
  switch (resourceType) {
    case 'users':
      return testData.users;
    case 'departments':
      return testData.departments;
    case 'assets':
      return testData.assets;
    case 'licenses':
      return testData.licenses;
    case 'vendors':
      return testData.vendors;
    case 'contracts':
      return testData.contracts;
    case 'assetGroups':
      return testData.assetGroups;
    case 'onboardingKits':
      return testData.onboardingKits;
    case 'microsoftLicenses':
      return mockMicrosoftLicenses;
    // ITAM modules
    case 'receiving':
    case 'receiving/expected-assets':
      return itamMockData.receiving.expectedAssets;
    case 'staging':
    case 'staging/assets':
      return itamMockData.staging.assets;
    case 'loaners':
      return itamMockData.loaners.loaners;
    case 'warranty':
    case 'warranty/assets':
      return itamMockData.warranty.assets;
    case 'financials':
    case 'financials/depreciation':
      return itamMockData.financials.depreciationSchedules;
    case 'contracts/renewals':
      return itamMockData.contracts.renewals;
    case 'discovery':
    case 'discovery/records':
      return itamMockData.discovery.records;
    case 'stock':
    case 'stock/items':
      return itamMockData.stock.items;
    case 'software':
      return itamMockData.software.software;
    case 'compliance':
    case 'compliance/attestations':
      return itamMockData.compliance.attestations;
    case 'security':
    case 'security/assets':
      return itamMockData.security.assets;
    case 'locations':
      return itamMockData.locations.locations;
    case 'labels':
    case 'labels/templates':
      return itamMockData.labels.templates;
    case 'workflows':
      return itamMockData.workflows.workflows;
    case 'apis':
    case 'apis/keys':
      return itamMockData.apis.keys;
    case 'apis/webhooks':
      return itamMockData.apis.webhooks;
    case 'data-quality':
    case 'data-quality/duplicates':
      return itamMockData.dataQuality.duplicates;
    case 'reporting':
    case 'reporting/dashboard':
      return itamMockData.reporting.dashboard;
    default:
      return null;
  }
};

/**
 * Get all test data
 */
export const getAllTestData = () => {
  return {
    ...testData,
    microsoftLicenses: mockMicrosoftLicenses,
    itam: itamMockData,
  };
};

/**
 * Get test data statistics
 */
export const getTestDataStats = () => {
  return {
    users: testData.users.length,
    departments: testData.departments.length,
    assets: testData.assets.length,
    licenses: testData.licenses.length,
    vendors: testData.vendors.length,
    contracts: testData.contracts.length,
    assetGroups: testData.assetGroups.length,
    onboardingKits: testData.onboardingKits.length,
    microsoftLicenses: mockMicrosoftLicenses.licenses.length,
    // ITAM stats
    receivingExpected: itamMockData.receiving.expectedAssets.length,
    stagingAssets: itamMockData.staging.assets.length,
    loaners: itamMockData.loaners.loaners.length,
    warrantyAssets: itamMockData.warranty.assets.length,
    contractRenewals: itamMockData.contracts.renewals.length,
    discoveryRecords: itamMockData.discovery.records.length,
    stockItems: itamMockData.stock.items.length,
    softwareEntries: itamMockData.software.software.length,
    attestations: itamMockData.compliance.attestations.length,
    securityAssets: itamMockData.security.assets.length,
    locations: itamMockData.locations.locations.length,
    labelTemplates: itamMockData.labels.templates.length,
    workflows: itamMockData.workflows.workflows.length,
    apiKeys: itamMockData.apis.keys.length,
    webhooks: itamMockData.apis.webhooks.length,
    duplicates: itamMockData.dataQuality.duplicates.length,
  };
};

/**
 * Format test data for API response format
 */
export const formatTestDataForAPI = (data, resourceType) => {
  // Most APIs return data in { data: { data: [...] } } format
  return {
    data: {
      data: Array.isArray(data) ? data : [data],
      total: Array.isArray(data) ? data.length : 1,
      page: 1,
      limit: Array.isArray(data) ? data.length : 1,
    },
  };
};

/**
 * Create a mock API response with test data
 */
export const createMockAPIResponse = (resourceType, options = {}) => {
  const data = getTestData(resourceType);
  
  if (!data) {
    return {
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      },
    };
  }

  // Filter data if needed
  let filteredData = Array.isArray(data) ? [...data] : [data];
  
  if (options.filter) {
    filteredData = filteredData.filter(options.filter);
  }

  // Paginate if needed
  if (options.pagination) {
    const { page = 1, limit = 10 } = options.pagination;
    const start = (page - 1) * limit;
    const end = start + limit;
    filteredData = filteredData.slice(start, end);
  }

  return {
    data: {
      data: filteredData,
      total: filteredData.length,
      page: options.pagination?.page || 1,
      limit: options.pagination?.limit || filteredData.length,
    },
  };
};

/**
 * Check if API is available (for fallback to test data)
 */
export const isAPIAvailable = async () => {
  try {
    // Try to check if the backend is responding by attempting a simple request
    // We'll use the auth/login endpoint with invalid credentials - if we get a 401/400, the API is up
    // If we get a network error or timeout, the API is down
    const response = await fetch((import.meta.env.VITE_API_URL || '/api/v1') + '/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'healthcheck@test.com', password: 'test' }),
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    
    // If we get any response (even 401/400), the API is available
    // Network errors will be caught in the catch block
    return response.status !== undefined;
  } catch (error) {
    // Network error, timeout, or CORS issue means API is not available
    console.log('API health check failed:', error.message);
    return false;
  }
};

export default {
  isDevelopmentMode,
  shouldLoadTestData,
  enableTestData,
  disableTestData,
  getTestData,
  getAllTestData,
  getTestDataStats,
  formatTestDataForAPI,
  createMockAPIResponse,
  isAPIAvailable,
};

