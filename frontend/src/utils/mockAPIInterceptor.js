/**
 * Mock API Interceptor
 * 
 * Intercepts API calls and returns mock data when API is unavailable
 * This enables full functionality testing without a backend
 */

import { itamMockData } from '../data/itamMockData';
import { testData } from '../data/testData';
import { shouldLoadTestData } from './testDataLoader';

// Helper to normalize data - add _id from id and populate relationships
const normalizeData = (data, type, allData = {}) => {
  if (!Array.isArray(data)) {
    return data;
  }

  return data.map(item => {
    // Create normalized item with _id
    const normalized = { ...item };
    
    // Add _id if it doesn't exist (use id if available)
    if (!normalized._id && normalized.id) {
      normalized._id = normalized.id;
    }

    // Populate relationships based on type
    if (type === 'assets') {
      // Populate assignedTo (user)
      if (normalized.assignedTo && typeof normalized.assignedTo === 'string') {
        const user = allData.users?.find(u => (u.id === normalized.assignedTo || u._id === normalized.assignedTo));
        if (user) {
          normalized.assignedTo = {
            _id: user._id || user.id,
            id: user.id,
            name: user.name,
            email: user.email,
          };
        }
      }
      // Populate vendor
      if (normalized.vendor && typeof normalized.vendor === 'string') {
        const vendor = allData.vendors?.find(v => (v.id === normalized.vendor || v._id === normalized.vendor));
        if (vendor) {
          normalized.vendor = {
            _id: vendor._id || vendor.id,
            id: vendor.id,
            name: vendor.name,
          };
        }
      }
    } else if (type === 'users') {
      // Populate department
      if (normalized.department && typeof normalized.department === 'string') {
        const dept = allData.departments?.find(d => (d.id === normalized.department || d._id === normalized.department || d.name === normalized.department));
        if (dept) {
          normalized.department = {
            _id: dept._id || dept.id,
            id: dept.id,
            name: dept.name,
          };
        }
      }
    } else if (type === 'departments') {
      // Populate manager (user)
      if (normalized.manager && typeof normalized.manager === 'string') {
        const manager = allData.users?.find(u => (u.id === normalized.manager || u._id === normalized.manager));
        if (manager) {
          normalized.manager = {
            _id: manager._id || manager.id,
            id: manager.id,
            name: manager.name,
            email: manager.email,
          };
        }
      }
      // Calculate employee count from users
      if (!normalized.employeeCount && allData.users) {
        const deptName = normalized.name || normalized.id;
        normalized.employeeCount = allData.users.filter(u => {
          const userDept = typeof u.department === 'string' ? u.department : u.department?.name;
          return userDept === deptName || userDept === normalized.id || userDept === normalized._id;
        }).length;
      }
    } else if (type === 'contracts') {
      // Populate vendor
      if (normalized.vendor && typeof normalized.vendor === 'string') {
        const vendor = allData.vendors?.find(v => (v.id === normalized.vendor || v._id === normalized.vendor));
        if (vendor) {
          normalized.vendor = {
            _id: vendor._id || vendor.id,
            id: vendor.id,
            name: vendor.name,
          };
        }
      }
    }

    return normalized;
  });
};

