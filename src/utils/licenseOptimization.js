/**
 * Software License Optimization Engine
 * Identifies cost-saving opportunities and compliance issues
 */

/**
 * Calculate license utilization rate
 */
export function calculateLicenseUtilization(license) {
  if (!license.totalSeats || license.totalSeats === 0) {
    return {
      utilization: 0,
      usedSeats: license.usedSeats || 0,
      totalSeats: 0,
      availableSeats: 0,
      status: 'unknown',
    };
  }

  const usedSeats = license.usedSeats || 0;
  const totalSeats = license.totalSeats;
  const availableSeats = totalSeats - usedSeats;
  const utilizationPercent = (usedSeats / totalSeats) * 100;

  let status;
  if (utilizationPercent >= 95) {
    status = 'overutilized';
  } else if (utilizationPercent >= 80) {
    status = 'optimal';
  } else if (utilizationPercent >= 50) {
    status = 'underutilized';
  } else {
    status = 'poor';
  }

  return {
    utilization: Math.round(utilizationPercent * 10) / 10,
    usedSeats,
    totalSeats,
    availableSeats,
    status,
    wastedSeats: status === 'poor' || status === 'underutilized' ? availableSeats : 0,
  };
}

/**
 * Identify inactive users (potential license reclaim candidates)
 */
export function identifyInactiveUsers(license, inactivityThreshold = 60) {
  // This would integrate with actual user activity data
  // For now, we'll simulate based on license metadata
  
  const assignments = license.assignments || [];
  const now = new Date();
  
  const inactiveUsers = assignments.filter(assignment => {
    if (!assignment.lastActivity) return true; // No activity = inactive
    
    const lastActivity = new Date(assignment.lastActivity);
    const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
    
    return daysSinceActivity > inactivityThreshold;
  });

  return {
    totalAssignments: assignments.length,
    inactiveCount: inactiveUsers.length,
    inactiveUsers,
    reclaimableLicenses: inactiveUsers.length,
    estimatedSavings: inactiveUsers.length * (license.costPerSeat || 0),
  };
}

/**
 * Calculate potential cost savings from optimization
 */
export function calculateSavings(licenses) {
  let totalPotentialSavings = 0;
  let reclaimableSeats = 0;
  let downgradeCandidates = [];
  let consolidationOpportunities = [];

  licenses.forEach(license => {
    const utilization = calculateLicenseUtilization(license);
    const costPerSeat = license.costPerSeat || (license.annualCost / license.totalSeats) || 0;

    // Savings from unused seats
    if (utilization.status === 'poor' || utilization.status === 'underutilized') {
      const wastedCost = utilization.wastedSeats * costPerSeat;
      totalPotentialSavings += wastedCost;
      reclaimableSeats += utilization.wastedSeats;

      if (utilization.utilization < 50) {
        downgradeCandidates.push({
          licenseId: license._id,
          name: license.name,
          currentSeats: license.totalSeats,
          usedSeats: utilization.usedSeats,
          recommendedSeats: Math.ceil(utilization.usedSeats * 1.2), // 20% buffer
          potentialSavings: wastedCost,
        });
      }
    }
  });

  // Identify consolidation opportunities (similar software)
  const softwareByCategory = {};
  licenses.forEach(license => {
    const category = license.category || 'Other';
    if (!softwareByCategory[category]) {
      softwareByCategory[category] = [];
    }
    softwareByCategory[category].push(license);
  });

  Object.entries(softwareByCategory).forEach(([category, categoryLicenses]) => {
    if (categoryLicenses.length > 1) {
      const totalCost = categoryLicenses.reduce((sum, l) => sum + (l.annualCost || 0), 0);
      consolidationOpportunities.push({
        category,
        licenseCount: categoryLicenses.length,
        licenses: categoryLicenses.map(l => l.name),
        totalCost,
        potentialSavings: totalCost * 0.15, // Estimate 15% savings from consolidation
      });
    }
  });

  return {
    totalPotentialSavings: Math.round(totalPotentialSavings),
    reclaimableSeats,
    downgradeCandidates,
    consolidationOpportunities,
    savingsBreakdown: {
      unusedSeats: totalPotentialSavings,
      consolidation: consolidationOpportunities.reduce((sum, o) => sum + o.potentialSavings, 0),
    },
  };
}

