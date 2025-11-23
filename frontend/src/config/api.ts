/**
 * API Configuration and Endpoints
 * 
 * @module api
 * @description Centralized API configuration with Axios interceptors for authentication
 * and token refresh. All API endpoints are exported as named exports.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getMockDataForEndpoint } from '../utils/mockAPIInterceptor';
import { shouldLoadTestData } from '../utils/testDataLoader';
import logger from '../utils/logger';

/**
 * Extended Axios config with mock data support
 */
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _useMockData?: boolean;
  _mockResponse?: unknown;
  _retry?: boolean;
}

/**
 * API Base URL from environment variable or default
 */
const API_URL: string = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * API Timeout from environment variable or default (30 seconds)
 */
const API_TIMEOUT: number = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

/**
 * Enable API logging in development
 */
const API_LOGGING: boolean = import.meta.env.VITE_API_LOGGING === 'true' || import.meta.env.DEV;

/**
 * Debug mode for detailed error messages
 */
const DEBUG_MODE: boolean = import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV;

/**
 * Axios instance with default configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request logging interceptor (development only)
if (API_LOGGING) {
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      logger.apiRequest(config.method?.toUpperCase() || 'GET', config.url || '', {
        baseURL: config.baseURL,
        params: config.params,
        data: config.data,
      } as any);
      return config;
    },
    (error: AxiosError) => {
      logger.apiError('REQUEST', '', error);
      return Promise.reject(error);
    }
  );
}

// Request interceptor to add auth token and check for mock data
api.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    // Check if mock data should be used BEFORE making the request
    const testDataEnabled = shouldLoadTestData();
    logger.debug('[Mock API] Request interceptor', {
      level: 'debug',
      context: 'MockAPI',
      data: {
        url: config.url,
        method: config.method,
        testDataEnabled,
        isDev: import.meta.env.DEV,
      },
    });

    if (testDataEnabled) {
      const mockResponse = getMockDataForEndpoint(
        config.method?.toUpperCase() || 'GET',
        config.url || '',
        config.params || {}
      );

      if (mockResponse) {
        logger.debug(`[Mock API] ✅ Found mock data for: ${config.url}`, {
          context: 'MockAPI',
          data: {
            mockResponseStructure: Object.keys(mockResponse),
            hasData: !!mockResponse.data,
            dataLength: Array.isArray(mockResponse.data) ? mockResponse.data.length : 'not array',
            hasPagination: !!mockResponse.pagination,
            mockResponse: mockResponse,
          },
        });

        // Mark this request to use mock data
        // Response interceptor will check for this and return mock data
        config._useMockData = true;
        config._mockResponse = mockResponse;
      } else {
        logger.debug(`[Mock API] ⚠️ No mock data found for: ${config.url}`, {
          context: 'MockAPI',
        });
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as ExtendedAxiosRequestConfig;

    // Check if we should use mock data instead of real response
    // This handles the case where mock data was marked but request didn't reject
    if (config._useMockData && config._mockResponse) {
      logger.debug(`[Mock API] ✅ Intercepting response for: ${config.url}`, {
        context: 'MockAPI',
      });
      logger.debug('[Mock API] Mock response structure', {
        context: 'MockAPI',
        data: {
          mockResponse: config._mockResponse,
          mockResponseKeys: Object.keys(config._mockResponse),
          dataType: Array.isArray((config._mockResponse as any).data) ? 'array' : typeof (config._mockResponse as any).data,
          dataLength: Array.isArray((config._mockResponse as any).data) ? (config._mockResponse as any).data.length : 'N/A',
          hasPagination: !!(config._mockResponse as any).pagination,
        },
      });

      // Return mock data
      // The API method does .then(res => res.data), so we return the mock response directly
      // Mock response is already in format: { data: [...], pagination: {...} }
      return {
        data: config._mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config,
      } as AxiosResponse;
    }

    // Log successful responses in development
    if (API_LOGGING) {
      logger.apiResponse(
        config.method?.toUpperCase() || 'GET',
        config.url || '',
        response.status,
        response.data
      );
    }
    return response;
  },
  async (error: AxiosError | Error) => {
    const axiosError = error as AxiosError & { isMockRequest?: boolean; mockResponse?: unknown };
    const config = axiosError.config as ExtendedAxiosRequestConfig;

    // Handle mock data requests (intercepted in request interceptor)
    if (axiosError.isMockRequest && axiosError.mockResponse) {
      logger.debug(`[Mock API] ✅ Returning mock data for: ${config?.url}`, {
        context: 'MockAPI',
        data: {
          mockResponse: axiosError.mockResponse,
          mockResponseKeys: Object.keys(axiosError.mockResponse),
          dataLength: Array.isArray((axiosError.mockResponse as any).data) ? (axiosError.mockResponse as any).data.length : 'not array',
        },
      });
      // Return mock data as a successful response
      return Promise.resolve({
        data: axiosError.mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config || {},
      } as AxiosResponse);
    }

    // Handle network errors or 401/404/500 errors - try to return mock data as fallback
    // In development mode, always try mock data fallback for these errors
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    const shouldFallbackToMock = (isDev || shouldLoadTestData()) && (
      !axiosError.response ||
      axiosError.code === 'ECONNABORTED' ||
      axiosError.code === 'ERR_NETWORK' ||
      axiosError.response?.status === 401 ||
      axiosError.response?.status === 404 ||
      axiosError.response?.status === 500
    );

    if (shouldFallbackToMock) {
      const mockResponse = getMockDataForEndpoint(
        config?.method?.toUpperCase() || 'GET',
        config?.url || '',
        config?.params || {}
      );

      if (mockResponse) {
        logger.debug(`[Mock API Fallback] Returning mock data for ${config?.method?.toUpperCase()} ${config?.url}`, {
          context: 'MockAPI',
          data: {
            reason: !axiosError.response ? 'Network error' : `HTTP ${axiosError.response?.status}`,
            mockData: mockResponse,
          },
        });
        return {
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {},
        } as AxiosResponse;
      } else {
        logger.debug(`[Mock API Fallback] No mock data found for ${config?.url}`, {
          context: 'MockAPI',
        });
      }
    }
    const originalRequest = config;

    // Log errors
    if (API_LOGGING || DEBUG_MODE) {
      logger.apiError(
        config?.method?.toUpperCase() || 'GET',
        config?.url || '',
        {
          status: axiosError.response?.status,
          message: axiosError.response?.data?.message || axiosError.message,
          data: axiosError.response?.data,
        }
      );
    }

    // Network error handling
    if (!axiosError.response) {
      const networkError: { message: string; code: string; details?: string } = {
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
      };

      if (DEBUG_MODE) {
        networkError.details = axiosError.message;
      }

      return Promise.reject(networkError);
    }

    // If 401 and not already retried, try to refresh token
    if (axiosError.response?.status === 401 && !originalRequest?._retry) {
      if (originalRequest) {
        originalRequest._retry = true;
      }

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Use axios directly to avoid interceptor loop
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: API_TIMEOUT,
            }
          );

          // Store both new tokens
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }

          // Update the original request with new token
          if (originalRequest) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Format error response for consistent handling
    const formattedError: { message: string; status?: number; code?: string; details?: unknown } = {
      message: axiosError.response?.data?.message || axiosError.message || 'An error occurred',
      status: axiosError.response?.status,
      code: axiosError.code,
    };

    if (DEBUG_MODE && axiosError.response?.data) {
      formattedError.details = axiosError.response.data;
    }

    return Promise.reject(formattedError);
  }
);

// Export API configuration for external use
export { API_URL, API_TIMEOUT, API_LOGGING, DEBUG_MODE };
export default api;

/**
 * Generic API params type
 */
