/**
 * Custom Report Builder Utility
 * Generate custom reports with flexible data selection and formatting
 */

// Available report templates
export const REPORT_TEMPLATES = {
  ASSET_DEPRECIATION: {
    id: 'asset_depreciation',
    name: 'Asset Depreciation Report',
    description: 'Depreciation schedules and current values',
    category: 'Financial',
    dataSource: 'assets',
    defaultFields: ['name', 'category', 'purchasePrice', 'purchaseDate', 'currentValue', 'depreciation'],
  },
  EOL_FORECAST: {
    id: 'eol_forecast',
    name: 'End-of-Life Forecast',
    description: 'Assets approaching EOL with replacement costs',
    category: 'Planning',
    dataSource: 'assets',
    defaultFields: ['name', 'category', 'purchaseDate', 'eolDate', 'yearsOld', 'status'],
  },
  WARRANTY_STATUS: {
    id: 'warranty_status',
    name: 'Warranty Status Report',
    description: 'All warranties with expiration tracking',
    category: 'Compliance',
    dataSource: 'assets',
    defaultFields: ['name', 'manufacturer', 'warrantyProvider', 'warrantyExpiry', 'status'],
  },
  LICENSE_UTILIZATION: {
    id: 'license_utilization',
    name: 'License Utilization Report',
    description: 'Software license usage and optimization',
    category: 'Financial',
    dataSource: 'licenses',
    defaultFields: ['name', 'vendor', 'totalSeats', 'usedSeats', 'utilization', 'annualCost'],
  },
  TCO_ANALYSIS: {
    id: 'tco_analysis',
    name: 'Total Cost of Ownership',
    description: 'Complete TCO breakdown by asset',
    category: 'Financial',
    dataSource: 'assets',
    defaultFields: ['name', 'category', 'purchasePrice', 'annualOperatingCost', 'totalTCO'],
  },
  DEPARTMENT_ALLOCATION: {
    id: 'department_allocation',
    name: 'Department Cost Allocation',
    description: 'Assets and costs by department',
    category: 'Financial',
    dataSource: 'assets',
    defaultFields: ['department', 'assetCount', 'totalValue', 'annualCost'],
  },
  COMPLIANCE_AUDIT: {
    id: 'compliance_audit',
    name: 'Compliance Audit Report',
    description: 'Full audit trail for compliance',
    category: 'Compliance',
    dataSource: 'combined',
    defaultFields: ['type', 'name', 'status', 'complianceStatus', 'expiryDate', 'owner'],
  },
  VENDOR_SPENDING: {
    id: 'vendor_spending',
    name: 'Vendor Spending Analysis',
    description: 'Total spend by vendor',
    category: 'Procurement',
    dataSource: 'assets',
    defaultFields: ['vendor', 'assetCount', 'totalSpend', 'averageCost'],
  },
};

// Available data fields
export const AVAILABLE_FIELDS = {
  assets: {
    name: { label: 'Asset Name', type: 'string' },
    assetTag: { label: 'Asset Tag', type: 'string' },
    serialNumber: { label: 'Serial Number', type: 'string' },
    category: { label: 'Category', type: 'string' },
    manufacturer: { label: 'Manufacturer', type: 'string' },
    model: { label: 'Model', type: 'string' },
    status: { label: 'Status', type: 'string' },
    condition: { label: 'Condition', type: 'string' },
    location: { label: 'Location', type: 'string' },
    purchasePrice: { label: 'Purchase Price', type: 'currency' },
    currentValue: { label: 'Current Value', type: 'currency' },
    depreciation: { label: 'Depreciation', type: 'currency' },
    purchaseDate: { label: 'Purchase Date', type: 'date' },
    warrantyExpiry: { label: 'Warranty Expiry', type: 'date' },
    warrantyProvider: { label: 'Warranty Provider', type: 'string' },
    assignedTo: { label: 'Assigned To', type: 'string' },
    department: { label: 'Department', type: 'string' },
    eolDate: { label: 'EOL Date', type: 'date' },
    yearsOld: { label: 'Age (Years)', type: 'number' },
    totalTCO: { label: 'Total TCO', type: 'currency' },
    annualOperatingCost: { label: 'Annual Operating Cost', type: 'currency' },
  },
  licenses: {
    name: { label: 'License Name', type: 'string' },
    vendor: { label: 'Vendor', type: 'string' },
    licenseType: { label: 'License Type', type: 'string' },
    totalSeats: { label: 'Total Seats', type: 'number' },
    usedSeats: { label: 'Used Seats', type: 'number' },
    utilization: { label: 'Utilization %', type: 'percentage' },
    annualCost: { label: 'Annual Cost', type: 'currency' },
    costPerSeat: { label: 'Cost per Seat', type: 'currency' },
    expirationDate: { label: 'Expiration Date', type: 'date' },
    status: { label: 'Status', type: 'string' },
  },
};

