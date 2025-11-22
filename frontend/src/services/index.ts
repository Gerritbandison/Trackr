/**
 * Services Index
 * 
 * Central export point for all service modules.
 */

export * from './warrantyService';
export * from './serialPatternService';
export * from './licenseService';
export * from './discoveryService';
export * from './receivingService';

// Re-export compliance services with explicit names to avoid conflicts
export {
    calculateCompliance,
    getComplianceScoreColor as getAssetComplianceScoreColor,
    getComplianceScoreBg as getAssetComplianceScoreBg,
} from './complianceService';

export {
    calculateAssetComplianceScore,
    validateAttestation,
    requiresWipeCertificate,
    generateAuditPack,
    getComplianceScoreColor as getComplianceAuditScoreColor,
    getComplianceScoreBadge as getComplianceAuditScoreBadge,
    getOverdueAttestations,
    getCurrentQuarter,
} from './complianceCalculationService';


