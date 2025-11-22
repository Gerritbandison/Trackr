/**
 * Maintenance Schedule Utilities
 * Calculates maintenance schedules and tracks maintenance history
 */

/**
 * Get recommended maintenance interval based on asset type
 * @param {string} category - Asset category
 * @param {string} manufacturer - Asset manufacturer
 * @returns {number} - Days between maintenance
 */
export const getMaintenanceInterval = (category, manufacturer) => {
  // Base intervals in days
  const baseIntervals = {
    laptop: 180, // 6 months
    desktop: 365, // 1 year
    monitor: 730, // 2 years
    phone: 365,
    tablet: 365,
    server: 90, // 3 months (critical infrastructure)
    printer: 180,
    network: 365,
    other: 365,
  };

  // Manufacturer-specific adjustments
  const manufacturerAdjustments = {
    apple: 0.8, // Apple devices typically need less frequent maintenance
    dell: 1.0,
    hp: 1.0,
    lenovo: 1.0,
    microsoft: 1.0,
    samsung: 0.9,
  };

  const baseInterval = baseIntervals[category] || 365;
  const adjustment = manufacturerAdjustments[manufacturer?.toLowerCase()] || 1.0;
  
  return Math.round(baseInterval * adjustment);
};

/**
 * Get next maintenance date
 * @param {Date} lastMaintenanceDate - Last maintenance date
 * @param {number} intervalDays - Days between maintenance
 * @returns {Date} - Next maintenance date
 */
export const getNextMaintenanceDate = (lastMaintenanceDate, intervalDays) => {
  if (!lastMaintenanceDate) {
    // If no last maintenance, schedule for 90 days from now
    return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }
  
  const lastDate = new Date(lastMaintenanceDate);
  return new Date(lastDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
};

/**
 * Get maintenance status
 * @param {Date} nextMaintenanceDate - Next scheduled maintenance date
 * @param {Date} currentDate - Current date
 * @returns {object} - Status information
 */
export const getMaintenanceStatus = (nextMaintenanceDate, currentDate = new Date()) => {
  if (!nextMaintenanceDate) {
    return {
      status: 'unknown',
      severity: 'info',
      daysUntil: null,
      label: 'Not Scheduled',
      color: 'slate',
    };
  }

  const nextDate = new Date(nextMaintenanceDate);
  const today = new Date(currentDate);
  const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return {
      status: 'overdue',
      severity: 'critical',
      daysUntil: Math.abs(daysUntil),
      label: `Overdue by ${Math.abs(daysUntil)} days`,
      color: 'red',
    };
  } else if (daysUntil <= 7) {
    return {
      status: 'due',
      severity: 'high',
      daysUntil,
      label: `Due in ${daysUntil} days`,
      color: 'red',
    };
  } else if (daysUntil <= 30) {
    return {
      status: 'upcoming',
      severity: 'medium',
      daysUntil,
      label: `Due in ${daysUntil} days`,
      color: 'amber',
    };
  } else {
    return {
      status: 'scheduled',
      severity: 'low',
      daysUntil,
      label: `Due in ${daysUntil} days`,
      color: 'green',
    };
  }
};

/**
 * Calculate maintenance cost estimate
 * @param {string} category - Asset category
 * @param {number} assetValue - Original asset value
 * @returns {number} - Estimated maintenance cost
 */
export const estimateMaintenanceCost = (category, assetValue) => {
  // Percentage of asset value for maintenance
  const costPercentages = {
    laptop: 0.05, // 5% of value
    desktop: 0.03,
    monitor: 0.02,
    phone: 0.08,
    tablet: 0.05,
    server: 0.10,
    printer: 0.08,
    network: 0.06,
    other: 0.04,
  };

  const percentage = costPercentages[category] || 0.04;
  return Math.round(assetValue * percentage);
};

/**
 * Get maintenance type recommendations
 * @param {string} category - Asset category
 * @returns {Array} - Array of maintenance tasks
 */
export const getMaintenanceTasks = (category) => {
  const taskTemplates = {
    laptop: [
      { task: 'Clean keyboard and screen', frequency: 'Monthly', priority: 'low' },
      { task: 'Update BIOS and drivers', frequency: 'Quarterly', priority: 'medium' },
      { task: 'Battery health check', frequency: 'Quarterly', priority: 'high' },
      { task: 'Full system cleaning', frequency: 'Semi-annually', priority: 'medium' },
      { task: 'OS and security updates', frequency: 'Monthly', priority: 'high' },
    ],
    desktop: [
      { task: 'Clean internal components', frequency: 'Semi-annually', priority: 'medium' },
      { task: 'Update drivers and firmware', frequency: 'Quarterly', priority: 'medium' },
      { task: 'Check cooling fans', frequency: 'Quarterly', priority: 'high' },
      { task: 'Full system cleaning', frequency: 'Annually', priority: 'low' },
      { task: 'OS updates', frequency: 'Monthly', priority: 'high' },
    ],
    monitor: [
      { task: 'Clean screen surface', frequency: 'Monthly', priority: 'low' },
      { task: 'Calibrate display', frequency: 'Quarterly', priority: 'low' },
      { task: 'Check power consumption', frequency: 'Semi-annually', priority: 'medium' },
      { task: 'Firmware update', frequency: 'Annually', priority: 'low' },
    ],
    server: [
      { task: 'Clean server room filters', frequency: 'Monthly', priority: 'high' },
      { task: 'Check RAID status', frequency: 'Weekly', priority: 'critical' },
      { task: 'Update firmware', frequency: 'Quarterly', priority: 'high' },
      { task: 'Performance monitoring', frequency: 'Monthly', priority: 'high' },
      { task: 'Backup verification', frequency: 'Weekly', priority: 'critical' },
      { task: 'Physical inspection', frequency: 'Monthly', priority: 'medium' },
    ],
  };

  return taskTemplates[category] || [
    { task: 'General maintenance', frequency: 'Quarterly', priority: 'medium' },
    { task: 'System updates', frequency: 'Monthly', priority: 'high' },
  ];
};

