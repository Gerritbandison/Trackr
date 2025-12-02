import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignmentHistory {
    userId: mongoose.Types.ObjectId;
    assignedDate: Date;
    returnedDate?: Date;
    assignedBy: mongoose.Types.ObjectId;
    notes?: string;
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
    location?: string;
    condition?: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
    conditionNotes?: string;
    warranty?: {
        provider: string;
        startDate: Date;
        endDate: Date;
        warrantyNumber?: string;
        supportPhone?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const AssignmentHistorySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedDate: { type: Date, required: true },
    returnedDate: { type: Date },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String }
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
    location: { type: String },
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
    }
}, { timestamps: true });

// Compound indexes for common query patterns
AssetSchema.index({ status: 1, category: 1 }); // Filter by status and category
AssetSchema.index({ status: 1, createdAt: -1 }); // Sort active/retired assets by date
AssetSchema.index({ category: 1, createdAt: -1 }); // Get recent assets in a category
AssetSchema.index({ assignedTo: 1 }); // Query assets by assigned user

// Helper method to check if asset is under warranty
AssetSchema.methods.isUnderWarranty = function(): boolean {
    if (!this.warranty || !this.warranty.endDate) {
        return false;
    }
    return this.warranty.endDate > new Date();
};

export default mongoose.model<IAsset>('Asset', AssetSchema);
