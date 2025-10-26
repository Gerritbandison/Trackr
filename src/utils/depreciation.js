/**
 * Asset Depreciation Calculator
 * Supports multiple depreciation methods for accurate financial reporting
 */

// Standard depreciation periods by asset type (in years)
export const DEPRECIATION_PERIODS = {
  laptop: 3,
  desktop: 4,
  monitor: 5,
  server: 5,
  phone: 2,
  tablet: 3,
  printer: 5,
  dock: 4,
  network: 7,
  storage: 5,
  software: 3,
  default: 4,
};

// Depreciation methods
export const DEPRECIATION_METHODS = {
  STRAIGHT_LINE: 'straight_line',
  DECLINING_BALANCE: 'declining_balance',
  SUM_OF_YEARS: 'sum_of_years',
};

/**
 * Calculate depreciation using straight-line method
 * Most common method: (Cost - Salvage Value) / Useful Life
 */
export function calculateStraightLineDepreciation(
  purchasePrice,
  salvageValue = 0,
  purchaseDate,
  usefulLifeYears
) {
  const currentDate = new Date();
  const purchaseDateObj = new Date(purchaseDate);
  
  // Calculate years since purchase
  const yearsSincePurchase = 
    (currentDate - purchaseDateObj) / (1000 * 60 * 60 * 24 * 365.25);
  
  // Annual depreciation
  const annualDepreciation = (purchasePrice - salvageValue) / usefulLifeYears;
  
  // Total depreciation so far
  const accumulatedDepreciation = Math.min(
    annualDepreciation * yearsSincePurchase,
    purchasePrice - salvageValue
  );
  
  // Current book value
  const currentValue = Math.max(purchasePrice - accumulatedDepreciation, salvageValue);
  
  // Depreciation percentage
  const depreciationPercentage = (accumulatedDepreciation / purchasePrice) * 100;
  
  // Remaining life in years
  const remainingLifeYears = Math.max(usefulLifeYears - yearsSincePurchase, 0);
  
  return {
    originalValue: purchasePrice,
    currentValue: Math.round(currentValue * 100) / 100,
    accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    annualDepreciation: Math.round(annualDepreciation * 100) / 100,
    depreciationPercentage: Math.round(depreciationPercentage * 100) / 100,
    remainingLifeYears: Math.round(remainingLifeYears * 100) / 100,
    usefulLifeYears,
    salvageValue,
    isFullyDepreciated: currentValue <= salvageValue,
  };
}

/**
 * Calculate depreciation using declining balance method (200% / double declining)
 * More aggressive depreciation in early years
 */
export function calculateDecliningBalanceDepreciation(
  purchasePrice,
  salvageValue = 0,
  purchaseDate,
  usefulLifeYears,
  rate = 2 // 200% declining balance
) {
  const currentDate = new Date();
  const purchaseDateObj = new Date(purchaseDate);
  
  const yearsSincePurchase = 
    (currentDate - purchaseDateObj) / (1000 * 60 * 60 * 24 * 365.25);
  
  // Calculate depreciation year by year
  let bookValue = purchasePrice;
  let accumulatedDepreciation = 0;
  const depreciationRate = rate / usefulLifeYears;
  
  for (let year = 0; year < Math.floor(yearsSincePurchase); year++) {
    const yearlyDepreciation = bookValue * depreciationRate;
    accumulatedDepreciation += yearlyDepreciation;
    bookValue -= yearlyDepreciation;
    
    // Don't depreciate below salvage value
    if (bookValue < salvageValue) {
      bookValue = salvageValue;
      accumulatedDepreciation = purchasePrice - salvageValue;
      break;
    }
  }
  
  // Partial year depreciation
  const partialYear = yearsSincePurchase - Math.floor(yearsSincePurchase);
  if (partialYear > 0 && bookValue > salvageValue) {
    const partialYearDepreciation = bookValue * depreciationRate * partialYear;
    accumulatedDepreciation += partialYearDepreciation;
    bookValue -= partialYearDepreciation;
  }
  
  const currentValue = Math.max(bookValue, salvageValue);
  const depreciationPercentage = (accumulatedDepreciation / purchasePrice) * 100;
  const remainingLifeYears = Math.max(usefulLifeYears - yearsSincePurchase, 0);
  
  return {
    originalValue: purchasePrice,
    currentValue: Math.round(currentValue * 100) / 100,
    accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    annualDepreciation: Math.round((accumulatedDepreciation / yearsSincePurchase) * 100) / 100,
    depreciationPercentage: Math.round(depreciationPercentage * 100) / 100,
    remainingLifeYears: Math.round(remainingLifeYears * 100) / 100,
    usefulLifeYears,
    salvageValue,
    isFullyDepreciated: currentValue <= salvageValue,
  };
}

