import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// Interfaces
// ============================================

export interface ICoordinates {
    latitude: number;
    longitude: number;
}

export interface IAddress {
    street?: string;
    street2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    coordinates?: ICoordinates;
}

export interface ICapacity {
    maxAssets?: number;
    maxPeople?: number;
    squareFeet?: number;
    squareMeters?: number;
    powerCapacity?: number;
    coolingCapacity?: number;
    networkPorts?: number;
}

export interface ILocation extends Document {
    name: string;
    code: string;
    type: 'Building' | 'Floor' | 'Room' | 'Storage' | 'Data Center' | 'Warehouse' | 'Remote' | 'Other';
    parentLocation?: mongoose.Types.ObjectId;
    address?: IAddress;
    description?: string;
    capacity?: ICapacity;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    operatingHours?: string;
    timezone?: string;
    accessInstructions?: string;
    isActive: boolean;
    tags: string[];
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;

    // Methods
    getChildren(): Promise<ILocation[]>;
    getAncestors(): Promise<ILocation[]>;
    getFullPath(): Promise<string>;
    getAssetCount(): Promise<number>;
    getCapacityUsage(): Promise<{ used: number; max: number; percentage: number }>;
}

// ============================================
// Sub-Schemas
// ============================================

const coordinatesSchema = new Schema<ICoordinates>({
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
}, { _id: false });

const addressSchema = new Schema<IAddress>({
    street: { type: String, trim: true },
    street2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true },
    coordinates: coordinatesSchema
}, { _id: false });

const capacitySchema = new Schema<ICapacity>({
    maxAssets: { type: Number, min: 0 },
    maxPeople: { type: Number, min: 0 },
    squareFeet: { type: Number, min: 0 },
    squareMeters: { type: Number, min: 0 },
    powerCapacity: { type: Number, min: 0 },
    coolingCapacity: { type: Number, min: 0 },
    networkPorts: { type: Number, min: 0 }
}, { _id: false });

