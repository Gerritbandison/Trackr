/**
 * Receiving Service
 * 
 * Business logic for PO ingestion, barcode scanning, and asset receiving workflows.
 */

export interface PurchaseOrder {
    poNumber: string;
    vendor: string;
    orderDate: Date;
    expectedDeliveryDate?: Date;
    status: 'pending' | 'partially_received' | 'received' | 'cancelled';
    totalValue: number;
    lineItems: POLineItem[];
}

export interface POLineItem {
    lineNumber: number;
    description: string;
    manufacturer?: string;
    model?: string;
    quantity: number;
    receivedQuantity: number;
    unitPrice: number;
    totalPrice: number;
    category?: string;
}

export interface BarcodeScanResult {
    barcode: string;
    type: 'serial' | 'asset_tag' | 'po_number' | 'unknown';
    matched: boolean;
    matchedAsset?: any;
    matchedPO?: PurchaseOrder;
    suggestions: string[];
}

export interface ReceivingQueueItem {
    id: string;
    poNumber: string;
    lineItem: POLineItem;
    expectedQuantity: number;
    receivedQuantity: number;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo?: string;
}

/**
 * Parse PO from various formats (CSV, JSON, ERP export)
 */
export const parsePOData = (data: string, format: 'csv' | 'json' | 'erp'): PurchaseOrder | null => {
    try {
        if (format === 'json') {
            return JSON.parse(data) as PurchaseOrder;
        }

        if (format === 'csv') {
            return parseCSVPO(data);
        }

        if (format === 'erp') {
            return parseERPPO(data);
        }

        return null;
    } catch (error) {
        console.error('PO parsing error:', error);
        return null;
    }
};

/**
 * Parse CSV format PO
 */
const parseCSVPO = (csvData: string): PurchaseOrder | null => {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return null;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const lineItems: POLineItem[] = [];

    let poNumber = '';
    let vendor = '';
    let totalValue = 0;

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        if (i === 1) {
            poNumber = row['po_number'] || row['ponumber'] || '';
            vendor = row['vendor'] || row['supplier'] || '';
        }

        const quantity = parseInt(row['quantity'] || '0');
        const unitPrice = parseFloat(row['unit_price'] || row['price'] || '0');

        lineItems.push({
            lineNumber: i,
            description: row['description'] || row['item'] || '',
            manufacturer: row['manufacturer'] || row['mfg'] || undefined,
            model: row['model'] || undefined,
            quantity,
            receivedQuantity: 0,
            unitPrice,
            totalPrice: quantity * unitPrice,
            category: row['category'] || undefined,
        });

        totalValue += quantity * unitPrice;
    }

    return {
        poNumber,
        vendor,
        orderDate: new Date(),
        status: 'pending',
        totalValue,
        lineItems,
    };
};

/**
 * Parse ERP format PO (simplified example)
 */
const parseERPPO = (erpData: string): PurchaseOrder | null => {
    // This would be customized based on specific ERP format
    // For now, treat as JSON
    try {
        return JSON.parse(erpData) as PurchaseOrder;
    } catch {
        return null;
    }
};

/**
 * Validate barcode and determine type
 */
export const validateBarcode = (barcode: string): BarcodeScanResult => {
    const result: BarcodeScanResult = {
        barcode,
        type: 'unknown',
        matched: false,
        suggestions: [],
    };

    // Check if it's a PO number (typically starts with PO or numeric)
    if (/^PO\d+/i.test(barcode) || /^\d{6,}$/.test(barcode)) {
        result.type = 'po_number';
        result.suggestions.push('Looks like a PO number');
    }

    // Check if it's a serial number (various manufacturer patterns)
    else if (/^[A-Z]{2,3}\d{6,}/i.test(barcode)) {
        result.type = 'serial';
        result.suggestions.push('Looks like a serial number');
    }

    // Check if it's an asset tag (typically AT- or AST- prefix)
    else if (/^(AT|AST|ASSET)-?\d+/i.test(barcode)) {
        result.type = 'asset_tag';
        result.suggestions.push('Looks like an asset tag');
    }

    return result;
};

/**
 * Match barcode to expected assets in receiving queue
 */
