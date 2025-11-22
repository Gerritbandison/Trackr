/**
 * Compliance Calculation Service
 * 
 * Business logic for compliance scoring, attestation validation, and audit controls.
 */

export interface ComplianceScore {
    overall: number;
    categories: {
        assetTracking: number;
        warrantyCompliance: number;
        disposalControls: number;
        attestationStatus: number;
    };
    issues: string[];
    warnings: string[];
    recommendations: string[];
}

export interface AttestationRecord {
    id: string;
    assetId: string;
    userId: string;
    quarter: string;
    year: number;
    status: 'pending' | 'confirmed' | 'disputed' | 'overdue';
    confirmedAt?: Date;
    notes?: string;
}

export interface AuditControl {
    id: string;
    name: string;
    description: string;
    type: 'disposal' | 'transfer' | 'maintenance' | 'procurement';
    required: boolean;
    requiresCertificate: boolean;
}

export interface WipeCertificate {
    assetId: string;
    method: 'DoD 5220.22-M' | 'NIST 800-88' | 'Gutmann' | 'Physical Destruction';
    certifiedBy: string;
    certifiedAt: Date;
    certificateUrl?: string;
}

/**
 * Calculate overall compliance score for an asset
 */
export const calculateAssetComplianceScore = (asset: any): ComplianceScore => {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    let assetTracking = 100;
    let warrantyCompliance = 100;
    let disposalControls = 100;
    let attestationStatus = 100;

    // Asset Tracking Score
    if (!asset.serialNumber) {
        warnings.push('Missing serial number');
        assetTracking -= 20;
    }
    if (!asset.assetTag) {
        warnings.push('Missing asset tag');
        assetTracking -= 15;
    }
    if (!asset.location) {
        recommendations.push('Add location for better tracking');
        assetTracking -= 10;
    }

    // Warranty Compliance Score
    if (!asset.warrantyExpiry) {
        warnings.push('Warranty expiry date not set');
        warrantyCompliance -= 30;
    } else {
        const expiryDate = new Date(asset.warrantyExpiry);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            issues.push('Warranty has expired');
            warrantyCompliance -= 40;
        } else if (daysUntilExpiry < 30) {
            warnings.push('Warranty expiring soon');
            warrantyCompliance -= 20;
        }
    }

    // Disposal Controls Score
    if (asset.status === 'disposed' && !asset.wipeCertificate) {
        issues.push('Disposed asset missing wipe certificate');
        disposalControls = 0;
    }

    if (asset.status === 'retired' && !asset.retirementDate) {
        warnings.push('Retired asset missing retirement date');
        disposalControls -= 25;
    }

    // Attestation Status Score
    const lastAttestation = asset.lastAttestation;
    if (!lastAttestation) {
        warnings.push('No attestation record found');
        attestationStatus -= 50;
    } else {
        const attestationDate = new Date(lastAttestation);
        const monthsSinceAttestation = Math.floor((Date.now() - attestationDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

        if (monthsSinceAttestation > 3) {
            warnings.push('Attestation overdue (quarterly required)');
            attestationStatus -= 40;
        }
    }

    const overall = Math.round(
        (assetTracking + warrantyCompliance + disposalControls + attestationStatus) / 4
    );

    return {
        overall: Math.max(0, overall),
        categories: {
            assetTracking: Math.max(0, assetTracking),
            warrantyCompliance: Math.max(0, warrantyCompliance),
            disposalControls: Math.max(0, disposalControls),
            attestationStatus: Math.max(0, attestationStatus),
        },
        issues,
        warnings,
        recommendations,
    };
};

/**
 * Validate attestation record
 */
export const validateAttestation = (attestation: AttestationRecord): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!attestation.assetId) {
        errors.push('Asset ID is required');
    }

    if (!attestation.userId) {
        errors.push('User ID is required');
    }

    if (!attestation.quarter || !['Q1', 'Q2', 'Q3', 'Q4'].includes(attestation.quarter)) {
        errors.push('Valid quarter (Q1-Q4) is required');
    }

    if (!attestation.year || attestation.year < 2020 || attestation.year > new Date().getFullYear() + 1) {
        errors.push('Valid year is required');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Check if disposal requires wipe certificate
 */
export const requiresWipeCertificate = (asset: any): boolean => {
    const sensitiveCategories = ['laptop', 'desktop', 'phone', 'tablet', 'server'];
    return sensitiveCategories.includes(asset.category) &&
        (asset.status === 'disposed' || asset.status === 'retired');
};

/**
 * Generate audit pack data
 */
export const generateAuditPack = (assets: any[], startDate: Date, endDate: Date) => {
    const assetsInPeriod = assets.filter(asset => {
        const createdAt = new Date(asset.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
    });

    const disposedAssets = assetsInPeriod.filter(a => a.status === 'disposed');
    const missingWipeCerts = disposedAssets.filter(a => requiresWipeCertificate(a) && !a.wipeCertificate);

    const complianceScores = assetsInPeriod.map(asset => calculateAssetComplianceScore(asset));
    const averageScore = complianceScores.reduce((sum, score) => sum + score.overall, 0) / complianceScores.length || 0;

    return {
        period: { startDate, endDate },
        totalAssets: assetsInPeriod.length,
        disposedAssets: disposedAssets.length,
        missingWipeCertificates: missingWipeCerts.length,
        averageComplianceScore: Math.round(averageScore),
        complianceBreakdown: {
            excellent: complianceScores.filter(s => s.overall >= 90).length,
            good: complianceScores.filter(s => s.overall >= 70 && s.overall < 90).length,
            fair: complianceScores.filter(s => s.overall >= 50 && s.overall < 70).length,
            poor: complianceScores.filter(s => s.overall < 50).length,
        },
        criticalIssues: complianceScores.flatMap(s => s.issues),
        warnings: complianceScores.flatMap(s => s.warnings),
    };
};

/**
 * Get compliance score color
 */
export const getComplianceScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
};

/**
 * Get compliance score badge
 */
export const getComplianceScoreBadge = (score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
};

/**
 * Get overdue attestations
 */
export const getOverdueAttestations = (assets: any[]): any[] => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return assets.filter(asset => {
        if (!asset.lastAttestation) return true;
        return new Date(asset.lastAttestation) < threeMonthsAgo;
    });
};

/**
 * Calculate current quarter
 */
export const getCurrentQuarter = (): { quarter: string; year: number } => {
    const now = new Date();
    const month = now.getMonth();
    const quarter = `Q${Math.floor(month / 3) + 1}`;
    return { quarter, year: now.getFullYear() };
};