// ============================================
// Main Schema
// ============================================

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
        enum: ['Building', 'Floor', 'Room', 'Storage', 'Data Center', 'Warehouse', 'Remote', 'Other'],
        required: [true, 'Location type is required'],
        default: 'Other'
    },
    parentLocation: {
        type: Schema.Types.ObjectId,
        ref: 'Location',
        default: null
    },
    address: addressSchema,
    description: {
        type: String,
        trim: true
    },
    capacity: capacitySchema,
    contactPerson: {
        type: String,
        trim: true
    },
    contactEmail: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
    },
    contactPhone: {
        type: String,
        trim: true
    },
    operatingHours: {
        type: String,
        trim: true
    },
    timezone: {
        type: String,
        trim: true
    },
    accessInstructions: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    metadata: {
        type: Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ============================================
// Indexes
// ============================================

LocationSchema.index({ code: 1 }, { unique: true });
LocationSchema.index({ type: 1, isActive: 1 });
LocationSchema.index({ parentLocation: 1 });
LocationSchema.index({ 'address.city': 1, 'address.state': 1 });
LocationSchema.index({ 'address.country': 1 });
LocationSchema.index({ tags: 1 });
LocationSchema.index({ name: 'text', description: 'text', code: 'text' });

// ============================================
// Virtuals
// ============================================

// Virtual populate for children
LocationSchema.virtual('children', {
    ref: 'Location',
    localField: '_id',
    foreignField: 'parentLocation'
});

// Virtual populate for assets
LocationSchema.virtual('assets', {
    ref: 'Asset',
    localField: '_id',
    foreignField: 'location'
});

// ============================================
// Methods
// ============================================

// Get all child locations
LocationSchema.methods.getChildren = async function(): Promise<ILocation[]> {
    return await mongoose.model('Location').find({ 
        parentLocation: this._id,
        isActive: true 
    });
};

// Get all ancestors (path to root)
LocationSchema.methods.getAncestors = async function(): Promise<ILocation[]> {
    const ancestors: ILocation[] = [];
    let current: ILocation | null = this;

    while (current?.parentLocation) {
        const parent = await mongoose.model('Location').findById(current.parentLocation);
        if (!parent) break;
        ancestors.push(parent);
        current = parent;
    }

    return ancestors.reverse(); // Root first
};

// Get full path (e.g., "NYC HQ > 5th Floor > Room 501")
LocationSchema.methods.getFullPath = async function(): Promise<string> {
    const ancestors = await this.getAncestors();
    const names = [...ancestors.map((a: ILocation) => a.name), this.name];
    return names.join(' > ');
};

// Get asset count at this location
LocationSchema.methods.getAssetCount = async function(): Promise<number> {
    try {
        const Asset = mongoose.model('Asset');
        return await Asset.countDocuments({ location: this._id });
    } catch {
        return 0;
    }
};

// Get capacity usage
LocationSchema.methods.getCapacityUsage = async function(): Promise<{ used: number; max: number; percentage: number }> {
    const used = await this.getAssetCount();
    const max = this.capacity?.maxAssets || 0;
    const percentage = max > 0 ? Math.round((used / max) * 100) : 0;
    
    return { used, max, percentage };
};

// ============================================
// Static Methods
// ============================================

// Get location tree starting from root
LocationSchema.statics.getTree = async function(rootId?: string) {
    const buildTree = async (parentId: mongoose.Types.ObjectId | null): Promise<any[]> => {
        const locations = await this.find({ 
            parentLocation: parentId, 
            isActive: true 
        }).lean();

        return Promise.all(locations.map(async (loc: any) => ({
            ...loc,
            children: await buildTree(loc._id)
        })));
    };

    if (rootId) {
        const root = await this.findById(rootId).lean();
        if (!root) return null;
        return {
            ...root,
            children: await buildTree(new mongoose.Types.ObjectId(rootId))
        };
    }

    return buildTree(null);
};

// Get all descendants of a location
LocationSchema.statics.getDescendants = async function(locationId: string): Promise<ILocation[]> {
    const descendants: ILocation[] = [];
    
    const collectDescendants = async (parentId: mongoose.Types.ObjectId) => {
        const children = await this.find({ parentLocation: parentId });
        for (const child of children) {
            descendants.push(child);
            await collectDescendants(child._id);
        }
    };

    await collectDescendants(new mongoose.Types.ObjectId(locationId));
    return descendants;
};

// Find locations with available capacity
LocationSchema.statics.findWithAvailableCapacity = async function(minAssets: number = 1) {
    const locations = await this.find({ 
        isActive: true, 
        'capacity.maxAssets': { $exists: true, $gt: 0 } 
    }).lean();

    const results = [];
    for (const loc of locations) {
        try {
            const Asset = mongoose.model('Asset');
            const currentCount = await Asset.countDocuments({ location: loc._id });
            const available = (loc.capacity?.maxAssets || 0) - currentCount;
            
            if (available >= minAssets) {
                results.push({
                    ...loc,
                    currentAssetCount: currentCount,
                    availableCapacity: available
                });
            }
        } catch {
            // Asset model may not exist yet
        }
    }

    return results;
};

// ============================================
// Pre-save Hooks
// ============================================

// Prevent circular hierarchy
LocationSchema.pre('save', async function(next) {
    if (this.parentLocation && this.isModified('parentLocation')) {
        // Check if parent is not self
        if (this.parentLocation.toString() === this._id.toString()) {
            throw new Error('Location cannot be its own parent');
        }

        // Check if parent is not a descendant
        const Location = mongoose.model('Location');
        const descendants = await (Location as any).getDescendants(this._id.toString());
        const descendantIds = descendants.map((d: ILocation) => d._id.toString());
        
        if (descendantIds.includes(this.parentLocation.toString())) {
            throw new Error('Cannot set a descendant as parent (circular hierarchy)');
        }
    }
    next();
});

// Enable virtuals in JSON
LocationSchema.set('toJSON', { virtuals: true });
LocationSchema.set('toObject', { virtuals: true });

const Location = mongoose.model<ILocation>('Location', LocationSchema);

export default Location;
