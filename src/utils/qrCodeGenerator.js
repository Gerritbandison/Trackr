/**
 * QR Code Generation Utilities
 * Bulk generation and label formatting for physical asset tracking
 */

/**
 * Generate QR code data for an asset
 */
export function generateAssetQRData(asset) {
  // Create a structured data payload that can be scanned
  const qrData = {
    id: asset._id,
    assetTag: asset.assetTag || '',
    serialNumber: asset.serialNumber || '',
    name: asset.name,
    category: asset.category,
    manufacturer: asset.manufacturer || '',
    model: asset.model || '',
    type: 'asset', // For scanner to identify data type
    url: `${window.location.origin}/assets/${asset._id}`,
  };
  
  return JSON.stringify(qrData);
}

/**
 * Generate QR codes for multiple assets
 */
export function generateBulkQRData(assets) {
  return assets.map(asset => ({
    assetId: asset._id,
    assetTag: asset.assetTag,
    qrData: generateAssetQRData(asset),
    displayInfo: {
      name: asset.name,
      tag: asset.assetTag || asset.serialNumber || 'N/A',
      category: asset.category,
    },
  }));
}

/**
 * Label template configurations
 */
export const LABEL_TEMPLATES = {
  AVERY_5160: {
    id: 'avery_5160',
    name: 'Avery 5160 (1" x 2-5/8")',
    width: 2.625, // inches
    height: 1,
    columns: 3,
    rows: 10,
    perPage: 30,
    qrSize: 0.75, // inches
  },
  AVERY_22806: {
    id: 'avery_22806',
    name: 'Avery 22806 (1.25" x 1.75")',
    width: 1.75,
    height: 1.25,
    columns: 4,
    rows: 6,
    perPage: 24,
    qrSize: 0.9,
  },
  DYMO_30336: {
    id: 'dymo_30336',
    name: 'DYMO 30336 (1" x 2.125")',
    width: 2.125,
    height: 1,
    columns: 1,
    rows: 1,
    perPage: 1,
    qrSize: 0.75,
  },
  BROTHER_DK1201: {
    id: 'brother_dk1201',
    name: 'Brother DK-1201 (1.1" x 3.5")',
    width: 3.5,
    height: 1.1,
    columns: 1,
    rows: 1,
    perPage: 1,
    qrSize: 0.9,
  },
  CUSTOM_2X2: {
    id: 'custom_2x2',
    name: 'Custom 2" x 2"',
    width: 2,
    height: 2,
    columns: 4,
    rows: 5,
    perPage: 20,
    qrSize: 1.5,
  },
};

/**
 * Format label data for printing
 */
export function formatLabelData(asset, template) {
  const templateConfig = LABEL_TEMPLATES[template] || LABEL_TEMPLATES.AVERY_5160;
  
  return {
    qrData: generateAssetQRData(asset),
    label: {
      line1: asset.assetTag || asset.serialNumber || '',
      line2: asset.name,
      line3: `${asset.manufacturer || ''} ${asset.model || ''}`.trim(),
      line4: asset.category?.toUpperCase() || '',
    },
    template: templateConfig,
    qrSize: templateConfig.qrSize,
  };
}

/**
 * Group assets for label sheet printing
 */
export function groupForLabelSheets(assets, template = 'AVERY_5160') {
  const templateConfig = LABEL_TEMPLATES[template] || LABEL_TEMPLATES.AVERY_5160;
  const perPage = templateConfig.perPage;
  
  const sheets = [];
  for (let i = 0; i < assets.length; i += perPage) {
    sheets.push(assets.slice(i, i + perPage));
  }
  
  return {
    sheets,
    totalSheets: sheets.length,
    template: templateConfig,
    totalLabels: assets.length,
  };
}

/**
 * Filter assets for QR generation
 */
export function filterAssetsForQR(assets, options = {}) {
  const {
    categories = [],
    status = [],
    withoutQR = false, // Only assets without existing QR codes
    location = '',
  } = options;
  
  let filtered = assets;
  
  // Filter by categories
  if (categories.length > 0) {
    filtered = filtered.filter(asset => categories.includes(asset.category));
  }
  
  // Filter by status
  if (status.length > 0) {
    filtered = filtered.filter(asset => status.includes(asset.status));
  }
  
  // Filter by location
  if (location) {
    filtered = filtered.filter(asset => 
      asset.location?.toLowerCase().includes(location.toLowerCase())
    );
  }
  
  // Only assets that don't have QR codes yet
  if (withoutQR) {
    filtered = filtered.filter(asset => !asset.qrCode);
  }
  
  return filtered;
}

/**
 * Generate CSV export of QR codes for external tools
 */
export function exportQRDataToCSV(assets) {
  const headers = ['Asset ID', 'Asset Tag', 'Name', 'Category', 'QR Code Data', 'URL'];
  
  const rows = assets.map(asset => {
    const qrData = generateAssetQRData(asset);
    return [
      asset._id,
      asset.assetTag || '',
      asset.name,
      asset.category || '',
      qrData,
      `${window.location.origin}/assets/${asset._id}`,
    ];
  });
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  return csv;
}

/**
 * Create downloadable QR code data blob
 */
export function createQRDownloadBlob(csvData) {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  return blob;
}

/**
 * Trigger browser download of QR code CSV
 */
export function downloadQRCodes(assets, filename = 'asset-qr-codes') {
  const csv = exportQRDataToCSV(assets);
  const blob = createQRDownloadBlob(csv);
  
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

export default {
  generateAssetQRData,
  generateBulkQRData,
  formatLabelData,
  groupForLabelSheets,
  filterAssetsForQR,
  exportQRDataToCSV,
  downloadQRCodes,
  LABEL_TEMPLATES,
};

