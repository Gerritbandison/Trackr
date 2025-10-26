/**
 * Total Cost of Ownership (TCO) Calculator
 * Calculates the complete cost of owning and operating IT assets
 */

/**
 * Calculate TCO for a single asset
 */
export function calculateAssetTCO(asset, options = {}) {
  const {
    electricityCostPerKWh = 0.12, // Default $0.12 per kWh
    annualMaintenancePercent = 0.10, // 10% of purchase price
    avgSupportHoursPerYear = 2, // Hours of IT support needed
    supportCostPerHour = 75, // IT support hourly rate
    yearsToCalculate = 5, // TCO calculation period
  } = options;

  if (!asset.purchasePrice || !asset.purchaseDate) {
    return null;
  }

  const purchasePrice = parseFloat(asset.purchasePrice);
  
  // Power consumption estimates (watts) by asset type
  const powerConsumption = {
    laptop: 65,
    desktop: 200,
    monitor: 30,
    server: 500,
    printer: 100,
    phone: 5,
    tablet: 10,
    dock: 15,
    network: 50,
    storage: 300,
  };

  const watts = powerConsumption[asset.category?.toLowerCase()] || 100;
  
  // Annual calculations
  const annualPowerCost = (watts / 1000) * 8 * 250 * electricityCostPerKWh; // 8 hrs/day, 250 days/year
  const annualMaintenanceCost = purchasePrice * annualMaintenancePercent;
  const annualSupportCost = avgSupportHoursPerYear * supportCostPerHour;
  
  // Software/license costs (if applicable)
  const annualSoftwareCost = 0; // Could be enhanced to pull from licenses
  
  // Total annual operating cost
  const annualOperatingCost = 
    annualPowerCost + 
    annualMaintenanceCost + 
    annualSupportCost + 
    annualSoftwareCost;
  
  // Total TCO over the period
  const totalOperatingCost = annualOperatingCost * yearsToCalculate;
  const totalTCO = purchasePrice + totalOperatingCost;
  
  // Per-year breakdown
  const yearlyBreakdown = [];
  let cumulativeCost = purchasePrice;
  
  for (let year = 1; year <= yearsToCalculate; year++) {
    const yearCost = year === 1 
      ? purchasePrice + annualOperatingCost 
      : annualOperatingCost;
    cumulativeCost = year === 1 ? yearCost : cumulativeCost + annualOperatingCost;
    
    yearlyBreakdown.push({
      year,
      annualCost: Math.round(yearCost * 100) / 100,
      cumulativeCost: Math.round(cumulativeCost * 100) / 100,
    });
  }
  
  return {
    assetId: asset._id,
    assetName: asset.name,
    category: asset.category,
    purchasePrice: Math.round(purchasePrice * 100) / 100,
    annualOperatingCost: Math.round(annualOperatingCost * 100) / 100,
    totalOperatingCost: Math.round(totalOperatingCost * 100) / 100,
    totalTCO: Math.round(totalTCO * 100) / 100,
    breakdown: {
      annualPower: Math.round(annualPowerCost * 100) / 100,
      annualMaintenance: Math.round(annualMaintenanceCost * 100) / 100,
      annualSupport: Math.round(annualSupportCost * 100) / 100,
      annualSoftware: Math.round(annualSoftwareCost * 100) / 100,
    },
    yearlyBreakdown,
    yearsToCalculate,
  };
}

/**
 * Calculate TCO for multiple assets
 */
export function calculateBulkTCO(assets, options = {}) {
  return assets
    .map(asset => calculateAssetTCO(asset, options))
    .filter(result => result !== null);
}

/**
 * Calculate total TCO across all assets
 */