/**
 * Analyze license compliance status
 */
export function analyzeLicenseCompliance(licenses) {
  const complianceIssues = [];
  let overLicensed = [];
  let underLicensed = [];
  let expiringLicenses = [];
  let compliant = [];

  const now = new Date();
  const warningThreshold = 90; // days

  licenses.forEach(license => {
    const utilization = calculateLicenseUtilization(license);
    
    // Check over-licensing
    if (utilization.status === 'overutilized') {
      underLicensed.push({
        licenseId: license._id,
        name: license.name,
        usedSeats: utilization.usedSeats,
        totalSeats: utilization.totalSeats,
        shortfall: utilization.usedSeats - utilization.totalSeats,
        severity: 'high',
        message: 'More seats in use than purchased - compliance risk!',
      });
    }

    // Check under-licensing (waste)
    if (utilization.status === 'poor') {
      overLicensed.push({
        licenseId: license._id,
        name: license.name,
        usedSeats: utilization.usedSeats,
        totalSeats: utilization.totalSeats,
        waste: utilization.availableSeats,
        severity: 'medium',
        message: `${utilization.utilization.toFixed(0)}% utilization - consider downsizing`,
      });
    }

    // Check expiration
    if (license.expirationDate) {
      const expiryDate = new Date(license.expirationDate);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= warningThreshold && daysUntilExpiry > 0) {
        expiringLicenses.push({
          licenseId: license._id,
          name: license.name,
          expirationDate: license.expirationDate,
          daysUntilExpiry,
          annualCost: license.annualCost || 0,
          severity: daysUntilExpiry <= 30 ? 'high' : 'medium',
        });
      } else if (daysUntilExpiry <= 0) {
        complianceIssues.push({
          licenseId: license._id,
          name: license.name,
          issue: 'Expired License',
          severity: 'critical',
          message: `License expired ${Math.abs(daysUntilExpiry)} days ago`,
        });
      }
    }

    // Compliant licenses
    if (
      utilization.status === 'optimal' &&
      (!license.expirationDate || 
       (new Date(license.expirationDate) - now) / (1000 * 60 * 60 * 24) > warningThreshold)
    ) {
      compliant.push(license);
    }
  });

  const complianceScore = licenses.length > 0
    ? Math.round((compliant.length / licenses.length) * 100)
    : 100;

  return {
    complianceScore,
    totalLicenses: licenses.length,
    compliant: compliant.length,
    issues: {
      critical: complianceIssues.length,
      underLicensed: underLicensed.length,
      overLicensed: overLicensed.length,
      expiring: expiringLicenses.length,
    },
    details: {
      complianceIssues,
      underLicensed,
      overLicensed,
      expiringLicenses,
      compliant,
    },
  };
}

/**
 * Generate optimization recommendations
 */
export function generateOptimizationRecommendations(licenses) {
  const recommendations = [];
  const utilization = calculateLicenseUtilization(licenses[0]); // Example - would iterate

  licenses.forEach(license => {
    const util = calculateLicenseUtilization(license);
    const costPerSeat = license.costPerSeat || (license.annualCost / license.totalSeats) || 0;

    // Recommendation: Downgrade
    if (util.status === 'poor') {
      recommendations.push({
        licenseId: license._id,
        licenseName: license.name,
        type: 'downgrade',
        priority: 'high',
        title: `Downgrade ${license.name}`,
        description: `Only using ${util.utilization.toFixed(0)}% of licenses. Reduce from ${util.totalSeats} to ${Math.ceil(util.usedSeats * 1.2)} seats.`,
        estimatedSavings: (util.availableSeats * costPerSeat * 0.8), // 80% of excess
        effort: 'medium',
        impact: 'high',
      });
    }

    // Recommendation: Reclaim unused
    if (util.availableSeats > 5) {
      recommendations.push({
        licenseId: license._id,
        licenseName: license.name,
        type: 'reclaim',
        priority: 'medium',
        title: `Reclaim unused ${license.name} licenses`,
        description: `${util.availableSeats} unused seats available for reassignment.`,
        estimatedSavings: 0, // No direct savings, but enables avoiding new purchases
        effort: 'low',
        impact: 'medium',
      });
    }

    // Recommendation: Increase (if over-utilized)
    if (util.status === 'overutilized') {
      recommendations.push({
        licenseId: license._id,
        licenseName: license.name,
        type: 'upgrade',
        priority: 'critical',
        title: `Increase ${license.name} licenses`,
        description: `Currently ${util.usedSeats} seats used but only ${util.totalSeats} purchased. Compliance risk!`,
        estimatedSavings: 0, // This costs money but avoids penalties
        effort: 'low',
        impact: 'critical',
      });
    }

    // Recommendation: Review inactive users
    const inactive = identifyInactiveUsers(license);
    if (inactive.reclaimableLicenses >= 3) {
      recommendations.push({
        licenseId: license._id,
        licenseName: license.name,
        type: 'harvest',
        priority: 'medium',
        title: `Harvest inactive ${license.name} licenses`,
        description: `${inactive.reclaimableLicenses} users inactive for 60+ days.`,
        estimatedSavings: inactive.estimatedSavings,
        effort: 'medium',
        impact: 'medium',
      });
    }
  });

  // Sort by priority and savings
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => {
    if (a.priority !== b.priority) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return (b.estimatedSavings || 0) - (a.estimatedSavings || 0);
  });

  return recommendations;
}