interface ApiParams {
  [key: string]: unknown;
}

/**
 * Authentication API endpoints
 */
export const authAPI = {
  login: (credentials: { email: string; password: string }) => api.post('/auth/login', credentials),
  register: (userData: Record<string, unknown>) => api.post('/auth/register', userData),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data: Record<string, unknown>) => api.put('/auth/updatedetails', data),
  updatePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/auth/updatepassword', data),
};

export const usersAPI = {
  getAll: (params?: ApiParams) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats/summary'),
  getUserAssets: (id: string) => api.get(`/users/${id}/assets`),
  getUserLicenses: (id: string) => api.get(`/users/${id}/licenses`),
  getUserMicrosoftLicenses: (id: string) => api.get(`/users/${id}/microsoft-licenses`),
};

export const assetsAPI = {
  getAll: (params?: ApiParams) => api.get('/assets', { params }),
  getById: (id: string) => api.get(`/assets/${id}`),
  create: (data: Record<string, unknown>) => api.post('/assets', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/assets/${id}`, data),
  delete: (id: string) => api.delete(`/assets/${id}`),
  assign: (id: string, data: Record<string, unknown>) => api.post(`/assets/${id}/assign`, data),
  unassign: (id: string) => api.post(`/assets/${id}/unassign`),
  getStats: () => api.get('/assets/stats/summary'),
  lookupLenovoWarranty: (id: string, autoUpdate = false) => api.get(`/assets/${id}/warranty-lookup`, { params: { autoUpdate } }),
  changeState: (id: string, newState: string, data?: Record<string, unknown>) => api.post(`/assets/${id}/state`, { state: newState, ...data }),
  getValidNextStates: (id: string) => api.get(`/assets/${id}/valid-next-states`),
  getHistory: (id: string) => api.get(`/assets/${id}/history`),
  checkout: (id: string, data: Record<string, unknown>) => api.post(`/assets/${id}/checkout`, data),
  checkin: (id: string, data?: ApiParams) => api.get(`/assets/${id}/checkin`, { params: data }),
  printLabel: (id: string, format?: string) => api.get(`/assets/${id}/label`, { params: { format }, responseType: 'blob' }),
  bulkUpdate: (data: Record<string, unknown>) => api.post('/assets/bulk-update', data),
  bulkImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/assets/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  reconcile: (data: Record<string, unknown>) => api.post('/assets/reconcile', data),
  getDuplicates: (id: string) => api.get(`/assets/${id}/duplicates`),
  lookupWarranty: (id: string, manufacturer?: string) => api.get(`/assets/${id}/warranty`, { params: { manufacturer } }),
  createRepairTicket: (id: string, data: Record<string, unknown>) => api.post(`/assets/${id}/repairs`, data),
  getRepairTickets: (id: string) => api.get(`/assets/${id}/repairs`),
  getSLAMetrics: (id: string) => api.get(`/assets/${id}/sla-metrics`),
  getDiscoveryRecords: (params?: ApiParams) => api.get('/assets/discovery', { params }),
  reconcileDiscovery: (data: Record<string, unknown>) => api.post('/assets/discovery/reconcile', data),
  getRelationships: (id: string) => api.get(`/assets/${id}/relationships`),
  addRelationship: (id: string, data: Record<string, unknown>) => api.post(`/assets/${id}/relationships`, data),
  removeRelationship: (id: string, relationshipId: string) => api.delete(`/assets/${id}/relationships/${relationshipId}`),
};

export const licensesAPI = {
  getAll: (params?: ApiParams) => api.get('/licenses', { params }),
  getById: (id: string) => api.get(`/licenses/${id}`),
  create: (data: Record<string, unknown>) => api.post('/licenses', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/licenses/${id}`, data),
  delete: (id: string) => api.delete(`/licenses/${id}`),
  assign: (id: string, data: Record<string, unknown>) => api.post(`/licenses/${id}/assign`, data),
  unassign: (id: string, data: Record<string, unknown>) => api.post(`/licenses/${id}/unassign`, data),
  getStats: () => api.get('/licenses/stats/summary'),
};

