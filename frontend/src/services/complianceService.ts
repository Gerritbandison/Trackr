/**
 * Compliance Calculation Service
 * 
 * Calculates compliance scores and provides recommendations for asset data quality.
 */

import { AssetCategory } from './serialPatternService';

export type AssetStatus = 'available' | 'assigned' | 'repair' | 'retired' | 'lost' | 'disposed';

export interface CompliancePreview {
    score: number;
    issues: string[];
    warnings: string[];
    recommendations: string[];
}

export interface AssetFormData {
    name?: string;
    category?: AssetCategory;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    assetTag?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    warrantyExpiry?: string;
    warrantyProvider?: string;
    status?: AssetStatus;
    condition?: string;
    location?: string;
    vendor?: string;
    [key: string]: any;
}

/**
 * Calculates compliance score and provides feedback based on form data
 * 
 * @param formData - Asset form data
 * @returns Compliance preview with score, issues, warnings, and recommendations
 */
export const calculateCompliance = (formData: AssetFormData): CompliancePreview => {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    let score = 100;

    // Check required fields
    if (!formData.name) {
        issues.push('Asset name is required');
        score -= 10;
    }

    if (!formData.manufacturer || !formData.model) {
        issues.push('Manufacturer and model are required');
        score -= 15;
    }

    if (!formData.serialNumber) {
        warnings.push('Serial number missing - may impact warranty tracking');
        score -= 5;
    }

    if (!formData.purchaseDate) {
        warnings.push('Purchase date missing - depreciation cannot be calculated');
        score -= 5;
    }

    if (!formData.purchasePrice) {
        warnings.push('Purchase price missing - TCO calculations unavailable');
        score -= 5;
    }

    if (!formData.warrantyExpiry) {
        warnings.push('Warranty expiry date missing - compliance tracking incomplete');
        score -= 10;
    } else {
        const expiryDate = new Date(formData.warrantyExpiry);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            issues.push('Warranty has expired');
            score -= 20;
        } else if (daysUntilExpiry < 30) {
            warnings.push('Warranty expiring soon');
            score -= 10;
        }
    }

    if (!formData.assetTag) {
        recommendations.push('Asset tag recommended for inventory tracking');
    }

    if (!formData.location) {
        recommendations.push('Location information helps with asset tracking');
    }

    if (formData.status === 'lost' || formData.status === 'retired') {
        warnings.push('Asset status indicates end of lifecycle');
    }

    // Recommendations for better compliance
    if (formData.category === 'laptop' && !formData.vendor) {
        recommendations.push('Vendor information helps track procurement');
    }

    return {
        score: Math.max(0, score),
        issues,
        warnings,
        recommendations,
    };
};

/**
 * Gets compliance score color class
 * 
 * @param score - Compliance score (0-100)
 * @returns Tailwind color class
 */
export const getComplianceScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
};

/**
 * Gets compliance score background class
 * 
 * @param score - Compliance score (0-100)
 * @returns Tailwind background class
 */
export const getComplianceScoreBg = (score: number): string => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
};
