/**
 * Asset Validation Utilities
 * 
 * Validates asset data according to ITAM platform requirements
 */

import { ITAMAsset, VALIDATION_RULES, AssetClass, REQUIRED_FIELDS_BY_CLASS } from '../types/itam';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Validate serial number format
 */
export function validateSerialNumber(serialNumber: string): boolean {
  if (!serialNumber) return true; // Optional field
  return VALIDATION_RULES.serialNumber.test(serialNumber);
}

/**
 * Validate asset tag format
 */
export function validateAssetTag(assetTag: string): boolean {
  if (!assetTag) return true; // Optional field
  return VALIDATION_RULES.assetTag.test(assetTag);
}

/**
 * Validate Global Asset ID format
 */
export function validateGlobalAssetId(globalAssetId: string): boolean {
  return VALIDATION_RULES.globalAssetId.test(globalAssetId);
}

/**
 * Validate UPN (User Principal Name) format
 */
export function validateUPN(upn: string): boolean {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(upn);
}

/**
 * Get asset class category for validation
 */
function getAssetClassCategory(assetClass: AssetClass): string {
  // Map asset classes to validation categories
  const endUserDevices: AssetClass[] = ['Laptop', 'Desktop', 'Phone', 'Tablet'];
  const peripherals: AssetClass[] = ['Monitor', 'Dock', 'Keyboard', 'Mouse', 'Headset', 'Webcam', 'Accessory'];
  
  if (endUserDevices.includes(assetClass)) {
    return 'End-user device';
  }
  if (peripherals.includes(assetClass)) {
    return 'Peripherals/consumables';
  }
  // SaaS licenses are handled separately
  return 'Other';
}

/**
 * Validate required fields for asset class
 */
function validateRequiredFields(asset: ITAMAsset): ValidationError[] {
  const errors: ValidationError[] = [];
  const category = getAssetClassCategory(asset.class);
  const requiredFields = REQUIRED_FIELDS_BY_CLASS[category] || [];

  for (const fieldPath of requiredFields) {
    const value = getNestedValue(asset, fieldPath);
    if (value === undefined || value === null || value === '') {
      errors.push({
        field: fieldPath,
        message: `Required field ${fieldPath} is missing`,
      });
    }
  }

  return errors;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Validate asset data
 */
export function validateAsset(asset: Partial<ITAMAsset>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Required top-level fields
  if (!asset.globalAssetId) {
    errors.push({
      field: 'globalAssetId',
      message: 'Global Asset ID is required',
    });
  } else if (!validateGlobalAssetId(asset.globalAssetId)) {
    errors.push({
      field: 'globalAssetId',
      message: 'Global Asset ID format is invalid (expected: AS-YYYY-NNNNNN)',
    });
  }

  if (!asset.class) {
    errors.push({
      field: 'class',
      message: 'Asset class is required',
    });
  }

  if (!asset.model) {
    errors.push({
      field: 'model',
      message: 'Model is required',
    });
  }

  if (!asset.state) {
    errors.push({
      field: 'state',
      message: 'Asset state is required',
    });
  }

  // Validate serial number format
  if (asset.serialNumber && !validateSerialNumber(asset.serialNumber)) {
    errors.push({
      field: 'serialNumber',
      message: 'Serial number format is invalid (expected: 6-20 alphanumeric characters and hyphens)',
    });
  }

  // Validate asset tag format
  if (asset.assetTag && !validateAssetTag(asset.assetTag)) {
    errors.push({
      field: 'assetTag',
      message: 'Asset tag format is invalid (expected: XX-XXXXX-NNNNN)',
    });
  }

  // Validate owner UPN if provided
  if (asset.owner?.upn && !validateUPN(asset.owner.upn)) {
    errors.push({
      field: 'owner.upn',
      message: 'Owner UPN format is invalid (expected: email address)',
    });
  }

  // Validate required fields by class
  if (asset.class) {
    const requiredFieldErrors = validateRequiredFields(asset as ITAMAsset);
    errors.push(...requiredFieldErrors);
  }

  // Warnings (non-blocking)
  if (!asset.serialNumber) {
    warnings.push('Serial number is missing - may impact warranty tracking');
  }

  if (!asset.purchase?.unitCost) {
    warnings.push('Purchase price is missing - depreciation cannot be calculated');
  }

  if (!asset.warranty?.end) {
    warnings.push('Warranty end date is missing - compliance tracking incomplete');
  }

  if (asset.state === 'In Service' && !asset.owner) {
    warnings.push('Asset is in service but has no owner assigned');
  }

  if (asset.state === 'In Service' && !asset.security?.edr) {
    warnings.push('Asset is in service but has no EDR status');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate Global Asset ID
 * Format: AS-YYYY-NNNNNN
 */
export function generateGlobalAssetId(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = String(sequence).padStart(6, '0');
  return `AS-${year}-${paddedSequence}`;
}

/**
 * Generate Asset Tag
 * Format: SITE-CATEGORY-NNNNN
 * Example: PHL-E14-0123
 */
export function generateAssetTag(
  site: string,
  category: string,
  sequence: number
): string {
  const siteCode = site.substring(0, 5).toUpperCase().replace(/\s+/g, '');
  const categoryCode = category.substring(0, 5).toUpperCase().replace(/\s+/g, '');
  const paddedSequence = String(sequence).padStart(5, '0');
  return `${siteCode}-${categoryCode}-${paddedSequence}`;
}

