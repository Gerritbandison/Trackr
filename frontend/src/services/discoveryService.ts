/**
 * Discovery Service
 * 
 * Business logic for asset discovery, reconciliation, and conflict resolution.
 */

export interface DiscoverySource {
    id: string;
    name: string;
    type: 'mdm' | 'ad' | 'jamf' | 'intune' | 'manual' | 'csv';
    status: 'active' | 'inactive' | 'error';
    lastSync: Date;
    assetCount: number;
    config: Record<string, any>;
}

export interface DiscoveredAsset {
    sourceId: string;
    sourceName: string;
    externalId: string;
    name: string;
    serialNumber?: string;
    manufacturer?: string;
    model?: string;
    lastSeen: Date;
    metadata: Record<string, any>;
}

export interface ReconciliationMatch {
    confidence: number;
    existingAsset: any;
    discoveredAsset: DiscoveredAsset;
    matchType: 'exact' | 'high' | 'medium' | 'low';
    matchedFields: string[];
    conflicts: Array<{ field: string; existing: any; discovered: any }>;
}

export interface OrphanedAsset {
    asset: any;
    reason: 'not_in_discovery' | 'missing_serial' | 'duplicate_serial';
    lastSeenInDiscovery?: Date;
    daysSinceLastSeen?: number;
}

/**
 * Match discovered asset to existing assets
 */
export const matchDiscoveredAsset = (
    discovered: DiscoveredAsset,
    existingAssets: any[]
): ReconciliationMatch | null => {
    let bestMatch: ReconciliationMatch | null = null;
    let highestConfidence = 0;

    for (const existing of existingAssets) {
        const match = compareAssets(discovered, existing);

        if (match.confidence > highestConfidence && match.confidence >= 50) {
            highestConfidence = match.confidence;
            bestMatch = match;
        }
    }

    return bestMatch;
};

/**
 * Compare discovered asset with existing asset
 */
const compareAssets = (discovered: DiscoveredAsset, existing: any): ReconciliationMatch => {
    let confidence = 0;
    const matchedFields: string[] = [];
    const conflicts: Array<{ field: string; existing: any; discovered: any }> = [];

    // Serial number match (highest weight)
    if (discovered.serialNumber && existing.serialNumber) {
        if (discovered.serialNumber.toLowerCase() === existing.serialNumber.toLowerCase()) {
            confidence += 60;
            matchedFields.push('serialNumber');
        }
    }

    // Name match
    if (discovered.name && existing.name) {
        const nameSimilarity = calculateStringSimilarity(
            discovered.name.toLowerCase(),
            existing.name.toLowerCase()
        );
        if (nameSimilarity > 0.8) {
            confidence += 20 * nameSimilarity;
            matchedFields.push('name');
        }
    }

    // Manufacturer match
    if (discovered.manufacturer && existing.manufacturer) {
        if (discovered.manufacturer.toLowerCase() === existing.manufacturer.toLowerCase()) {
            confidence += 10;
            matchedFields.push('manufacturer');
        } else {
            conflicts.push({
                field: 'manufacturer',
                existing: existing.manufacturer,
                discovered: discovered.manufacturer,
            });
        }
    }

    // Model match
    if (discovered.model && existing.model) {
        if (discovered.model.toLowerCase() === existing.model.toLowerCase()) {
            confidence += 10;
            matchedFields.push('model');
        } else {
            conflicts.push({
                field: 'model',
                existing: existing.model,
                discovered: discovered.model,
            });
        }
    }

    let matchType: 'exact' | 'high' | 'medium' | 'low';
    if (confidence >= 90) matchType = 'exact';
    else if (confidence >= 70) matchType = 'high';
    else if (confidence >= 50) matchType = 'medium';
    else matchType = 'low';

    return {
        confidence: Math.min(100, confidence),
        existingAsset: existing,
        discoveredAsset: discovered,
        matchType,
        matchedFields,
        conflicts,
    };
};

