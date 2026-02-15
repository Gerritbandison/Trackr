import mongoose, { Document, Schema } from 'mongoose';

// ============================================
// Interfaces
// ============================================

export interface ILicenseAssignmentHistory {
    userId: mongoose.Types.ObjectId;
    assignedDate: Date;
    unassignedDate?: Date;
    assignedBy: mongoose.Types.ObjectId;
    reason?: string;
}

export interface IRenewalReminder {
    daysBefore: number;
    sent: boolean;
    sentAt?: Date;
}

export interface ICostAllocation {
    departmentId?: mongoose.Types.ObjectId;
    costCenter?: string;
    percentage: number;
    amount?: number;
}

export interface ILicense extends Document {
    // Core fields
    name: string;
    vendor: string;
    licenseKey?: string;
    productKey?: string;
    description?: string;
    type: 'perpetual' | 'subscription' | 'trial' | 'site' | 'volume' | 'oem';
    category: string;
    
    // Seat tracking
    totalSeats: number;
    usedSeats: number;
    availableSeats: number;
    
    // Dates
    purchaseDate: Date;
    expirationDate?: Date;
    renewalDate?: Date;
    
    // Costs
    purchaseCost: number;
    annualCost?: number;
    monthlyEstimate?: number;
    costPerSeat?: number;
    billingCycle?: 'monthly' | 'quarterly' | 'annual' | 'one-time' | 'multi-year';
    
    // Status fields
    status: 'active' | 'expiring' | 'expired' | 'cancelled' | 'suspended';
    complianceStatus: 'compliant' | 'overAllocated' | 'underUtilized' | 'at-risk';
    
    // Assignments
    assignedTo: mongoose.Types.ObjectId[];
    assignmentHistory: ILicenseAssignmentHistory[];
    
    // Renewal tracking
    autoRenew: boolean;
    renewalNotificationDays: number;
    renewalStatus?: 'pending' | 'approved' | 'rejected' | 'auto-renewing' | 'not-applicable';
    renewalReminders: IRenewalReminder[];
    lastRenewalCheck?: Date;
    
    // Cost allocation
    costAllocations: ICostAllocation[];
    
    // Metadata
    notes?: string;
    tags: string[];
    
    // Vendor contact
    vendorContactName?: string;
    vendorContactEmail?: string;
    vendorContactPhone?: string;
    supportUrl?: string;
    documentationUrl?: string;
    
    // Agreement info
    agreementNumber?: string;
    poNumber?: string;
    
    // Soft delete
    isArchived: boolean;
    archivedAt?: Date;
    archivedBy?: mongoose.Types.ObjectId;
    archiveReason?: string;
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    
    // Virtual methods
    utilizationRate: number;
    daysUntilExpiration: number | null;
    isExpiringSoon: boolean;
    costPerUsedSeat: number | null;
}

// ============================================
// Sub-Schemas
// ============================================

const LicenseAssignmentHistorySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedDate: { type: Date, required: true },
    unassignedDate: { type: Date },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, maxlength: 500 }
}, { _id: false });

const RenewalReminderSchema = new Schema({
    daysBefore: { type: Number, required: true, min: 1, max: 365 },
    sent: { type: Boolean, default: false },
    sentAt: { type: Date }
}, { _id: false });