// Helper to calculate stats from data arrays
const calculateStats = (data, type) => {
  if (type === 'users') {
    const total = data.length;
    const active = data.filter(u => u.status === 'active').length;
    return {
      totalUsers: total, // Dashboard expects totalUsers
      total: total, // Keep for backward compatibility
      activeUsers: active, // Dashboard expects activeUsers
      active: active, // Keep for backward compatibility
      inactive: data.filter(u => u.status !== 'active').length,
      byRole: {
        admin: data.filter(u => u.role === 'admin').length,
        manager: data.filter(u => u.role === 'manager').length,
        staff: data.filter(u => u.role === 'staff').length,
      },
    };
  }
  if (type === 'assets') {
    const total = data.length;
    const assigned = data.filter(a => a.status === 'assigned').length;
    const available = data.filter(a => a.status === 'available').length;
    const utilizationRate = total > 0 ? Math.round((assigned / total) * 100) : 0;
    const expiringWarranties = data.filter(a => {
      if (!a.warrantyExpiry) return false;
      const daysUntilExpiry = Math.floor((new Date(a.warrantyExpiry) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 14 && daysUntilExpiry > 0;
    }).length;
    return {
      totalAssets: total, // Dashboard expects totalAssets
      total: total, // Keep for backward compatibility
      availableAssets: available, // Dashboard expects availableAssets
      assigned: assigned, // Keep for backward compatibility
      available: available, // Keep for backward compatibility
      maintenance: data.filter(a => a.status === 'maintenance').length,
      utilizationRate: utilizationRate, // Dashboard expects utilizationRate
      expiringWarranties: expiringWarranties, // Dashboard expects expiringWarranties
      byCategory: {
        laptop: data.filter(a => a.category === 'Laptop').length,
        desktop: data.filter(a => a.category === 'Desktop').length,
        monitor: data.filter(a => a.category === 'Monitor').length,
        mobile: data.filter(a => a.category === 'Mobile Device').length,
        tablet: data.filter(a => a.category === 'Tablet').length,
        server: data.filter(a => a.category === 'Server').length,
      },
    };
  }
  if (type === 'licenses') {
    const total = data.length;
    const active = data.filter(l => l.status === 'active').length;
    const totalSeats = data.reduce((sum, l) => sum + (l.totalSeats || 0), 0);
    const usedSeats = data.reduce((sum, l) => sum + (l.usedSeats || 0), 0);
    const utilization = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;
    const expiringLicenses = data.filter(l => {
      if (!l.expirationDate) return false;
      const daysUntilExpiry = Math.floor((new Date(l.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 60 && daysUntilExpiry > 0;
    }).length;
    return {
      totalLicenses: total, // Dashboard expects totalLicenses
      total: total, // Keep for backward compatibility
      active: active, // Keep for backward compatibility
      totalSeats: totalSeats,
      usedSeats: usedSeats,
      availableSeats: data.reduce((sum, l) => sum + (l.availableSeats || 0), 0),
      utilization: utilization, // Dashboard expects utilization
      expiringLicenses: expiringLicenses, // Dashboard expects expiringLicenses
      expiringSoon: expiringLicenses, // Keep for backward compatibility
    };
  }
  if (type === 'departments') {
    return {
      total: data.length,
      active: data.filter(d => d.status === 'active').length,
      totalEmployees: data.reduce((sum, d) => sum + (d.employeeCount || 0), 0),
      totalBudget: data.reduce((sum, d) => sum + (d.budget || 0), 0),
    };
  }
  if (type === 'contracts') {
    return {
      total: data.length,
      active: data.filter(c => c.status === 'active').length,
      totalValue: data.reduce((sum, c) => sum + (c.value || 0), 0),
      renewalsDue30: data.filter(c => {
        if (!c.renewalDate) return false;
        const daysUntilRenewal = Math.floor((new Date(c.renewalDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilRenewal <= 30 && daysUntilRenewal > 0;
      }).length,
    };
  }
  return {};
};

/**
 * Check if mock API should be used
 */
export const shouldUseMockAPI = () => {
  return shouldLoadTestData();
};

/**
 * Create mock API response
 * Since API methods do .then(res => res.data), we need to return:
 * { data: [...], pagination: {...} }
 * NOT { data: { data: [...], pagination: {...} } }
 */
export const createMockResponse = (data, pagination = null, type = null) => {
  // Normalize data to array
  let dataArray = Array.isArray(data) ? data : (data ? [data] : []);
  
  // Normalize IDs and populate relationships if type is provided
  if (type && dataArray.length > 0) {
    const allData = {
      users: testData.users,
      assets: testData.assets,
      departments: testData.departments,
      vendors: testData.vendors,
      contracts: testData.contracts,
    };
    dataArray = normalizeData(dataArray, type, allData);
  } else if (dataArray.length > 0) {
    // At minimum, add _id from id if not present
    dataArray = dataArray.map(item => {
      if (!item._id && item.id) {
        return { ...item, _id: item.id };
      }
      return item;
    });
  }
  
  // Return format: { data: [...], pagination: {...} }
  // This is what res.data will be after .then(res => res.data)
  const response = {
    data: dataArray,
  };

  if (pagination) {
    response.pagination = {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      total: dataArray.length,
      totalPages: Math.ceil(dataArray.length / (pagination.limit || 20)),
    };
  } else {
    response.pagination = {
      page: 1,
      limit: dataArray.length || 20,
      total: dataArray.length,
      totalPages: 1,
    };
  }

  return response;
};

/**
 * Get mock data for API endpoint
 */
export const getMockDataForEndpoint = (method, url, params = {}) => {
  if (!shouldLoadTestData()) {
    return null;
  }

  // Remove base URL and extract path
  // Handle both /api/v1/receiving/expected-assets and /receiving/expected-assets
  let path = url || '';
  
  // Remove query parameters first
  path = path.split('?')[0];
  
  // Remove base URL if present (handle various formats)
  // Match: /api/v1/..., http://.../api/v1/..., or just /api/v1/...
  if (path.includes('/api/v1/')) {
    // Extract everything after /api/v1/
    path = path.replace(/^.*\/api\/v1\//, '');
  } else if (path.startsWith('/api/v1')) {
    // Handle /api/v1 or /api/v1/ at the start
    path = path.replace(/^\/api\/v1\/?/, '');
  }
  
  // Remove leading slash
  path = path.replace(/^\//, '');
  
  // Debug logging
  console.log('[Mock API] Checking path:', path, 'from URL:', url);

  // Receiving endpoints
  if (path === 'receiving/expected-assets' || path.startsWith('receiving/expected-assets')) {
    console.log('[Mock API] Returning mock data for receiving/expected-assets', {
      path,
      dataCount: itamMockData.receiving.expectedAssets.length,
    });
    return createMockResponse(itamMockData.receiving.expectedAssets, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  if (path === 'receiving/stats') {
    return { data: itamMockData.receiving.stats };
  }

  // Staging endpoints
  if (path === 'staging/assets' || path.startsWith('staging/assets')) {
    return createMockResponse(itamMockData.staging.assets, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  if (path === 'staging/profile-mappings' || path.startsWith('staging/profile-mappings')) {
    return createMockResponse(itamMockData.staging.profileMappings || []);
  }

  if (path === 'staging/stats') {
    return { data: itamMockData.staging.stats };
  }

  // Loaners endpoints
  if (path === 'loaners' || path.startsWith('loaners')) {
    if (method === 'GET') {
      return createMockResponse(itamMockData.loaners.loaners, {
        page: params.page || 1,
        limit: params.limit || 20,
      });
    }
  }

  if (path === 'loaners/stats') {
    return { data: itamMockData.loaners.stats };
  }

  // Warranty endpoints
  if (path.includes('warranty') || path.includes('repairs')) {
    return createMockResponse(itamMockData.warranty.assets, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  // Financials endpoints
  if (path.includes('depreciation')) {
    return createMockResponse(itamMockData.financials.depreciationSchedules);
  }

  if (path === 'financials/stats') {
    return { data: itamMockData.financials.stats };
  }

  // Contracts endpoints
  if (path === 'contracts/renewals' || path.includes('contracts/renewals')) {
    return createMockResponse(itamMockData.contracts.renewals, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  if (path === 'contracts/renewal-notifications') {
    return createMockResponse(itamMockData.contracts.renewals.filter(r => r.daysUntilRenewal <= 60));
  }

  // Discovery endpoints
  if (path === 'discovery/records' || path.includes('discovery/records')) {
    return createMockResponse(itamMockData.discovery.records, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  if (path === 'discovery/orphaned') {
    return { data: itamMockData.discovery.orphaned };
  }

  if (path === 'discovery/conflicts') {
    return { data: itamMockData.discovery.conflicts };
  }

  if (path === 'discovery/sources') {
    // Return array of source objects (not just strings)
    return { 
      data: [
        { name: 'Intune', enabled: true, lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { name: 'Jamf', enabled: true, lastSync: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
        { name: 'SCCM', enabled: true, lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
        { name: 'Lansweeper', enabled: false, lastSync: null },
      ] 
    };
  }

  // Stock endpoints
  if (path === 'stock' || path.startsWith('stock/')) {
    console.log('[Mock API] ✅ Matched stock endpoint, path:', path);
    if (path === 'stock/low-stock') {
      return createMockResponse(itamMockData.stock.items.filter(item => item.status === 'Low Stock'));
    }
    if (path === 'stock/stats') {
      return { data: itamMockData.stock.stats };
    }
    // Default stock endpoint - return all stock items
    console.log('[Mock API] Returning stock items:', itamMockData.stock.items.length);
    return createMockResponse(itamMockData.stock.items, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  // Software endpoints
  if (path === 'software' || path.startsWith('software')) {
    if (path.includes('expiring')) {
      return createMockResponse(itamMockData.software.software.filter(s => s.status === 'Expiring Soon'));
    }
    if (path.includes('stats')) {
      return { data: itamMockData.software.stats };
    }
    return createMockResponse(itamMockData.software.software, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  // Compliance endpoints
  if (path === 'compliance/attestations' || path.startsWith('compliance/attestations')) {
    if (path.includes('pending')) {
      return createMockResponse(itamMockData.compliance.attestations.filter(a => a.status === 'Pending'));
    }
    return createMockResponse(itamMockData.compliance.attestations, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  if (path === 'compliance/stats') {
    return { data: itamMockData.compliance.stats };
  }

  if (path === 'compliance/wipe-certs') {
    return createMockResponse(itamMockData.compliance.wipeCerts);
  }

  // Security endpoints
  if (path === 'security/non-compliant' || path.includes('security/non-compliant')) {
    return createMockResponse(itamMockData.security.assets.filter(a => a.compliance === 'Non-Compliant'), {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  if (path === 'security/stats') {
    return { data: itamMockData.security.stats };
  }

  if (path === 'security/at-risk') {
    return createMockResponse(itamMockData.security.assets.filter(a => a.healthStatus.riskScore > 50));
  }

  if (path.includes('assets/') && path.includes('security/health')) {
    const assetId = path.match(/assets\/([^\/]+)/)?.[1];
    const asset = itamMockData.security.assets.find(a => a.id === assetId);
    return { data: asset?.healthStatus || null };
  }

  // Locations endpoints
  if (path === 'locations' || path.startsWith('locations')) {
    if (path === 'locations/tree') {
      return { data: itamMockData.locations.tree };
    }
    return createMockResponse(itamMockData.locations.locations, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  if (path === 'locations/shipments/active') {
    return { data: itamMockData.locations.shipments };
  }

  // Labels endpoints
  if (path === 'labels/templates' || path.startsWith('labels/templates')) {
    return createMockResponse(itamMockData.labels.templates, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  if (path === 'labels/print-jobs') {
    return createMockResponse(itamMockData.labels.printJobs);
  }

  // Workflows endpoints
  if (path === 'workflows' || path.startsWith('workflows')) {
    if (path.includes('executions')) {
      return createMockResponse(itamMockData.workflows.executions, {
        page: params.page || 1,
        limit: params.limit || 20,
      });
    }
    return createMockResponse(itamMockData.workflows.workflows, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  // APIs endpoints
  if (path === 'apis/keys') {
    return { data: itamMockData.apis.keys };
  }

  if (path === 'webhooks' || path.startsWith('webhooks')) {
    return createMockResponse(itamMockData.apis.webhooks, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  if (path === 'apis/bulk-operations') {
    return createMockResponse(itamMockData.apis.bulkOperations);
  }

  // Data Quality endpoints
  if (path === 'data-quality/duplicates' || path.includes('data-quality/duplicates')) {
    return createMockResponse(itamMockData.dataQuality.duplicates, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  if (path === 'data-quality/drift') {
    return { data: itamMockData.dataQuality.driftReport };
  }

  if (path === 'data-quality/normalization-catalog') {
    return { data: itamMockData.dataQuality.normalizationCatalog };
  }

  // Reporting endpoints
  if (path === 'reports/dashboard') {
    return { data: itamMockData.reporting.dashboard };
  }

  if (path === 'reports/scheduled-exports') {
    return createMockResponse(itamMockData.reporting.scheduledExports);
  }

  // Users endpoints
  if (path === 'users' || path.startsWith('users')) {
    if (path === 'users/stats/summary') {
      return { data: calculateStats(testData.users, 'users') };
    }
    if (path.match(/^users\/(\d+)$/)) {
      const userId = path.match(/^users\/(\d+)$/)[1];
      const user = testData.users.find(u => u.id === userId);
      if (user) {
        const normalized = normalizeData([user], 'users', { users: testData.users, departments: testData.departments })[0];
        return { data: normalized };
      }
      return null;
    }
    if (path.match(/^users\/(\d+)\/(assets|licenses|microsoft-licenses)$/)) {
      const userId = path.match(/^users\/(\d+)\//)[1];
      const resourceType = path.split('/').pop();
      if (resourceType === 'assets') {
        const userAssets = testData.assets.filter(a => a.assignedTo === userId);
        return createMockResponse(userAssets, null, 'assets');
      }
      if (resourceType === 'licenses') {
        const userLicenses = testData.licenses.filter(l => 
          l.assignedUsers && l.assignedUsers.includes(userId)
        );
        return createMockResponse(userLicenses, null, 'licenses');
      }
      return createMockResponse([]);
    }
    return createMockResponse(testData.users, {
      page: params.page || 1,
      limit: params.limit || 20,
    }, 'users');
  }

  // Assets endpoints
  if (path === 'assets' || path.startsWith('assets/')) {
    if (path === 'assets/stats/summary') {
      return { data: calculateStats(testData.assets, 'assets') };
    }
    if (path.match(/^assets\/(\d+)$/)) {
      const assetId = path.match(/^assets\/(\d+)$/)[1];
      const asset = testData.assets.find(a => a.id === assetId);
      if (asset) {
        const normalized = normalizeData([asset], 'assets', { users: testData.users, vendors: testData.vendors })[0];
        return { data: normalized };
      }
      return null;
    }
    return createMockResponse(testData.assets, {
      page: params.page || 1,
      limit: params.limit || 20,
    }, 'assets');
  }

  // Licenses endpoints
  if (path === 'licenses' || path.startsWith('licenses')) {
    if (path === 'licenses/stats/summary') {
      return { data: calculateStats(testData.licenses, 'licenses') };
    }
    if (path.match(/^licenses\/(\d+)$/)) {
      const licenseId = path.match(/^licenses\/(\d+)$/)[1];
      const license = testData.licenses.find(l => l.id === licenseId);
      if (license) {
        const normalized = normalizeData([license], 'licenses', {})[0];
        return { data: normalized };
      }
      return null;
    }
    return createMockResponse(testData.licenses, {
      page: params.page || 1,
      limit: params.limit || 20,
    }, 'licenses');
  }

  // Departments endpoints
  if (path === 'departments' || path.startsWith('departments')) {
    if (path === 'departments/stats/summary') {
      return { data: calculateStats(testData.departments, 'departments') };
    }
    if (path.match(/^departments\/(\d+)$/)) {
      const deptId = path.match(/^departments\/(\d+)$/)[1];
      const dept = testData.departments.find(d => d.id === deptId);
      if (dept) {
        const normalized = normalizeData([dept], 'departments', { users: testData.users, departments: testData.departments })[0];
        return { data: normalized };
      }
      return null;
    }
    return createMockResponse(testData.departments, {
      page: params.page || 1,
      limit: params.limit || 20,
    }, 'departments');
  }

  // Vendors endpoints
  if (path === 'vendors' || path.startsWith('vendors')) {
    if (path.match(/^vendors\/(\d+)$/) || path.match(/^vendors\/(\w+)$/)) {
      const vendorId = path.match(/^vendors\/(.+)$/)?.[1];
      const vendor = testData.vendors.find(v => v.id === vendorId || v._id === vendorId);
      if (vendor) {
        const normalized = normalizeData([vendor], 'vendors', {})[0];
        return { data: normalized };
      }
      return null;
    }
    if (path.match(/^vendors\/(\d+)\/(stats|contracts|assets)$/)) {
      // Return empty/mock data for vendor sub-resources
      return createMockResponse([]);
    }
    return createMockResponse(testData.vendors, {
      page: params.page || 1,
      limit: params.limit || 20,
    }, 'vendors');
  }

  // Contracts endpoints (full contracts, not just renewals)
  // Note: contracts/renewals is handled earlier in the file
  if (path === 'contracts' || (path.startsWith('contracts/') && !path.includes('renewals'))) {
    if (path === 'contracts/stats/summary') {
      return { data: calculateStats(testData.contracts, 'contracts') };
    }
    if (path.match(/^contracts\/(\d+)$/) || path.match(/^contracts\/(\w+)$/)) {
      const contractId = path.match(/^contracts\/(.+)$/)?.[1];
      const contract = testData.contracts.find(c => c.id === contractId || c._id === contractId);
      if (contract) {
        const normalized = normalizeData([contract], 'contracts', { vendors: testData.vendors })[0];
        return { data: normalized };
      }
      return null;
    }
    return createMockResponse(testData.contracts, {
      page: params.page || 1,
      limit: params.limit || 20,
    }, 'contracts');
  }

  // Asset Groups endpoints
  if (path === 'asset-groups' || path.startsWith('asset-groups')) {
    if (path === 'asset-groups/alerts/low-stock') {
      const lowStockGroups = testData.assetGroups
        .filter(ag => ag.available <= ag.lowStockThreshold)
        .map(ag => ({
          ...ag,
          _id: ag._id || ag.id,
          groupId: ag._id || ag.id,
          group: ag.name,
          availableCount: ag.available,
          severity: ag.available === 0 ? 'urgent' : (ag.available <= ag.lowStockThreshold * 0.5 ? 'urgent' : 'warning'),
        }));
      return createMockResponse(lowStockGroups);
    }
    if (path.match(/^asset-groups\/(\d+)$/)) {
      const groupId = path.match(/^asset-groups\/(\d+)$/)[1];
      const group = testData.assetGroups.find(ag => ag.id === groupId);
      return group ? { data: group } : null;
    }
    return createMockResponse(testData.assetGroups, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  // Onboarding Kits endpoints
  if (path === 'onboarding-kits' || path.startsWith('onboarding-kits')) {
    if (path.match(/^onboarding-kits\/(\d+)$/)) {
      const kitId = path.match(/^onboarding-kits\/(\d+)$/)[1];
      const kit = testData.onboardingKits.find(k => k.id === kitId);
      return kit ? { data: kit } : null;
    }
    if (path === 'onboarding-kits/recommended') {
      // Return recommended kits based on some logic
      return createMockResponse(testData.onboardingKits.filter(k => k.status === 'active'));
    }
    return createMockResponse(testData.onboardingKits, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  // Auth endpoints
  if (path === 'auth/me') {
    // Return current user (default to admin)
    return { data: testData.users.find(u => u.role === 'admin') || testData.users[0] };
  }

  if (path === 'auth/login') {
    // Mock successful login
    return {
      data: {
        token: 'mock_jwt_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
        user: testData.users[0],
      },
    };
  }

  // Audit Logs endpoints
  if (path === 'audit-logs' || path.startsWith('audit-logs')) {
    if (path === 'audit-logs/stats/summary') {
      return {
        data: {
          total: 150,
          today: 5,
          thisWeek: 25,
          thisMonth: 100,
          byAction: {
            create: 50,
            update: 60,
            delete: 20,
            view: 20,
          },
        },
      };
    }
    // Return empty audit logs array
    return createMockResponse([], {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  // Notifications endpoints
  if (path === 'notifications' || path.startsWith('notifications')) {
    const mockNotifications = [
      {
        id: '1',
        type: 'info',
        title: 'New Asset Received',
        message: 'Asset LAP-007 has been received and is ready for assignment',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: '2',
        type: 'warning',
        title: 'License Expiring Soon',
        message: 'Adobe Creative Cloud license expires in 30 days',
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      },
      {
        id: '3',
        type: 'success',
        title: 'Asset Assigned',
        message: 'Asset LAP-003 has been assigned to Robert Taylor',
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
    ];
    return createMockResponse(mockNotifications, {
      page: params.page || 1,
      limit: params.limit || 20,
    });
  }

  // Integrations endpoints
  if (path === 'integrations/sync-status' || path.startsWith('integrations')) {
    if (path === 'integrations/sync-status') {
      return {
        data: {
          intune: { status: 'connected', lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          jamf: { status: 'connected', lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000) },
          sccm: { status: 'disconnected', lastSync: null },
          lansweeper: { status: 'connected', lastSync: new Date(Date.now() - 3 * 60 * 60 * 1000) },
        },
      };
    }
    if (path === 'integrations/devices') {
      // Return discovery records as devices
      return createMockResponse(itamMockData.discovery.records, {
        page: params.page || 1,
        limit: params.limit || 20,
      });
    }
    return createMockResponse([]);
  }

  // Integration Configs endpoints
  if (path === 'integration-configs' || path.startsWith('integration-configs')) {
    const mockConfigs = [
      {
        id: '1',
        name: 'Intune',
        enabled: true,
        type: 'MDM',
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: '2',
        name: 'Jamf',
        enabled: true,
        type: 'MDM',
        lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ];
    if (path.match(/^integration-configs\/(\w+)$/)) {
      const configName = path.match(/^integration-configs\/(\w+)$/)[1];
      const config = mockConfigs.find(c => c.name.toLowerCase() === configName.toLowerCase());
      return config ? { data: config } : null;
    }
    return createMockResponse(mockConfigs);
  }

  // Favorites endpoints
  if (path === 'favorites' || path.startsWith('favorites')) {
    return createMockResponse([]);
  }

  // Reports endpoints
  if (path.startsWith('reports/')) {
    if (path === 'reports/spend-analytics') {
      // Calculate spend from actual data
      const totalAssetSpend = testData.assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
      const totalLicenseSpend = testData.licenses.reduce((sum, l) => sum + (l.cost || 0), 0);
      const totalContractValue = testData.contracts.reduce((sum, c) => sum + (c.value || 0), 0);
      const totalSpend = totalAssetSpend + totalLicenseSpend + totalContractValue;
      const totalUsers = testData.users.length;
      const costPerUser = totalUsers > 0 ? Math.round(totalSpend / totalUsers) : 0;
      
      // Calculate by category
      const assetsByCategory = testData.assets.reduce((acc, asset) => {
        const category = asset.category || 'Other';
        acc[category] = (acc[category] || 0) + (asset.purchasePrice || 0);
        return acc;
      }, {});
      
      // Convert to array format for charts
      const assetsByCategoryArray = Object.entries(assetsByCategory).map(([category, totalSpend]) => ({
        _id: category,
        id: category,
        category: category,
        totalSpend: totalSpend,
      }));
      
      return {
        data: {
          summary: {
            totalAssetSpend: totalAssetSpend,
            totalLicenseSpend: totalLicenseSpend,
            totalContractSpend: totalContractValue,
            totalSpend: totalSpend,
            costPerUser: costPerUser,
            monthlyRecurring: totalLicenseSpend / 12, // Approximate monthly from annual licenses
          },
          assets: {
            byCategory: assetsByCategoryArray,
          },
          totalSpend: totalSpend,
          monthlySpend: totalSpend / 12,
          byCategory: {
            hardware: totalAssetSpend,
            software: totalLicenseSpend,
            services: totalContractValue,
          },
        },
      };
    }
    if (path === 'reports/utilization') {
      // Calculate utilization from actual data
      const totalAssets = testData.assets.length;
      const assignedAssets = testData.assets.filter(a => a.status === 'assigned').length;
      const assetUtilization = totalAssets > 0 ? Math.round((assignedAssets / totalAssets) * 100) : 0;
      
      const totalSeats = testData.licenses.reduce((sum, l) => sum + (l.totalSeats || 0), 0);
      const usedSeats = testData.licenses.reduce((sum, l) => sum + (l.usedSeats || 0), 0);
      const licenseUtilization = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;
      
      return {
        data: {
          assetUtilization: assetUtilization,
          licenseUtilization: licenseUtilization,
          byDepartment: {
            IT: 90,
            Sales: 80,
            Engineering: 85,
          },
        },
      };
    }
    return { data: {} };
  }

  // Default: return null to let API call proceed normally
  return null;
};

/**
 * Mock API interceptor for Axios
 * This can be added to axios interceptors to automatically return mock data
 */
export const mockAPIInterceptor = (config) => {
  if (!shouldUseMockAPI()) {
    return config;
  }

  // Check if we have mock data for this endpoint
  const mockResponse = getMockDataForEndpoint(
    config.method?.toUpperCase() || 'GET',
    config.url || '',
    config.params || {}
  );

  if (mockResponse) {
    // Return a promise that resolves with mock data
    return Promise.resolve(mockResponse);
  }

  return config;
};

// Export shouldLoadTestData for convenience
export { shouldLoadTestData };

export default {
  shouldUseMockAPI,
  shouldLoadTestData,
  getMockDataForEndpoint,
  createMockResponse,
  mockAPIInterceptor,
};

