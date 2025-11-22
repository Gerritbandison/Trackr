/**
 * Serial Pattern Detection Service
 * 
 * Auto-detects asset type, manufacturer, and model from serial number patterns.
 */

export type AssetCategory = 'laptop' | 'desktop' | 'monitor' | 'phone' | 'tablet' | 'dock' | 'keyboard' | 'mouse' | 'headset' | 'webcam' | 'accessory' | 'other';

export interface SerialPatternMatch {
    category: AssetCategory;
    manufacturer: string;
    model?: string;
}

// Serial number pattern detection map
export const SERIAL_PATTERNS: Record<string, SerialPatternMatch> = {
    // Dell patterns
    'DLX': { category: 'laptop', manufacturer: 'Dell', model: 'Latitude' },
    'DL': { category: 'laptop', manufacturer: 'Dell' },
    'DELL': { category: 'laptop', manufacturer: 'Dell' },
    'OPT': { category: 'desktop', manufacturer: 'Dell', model: 'OptiPlex' },

    // HP patterns
    'HP': { category: 'laptop', manufacturer: 'HP' },
    '5CD': { category: 'laptop', manufacturer: 'HP', model: 'EliteBook' },
    'PRO': { category: 'desktop', manufacturer: 'HP', model: 'ProDesk' },

    // Lenovo patterns
    'LEN': { category: 'laptop', manufacturer: 'Lenovo', model: 'ThinkPad' },
    'TP': { category: 'laptop', manufacturer: 'Lenovo', model: 'ThinkPad' },
    '20': { category: 'laptop', manufacturer: 'Lenovo' }, // ThinkPad model numbers

    // Apple patterns
    'C02': { category: 'laptop', manufacturer: 'Apple', model: 'MacBook' },
    'C02X': { category: 'desktop', manufacturer: 'Apple', model: 'iMac' },
    'F5': { category: 'laptop', manufacturer: 'Apple', model: 'MacBook Pro' },

    // Microsoft patterns
    'MS': { category: 'laptop', manufacturer: 'Microsoft', model: 'Surface' },
    'SUR': { category: 'laptop', manufacturer: 'Microsoft', model: 'Surface' },
};

/**
 * Detects asset information from serial number pattern
 * 
 * @param serialNumber - Asset serial number
 * @returns Detected pattern match or null if no match found
 */
export const detectFromSerialNumber = (serialNumber: string): SerialPatternMatch | null => {
    if (!serialNumber || serialNumber.length < 3) return null;

    const prefix = serialNumber.substring(0, 3).toUpperCase();
    const pattern = Object.entries(SERIAL_PATTERNS).find(([key]) =>
        prefix.includes(key) || key.includes(prefix)
    );

    if (pattern) {
        const [, detection] = pattern;
        return detection;
    }

    return null;
};

/**
 * Gets all supported manufacturers
 * 
 * @returns Array of unique manufacturer names
 */
export const getSupportedManufacturers = (): string[] => {
    const manufacturers = new Set<string>();
    Object.values(SERIAL_PATTERNS).forEach(pattern => {
        manufacturers.add(pattern.manufacturer);
    });
    return Array.from(manufacturers).sort();
};
