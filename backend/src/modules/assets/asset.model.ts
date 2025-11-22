import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset extends Document {
    name: string;
    description?: string;
    serialNumber: string;
    assetTag: string;
    purchaseDate: Date;
    purchasePrice: number;
    depreciationType: 'Straight Line' | 'Double Declining' | 'Sum of Years';
    usefulLife: number; // in years
    salvageValue: number;
    assignedUser?: string; // User ID or Name
    status: 'Active' | 'Retired' | 'Repair' | 'In Stock';
    category: string;
    location?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AssetSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    serialNumber: { type: String, required: true, unique: true },
    assetTag: { type: String, required: true, unique: true },
    purchaseDate: { type: Date, required: true },
    purchasePrice: { type: Number, required: true },
    depreciationType: {
        type: String,
        enum: ['Straight Line', 'Double Declining', 'Sum of Years'],
        default: 'Straight Line'
    },
    usefulLife: { type: Number, default: 5 },
    salvageValue: { type: Number, default: 0 },
    assignedUser: { type: String },
    status: {
        type: String,
        enum: ['Active', 'Retired', 'Repair', 'In Stock'],
        default: 'In Stock'
    },
    category: { type: String, required: true },
    location: { type: String },
}, { timestamps: true });

export default mongoose.model<IAsset>('Asset', AssetSchema);