/**
 * Calculate depreciation using sum-of-years-digits method
 * Front-loaded depreciation but less aggressive than declining balance
 */
export function calculateSumOfYearsDepreciation(
  purchasePrice,
  salvageValue = 0,
  purchaseDate,
  usefulLifeYears
) {
  const currentDate = new Date();
  const purchaseDateObj = new Date(purchaseDate);
  
  const yearsSincePurchase = 
    (currentDate - purchaseDateObj) / (1000 * 60 * 60 * 24 * 365.25);
  
  const depreciableBase = purchasePrice - salvageValue;
  const sumOfYears = (usefulLifeYears * (usefulLifeYears + 1)) / 2;
  
  let accumulatedDepreciation = 0;
  
  // Calculate depreciation for each complete year
  for (let year = 1; year <= Math.floor(yearsSincePurchase) && year <= usefulLifeYears; year++) {
    const remainingLife = usefulLifeYears - year + 1;
    const yearlyDepreciation = (remainingLife / sumOfYears) * depreciableBase;
    accumulatedDepreciation += yearlyDepreciation;
  }
  
  // Add partial year if applicable
  const partialYear = yearsSincePurchase - Math.floor(yearsSincePurchase);
  if (partialYear > 0 && yearsSincePurchase < usefulLifeYears) {
    const currentYearNum = Math.floor(yearsSincePurchase) + 1;
    const remainingLife = usefulLifeYears - currentYearNum + 1;
    const yearlyDepreciation = (remainingLife / sumOfYears) * depreciableBase;
    accumulatedDepreciation += yearlyDepreciation * partialYear;
  }
  
  const currentValue = Math.max(purchasePrice - accumulatedDepreciation, salvageValue);
  const depreciationPercentage = (accumulatedDepreciation / purchasePrice) * 100;
  const remainingLifeYears = Math.max(usefulLifeYears - yearsSincePurchase, 0);
  
  return {
    originalValue: purchasePrice,
    currentValue: Math.round(currentValue * 100) / 100,
    accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    annualDepreciation: Math.round((accumulatedDepreciation / yearsSincePurchase) * 100) / 100,
    depreciationPercentage: Math.round(depreciationPercentage * 100) / 100,
    remainingLifeYears: Math.round(remainingLifeYears * 100) / 100,
    usefulLifeYears,
    salvageValue,
    isFullyDepreciated: currentValue <= salvageValue,
  };
}

/**
 * Main function to calculate asset depreciation
 * Automatically selects the appropriate method and useful life
 */
export function calculateAssetDepreciation(
  asset,
  method = DEPRECIATION_METHODS.STRAIGHT_LINE,
  customUsefulLife = null,
  customSalvageValue = null
) {
  if (!asset.purchasePrice || !asset.purchaseDate) {
    return null;
  }
  
  const purchasePrice = parseFloat(asset.purchasePrice);
  const assetCategory = asset.category?.toLowerCase() || 'default';
  const usefulLifeYears = customUsefulLife || DEPRECIATION_PERIODS[assetCategory] || DEPRECIATION_PERIODS.default;
  
  // Calculate salvage value (typically 10% of purchase price)
  const salvageValue = customSalvageValue !== null 
    ? customSalvageValue 
    : Math.round(purchasePrice * 0.10);
  
  let depreciationData;
  
  switch (method) {
    case DEPRECIATION_METHODS.DECLINING_BALANCE:
      depreciationData = calculateDecliningBalanceDepreciation(
        purchasePrice,
        salvageValue,
        asset.purchaseDate,
        usefulLifeYears
      );
      break;
      
    case DEPRECIATION_METHODS.SUM_OF_YEARS:
      depreciationData = calculateSumOfYearsDepreciation(
        purchasePrice,
        salvageValue,
        asset.purchaseDate,
        usefulLifeYears
      );
      break;
      
    case DEPRECIATION_METHODS.STRAIGHT_LINE:
    default:
      depreciationData = calculateStraightLineDepreciation(
        purchasePrice,
        salvageValue,
        asset.purchaseDate,
        usefulLifeYears
      );
  }
  
  return {
    ...depreciationData,
    method,
    assetId: asset._id,
    assetTag: asset.assetTag,
    category: asset.category,
    purchaseDate: asset.purchaseDate,
  };
}