/**
 * Calculate true-up costs for audit preparation
 */
export function calculateTrueUpCosts(licenses) {
  let totalTrueUpCost = 0;
  const trueUpNeeded = [];

  licenses.forEach(license => {
    const util = calculateLicenseUtilization(license);
    
    if (util.usedSeats > util.totalSeats) {
      const shortfall = util.usedSeats - util.totalSeats;
      const costPerSeat = license.costPerSeat || (license.annualCost / license.totalSeats) || 0;
      const trueUpCost = shortfall * costPerSeat;

      totalTrueUpCost += trueUpCost;
      trueUpNeeded.push({
        licenseId: license._id,
        name: license.name,
        purchased: util.totalSeats,
        inUse: util.usedSeats,
        shortfall,
        costPerSeat,
        trueUpCost,
      });
    }
  });

  return {
    totalTrueUpCost: Math.round(totalTrueUpCost),
    licensesNeedingTrueUp: trueUpNeeded.length,
    details: trueUpNeeded,
    auditReady: trueUpNeeded.length === 0,
  };
}

/**
 * Generate comprehensive optimization report
 */
export function generateOptimizationReport(licenses) {
  const savings = calculateSavings(licenses);
  const compliance = analyzeLicenseCompliance(licenses);
  const recommendations = generateOptimizationRecommendations(licenses);
  const trueUp = calculateTrueUpCosts(licenses);

  // Calculate utilization by license
  const utilizationData = licenses.map(license => ({
    licenseId: license._id,
    name: license.name,
    vendor: license.vendor,
    ...calculateLicenseUtilization(license),
    annualCost: license.annualCost || 0,
  }));

  // Overall statistics
  const totalAnnualCost = licenses.reduce((sum, l) => sum + (l.annualCost || 0), 0);
  const totalSeats = licenses.reduce((sum, l) => sum + (l.totalSeats || 0), 0);
  const totalUsedSeats = licenses.reduce((sum, l) => sum + (l.usedSeats || 0), 0);
  const overallUtilization = totalSeats > 0 ? (totalUsedSeats / totalSeats) * 100 : 0;

  return {
    summary: {
      totalLicenses: licenses.length,
      totalAnnualCost,
      totalSeats,
      totalUsedSeats,
      overallUtilization: Math.round(overallUtilization * 10) / 10,
      potentialSavings: savings.totalPotentialSavings + savings.savingsBreakdown.consolidation,
      savingsPercentage: totalAnnualCost > 0 
        ? Math.round(((savings.totalPotentialSavings + savings.savingsBreakdown.consolidation) / totalAnnualCost) * 100)
        : 0,
    },
    compliance,
    savings,
    recommendations,
    trueUp,
    utilizationData,
    generatedAt: new Date().toISOString(),
  };
}

export default {
  calculateLicenseUtilization,
  identifyInactiveUsers,
  calculateSavings,
  analyzeLicenseCompliance,
  generateOptimizationRecommendations,
  calculateTrueUpCosts,
  generateOptimizationReport,
};