const CostAllocationSchema = new Schema({
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    costCenter: { type: String, maxlength: 50 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    amount: { type: Number, min: 0 }
}, { _id: false });

// ============================================
// Main Schema
// ============================================

const licenseSchema = new Schema<ILicense>(
    {
        // Core fields
        name: {
            type: String,
            required: [true, 'License name is required'],
            trim: true,
            maxlength: 200
        },
        vendor: {
            type: String,
            required: [true, 'Vendor is required'],
            trim: true,
            maxlength: 100
        },
        licenseKey: {
            type: String,
            trim: true,
            maxlength: 500,
            select: false // Don't return license key by default for security
        },
        productKey: {
            type: String,
            trim: true,
            maxlength: 500,
            select: false
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        type: {
            type: String,
            enum: ['perpetual', 'subscription', 'trial', 'site', 'volume', 'oem'],
            required: true,
            default: 'subscription'
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true
        },
        
        // Seat tracking
        totalSeats: {
            type: Number,
            required: [true, 'Total seats is required'],
            min: [1, 'Total seats must be at least 1'],
            max: [1000000, 'Total seats too high']
        },
        usedSeats: {
            type: Number,
            default: 0,
            min: [0, 'Used seats cannot be negative']
        },
        availableSeats: {
            type: Number,
            default: function() { return this.totalSeats; }
        },
        
        // Dates
        purchaseDate: {
            type: Date,
            required: [true, 'Purchase date is required']
        },
        expirationDate: {
            type: Date
        },
        renewalDate: {
            type: Date
        },
        
        // Costs
        purchaseCost: {
            type: Number,
            required: [true, 'Purchase cost is required'],
            min: [0, 'Purchase cost cannot be negative']
        },
        annualCost: {
            type: Number,
            min: [0, 'Annual cost cannot be negative']
        },
        monthlyEstimate: {
            type: Number,
            min: [0, 'Monthly estimate cannot be negative']
        },
        costPerSeat: {
            type: Number,
            min: [0, 'Cost per seat cannot be negative']
        },
        billingCycle: {
            type: String,
            enum: ['monthly', 'quarterly', 'annual', 'one-time', 'multi-year']
        },
        
        // Status fields
        status: {
            type: String,
            enum: ['active', 'expiring', 'expired', 'cancelled', 'suspended'],
            default: 'active'
        },
        complianceStatus: {
            type: String,
            enum: ['compliant', 'overAllocated', 'underUtilized', 'at-risk'],
            default: 'compliant'
        },
        
        // Assignments
        assignedTo: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        assignmentHistory: [LicenseAssignmentHistorySchema],
        
        // Renewal tracking
        autoRenew: {
            type: Boolean,
            default: false
        },
        renewalNotificationDays: {
            type: Number,
            default: 30,
            min: 1,
            max: 365
        },
        renewalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'auto-renewing', 'not-applicable']
        },
        renewalReminders: [RenewalReminderSchema],
        lastRenewalCheck: {
            type: Date
        },
        
        // Cost allocation
        costAllocations: [CostAllocationSchema],
        
        // Metadata
        notes: {
            type: String,
            trim: true,
            maxlength: 5000
        },
        tags: [{
            type: String,
            trim: true,
            maxlength: 50
        }],
        
        // Vendor contact
        vendorContactName: { type: String, maxlength: 100 },
        vendorContactEmail: { type: String, maxlength: 255 },
        vendorContactPhone: { type: String, maxlength: 30 },
        supportUrl: { type: String, maxlength: 500 },
        documentationUrl: { type: String, maxlength: 500 },
        
        // Agreement info
        agreementNumber: { type: String, maxlength: 100 },
        poNumber: { type: String, maxlength: 100 },
        
        // Soft delete
        isArchived: {
            type: Boolean,
            default: false,
            index: true
        },
        archivedAt: {
            type: Date
        },
        archivedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        archiveReason: {
            type: String,
            maxlength: 500
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ============================================
// Virtuals
// ============================================

// Calculate utilization rate as percentage
licenseSchema.virtual('utilizationRate').get(function() {
    if (this.totalSeats === 0) return 0;
    return parseFloat(((this.usedSeats / this.totalSeats) * 100).toFixed(2));
});

// Calculate days until expiration
licenseSchema.virtual('daysUntilExpiration').get(function() {
    if (!this.expirationDate) return null;
    const now = new Date();
    const diffTime = this.expirationDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Check if license is expiring soon (within notification period)
licenseSchema.virtual('isExpiringSoon').get(function() {
    const days = this.daysUntilExpiration;
    if (days === null) return false;
    return days > 0 && days <= this.renewalNotificationDays;
});

// Calculate cost per used seat
licenseSchema.virtual('costPerUsedSeat').get(function() {
    if (this.usedSeats === 0) return null;
    const annualCost = this.annualCost || this.purchaseCost;
    return parseFloat((annualCost / this.usedSeats).toFixed(2));
});

// ============================================
// Pre-save Middleware
// ============================================

// Update availableSeats before saving
licenseSchema.pre('save', function(next) {
    this.availableSeats = Math.max(0, this.totalSeats - this.usedSeats);
    next();
});

// Calculate monthly estimate from annual cost
licenseSchema.pre('save', function(next) {
    if (this.annualCost && !this.monthlyEstimate) {
        this.monthlyEstimate = parseFloat((this.annualCost / 12).toFixed(2));
    }
    next();
});

// Calculate cost per seat
licenseSchema.pre('save', function(next) {
    if (this.totalSeats > 0) {
        const annualCost = this.annualCost || this.purchaseCost;
        this.costPerSeat = parseFloat((annualCost / this.totalSeats).toFixed(2));
    }
    next();
});

// Auto-update status based on expiration date
licenseSchema.pre('save', function(next) {
    if (this.status === 'cancelled' || this.status === 'suspended') {
        return next();
    }
    
    if (this.expirationDate && this.type !== 'perpetual') {
        const now = new Date();
        const daysUntilExpiration = Math.ceil(
            (this.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiration < 0) {
            this.status = 'expired';
        } else if (daysUntilExpiration <= this.renewalNotificationDays) {
            this.status = 'expiring';
        } else {
            this.status = 'active';
        }
    }
    next();
});

// Auto-update compliance status based on utilization
licenseSchema.pre('save', function(next) {
    const utilizationRate = this.totalSeats > 0 ? (this.usedSeats / this.totalSeats) * 100 : 0;

    if (this.usedSeats > this.totalSeats) {
        this.complianceStatus = 'overAllocated';
    } else if (utilizationRate >= 90) {
        this.complianceStatus = 'at-risk';
    } else if (utilizationRate < 30 && this.usedSeats > 0) {
        this.complianceStatus = 'underUtilized';
    } else {
        this.complianceStatus = 'compliant';
    }
    next();
});

// Set renewal status for perpetual licenses
licenseSchema.pre('save', function(next) {
    if (this.type === 'perpetual' && !this.renewalStatus) {
        this.renewalStatus = 'not-applicable';
    } else if (this.autoRenew && !this.renewalStatus) {
        this.renewalStatus = 'auto-renewing';
    }
    next();
});

// ============================================
// Indexes
// ============================================

// Compound indexes for common query patterns
licenseSchema.index({ status: 1, expirationDate: 1 }); // Find expiring/active licenses
licenseSchema.index({ vendor: 1, type: 1, status: 1 }); // Filter by vendor, type, and status
licenseSchema.index({ complianceStatus: 1 }); // Query by compliance status
licenseSchema.index({ status: 1, createdAt: -1 }); // Sort licenses by date within status
licenseSchema.index({ isArchived: 1, status: 1 }); // Filter archived licenses
licenseSchema.index({ category: 1, status: 1 }); // Category-based queries
licenseSchema.index({ expirationDate: 1, renewalDate: 1 }); // Renewal tracking
licenseSchema.index({ 'assignedTo': 1 }); // Find licenses by assigned user
licenseSchema.index({ tags: 1 }); // Tag-based queries
licenseSchema.index({ vendor: 1, isArchived: 1 }); // Vendor reporting
licenseSchema.index({ name: 'text', vendor: 'text', category: 'text' }); // Full-text search

// ============================================
// Static Methods
// ============================================

licenseSchema.statics.findActive = function() {
    return this.find({ isArchived: false, status: { $ne: 'cancelled' } });
};

licenseSchema.statics.findExpiring = function(days: number = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    return this.find({
        isArchived: false,
        expirationDate: { $gte: now, $lte: futureDate },
        status: { $nin: ['cancelled', 'expired'] }
    });
};

licenseSchema.statics.findNonCompliant = function() {
    return this.find({
        isArchived: false,
        complianceStatus: { $in: ['overAllocated', 'at-risk'] }
    });
};

licenseSchema.statics.findUnderutilized = function(threshold: number = 30) {
    return this.find({
        isArchived: false,
        status: 'active',
        $expr: {
            $lt: [
                { $multiply: [{ $divide: ['$usedSeats', '$totalSeats'] }, 100] },
                threshold
            ]
        }
    });
};

export default mongoose.model<ILicense>('License', licenseSchema);
