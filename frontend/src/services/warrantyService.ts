/**
 * Warranty Service
 * 
 * Handles warranty data lookup and management.
 * Currently uses mock data, but can be extended to call real warranty APIs.
 */

export interface WarrantyData {
    expiryDate: string;
    isActive: boolean;
    daysRemaining: number;
    provider: string;
    coverageType: string;
}

// Mock warranty data by manufacturer prefix
const mockWarrantyData: Record<string, WarrantyData> = {
    'DLX': {
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        daysRemaining: 365,
        provider: 'Dell Support',
        coverageType: 'ProSupport Plus',
    },
    'HP': {
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        daysRemaining: 180,
        provider: 'HP Care Pack',
        coverageType: 'Standard Warranty',
    },
    'LEN': {
        expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        daysRemaining: 730,
        provider: 'Lenovo ThinkPlus',
        coverageType: 'Premier Support',
    },
    'C02': {
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        daysRemaining: 365,
        provider: 'AppleCare',
        coverageType: 'AppleCare+',
    },
    'MS': {
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        daysRemaining: 365,
        provider: 'Microsoft Complete',
        coverageType: 'Extended Warranty',
    },
};

/**
 * Fetches warranty information based on serial number and manufacturer
 * 
 * @param serialNumber - Asset serial number
 * @param manufacturer - Asset manufacturer
 * @returns Warranty data or null if not found
 */
export const fetchWarrantyFromSerial = async (
    serialNumber: string,
    manufacturer: string
): Promise<WarrantyData | null> => {
    if (!serialNumber || serialNumber.length < 3) return null;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Match serial prefix
    const prefix = serialNumber.substring(0, 3).toUpperCase();
    const match = Object.keys(mockWarrantyData).find(key => prefix.includes(key));

    if (match) {
        return mockWarrantyData[match];
    }

    // Default warranty (3 years from purchase or now)
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 3);

    return {
        expiryDate: defaultExpiry.toISOString().split('T')[0],
        isActive: true,
        daysRemaining: 1095,
        provider: `${manufacturer} Standard Warranty`,
        coverageType: 'Standard',
    };
};

/**
 * Calculates days remaining until warranty expiry
 * 
 * @param expiryDate - Warranty expiry date
 * @returns Number of days remaining (negative if expired)
 */
export const calculateDaysRemaining = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Checks if warranty is still active
 * 
 * @param expiryDate - Warranty expiry date
 * @returns True if warranty is active
 */
export const isWarrantyActive = (expiryDate: string): boolean => {
    return calculateDaysRemaining(expiryDate) > 0;
};
