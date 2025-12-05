import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignmentHistory {
    userId: mongoose.Types.ObjectId;
    assignedDate: Date;
    returnedDate?: Date;
    assignedBy: mongoose.Types.ObjectId;
    notes?: string;
}

export interface ILocationHistory {
    locationId: mongoose.Types.ObjectId;
    movedDate: Date;
    movedBy: mongoose.Types.ObjectId;
    reason?: string;
}

export interface IAsset extends Document {
    name: string;
    description?: string;
    serialNumber: string;
    assetTag: string;
    manufacturer?: string;
    modelNumber?: string;
    purchaseDate: Date;
    purchasePrice: number;
    depreciationType: 'Straight Line' | 'Double Declining' | 'Sum of Years';
    usefulLife: number; // in years
    salvageValue: number;
    assignedTo?: mongoose.Types.ObjectId; // Current user
    assignedDate?: Date; // When current assignment started
    assignmentHistory: IAssignmentHistory[];
    status: 'Active' | 'Retired' | 'Repair' | 'In Stock';
    category: string;
    location?: mongoose.Types.ObjectId; // Current location
    locationHistory: ILocationHistory[];
    condition?: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
    conditionNotes?: string;
    warranty?: {
        provider: string;
        startDate: Date;
        endDate: Date;
        warrantyNumber?: string;
        supportPhone?: string;
    };

    // Microsoft Intune Integration Fields
    intuneDeviceId?: string; // Unique Intune device ID
    managementAgent?: 'intune' | 'configmgr' | 'easmdm' | 'manual'; // Device management source
    enrollmentDate?: Date; // Intune enrollment date
    lastSyncDate?: Date; // Last sync from Intune
    complianceState?: 'compliant' | 'noncompliant' | 'inGracePeriod' | 'unknown'; // Compliance status
    operatingSystem?: string; // e.g., "Windows 11", "iOS 17.2", "Android 14"
    osVersion?: string; // e.g., "10.0.22621.2506"
    lastCheckIn?: Date; // Last Intune check-in timestamp

    // Device Hardware Details
    imei?: string; // Mobile device IMEI
    meid?: string; // Mobile device MEID
    wifiMacAddress?: string; // WiFi MAC address
    ethernetMacAddress?: string; // Ethernet MAC address
    storageTotal?: number; // Total storage in GB
    storageFree?: number; // Free storage in GB
    memoryTotal?: number; // Total memory/RAM in GB

    // Azure AD / Entra ID Fields
    azureAdDeviceId?: string; // Azure AD device object ID
    isEntraJoined?: boolean; // Azure AD joined status
    isEntraRegistered?: boolean; // Azure AD registered status

    createdAt: Date;
    updatedAt: Date;
    isUnderWarranty(): boolean;
}

const AssignmentHistorySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedDate: { type: Date, required: true },
    returnedDate: { type: Date },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String }
}, { _id: false });

const LocationHistorySchema = new Schema({
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    movedDate: { type: Date, required: true },
    movedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String }
}, { _id: false });

const AssetSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    serialNumber: { type: String, required: true, unique: true },
    assetTag: { type: String, required: true, unique: true },
    manufacturer: { type: String },
    modelNumber: { type: String },
    purchaseDate: { type: Date, required: true },
    purchasePrice: { type: Number, required: true },
    depreciationType: {
        type: String,
        enum: ['Straight Line', 'Double Declining', 'Sum of Years'],
        default: 'Straight Line'
    },
    usefulLife: { type: Number, default: 5 },
    salvageValue: { type: Number, default: 0 },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedDate: { type: Date },
    assignmentHistory: [AssignmentHistorySchema],
    status: {
        type: String,
        enum: ['Active', 'Retired', 'Repair', 'In Stock'],
        default: 'In Stock'
    },
    category: { type: String, required: true },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    locationHistory: [LocationHistorySchema],
    condition: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
        default: 'Excellent'
    },
    conditionNotes: { type: String },
    warranty: {
        provider: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        warrantyNumber: { type: String },
        supportPhone: { type: String }
    },

    // Microsoft Intune Integration Fields
    intuneDeviceId: { type: String, sparse: true },
    managementAgent: {
        type: String,
        enum: ['intune', 'configmgr', 'easmdm', 'manual'],
        default: 'manual'
    },
    enrollmentDate: { type: Date },
    lastSyncDate: { type: Date },
    complianceState: {
        type: String,
        enum: ['compliant', 'noncompliant', 'inGracePeriod', 'unknown']
    },
    operatingSystem: { type: String },
    osVersion: { type: String },
    lastCheckIn: { type: Date },

    // Device Hardware Details
    imei: { type: String },
    meid: { type: String },
    wifiMacAddress: { type: String },
    ethernetMacAddress: { type: String },
    storageTotal: { type: Number },
    storageFree: { type: Number },
    memoryTotal: { type: Number },

    // Azure AD / Entra ID Fields
    azureAdDeviceId: { type: String, sparse: true },
    isEntraJoined: { type: Boolean, default: false },
    isEntraRegistered: { type: Boolean, default: false }
}, { timestamps: true });

// Compound indexes for common query patterns
AssetSchema.index({ status: 1, category: 1 }); // Filter by status and category
AssetSchema.index({ status: 1, createdAt: -1 }); // Sort active/retired assets by date
AssetSchema.index({ category: 1, createdAt: -1 }); // Get recent assets in a category
AssetSchema.index({ assignedTo: 1 }); // Query assets by assigned user
AssetSchema.index({ location: 1 }); // Query assets by location

// Intune and Azure AD indexes
AssetSchema.index({ intuneDeviceId: 1 }, { sparse: true }); // Query by Intune device ID
AssetSchema.index({ azureAdDeviceId: 1 }, { sparse: true }); // Query by Azure AD device ID
AssetSchema.index({ managementAgent: 1, complianceState: 1 }); // Filter by management source and compliance
AssetSchema.index({ complianceState: 1, lastCheckIn: -1 }); // Monitor compliance status

// Helper method to check if asset is under warranty
AssetSchema.methods.isUnderWarranty = function(): boolean {
    if (!this.warranty || !this.warranty.endDate) {
        return false;
    }
    return this.warranty.endDate > new Date();
};

export default mongoose.model<IAsset>('Asset', AssetSchema);
