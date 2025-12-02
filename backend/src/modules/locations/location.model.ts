import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
    name: string;
    code: string; // Short code like "NYC-HQ-5F-501"
    type: 'Building' | 'Floor' | 'Room' | 'Storage' | 'Remote' | 'Other';
    parentLocation?: mongoose.Types.ObjectId; // For hierarchy (e.g., Room → Floor → Building)
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    description?: string;
    capacity?: number; // Maximum assets this location can hold
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    isActive: boolean;
    metadata?: Record<string, any>; // For custom fields
    createdAt: Date;
    updatedAt: Date;
}

const LocationSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Location name is required'],
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Location code is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['Building', 'Floor', 'Room', 'Storage', 'Remote', 'Other'],
        required: [true, 'Location type is required'],
        default: 'Other'
    },
    parentLocation: {
        type: Schema.Types.ObjectId,
        ref: 'Location'
    },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String }
    },
    description: {
        type: String
    },
    capacity: {
        type: Number,
        min: [0, 'Capacity cannot be negative']
    },
    contactPerson: {
        type: String
    },
    contactEmail: {
        type: String,
        lowercase: true,
        trim: true
    },
    contactPhone: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        type: Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
LocationSchema.index({ code: 1 }, { unique: true });
LocationSchema.index({ type: 1, isActive: 1 });
LocationSchema.index({ parentLocation: 1 });
LocationSchema.index({ 'address.city': 1, 'address.state': 1 });

// Virtual for full path (e.g., "NYC HQ → 5th Floor → Room 501")
LocationSchema.virtual('fullPath').get(async function() {
    const path = [this.name];
    let current = this;

    while (current.parentLocation) {
        const parent = await mongoose.model('Location').findById(current.parentLocation);
        if (!parent) break;
        path.unshift(parent.name);
        current = parent;
    }

    return path.join(' → ');
});

// Method to get all child locations
LocationSchema.methods.getChildren = async function(): Promise<ILocation[]> {
    return await mongoose.model('Location').find({ parentLocation: this._id });
};

// Method to get asset count at this location
LocationSchema.methods.getAssetCount = async function(): Promise<number> {
    const Asset = mongoose.model('Asset');
    return await Asset.countDocuments({ location: this._id });
};

const Location = mongoose.model<ILocation>('Location', LocationSchema);

export default Location;