export const departmentsAPI = {
  getAll: (params?: ApiParams) => api.get('/departments', { params }),
  getById: (id: string) => api.get(`/departments/${id}`),
  create: (data: Record<string, unknown>) => api.post('/departments', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
  getStats: () => api.get('/departments/stats/summary'),
  addUser: (id: string, data: Record<string, unknown>) => api.post(`/departments/${id}/users`, data),
  removeUser: (id: string, userId: string) => api.delete(`/departments/${id}/users/${userId}`),
};

export const auditLogsAPI = {
  getAll: (params?: ApiParams) => api.get('/audit-logs', { params }),
  getById: (id: string) => api.get(`/audit-logs/${id}`),
  getResourceLogs: (targetType: string, targetId: string) => api.get(`/audit-logs/resource/${targetType}/${targetId}`),
  getUserActivity: (userId: string) => api.get(`/audit-logs/user/${userId}`),
  getStats: () => api.get('/audit-logs/stats/summary'),
};

export const notificationsAPI = {
  getAll: (params?: ApiParams) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const assetGroupsAPI = {
  getAll: (params?: ApiParams) => api.get('/asset-groups', { params }),
  getById: (id: string) => api.get(`/asset-groups/${id}`),
  create: (data: Record<string, unknown>) => api.post('/asset-groups', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/asset-groups/${id}`, data),
  delete: (id: string) => api.delete(`/asset-groups/${id}`),
  getLowStockAlerts: () => api.get('/asset-groups/alerts/low-stock'),
  bulkAction: (id: string, data: Record<string, unknown>) => api.post(`/asset-groups/${id}/bulk-action`, data),
  addAssets: (id: string, data: Record<string, unknown>) => api.post(`/asset-groups/${id}/assets`, data),
  removeAssets: (id: string, data: Record<string, unknown>) => api.delete(`/asset-groups/${id}/assets`, { data }),
};

export const onboardingKitsAPI = {
  getAll: (params?: ApiParams) => api.get('/onboarding-kits', { params }),
  getById: (id: string) => api.get(`/onboarding-kits/${id}`),
  create: (data: Record<string, unknown>) => api.post('/onboarding-kits', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/onboarding-kits/${id}`, data),
  delete: (id: string) => api.delete(`/onboarding-kits/${id}`),
  applyToUser: (id: string, userId: string) => api.post(`/onboarding-kits/${id}/apply`, { userId }),
  getRecommended: (params?: ApiParams) => api.get('/onboarding-kits/recommended', { params }),
};

export const reportsAPI = {
  getSpendAnalytics: (params?: ApiParams) => api.get('/reports/spend-analytics', { params }),
  getUtilization: () => api.get('/reports/utilization'),
  getAuditSummary: (params?: ApiParams) => api.get('/reports/audit-summary', { params }),
  exportAssets: () => api.get('/reports/export/assets', { responseType: 'blob' }),
  exportUsers: () => api.get('/reports/export/users', { responseType: 'blob' }),
  exportLicenses: () => api.get('/reports/export/licenses', { responseType: 'blob' }),
  importAssets: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/reports/import/assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const favoritesAPI = {
  getAll: () => api.get('/favorites'),
  add: (data: Record<string, unknown>) => api.post('/favorites', data),
  remove: (resourceType: string, resourceId: string) => api.delete(`/favorites/${resourceType}/${resourceId}`),
};

export const integrationsAPI = {
  getSyncStatus: () => api.get('/integrations/sync-status'),
  getSyncedDevices: (params?: ApiParams) => api.get('/integrations/devices', { params }),
  syncIntune: (devices: unknown[]) => api.post('/integrations/intune/sync', { devices }),
  syncLansweeper: (devices: unknown[]) => api.post('/integrations/lansweeper/sync', { devices }),
  triggerSync: (source: string) => api.post(`/integrations/${source}/trigger-sync`),
};

export const integrationConfigsAPI = {
  getAll: () => api.get('/integration-configs'),
  getByName: (name: string) => api.get(`/integration-configs/${name}`),
  createOrUpdate: (data: Record<string, unknown>) => api.post('/integration-configs', data),
  test: (name: string) => api.post(`/integration-configs/${name}/test`),
  toggle: (name: string) => api.patch(`/integration-configs/${name}/toggle`),
  delete: (name: string) => api.delete(`/integration-configs/${name}`),
  getOAuthUrl: (name: string) => api.get(`/integration-configs/${name}/oauth-url`),
};

export const vendorsAPI = {
  getAll: (params?: ApiParams) => api.get('/vendors', { params }),
  getById: (id: string) => api.get(`/vendors/${id}`),
  create: (data: Record<string, unknown>) => api.post('/vendors', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/vendors/${id}`, data),
  delete: (id: string) => api.delete(`/vendors/${id}`),
  getStats: (id: string) => api.get(`/vendors/${id}/stats`),
  getContracts: (id: string) => api.get(`/vendors/${id}/contracts`),
  getAssets: (id: string) => api.get(`/vendors/${id}/assets`),
};

export const contractsAPI = {
  getAll: (params?: ApiParams) => api.get('/contracts', { params }),
  getById: (id: string) => api.get(`/contracts/${id}`),
  create: (data: Record<string, unknown>) => api.post('/contracts', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/contracts/${id}`, data),
  delete: (id: string) => api.delete(`/contracts/${id}`),
  getStats: () => api.get('/contracts/stats/summary'),
  uploadDocument: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post(`/contracts/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadDocument: (id: string, documentId: string) => api.get(`/contracts/${id}/documents/${documentId}`, { responseType: 'blob' }),
  deleteDocument: (id: string, documentId: string) => api.delete(`/contracts/${id}/documents/${documentId}`),
};

export const cdwAPI = {
  searchProducts: (params?: ApiParams) => api.get('/cdw/products', { params }),
  getProductDetails: (sku: string) => api.get(`/cdw/products/${sku}`),
  getCart: () => api.get('/cdw/cart'),
  addToCart: (data: Record<string, unknown>) => api.post('/cdw/cart', data),
  getOrders: (params?: ApiParams) => api.get('/cdw/orders', { params }),
  createOrder: (data: Record<string, unknown>) => api.post('/cdw/orders', data),
  syncOrder: (orderId: string) => api.post(`/cdw/orders/${orderId}/sync`),
};

export const microsoftGraphAPI = {
  syncLicenses: (data: Record<string, unknown>) => api.post('/microsoft-graph/sync', data),
  getLicenseStats: () => api.get('/microsoft-graph/stats'),
  getLicenseUsers: (data: Record<string, unknown>) => api.post('/microsoft-graph/users', data),
  getLicensePricing: (data: Record<string, unknown>) => api.post('/microsoft-graph/pricing', data),
  assignLicense: (data: Record<string, unknown>) => api.post('/microsoft-graph/assign-license', data),
  removeLicense: (data: Record<string, unknown>) => api.post('/microsoft-graph/remove-license', data),
};

// Enhanced ITAM API endpoints
export const itamAPI = {
  receiving: {
    getExpected: (params?: ApiParams) => api.get('/receiving/expected-assets', { params }).then(res => res.data),
    getById: (id: string) => api.get(`/receiving/expected-assets/${id}`),
    ingestPO: (data: FormData | Record<string, unknown>) => {
      if (data instanceof FormData) {
        return api.post('/receiving/ingest-po', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return api.post('/receiving/ingest-po', data);
    },
    receiveAsset: (data: Record<string, unknown>) => api.post('/receiving/receive', data),
    bulkReceive: (data: Record<string, unknown>) => api.post('/receiving/bulk-receive', data),
    printLabel: (id: string, format?: string) => api.get(`/receiving/expected-assets/${id}/label`, {
      params: { format },
      responseType: 'blob'
    }),
  },
  contracts: {
    getAll: (params?: ApiParams) => api.get('/contracts', { params }),
    getById: (id: string) => api.get(`/contracts/${id}`),
    create: (data: Record<string, unknown>) => api.post('/contracts', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/contracts/${id}`, data),
    delete: (id: string) => api.delete(`/contracts/${id}`),
    getRenewals: (params?: ApiParams) => api.get('/contracts/renewals', { params }),
    getRenewalNotifications: () => api.get('/contracts/renewal-notifications'),
    acknowledgeRenewal: (id: string, data: Record<string, unknown>) => api.post(`/contracts/${id}/acknowledge-renewal`, data),
    getHealthScore: (id: string) => api.get(`/contracts/${id}/health-score`),
  },
  financials: {
    getDepreciationSchedule: (id: string) => api.get(`/assets/${id}/depreciation`),
    calculateDepreciation: (data: Record<string, unknown>) => api.post('/financials/depreciation', data),
    getChargebackAllocation: (id: string) => api.get(`/assets/${id}/chargeback`),
    updateChargeback: (id: string, data: Record<string, unknown>) => api.put(`/assets/${id}/chargeback`, data),
    getCOGS: (params?: ApiParams) => api.get('/financials/cogs', { params }),
    exportToERP: (data: Record<string, unknown>) => api.post('/financials/export-erp', data),
  },
  loaners: {
    getAll: (params?: ApiParams) => api.get('/loaners', { params }),
    getById: (id: string) => api.get(`/loaners/${id}`),
    checkout: (data: Record<string, unknown>) => api.post('/loaners/checkout', data),
    checkin: (id: string, data?: Record<string, unknown>) => api.post(`/loaners/${id}/checkin`, data),
    getPolicy: () => api.get('/loaners/policy'),
    savePolicy: (data: Record<string, unknown>) => api.post('/loaners/policy', data),
    getOverdue: () => api.get('/loaners/overdue'),
    sendReminders: (data: Record<string, unknown>) => api.post('/loaners/send-reminders', data),
  },
  stock: {
    getAll: (params?: ApiParams) => api.get('/stock', { params }),
    getById: (id: string) => api.get(`/stock/${id}`),
    create: (data: Record<string, unknown>) => api.post('/stock', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/stock/${id}`, data),
    delete: (id: string) => api.delete(`/stock/${id}`),
    getLowStock: () => api.get('/stock/low-stock'),
    reorder: (id: string, data: Record<string, unknown>) => api.post(`/stock/${id}/reorder`, data),
    cycleCount: (data: Record<string, unknown>) => api.post('/stock/cycle-count', data),
  },
  kits: {
    getAll: (params?: ApiParams) => api.get('/kits', { params }),
    getById: (id: string) => api.get(`/kits/${id}`),
    create: (data: Record<string, unknown>) => api.post('/kits', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/kits/${id}`, data),
    delete: (id: string) => api.delete(`/kits/${id}`),
    applyToUser: (id: string, userId: string) => api.post(`/kits/${id}/apply`, { userId }),
    deductInventory: (id: string, data: Record<string, unknown>) => api.post(`/kits/${id}/deduct`, data),
  },
  staging: {
    getProfileMappings: () => api.get('/staging/profile-mappings'),
    saveProfileMappings: (data: Record<string, unknown>) => api.post('/staging/profile-mappings', data),
    getDeploymentConfig: () => api.get('/staging/deployment-config'),
    saveDeploymentConfig: (data: Record<string, unknown>) => api.post('/staging/deployment-config', data),
    deploy: (data: Record<string, unknown>) => api.post('/staging/deploy', data),
    getHandoffDocs: (params?: ApiParams) => api.get('/staging/handoff-docs', { params }),
    uploadHandoffDoc: (assetId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/staging/assets/${assetId}/handoff-doc`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },
  discovery: {
    getSources: () => api.get('/discovery/sources'),
    saveSources: (data: Record<string, unknown>) => api.post('/discovery/sources', data),
    getRecords: (params?: ApiParams) => api.get('/discovery/records', { params }),
    reconcile: (data: Record<string, unknown>) => api.post('/discovery/reconcile', data),
    getOrphaned: () => api.get('/discovery/orphaned'),
    getConflicts: () => api.get('/discovery/conflicts'),
    triggerSync: (source: string) => api.post(`/discovery/${source}/sync`),
  },
  software: {
    getAll: (params?: ApiParams) => api.get('/software', { params }),
    getById: (id: string) => api.get(`/software/${id}`),
    create: (data: Record<string, unknown>) => api.post('/software', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/software/${id}`, data),
    delete: (id: string) => api.delete(`/software/${id}`),
    getRecognitionCatalog: () => api.get('/software/recognition-catalog'),
    normalizeProduct: (data: Record<string, unknown>) => api.post('/software/normalize', data),
    getEntitlements: (id: string) => api.get(`/software/${id}/entitlements`),
    getStats: () => api.get('/software/stats'),
    getExpiring: () => api.get('/software/expiring'),
    getTrueUpReport: (params?: ApiParams) => api.get('/software/true-up', { params }),
    optimizeSeats: (data: Record<string, unknown>) => api.post('/software/optimize-seats', data),
    reclaimInactive: (params?: ApiParams) => api.post('/software/reclaim-inactive', params),
  },
  saas: {
    getAllSeats: (params?: ApiParams) => api.get('/saas/seats', { params }),
    getSeatActivity: (id: string) => api.get(`/saas/seats/${id}/activity`),
    reclaimSeat: (id: string, data: Record<string, unknown>) => api.post(`/saas/seats/${id}/reclaim`, data),
    getOptimization: (params?: ApiParams) => api.get('/saas/optimization', { params }),
    syncVendor: (vendor: string) => api.post(`/saas/sync/${vendor}`),
  },
  compliance: {
    getAttestations: (params?: ApiParams) => api.get('/compliance/attestations', { params }),
    createAttestation: (data: Record<string, unknown>) => api.post('/compliance/attestations', data),
    completeAttestation: (id: string, data: Record<string, unknown>) => api.post(`/compliance/attestations/${id}/complete`, data),
    getAuditPack: (params?: ApiParams) => api.get('/compliance/audit-pack', { params }),
    getWipeCerts: (params?: ApiParams) => api.get('/compliance/wipe-certs', { params }),
    getStats: () => api.get('/compliance/stats'),
    getPendingAttestations: () => api.get('/compliance/attestations/pending'),
    uploadWipeCert: (id: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/compliance/assets/${id}/wipe-cert`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },
  security: {
    getHealthStatus: (id: string) => api.get(`/assets/${id}/security/health`),
    getNonCompliant: (params?: ApiParams) => api.get('/security/non-compliant', { params }),
    getStats: () => api.get('/security/stats'),
    getAtRisk: () => api.get('/security/at-risk'),
    refreshStatus: (id: string) => api.post(`/security/refresh/${id}`),
    executeOffboarding: (data: Record<string, unknown>) => api.post('/security/offboarding', data),
    getRiskScore: (id: string) => api.get(`/assets/${id}/security/risk-score`),
    getCVEs: (id: string) => api.get(`/assets/${id}/security/cves`),
    updateSecurityStatus: (id: string, data: Record<string, unknown>) => api.put(`/assets/${id}/security/status`, data),
  },
  workflows: {
    getAll: (params?: ApiParams) => api.get('/workflows', { params }),
    getById: (id: string) => api.get(`/workflows/${id}`),
    create: (data: Record<string, unknown>) => api.post('/workflows', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/workflows/${id}`, data),
    delete: (id: string) => api.delete(`/workflows/${id}`),
    execute: (id: string, data: Record<string, unknown>) => api.post(`/workflows/${id}/execute`, data),
    toggle: (id: string, enabled: boolean) => api.patch(`/workflows/${id}/toggle`, { enabled }),
    getExecutions: (params?: ApiParams) => api.get('/workflows/executions', { params }),
    executeNewHire: (data: Record<string, unknown>) => api.post('/workflows/new-hire', data),
  },
  webhooks: {
    getAll: (params?: ApiParams) => api.get('/webhooks', { params }),
    getById: (id: string) => api.get(`/webhooks/${id}`),
    create: (data: Record<string, unknown>) => api.post('/webhooks', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/webhooks/${id}`, data),
    delete: (id: string) => api.delete(`/webhooks/${id}`),
    test: (id: string) => api.post(`/webhooks/${id}/test`),
  },
  apis: {
    getKeys: () => api.get('/apis/keys'),
    createKey: (data: Record<string, unknown>) => api.post('/apis/keys', data),
    deleteKey: (id: string) => api.delete(`/apis/keys/${id}`),
    getBulkOperations: (params?: ApiParams) => api.get('/apis/bulk-operations', { params }),
    bulkImport: (formData: FormData) => api.post('/apis/bulk/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  },
  locations: {
    getAll: (params?: ApiParams) => api.get('/locations', { params }),
    getById: (id: string) => api.get(`/locations/${id}`),
    getTree: () => api.get('/locations/tree'),
    getParents: (params?: ApiParams) => api.get('/locations/parents', { params }),
    create: (data: Record<string, unknown>) => api.post('/locations', data),
    update: (id: string, data: Record<string, unknown>) => api.put(`/locations/${id}`, data),
    delete: (id: string) => api.delete(`/locations/${id}`),
    getActiveShipments: () => api.get('/locations/shipments/active'),
    trackShipment: (params?: ApiParams) => api.get('/locations/shipments/track', { params }),
  },
  labels: {
    getTemplates: (params?: ApiParams) => api.get('/labels/templates', { params }),
    createTemplate: (data: Record<string, unknown>) => api.post('/labels/templates', data),
    updateTemplate: (id: string, data: Record<string, unknown>) => api.put(`/labels/templates/${id}`, data),
    deleteTemplate: (id: string) => api.delete(`/labels/templates/${id}`),
    getPrintJobs: () => api.get('/labels/print-jobs'),
    printLabel: (templateId: string, assetId: string) => api.post(`/labels/print/${templateId}/${assetId}`),
    generateLabel: (templateId: string, assetId: string) => api.get(`/labels/generate/${templateId}/${assetId}`),
  },
  shipping: {
    createShipment: (data: Record<string, unknown>) => api.post('/shipping/shipments', data),
    getShipment: (id: string) => api.get(`/shipping/shipments/${id}`),
    trackShipment: (id: string) => api.get(`/shipping/shipments/${id}/track`),
    createLabel: (data: Record<string, unknown>) => api.post('/shipping/labels', data),
    updateTracking: (id: string, data: Record<string, unknown>) => api.put(`/shipping/shipments/${id}/tracking`, data),
  },
  dataQuality: {
    getDriftReport: () => api.get('/data-quality/drift'),
    getNormalizationCatalog: () => api.get('/data-quality/normalization-catalog'),
    updateNormalizationCatalog: (data: Record<string, unknown>) => api.put('/data-quality/normalization-catalog', data),
    findDuplicates: (params?: ApiParams) => api.get('/data-quality/duplicates', { params }),
    mergeDuplicates: (data: Record<string, unknown>) => api.post('/data-quality/merge', data),
    validateData: (data: Record<string, unknown>) => api.post('/data-quality/validate', data),
  },
  reporting: {
    getDashboard: (params?: ApiParams) => api.get('/reports/dashboard', { params }),
    exportData: (params?: ApiParams) => api.get('/reports/export', { params, responseType: 'blob' }),
    scheduleExport: (data: Record<string, unknown>) => api.post('/reports/schedule-export', data),
    getPowerBISchema: () => api.get('/reports/powerbi-schema'),
    getScheduledExports: () => api.get('/reports/scheduled-exports'),
  },
};


