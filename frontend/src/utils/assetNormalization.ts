/**
 * Asset Data Normalization
 * 
 * Normalizes asset data to prevent duplicates and ensure consistency
 */

import { ITAMAsset, AssetClass } from '../types/itam';

/**
 * Model normalization catalog
 * Maps various model name variations to canonical names
 */
const MODEL_NORMALIZATION: Record<string, string> = {
  // Lenovo
  'ThinkPad E14 Gen 5': 'Lenovo ThinkPad E14 Gen 5',
  'ThinkPad E14 G5': 'Lenovo ThinkPad E14 Gen 5',
  'E14 Gen 5': 'Lenovo ThinkPad E14 Gen 5',
  'E14 G5': 'Lenovo ThinkPad E14 Gen 5',
  
  // Dell
  'Latitude 7420': 'Dell Latitude 7420',
  'Latitude 7420': 'Dell Latitude 7420',
  'Latitude7420': 'Dell Latitude 7420',
  
  // HP
  'EliteBook 840 G8': 'HP EliteBook 840 G8',
  'EliteBook 840G8': 'HP EliteBook 840 G8',
  'EliteBook840G8': 'HP EliteBook 840 G8',
  
  // Add more normalization rules as needed
};

/**
 * Manufacturer normalization
 */
const MANUFACTURER_NORMALIZATION: Record<string, string> = {
  'Dell Inc.': 'Dell',
  'Dell Technologies': 'Dell',
  'HP Inc.': 'HP',
  'HP Inc': 'HP',
  'Hewlett-Packard': 'HP',
  'Lenovo Group': 'Lenovo',
  'Lenovo Group Limited': 'Lenovo',
  'Microsoft Corporation': 'Microsoft',
  'Apple Inc.': 'Apple',
  'Apple Inc': 'Apple',
};

/**
 * Normalize model name
 */
export function normalizeModel(model: string, manufacturer?: string): string {
  if (!model) return model;

  // Try direct match first
  if (MODEL_NORMALIZATION[model]) {
    return MODEL_NORMALIZATION[model];
  }

  // Try case-insensitive match
  const normalized = Object.entries(MODEL_NORMALIZATION).find(
    ([key]) => key.toLowerCase() === model.toLowerCase()
  );
  if (normalized) {
    return normalized[1];
  }

  // If manufacturer is provided, ensure it's in the model name
  if (manufacturer) {
    const normalizedManufacturer = normalizeManufacturer(manufacturer);
    if (!model.toLowerCase().startsWith(normalizedManufacturer.toLowerCase())) {
      return `${normalizedManufacturer} ${model}`;
    }
  }

  return model;
}

/**
 * Normalize manufacturer name
 */
export function normalizeManufacturer(manufacturer: string): string {
  if (!manufacturer) return manufacturer;

  // Direct match
  if (MANUFACTURER_NORMALIZATION[manufacturer]) {
    return MANUFACTURER_NORMALIZATION[manufacturer];
  }

  // Case-insensitive match
  const normalized = Object.entries(MANUFACTURER_NORMALIZATION).find(
    ([key]) => key.toLowerCase() === manufacturer.toLowerCase()
  );
  if (normalized) {
    return normalized[1];
  }

  return manufacturer;
}

/**
 * Normalize serial number
 * Removes spaces, converts to uppercase
 */
export function normalizeSerialNumber(serial: string): string {
  if (!serial) return serial;
  return serial.trim().replace(/\s+/g, '').toUpperCase();
}

/**
 * Normalize asset tag
 */
export function normalizeAssetTag(tag: string): string {
  if (!tag) return tag;
  return tag.trim().toUpperCase();
}

/**
 * Fuzzy serial number matching
 * Tries to match serials that might be slight variations
 */
export function fuzzyMatchSerial(serial1: string, serial2: string): boolean {
  const norm1 = normalizeSerialNumber(serial1);
  const norm2 = normalizeSerialNumber(serial2);

  // Exact match
  if (norm1 === norm2) return true;

  // Check if one is a substring of the other (common in some OEM serials)
  if (norm1.length > 5 && norm2.length > 5) {
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return true;
    }
  }

  // Levenshtein distance for typos (max 2 characters difference)
  const distance = levenshteinDistance(norm1, norm2);
  if (distance <= 2 && Math.abs(norm1.length - norm2.length) <= 2) {
    return true;
  }

  return false;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
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
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Normalize asset data
 */
export function normalizeAsset(asset: Partial<ITAMAsset>): Partial<ITAMAsset> {
  const normalized = { ...asset };

  // Normalize model
  if (normalized.model) {
    normalized.model = normalizeModel(normalized.model, undefined);
  }

  // Normalize serial number
  if (normalized.serialNumber) {
    normalized.serialNumber = normalizeSerialNumber(normalized.serialNumber);
  }

  // Normalize asset tag
  if (normalized.assetTag) {
    normalized.assetTag = normalizeAssetTag(normalized.assetTag);
  }

  return normalized;
}

/**
 * Find potential duplicate assets
 */
export function findPotentialDuplicates(
  asset: ITAMAsset,
  existingAssets: ITAMAsset[]
): ITAMAsset[] {
  const duplicates: ITAMAsset[] = [];

  for (const existing of existingAssets) {
    // Skip self
    if (existing.globalAssetId === asset.globalAssetId) {
      continue;
    }

    let isDuplicate = false;

    // Match by serial number (fuzzy)
    if (asset.serialNumber && existing.serialNumber) {
      if (fuzzyMatchSerial(asset.serialNumber, existing.serialNumber)) {
        isDuplicate = true;
      }
    }

    // Match by asset tag (exact)
    if (asset.assetTag && existing.assetTag) {
      if (normalizeAssetTag(asset.assetTag) === normalizeAssetTag(existing.assetTag)) {
        isDuplicate = true;
      }
    }

    // Match by device GUIDs
    if (asset.deviceGuids && existing.deviceGuids) {
      for (const [key, value] of Object.entries(asset.deviceGuids)) {
        if (value && existing.deviceGuids[key] === value) {
          isDuplicate = true;
          break;
        }
      }
    }

    if (isDuplicate) {
      duplicates.push(existing);
    }
  }

  return duplicates;
}

