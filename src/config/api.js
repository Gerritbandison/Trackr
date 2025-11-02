import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Use axios directly to avoid interceptor loop
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          // Store both new tokens
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }

          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats/summary'),
  getUserAssets: (id) => api.get(`/users/${id}/assets`),
  getUserLicenses: (id) => api.get(`/users/${id}/licenses`),
  getUserMicrosoftLicenses: (id) => api.get(`/users/${id}/microsoft-licenses`),
};

export const assetsAPI = {
  getAll: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
  assign: (id, data) => api.post(`/assets/${id}/assign`, data),
  unassign: (id) => api.post(`/assets/${id}/unassign`),
  getStats: () => api.get('/assets/stats/summary'),
  lookupLenovoWarranty: (id, autoUpdate = false) => api.get(`/assets/${id}/warranty-lookup`, { params: { autoUpdate } }),
};

export const licensesAPI = {
  getAll: (params) => api.get('/licenses', { params }),
  getById: (id) => api.get(`/licenses/${id}`),
  create: (data) => api.post('/licenses', data),
  update: (id, data) => api.put(`/licenses/${id}`, data),
  delete: (id) => api.delete(`/licenses/${id}`),
  assign: (id, data) => api.post(`/licenses/${id}/assign`, data),
  unassign: (id, data) => api.post(`/licenses/${id}/unassign`, data),
  getStats: () => api.get('/licenses/stats/summary'),
};

export const departmentsAPI = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  getStats: () => api.get('/departments/stats/summary'),
  addUser: (id, data) => api.post(`/departments/${id}/users`, data),
  removeUser: (id, userId) => api.delete(`/departments/${id}/users/${userId}`),
};

export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getById: (id) => api.get(`/audit-logs/${id}`),
  getResourceLogs: (targetType, targetId) =>
    api.get(`/audit-logs/resource/${targetType}/${targetId}`),
  getUserActivity: (userId) => api.get(`/audit-logs/user/${userId}`),
  getStats: () => api.get('/audit-logs/stats/summary'),
};

export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const assetGroupsAPI = {
  getAll: (params) => api.get('/asset-groups', { params }),
  getById: (id) => api.get(`/asset-groups/${id}`),
  create: (data) => api.post('/asset-groups', data),
  update: (id, data) => api.put(`/asset-groups/${id}`, data),
  delete: (id) => api.delete(`/asset-groups/${id}`),
  getLowStockAlerts: () => api.get('/asset-groups/alerts/low-stock'),
  bulkAction: (id, data) => api.post(`/asset-groups/${id}/bulk-action`, data),
};

export const onboardingKitsAPI = {
  getAll: (params) => api.get('/onboarding-kits', { params }),
  getById: (id) => api.get(`/onboarding-kits/${id}`),
  create: (data) => api.post('/onboarding-kits', data),
  update: (id, data) => api.put(`/onboarding-kits/${id}`, data),
  delete: (id) => api.delete(`/onboarding-kits/${id}`),
  applyToUser: (id, userId) => api.post(`/onboarding-kits/${id}/apply`, { userId }),
  getRecommended: (params) => api.get('/onboarding-kits/recommended', { params }),
};

export const reportsAPI = {
  getSpendAnalytics: (params) => api.get('/reports/spend-analytics', { params }),
  getUtilization: () => api.get('/reports/utilization'),
  getAuditSummary: (params) => api.get('/reports/audit-summary', { params }),
  exportAssets: () => api.get('/reports/export/assets', { responseType: 'blob' }),
  exportUsers: () => api.get('/reports/export/users', { responseType: 'blob' }),
  exportLicenses: () => api.get('/reports/export/licenses', { responseType: 'blob' }),
  importAssets: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/reports/import/assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const favoritesAPI = {
  getAll: () => api.get('/favorites'),
  add: (data) => api.post('/favorites', data),
  remove: (resourceType, resourceId) => api.delete(`/favorites/${resourceType}/${resourceId}`),
};

export const integrationsAPI = {
  getSyncStatus: () => api.get('/integrations/sync-status'),
  getSyncedDevices: (params) => api.get('/integrations/devices', { params }),
  syncIntune: (devices) => api.post('/integrations/intune/sync', { devices }),
  syncLansweeper: (devices) => api.post('/integrations/lansweeper/sync', { devices }),
  triggerSync: (source) => api.post(`/integrations/${source}/trigger-sync`),
};

export const integrationConfigsAPI = {
  getAll: () => api.get('/integration-configs'),
  getByName: (name) => api.get(`/integration-configs/${name}`),
  createOrUpdate: (data) => api.post('/integration-configs', data),
  test: (name) => api.post(`/integration-configs/${name}/test`),
  toggle: (name) => api.patch(`/integration-configs/${name}/toggle`),
  delete: (name) => api.delete(`/integration-configs/${name}`),
  getOAuthUrl: (name) => api.get(`/integration-configs/${name}/oauth-url`),
};

export const vendorsAPI = {
  getAll: (params) => api.get('/vendors', { params }),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
  getStats: (id) => api.get(`/vendors/${id}/stats`),
  getContracts: (id) => api.get(`/vendors/${id}/contracts`),
  getAssets: (id) => api.get(`/vendors/${id}/assets`),
};

export const contractsAPI = {
  getAll: (params) => api.get('/contracts', { params }),
  getById: (id) => api.get(`/contracts/${id}`),
  create: (data) => api.post('/contracts', data),
  update: (id, data) => api.put(`/contracts/${id}`, data),
  delete: (id) => api.delete(`/contracts/${id}`),
  getStats: () => api.get('/contracts/stats/summary'),
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post(`/contracts/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadDocument: (id, documentId) => api.get(`/contracts/${id}/documents/${documentId}`, { responseType: 'blob' }),
  deleteDocument: (id, documentId) => api.delete(`/contracts/${id}/documents/${documentId}`),
};

export const cdwAPI = {
  searchProducts: (params) => api.get('/cdw/products', { params }),
  getProductDetails: (sku) => api.get(`/cdw/products/${sku}`),
  getCart: () => api.get('/cdw/cart'),
  addToCart: (data) => api.post('/cdw/cart', data),
  getOrders: (params) => api.get('/cdw/orders', { params }),
  createOrder: (data) => api.post('/cdw/orders', data),
  syncOrder: (orderId) => api.post(`/cdw/orders/${orderId}/sync`),
};

export const microsoftGraphAPI = {
  syncLicenses: (data) => api.post('/microsoft-graph/sync', data),
  getLicenseStats: () => api.get('/microsoft-graph/stats'),
  getLicenseUsers: (data) => api.post('/microsoft-graph/users', data),
  getLicensePricing: (data) => api.post('/microsoft-graph/pricing', data),
  assignLicense: (data) => api.post('/microsoft-graph/assign-license', data),
  removeLicense: (data) => api.post('/microsoft-graph/remove-license', data),
};

