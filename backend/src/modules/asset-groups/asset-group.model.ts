import mongoose, { Document, Schema } from 'mongoose';

export interface IAssetGroup extends Document {
    name: string;
    description?: string;
    category: string;
    minStock?: number;
    currentStock: number;
    location?: string;
    assets: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const assetGroupSchema = new Schema<IAssetGroup>(
    {
        name: {
            type: String,
            required: [true, 'Group name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true
        },
        minStock: {
            type: Number,
            min: [0, 'Minimum stock cannot be negative'],
            default: 0
        },
        currentStock: {
            type: Number,
            required: true,
            min: [0, 'Current stock cannot be negative'],
            default: 0
        },
        location: {
            type: String,
            trim: true
        },
        assets: [{
            type: Schema.Types.ObjectId,
            ref: 'Asset'
        }],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Index for searching
assetGroupSchema.index({ name: 'text', description: 'text' });
assetGroupSchema.index({ category: 1 });
assetGroupSchema.index({ currentStock: 1 });

export const AssetGroup = mongoose.model<IAssetGroup>('AssetGroup', assetGroupSchema);