/**
 * Calculate string similarity (Levenshtein distance based)
 */
const calculateStringSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
};

/**
 * Levenshtein distance algorithm
 */
const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i]![j] = matrix[i - 1]![j - 1]!;
            } else {
                matrix[i]![j] = Math.min(
                    matrix[i - 1]![j - 1]! + 1,
                    matrix[i]![j - 1]! + 1,
                    matrix[i - 1]![j]! + 1
                );
            }
        }
    }

    return matrix[str2.length]![str1.length]!;
};

/**
 * Find orphaned assets (in database but not in discovery)
 */
export const findOrphanedAssets = (
    existingAssets: any[],
    discoveredAssets: DiscoveredAsset[],
    daysThreshold: number = 30
): OrphanedAsset[] => {
    const orphaned: OrphanedAsset[] = [];
    const discoveredSerials = new Set(
        discoveredAssets.map(d => d.serialNumber?.toLowerCase()).filter(Boolean)
    );

    for (const asset of existingAssets) {
        // Skip assets without serial numbers
        if (!asset.serialNumber) {
            orphaned.push({
                asset,
                reason: 'missing_serial',
            });
            continue;
        }

        // Check if asset is in discovery
        if (!discoveredSerials.has(asset.serialNumber.toLowerCase())) {
            const daysSinceLastSeen = asset.lastSeenInDiscovery
                ? Math.floor((Date.now() - new Date(asset.lastSeenInDiscovery).getTime()) / (1000 * 60 * 60 * 24))
                : null;

            if (daysSinceLastSeen === null || daysSinceLastSeen >= daysThreshold) {
                orphaned.push({
                    asset,
                    reason: 'not_in_discovery',
                    lastSeenInDiscovery: asset.lastSeenInDiscovery,
                    daysSinceLastSeen: daysSinceLastSeen ?? undefined,
                });
            }
        }
    }

    return orphaned;
};

/**
 * Detect duplicate serial numbers
 */
export const findDuplicateSerials = (assets: any[]): Map<string, any[]> => {
    const serialMap = new Map<string, any[]>();

    for (const asset of assets) {
        if (!asset.serialNumber) continue;

        const serial = asset.serialNumber.toLowerCase();
        if (!serialMap.has(serial)) {
            serialMap.set(serial, []);
        }
        serialMap.get(serial)!.push(asset);
    }

    // Filter to only duplicates
    const duplicates = new Map<string, any[]>();
    for (const [serial, assetList] of serialMap.entries()) {
        if (assetList.length > 1) {
            duplicates.set(serial, assetList);
        }
    }

    return duplicates;
};

/**
 * Resolve conflict by choosing a value
 */
export const resolveConflict = (
    _field: string,
    existingValue: any,
    discoveredValue: any,
    strategy: 'keep_existing' | 'use_discovered' | 'manual'
): any => {
    if (strategy === 'keep_existing') return existingValue;
    if (strategy === 'use_discovered') return discoveredValue;
    return null; // Manual resolution required
};

/**
 * Get reconciliation statistics
 */
export const getReconciliationStats = (matches: ReconciliationMatch[]) => {
    return {
        total: matches.length,
        exact: matches.filter(m => m.matchType === 'exact').length,
        high: matches.filter(m => m.matchType === 'high').length,
        medium: matches.filter(m => m.matchType === 'medium').length,
        low: matches.filter(m => m.matchType === 'low').length,
        withConflicts: matches.filter(m => m.conflicts.length > 0).length,
        averageConfidence: matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length || 0,
    };
};

/**
 * Get match confidence color
 */
export const getMatchConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-blue-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
};

/**
 * Get match confidence badge
 */
export const getMatchConfidenceBadge = (confidence: number): string => {
    if (confidence >= 90) return 'bg-green-100 text-green-800';
    if (confidence >= 70) return 'bg-blue-100 text-blue-800';
    if (confidence >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
};
