import mongoose, { Document, Schema } from 'mongoose';

export interface IVendor extends Document {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    category?: string;
    status: 'active' | 'inactive';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
    {
        name: {
            type: String,
            required: [true, 'Vendor name is required'],
            unique: true,
            trim: true
        },
        contactName: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
        },
        phone: {
            type: String,
            trim: true
        },
        website: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        category: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        },
        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Compound indexes for common query patterns
vendorSchema.index({ status: 1, category: 1 }); // Filter by status and category
vendorSchema.index({ status: 1, createdAt: -1 }); // Sort vendors by date within status

export default mongoose.model<IVendor>('Vendor', vendorSchema);
