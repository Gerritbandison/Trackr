/**
 * License Service
 * 
 * Centralized service for Microsoft license management, calculations, and optimization.
 * Migrated from data/mockMicrosoftLicenses.js for better architecture.
 */

export interface ServicePlan {
    servicePlanId: string;
    servicePlanName: string;
    provisioningStatus: string;
}

export interface License {
    skuId: string;
    skuPartNumber: string;
    name: string;
    consumedUnits: number;
    prepaidUnits: number;
    enabled: number;
    available: number;
    status: 'active' | 'exhausted' | 'suspended';
    category: 'office365' | 'powerplatform' | 'teams' | 'security' | 'dynamics' | 'visio' | 'project' | 'sharepoint' | 'exchange' | 'windows';
    unitPrice: number;
    totalCost: number;
    billingCycle: 'monthly' | 'annual';
    servicePlans: ServicePlan[];
    lastSynced: Date;
}

export interface LicenseStats {
    totalLicenses: number;
    totalSeats: number;
    assignedSeats: number;
    availableSeats: number;
    byCategory: Record<string, { count: number; totalSeats: number; assignedSeats: number }>;
    lowStock: Array<{ skuId: string; skuPartNumber: string; name: string; available: number }>;
}

export interface UserLicense {
    userId: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
    licenses: Array<{ skuId: string; skuPartNumber: string; name: string }>;
}

/**
 * Calculate license utilization percentage
 */
export const calculateUtilization = (license: License): number => {
    if (license.prepaidUnits === 0) return 0;
    return Math.round((license.consumedUnits / license.prepaidUnits) * 100);
};

/**
 * Calculate total monthly cost across all licenses
 */
export const calculateTotalMonthlyCost = (licenses: License[]): number => {
    return licenses.reduce((total, license) => total + license.totalCost, 0);
};

/**
 * Calculate annual cost projection
 */
export const calculateAnnualCost = (licenses: License[]): number => {
    return licenses.reduce((total, license) => {
        const monthlyCost = license.billingCycle === 'monthly' ? license.totalCost : license.totalCost / 12;
        return total + (monthlyCost * 12);
    }, 0);
};

/**
 * Identify underutilized licenses (< 70% usage)
 */
export const findUnderutilizedLicenses = (licenses: License[]): License[] => {
    return licenses.filter(license => {
        const utilization = calculateUtilization(license);
        return utilization < 70 && license.status === 'active';
    });
};

/**
 * Identify overallocated licenses (> 95% usage)
 */
export const findOverallocatedLicenses = (licenses: License[]): License[] => {
    return licenses.filter(license => {
        const utilization = calculateUtilization(license);
        return utilization > 95 || license.status === 'exhausted';
    });
};

/**
 * Calculate potential cost savings from optimization
 */
export const calculateOptimizationSavings = (licenses: License[]): number => {
    const underutilized = findUnderutilizedLicenses(licenses);
    return underutilized.reduce((savings, license) => {
        const wastedSeats = license.prepaidUnits - license.consumedUnits;
        const costPerSeat = license.unitPrice;
        return savings + (wastedSeats * costPerSeat);
    }, 0);
};

/**
 * Get license recommendations
 */
export const getLicenseRecommendations = (licenses: License[]): string[] => {
    const recommendations: string[] = [];

    const underutilized = findUnderutilizedLicenses(licenses);
    const overallocated = findOverallocatedLicenses(licenses);

    if (underutilized.length > 0) {
        recommendations.push(`${underutilized.length} license(s) are underutilized. Consider reducing allocation.`);
    }

    if (overallocated.length > 0) {
        recommendations.push(`${overallocated.length} license(s) are near or at capacity. Consider purchasing more seats.`);
    }

    const potentialSavings = calculateOptimizationSavings(licenses);
    if (potentialSavings > 0) {
        recommendations.push(`Potential monthly savings: $${potentialSavings.toFixed(2)}`);
    }

    return recommendations;
};

/**
 * Group licenses by category
 */
export const groupLicensesByCategory = (licenses: License[]): Record<string, License[]> => {
    return licenses.reduce((groups, license) => {
        const category = license.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(license);
        return groups;
    }, {} as Record<string, License[]>);
};

/**
 * Calculate true-up requirements (licenses needed vs purchased)
 */
export const calculateTrueUp = (licenses: License[]): Array<{ license: License; shortfall: number; cost: number }> => {
    return licenses
        .filter(license => license.consumedUnits > license.prepaidUnits)
        .map(license => ({
            license,
            shortfall: license.consumedUnits - license.prepaidUnits,
            cost: (license.consumedUnits - license.prepaidUnits) * license.unitPrice,
        }));
};

/**
 * Get license status color for UI
 */
export const getLicenseStatusColor = (license: License): string => {
    const utilization = calculateUtilization(license);

    if (license.status === 'exhausted' || utilization >= 100) {
        return 'text-red-600';
    }
    if (utilization >= 90) {
        return 'text-orange-600';
    }
    if (utilization >= 70) {
        return 'text-yellow-600';
    }
    return 'text-green-600';
};

/**
 * Get license status badge class
 */
export const getLicenseStatusBadge = (license: License): string => {
    const utilization = calculateUtilization(license);

    if (license.status === 'exhausted' || utilization >= 100) {
        return 'bg-red-100 text-red-800';
    }
    if (utilization >= 90) {
        return 'bg-orange-100 text-orange-800';
    }
    if (utilization >= 70) {
        return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800';
};

/**
 * Search licenses by name or SKU
 */
export const searchLicenses = (licenses: License[], query: string): License[] => {
    const lowerQuery = query.toLowerCase();
    return licenses.filter(license =>
        license.name.toLowerCase().includes(lowerQuery) ||
        license.skuPartNumber.toLowerCase().includes(lowerQuery)
    );
};

/**
 * Sort licenses by various criteria
 */
export const sortLicenses = (
    licenses: License[],
    sortBy: 'name' | 'cost' | 'utilization' | 'available',
    direction: 'asc' | 'desc' = 'asc'
): License[] => {
    const sorted = [...licenses].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'cost':
                comparison = a.totalCost - b.totalCost;
                break;
            case 'utilization':
                comparison = calculateUtilization(a) - calculateUtilization(b);
                break;
            case 'available':
                comparison = a.available - b.available;
                break;
        }

        return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
};