/**
 * Calculate depreciation for multiple assets
 */
export function calculateBulkDepreciation(assets, method = DEPRECIATION_METHODS.STRAIGHT_LINE) {
  return assets
    .map(asset => calculateAssetDepreciation(asset, method))
    .filter(result => result !== null);
}

/**
 * Calculate total depreciation across all assets
 */
export function calculateTotalDepreciation(assets, method = DEPRECIATION_METHODS.STRAIGHT_LINE) {
  const depreciationResults = calculateBulkDepreciation(assets, method);
  
  const totals = depreciationResults.reduce(
    (acc, result) => ({
      originalValue: acc.originalValue + result.originalValue,
      currentValue: acc.currentValue + result.currentValue,
      accumulatedDepreciation: acc.accumulatedDepreciation + result.accumulatedDepreciation,
      annualDepreciation: acc.annualDepreciation + result.annualDepreciation,
    }),
    {
      originalValue: 0,
      currentValue: 0,
      accumulatedDepreciation: 0,
      annualDepreciation: 0,
    }
  );
  
  const averageDepreciationPercentage = depreciationResults.length > 0
    ? (totals.accumulatedDepreciation / totals.originalValue) * 100
    : 0;
  
  return {
    ...totals,
    averageDepreciationPercentage: Math.round(averageDepreciationPercentage * 100) / 100,
    assetCount: depreciationResults.length,
    fullyDepreciatedCount: depreciationResults.filter(r => r.isFullyDepreciated).length,
  };
}

/**
 * Get depreciation schedule for an asset (yearly breakdown)
 */
export function getDepreciationSchedule(
  asset,
  method = DEPRECIATION_METHODS.STRAIGHT_LINE
) {
  if (!asset.purchasePrice || !asset.purchaseDate) {
    return [];
  }
  
  const purchasePrice = parseFloat(asset.purchasePrice);
  const assetCategory = asset.category?.toLowerCase() || 'default';
  const usefulLifeYears = DEPRECIATION_PERIODS[assetCategory] || DEPRECIATION_PERIODS.default;
  const salvageValue = Math.round(purchasePrice * 0.10);
  const purchaseDateObj = new Date(asset.purchaseDate);
  
  const schedule = [];
  
  for (let year = 0; year <= usefulLifeYears; year++) {
    const scheduleDate = new Date(purchaseDateObj);
    scheduleDate.setFullYear(scheduleDate.getFullYear() + year);
    
    // Calculate depreciation at this point
    const tempAsset = {
      ...asset,
      purchaseDate: purchaseDateObj.toISOString(),
    };
    
    // Temporarily adjust the calculation to this specific year
    const futureDate = scheduleDate.toISOString();
    const yearsSince = year;
    
    let bookValue = purchasePrice;
    let accumulated = 0;
    
    if (method === DEPRECIATION_METHODS.STRAIGHT_LINE) {
      const annualDep = (purchasePrice - salvageValue) / usefulLifeYears;
      accumulated = Math.min(annualDep * yearsSince, purchasePrice - salvageValue);
      bookValue = Math.max(purchasePrice - accumulated, salvageValue);
    }
    
    schedule.push({
      year: year,
      date: scheduleDate,
      bookValue: Math.round(bookValue * 100) / 100,
      accumulatedDepreciation: Math.round(accumulated * 100) / 100,
      yearlyDepreciation: year > 0 
        ? Math.round(((accumulated - (schedule[year - 1]?.accumulatedDepreciation || 0))) * 100) / 100
        : 0,
    });
  }
  
  return schedule;
}

export default {
  calculateAssetDepreciation,
  calculateBulkDepreciation,
  calculateTotalDepreciation,
  getDepreciationSchedule,
  DEPRECIATION_METHODS,
  DEPRECIATION_PERIODS,
};