// Export formats
export const EXPORT_FORMATS = {
  CSV: { id: 'csv', name: 'CSV', extension: 'csv', mimeType: 'text/csv' },
  EXCEL: { id: 'excel', name: 'Excel', extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  PDF: { id: 'pdf', name: 'PDF', extension: 'pdf', mimeType: 'application/pdf' },
  JSON: { id: 'json', name: 'JSON', extension: 'json', mimeType: 'application/json' },
};

/**
 * Build custom report based on selected fields and filters
 */
export function buildCustomReport(data, config) {
  const {
    fields = [],
    filters = {},
    groupBy = null,
    sortBy = null,
    sortOrder = 'asc',
  } = config;

  let filtered = [...data];

  // Apply filters
  Object.entries(filters).forEach(([field, filterValue]) => {
    if (!filterValue || filterValue.length === 0) return;
    
    filtered = filtered.filter(item => {
      const value = item[field];
      if (Array.isArray(filterValue)) {
        return filterValue.includes(value);
      }
      return value === filterValue;
    });
  });

  // Group data if specified
  if (groupBy) {
    const grouped = {};
    filtered.forEach(item => {
      const groupKey = item[groupBy] || 'Unknown';
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(item);
    });
    
    return Object.entries(grouped).map(([group, items]) => ({
      group,
      items,
      count: items.length,
    }));
  }

  // Sort data
  if (sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  return filtered;
}

/**
 * Export report to CSV
 */
export function exportToCSV(data, fields, filename = 'report') {
  // Get field labels
  const headers = fields.map(field => {
    const fieldConfig = AVAILABLE_FIELDS.assets[field] || AVAILABLE_FIELDS.licenses[field];
    return fieldConfig?.label || field;
  });

  // Extract data
  const rows = data.map(item => {
    return fields.map(field => {
      let value = item[field];
      
      // Format based on type
      const fieldConfig = AVAILABLE_FIELDS.assets[field] || AVAILABLE_FIELDS.licenses[field];
      if (fieldConfig?.type === 'date' && value) {
        value = new Date(value).toLocaleDateString();
      } else if (fieldConfig?.type === 'currency' && value) {
        value = `$${parseFloat(value).toLocaleString()}`;
      } else if (fieldConfig?.type === 'percentage' && value) {
        value = `${value}%`;
      }
      
      return value || 'N/A';
    });
  });

  // Build CSV
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export report to JSON
 */
export function exportToJSON(data, filename = 'report') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calculate report statistics
 */
export function calculateReportStats(data, dataSource = 'assets') {
  if (!data || data.length === 0) return null;

  const stats = {
    totalRecords: data.length,
  };

  if (dataSource === 'assets') {
    stats.totalValue = data.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
    stats.currentValue = data.reduce((sum, item) => sum + (item.currentValue || 0), 0);
    stats.categories = [...new Set(data.map(item => item.category))].length;
    stats.avgPurchasePrice = stats.totalValue / data.length;
  } else if (dataSource === 'licenses') {
    stats.totalCost = data.reduce((sum, item) => sum + (item.annualCost || 0), 0);
    stats.totalSeats = data.reduce((sum, item) => sum + (item.totalSeats || 0), 0);
    stats.usedSeats = data.reduce((sum, item) => sum + (item.usedSeats || 0), 0);
    stats.avgUtilization = stats.totalSeats > 0 ? (stats.usedSeats / stats.totalSeats) * 100 : 0;
  }

  return stats;
}

/**
 * Save report configuration for later use
 */
export function saveReportConfig(config) {
  const savedReports = JSON.parse(localStorage.getItem('customReports') || '[]');
  savedReports.push({
    ...config,
    id: `report_${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem('customReports', JSON.stringify(savedReports));
  return savedReports;
}

/**
 * Load saved report configurations
 */
export function loadSavedReports() {
  return JSON.parse(localStorage.getItem('customReports') || '[]');
}

/**
 * Delete saved report
 */
export function deleteSavedReport(reportId) {
  const savedReports = JSON.parse(localStorage.getItem('customReports') || '[]');
  const filtered = savedReports.filter(r => r.id !== reportId);
  localStorage.setItem('customReports', JSON.stringify(filtered));
  return filtered;
}

export default {
  buildCustomReport,
  exportToCSV,
  exportToJSON,
  calculateReportStats,
  saveReportConfig,
  loadSavedReports,
  deleteSavedReport,
  REPORT_TEMPLATES,
  AVAILABLE_FIELDS,
  EXPORT_FORMATS,
};