export function calculateTotalTCO(assets, options = {}) {
  const tcoResults = calculateBulkTCO(assets, options);
  
  if (tcoResults.length === 0) {
    return null;
  }
  
  const totals = tcoResults.reduce(
    (acc, result) => ({
      purchasePrice: acc.purchasePrice + result.purchasePrice,
      annualOperatingCost: acc.annualOperatingCost + result.annualOperatingCost,
      totalOperatingCost: acc.totalOperatingCost + result.totalOperatingCost,
      totalTCO: acc.totalTCO + result.totalTCO,
      annualPower: acc.annualPower + result.breakdown.annualPower,
      annualMaintenance: acc.annualMaintenance + result.breakdown.annualMaintenance,
      annualSupport: acc.annualSupport + result.breakdown.annualSupport,
      annualSoftware: acc.annualSoftware + result.breakdown.annualSoftware,
    }),
    {
      purchasePrice: 0,
      annualOperatingCost: 0,
      totalOperatingCost: 0,
      totalTCO: 0,
      annualPower: 0,
      annualMaintenance: 0,
      annualSupport: 0,
      annualSoftware: 0,
    }
  );
  
  return {
    assetCount: tcoResults.length,
    ...totals,
    averageTCO: totals.totalTCO / tcoResults.length,
    operatingCostPercentage: (totals.totalOperatingCost / totals.totalTCO) * 100,
  };
}

/**
 * Calculate TCO by category
 */
export function calculateTCOByCategory(assets, options = {}) {
  const byCategory = {};
  
  assets.forEach(asset => {
    const category = asset.category || 'Unknown';
    const tco = calculateAssetTCO(asset, options);
    
    if (!tco) return;
    
    if (!byCategory[category]) {
      byCategory[category] = {
        count: 0,
        purchasePrice: 0,
        totalTCO: 0,
        annualOperatingCost: 0,
      };
    }
    
    byCategory[category].count++;
    byCategory[category].purchasePrice += tco.purchasePrice;
    byCategory[category].totalTCO += tco.totalTCO;
    byCategory[category].annualOperatingCost += tco.annualOperatingCost;
  });
  
  // Add averages
  Object.keys(byCategory).forEach(category => {
    byCategory[category].averageTCO = byCategory[category].totalTCO / byCategory[category].count;
    byCategory[category].averageAnnualCost = byCategory[category].annualOperatingCost / byCategory[category].count;
  });
  
  return byCategory;
}

/**
 * Calculate TCO by department
 */
export function calculateTCOByDepartment(assets, options = {}) {
  const byDepartment = {};
  
  assets.forEach(asset => {
    const department = asset.assignedTo?.department?.name || 'Unassigned';
    const tco = calculateAssetTCO(asset, options);
    
    if (!tco) return;
    
    if (!byDepartment[department]) {
      byDepartment[department] = {
        count: 0,
        totalTCO: 0,
        annualCost: 0,
      };
    }
    
    byDepartment[department].count++;
    byDepartment[department].totalTCO += tco.totalTCO;
    byDepartment[department].annualCost += tco.annualOperatingCost;
  });
  
  return byDepartment;
}

/**
 * Compare TCO between two assets or asset types
 */
export function compareTCO(asset1, asset2, options = {}) {
  const tco1 = calculateAssetTCO(asset1, options);
  const tco2 = calculateAssetTCO(asset2, options);
  
  if (!tco1 || !tco2) return null;
  
  const difference = tco2.totalTCO - tco1.totalTCO;
  const percentDifference = ((difference / tco1.totalTCO) * 100).toFixed(2);
  
  return {
    asset1: tco1,
    asset2: tco2,
    difference: Math.round(difference * 100) / 100,
    percentDifference: parseFloat(percentDifference),
    cheaper: difference < 0 ? asset2.name : asset1.name,
  };
}

/**
 * Generate TCO report summary
 */
export function generateTCOReport(assets, options = {}) {
  const total = calculateTotalTCO(assets, options);
  const byCategory = calculateTCOByCategory(assets, options);
  const byDepartment = calculateTCOByDepartment(assets, options);
  
  return {
    summary: total,
    byCategory,
    byDepartment,
    generatedAt: new Date().toISOString(),
    parameters: options,
  };
}

export default {
  calculateAssetTCO,
  calculateBulkTCO,
  calculateTotalTCO,
  calculateTCOByCategory,
  calculateTCOByDepartment,
  compareTCO,
  generateTCOReport,
};