export const matchBarcodeToQueue = (
    barcode: string,
    queue: ReceivingQueueItem[],
    existingAssets: any[]
): BarcodeScanResult => {
    const result = validateBarcode(barcode);

    // Try to match to existing assets
    const matchedAsset = existingAssets.find(
        asset => asset.serialNumber === barcode || asset.assetTag === barcode
    );

    if (matchedAsset) {
        result.matched = true;
        result.matchedAsset = matchedAsset;
        result.suggestions.push('Found existing asset in database');
    }

    // Try to match to PO
    if (result.type === 'po_number') {
        const matchedQueue = queue.find(item => item.poNumber === barcode);
        if (matchedQueue) {
            result.matched = true;
            result.suggestions.push('Found matching PO in receiving queue');
        }
    }

    return result;
};

/**
 * Generate asset tag
 */
export const generateAssetTag = (prefix: string = 'AT', sequence: number): string => {
    return `${prefix}-${sequence.toString().padStart(6, '0')}`;
};

/**
 * Calculate receiving progress
 */
export const calculateReceivingProgress = (po: PurchaseOrder): number => {
    const totalExpected = po.lineItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = po.lineItems.reduce((sum, item) => sum + item.receivedQuantity, 0);

    if (totalExpected === 0) return 0;
    return Math.round((totalReceived / totalExpected) * 100);
};

/**
 * Check if PO is fully received
 */
export const isPOFullyReceived = (po: PurchaseOrder): boolean => {
    return po.lineItems.every(item => item.receivedQuantity >= item.quantity);
};

/**
 * Get receiving queue statistics
 */
export const getReceivingQueueStats = (queue: ReceivingQueueItem[]) => {
    return {
        total: queue.length,
        pending: queue.filter(item => item.status === 'pending').length,
        inProgress: queue.filter(item => item.status === 'in_progress').length,
        completed: queue.filter(item => item.status === 'completed').length,
        totalExpected: queue.reduce((sum, item) => sum + item.expectedQuantity, 0),
        totalReceived: queue.reduce((sum, item) => sum + item.receivedQuantity, 0),
    };
};

/**
 * Determine if asset should auto-enroll in MDM
 */
export const shouldAutoEnrollMDM = (asset: any): boolean => {
    const mdmCategories = ['laptop', 'desktop', 'phone', 'tablet'];
    return mdmCategories.includes(asset.category) && asset.status === 'available';
};

/**
 * Generate label data for printing
 */
export const generateLabelData = (asset: any) => {
    return {
        assetTag: asset.assetTag,
        name: asset.name,
        serialNumber: asset.serialNumber,
        manufacturer: asset.manufacturer,
        model: asset.model,
        qrCode: generateQRCodeData(asset),
        barcode: asset.assetTag,
    };
};

/**
 * Generate QR code data
 */
const generateQRCodeData = (asset: any): string => {
    return JSON.stringify({
        id: asset._id || asset.id,
        assetTag: asset.assetTag,
        serialNumber: asset.serialNumber,
        type: 'trackr_asset',
    });
};

/**
 * Validate PO line item
 */
export const validatePOLineItem = (item: POLineItem): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!item.description || item.description.trim() === '') {
        errors.push('Description is required');
    }

    if (item.quantity <= 0) {
        errors.push('Quantity must be greater than 0');
    }

    if (item.unitPrice < 0) {
        errors.push('Unit price cannot be negative');
    }

    if (item.receivedQuantity > item.quantity) {
        errors.push('Received quantity cannot exceed ordered quantity');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Get PO status color
 */
export const getPOStatusColor = (status: PurchaseOrder['status']): string => {
    switch (status) {
        case 'received':
            return 'text-green-600';
        case 'partially_received':
            return 'text-yellow-600';
        case 'pending':
            return 'text-blue-600';
        case 'cancelled':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
};

/**
 * Get PO status badge
 */
export const getPOStatusBadge = (status: PurchaseOrder['status']): string => {
    switch (status) {
        case 'received':
            return 'bg-green-100 text-green-800';
        case 'partially_received':
            return 'bg-yellow-100 text-yellow-800';
        case 'pending':
            return 'bg-blue-100 text-blue-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
