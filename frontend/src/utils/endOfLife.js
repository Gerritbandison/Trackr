/**
 * End-of-Life (EOL) Tracking Utility
 * Tracks when assets approach end of support dates
 */

// Standard EOL periods by asset type and manufacturer (in years from purchase)
export const EOL_PERIODS = {
  // Operating Systems
  windows10: { years: 10, name: 'Windows 10', supportEndDate: new Date('2025-10-14') },
  windows11: { years: 10, name: 'Windows 11', supportEndDate: null }, // Still supported
  macOS: { years: 7, name: 'macOS', supportEndDate: null },
  
  // Hardware by manufacturer
  dell: {
    laptop: 5,
    desktop: 6,
    server: 7,
    monitor: 7,
  },
  hp: {
    laptop: 5,
    desktop: 6,
    server: 7,
    monitor: 7,
  },
  lenovo: {
    laptop: 5,
    desktop: 6,
    server: 7,
    monitor: 7,
  },
  apple: {
    laptop: 7,
    desktop: 7,
    phone: 5,
    tablet: 5,
  },
  microsoft: {
    laptop: 5,
    tablet: 4,
  },
  
  // Generic by category
  default: {
    laptop: 5,
    desktop: 6,
    monitor: 7,
    phone: 3,
    tablet: 4,
    server: 7,
    printer: 7,
    dock: 5,
    network: 10,
    storage: 7,
  },
};

// Warning thresholds (months before EOL)
export const EOL_WARNING_THRESHOLDS = {
  CRITICAL: 3, // 3 months
  WARNING: 6,  // 6 months
  INFO: 12,    // 12 months
};

/**
 * Calculate EOL date for an asset
 */
export function calculateEOLDate(asset) {
  if (!asset.purchaseDate) {
    return null;
  }

  const purchaseDate = new Date(asset.purchaseDate);
  const manufacturer = asset.manufacturer?.toLowerCase();
  const category = asset.category?.toLowerCase();
  
  let eolYears = null;
  
  // Try manufacturer-specific EOL period
  if (manufacturer && EOL_PERIODS[manufacturer]?.[category]) {
    eolYears = EOL_PERIODS[manufacturer][category];
  }
  // Fall back to default by category
  else if (category && EOL_PERIODS.default[category]) {
    eolYears = EOL_PERIODS.default[category];
  }
  // Use generic default
  else {
    eolYears = 5; // Default 5 years for unknown types
  }
  
  const eolDate = new Date(purchaseDate);
  eolDate.setFullYear(eolDate.getFullYear() + eolYears);
  
  return eolDate;
}

/**
 * Get EOL status for an asset
 */
export function getEOLStatus(asset) {
  const eolDate = calculateEOLDate(asset);
  
  if (!eolDate) {
    return {
      status: 'unknown',
      eolDate: null,
      daysUntilEOL: null,
      monthsUntilEOL: null,
      isPastEOL: false,
      severity: null,
      message: 'Unable to determine EOL date',
    };
  }
  
  const now = new Date();
  const diffTime = eolDate - now;
  const daysUntilEOL = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const monthsUntilEOL = Math.ceil(daysUntilEOL / 30);
  const isPastEOL = daysUntilEOL < 0;
  
  let status, severity, message;
  
  if (isPastEOL) {
    status = 'past_eol';
    severity = 'critical';
    message = `Past end-of-life by ${Math.abs(monthsUntilEOL)} months`;
  } else if (monthsUntilEOL <= EOL_WARNING_THRESHOLDS.CRITICAL) {
    status = 'critical';
    severity = 'critical';
    message = `Approaching end-of-life in ${monthsUntilEOL} month${monthsUntilEOL !== 1 ? 's' : ''}`;
  } else if (monthsUntilEOL <= EOL_WARNING_THRESHOLDS.WARNING) {
    status = 'warning';
    severity = 'warning';
    message = `End-of-life in ${monthsUntilEOL} months`;
  } else if (monthsUntilEOL <= EOL_WARNING_THRESHOLDS.INFO) {
    status = 'info';
    severity = 'info';
    message = `End-of-life in ${monthsUntilEOL} months`;
  } else {
    status = 'ok';
    severity = null;
    message = `Supported for ${monthsUntilEOL} more months`;
  }
  
  return {
    status,
    eolDate,
    daysUntilEOL,
    monthsUntilEOL,
    isPastEOL,
    severity,
    message,
    yearsOld: Math.floor((now - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365.25)),
  };
}

/**
 * Get all assets approaching EOL
 */
