import mongoose, { Document, Schema } from 'mongoose';

// ============================================
// Interfaces
// ============================================

export interface IVendorContact {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    isPrimary: boolean;
    department?: string;
    notes?: string;
}

export interface IVendorContract {
    _id?: mongoose.Types.ObjectId;
    contractNumber: string;
    name: string;
    description?: string;
    status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewal_pending';
    startDate: Date;
    endDate: Date;
    value?: number;
    paymentTerms?: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'net_90' | 'due_on_receipt';
    autoRenewal: boolean;
    renewalNoticeDays?: number;
    documentUrl?: string;
    notes?: string;
}

export interface IVendorAddress {
    street?: string;
    street2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
}

export interface IVendor extends Document {
    name: string;
    category?: 'Hardware' | 'Software' | 'Services' | 'Cloud' | 'Telecom' | 'Office Supplies' | 'Maintenance' | 'Consulting' | 'Other';
    status: 'active' | 'inactive' | 'pending' | 'suspended';
    website?: string;
    taxId?: string;
    accountNumber?: string;
    address?: IVendorAddress;
    paymentTerms?: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'net_90' | 'due_on_receipt';
    creditLimit?: number;
    contacts: IVendorContact[];
    contracts: IVendorContract[];
    tags: string[];
    notes?: string;
    rating?: number;
    // Soft delete
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId;
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// Sub-Schemas
// ============================================

const contactSchema = new Schema<IVendorContact>({
    name: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    email: { 
        type: String, 
        trim: true, 
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
    },
    phone: { type: String, trim: true },
    mobile: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    department: { type: String, trim: true },
    notes: { type: String, trim: true }
}, { _id: true });

const contractSchema = new Schema<IVendorContract>({
    contractNumber: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
        type: String,
        enum: ['draft', 'active', 'expired', 'terminated', 'renewal_pending'],
        default: 'draft'
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    value: { type: Number, min: 0 },
    paymentTerms: {
        type: String,
        enum: ['net_15', 'net_30', 'net_45', 'net_60', 'net_90', 'due_on_receipt']
    },
    autoRenewal: { type: Boolean, default: false },
    renewalNoticeDays: { type: Number, min: 0, max: 365 },
    documentUrl: { type: String, trim: true },
    notes: { type: String, trim: true }
}, { _id: true });

const addressSchema = new Schema<IVendorAddress>({
    street: { type: String, trim: true },
    street2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true }
}, { _id: false });

// ============================================
// Main Schema
// ============================================

const vendorSchema = new Schema<IVendor>(
    {
        name: {
            type: String,
            required: [true, 'Vendor name is required'],
            unique: true,
            trim: true
        },
        category: {
            type: String,
            enum: ['Hardware', 'Software', 'Services', 'Cloud', 'Telecom', 'Office Supplies', 'Maintenance', 'Consulting', 'Other'],
            trim: true
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending', 'suspended'],
            default: 'active'
        },
        website: {
            type: String,
            trim: true
        },
        taxId: {
            type: String,
            trim: true
        },
        accountNumber: {
            type: String,
            trim: true
        },
        address: addressSchema,
        paymentTerms: {
            type: String,
            enum: ['net_15', 'net_30', 'net_45', 'net_60', 'net_90', 'due_on_receipt']
        },
        creditLimit: {
            type: Number,
            min: [0, 'Credit limit cannot be negative']
        },
        contacts: [contactSchema],
        contracts: [contractSchema],
        tags: [{
            type: String,
            trim: true
        }],
        notes: {
            type: String,
            trim: true
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        // Soft delete fields
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: {
            type: Date
        },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

// ============================================
// Indexes
// ============================================

vendorSchema.index({ status: 1, category: 1 });
vendorSchema.index({ status: 1, createdAt: -1 });
vendorSchema.index({ isDeleted: 1, status: 1 });
vendorSchema.index({ 'contracts.status': 1, 'contracts.endDate': 1 });
vendorSchema.index({ tags: 1 });
vendorSchema.index({ name: 'text', notes: 'text' });

// ============================================
// Methods
// ============================================

// Get primary contact
vendorSchema.methods.getPrimaryContact = function(): IVendorContact | undefined {
    return this.contacts.find((c: IVendorContact) => c.isPrimary) || this.contacts[0];
};

// Get active contracts
vendorSchema.methods.getActiveContracts = function(): IVendorContract[] {
    return this.contracts.filter((c: IVendorContract) => c.status === 'active');
};

// Get expiring contracts (within specified days)
vendorSchema.methods.getExpiringContracts = function(days: number = 30): IVendorContract[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    return this.contracts.filter((c: IVendorContract) => 
        c.status === 'active' && c.endDate <= cutoffDate
    );
};

// Soft delete
vendorSchema.methods.softDelete = async function(userId: mongoose.Types.ObjectId): Promise<IVendor> {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return await this.save();
};

// Restore soft deleted
vendorSchema.methods.restore = async function(): Promise<IVendor> {
    this.isDeleted = false;
    this.deletedAt = undefined;
    this.deletedBy = undefined;
    return await this.save();
};

// ============================================
// Static Methods
// ============================================

// Find vendors with expiring contracts
vendorSchema.statics.findWithExpiringContracts = async function(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return this.find({
        isDeleted: false,
        'contracts.status': 'active',
        'contracts.endDate': { $lte: cutoffDate }
    });
};

// Default query excludes soft deleted
vendorSchema.pre('find', function() {
    const conditions = this.getQuery();
    if (conditions.includeDeleted !== true && conditions.isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
    delete conditions.includeDeleted;
});

vendorSchema.pre('findOne', function() {
    const conditions = this.getQuery();
    if (conditions.includeDeleted !== true && conditions.isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
    delete conditions.includeDeleted;
});

vendorSchema.pre('countDocuments', function() {
    const conditions = this.getQuery();
    if (conditions.includeDeleted !== true && conditions.isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
    delete conditions.includeDeleted;
});

export default mongoose.model<IVendor>('Vendor', vendorSchema);