export function getAssetsApproachingEOL(assets, threshold = EOL_WARNING_THRESHOLDS.INFO) {
  return assets
    .map(asset => ({
      ...asset,
      eolStatus: getEOLStatus(asset),
    }))
    .filter(asset => {
      const eol = asset.eolStatus;
      return eol.monthsUntilEOL !== null && 
             eol.monthsUntilEOL <= threshold && 
             !eol.isPastEOL;
    })
    .sort((a, b) => a.eolStatus.daysUntilEOL - b.eolStatus.daysUntilEOL);
}

/**
 * Get assets past EOL
 */
export function getAssetsPastEOL(assets) {
  return assets
    .map(asset => ({
      ...asset,
      eolStatus: getEOLStatus(asset),
    }))
    .filter(asset => asset.eolStatus.isPastEOL)
    .sort((a, b) => a.eolStatus.daysUntilEOL - b.eolStatus.daysUntilEOL);
}

/**
 * Calculate replacement recommendations
 */
export function getReplacementRecommendations(assets) {
  const recommendations = [];
  
  assets.forEach(asset => {
    const eolStatus = getEOLStatus(asset);
    
    if (eolStatus.isPastEOL || eolStatus.severity === 'critical') {
      recommendations.push({
        assetId: asset._id,
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.category,
        eolStatus,
        priority: eolStatus.isPastEOL ? 'urgent' : 'high',
        reason: eolStatus.message,
        estimatedReplacementCost: estimateReplacementCost(asset),
      });
    }
  });
  
  return recommendations.sort((a, b) => {
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
    return a.eolStatus.daysUntilEOL - b.eolStatus.daysUntilEOL;
  });
}

/**
 * Estimate replacement cost based on asset type and current market prices
 */
function estimateReplacementCost(asset) {
  const category = asset.category?.toLowerCase();
  
  const estimatedPrices = {
    laptop: 1200,
    desktop: 900,
    monitor: 350,
    phone: 800,
    tablet: 600,
    server: 3500,
    printer: 400,
    dock: 200,
    network: 500,
    storage: 800,
  };
  
  return estimatedPrices[category] || 500;
}

/**
 * Group assets by EOL status
 */
export function groupAssetsByEOLStatus(assets) {
  const grouped = {
    past_eol: [],
    critical: [],
    warning: [],
    info: [],
    ok: [],
    unknown: [],
  };
  
  assets.forEach(asset => {
    const eolStatus = getEOLStatus(asset);
    grouped[eolStatus.status].push({
      ...asset,
      eolStatus,
    });
  });
  
  return grouped;
}

/**
 * Calculate total replacement budget needed
 */
export function calculateReplacementBudget(assets, timeframe = 12) {
  const assetsNeedingReplacement = assets
    .map(asset => ({
      ...asset,
      eolStatus: getEOLStatus(asset),
    }))
    .filter(asset => 
      asset.eolStatus.monthsUntilEOL !== null && 
      asset.eolStatus.monthsUntilEOL <= timeframe
    );
  
  const totalCost = assetsNeedingReplacement.reduce((sum, asset) => 
    sum + estimateReplacementCost(asset), 0
  );
  
  return {
    assetsCount: assetsNeedingReplacement.length,
    totalEstimatedCost: totalCost,
    averageCostPerAsset: assetsNeedingReplacement.length > 0 
      ? totalCost / assetsNeedingReplacement.length 
      : 0,
    timeframeMonths: timeframe,
    breakdown: assetsNeedingReplacement.map(asset => ({
      assetId: asset._id,
      assetTag: asset.assetTag,
      name: asset.name,
      category: asset.category,
      eolDate: asset.eolStatus.eolDate,
      monthsUntilEOL: asset.eolStatus.monthsUntilEOL,
      estimatedCost: estimateReplacementCost(asset),
    })),
  };
}

/**
 * Generate EOL report summary
 */
export function generateEOLSummary(assets) {
  const grouped = groupAssetsByEOLStatus(assets);
  const recommendations = getReplacementRecommendations(assets);
  const budget12Month = calculateReplacementBudget(assets, 12);
  const budget24Month = calculateReplacementBudget(assets, 24);
  
  return {
    totalAssets: assets.length,
    pastEOL: grouped.past_eol.length,
    critical: grouped.critical.length,
    warning: grouped.warning.length,
    info: grouped.info.length,
    ok: grouped.ok.length,
    unknown: grouped.unknown.length,
    recommendations,
    budgets: {
      next12Months: budget12Month,
      next24Months: budget24Month,
    },
    urgentActionRequired: grouped.past_eol.length + grouped.critical.length,
  };
}

export default {
  calculateEOLDate,
  getEOLStatus,
  getAssetsApproachingEOL,
  getAssetsPastEOL,
  getReplacementRecommendations,
  groupAssetsByEOLStatus,
  calculateReplacementBudget,
  generateEOLSummary,
  EOL_PERIODS,
  EOL_WARNING_THRESHOLDS,
};

