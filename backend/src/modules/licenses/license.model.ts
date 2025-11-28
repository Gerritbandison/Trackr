import mongoose, { Document, Schema } from 'mongoose';

export interface ILicense extends Document {
    name: string;
    vendor: string;
    licenseKey?: string;
    type: 'perpetual' | 'subscription' | 'trial';
    category: string;
    totalSeats: number;
    usedSeats: number;
    availableSeats: number;
    purchaseDate: Date;
    expirationDate?: Date;
    renewalDate?: Date;
    purchaseCost: number;
    annualCost?: number;
    status: 'active' | 'expiring' | 'expired' | 'cancelled';
    assignedTo: mongoose.Types.ObjectId[];
    notes?: string;
    autoRenew: boolean;
    complianceStatus: 'compliant' | 'at-risk' | 'non-compliant';
    createdAt: Date;
    updatedAt: Date;
}

const licenseSchema = new Schema<ILicense>(
    {
        name: {
            type: String,
            required: [true, 'License name is required'],
            trim: true
        },
        vendor: {
            type: String,
            required: [true, 'Vendor is required'],
            trim: true
        },
        licenseKey: {
            type: String,
            trim: true,
            select: false // Don't return license key by default for security
        },
        type: {
            type: String,
            enum: ['perpetual', 'subscription', 'trial'],
            required: true,
            default: 'subscription'
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true
        },
        totalSeats: {
            type: Number,
            required: [true, 'Total seats is required'],
            min: [1, 'Total seats must be at least 1']
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
        purchaseCost: {
            type: Number,
            required: [true, 'Purchase cost is required'],
            min: [0, 'Purchase cost cannot be negative']
        },
        annualCost: {
            type: Number,
            min: [0, 'Annual cost cannot be negative']
        },
        status: {
            type: String,
            enum: ['active', 'expiring', 'expired', 'cancelled'],
            default: 'active'
        },
        assignedTo: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        notes: {
            type: String,
            trim: true
        },
        autoRenew: {
            type: Boolean,
            default: false
        },
        complianceStatus: {
            type: String,
            enum: ['compliant', 'at-risk', 'non-compliant'],
            default: 'compliant'
        }
    },
    {
        timestamps: true
    }
);

// Update availableSeats before saving
licenseSchema.pre('save', function(next) {
    this.availableSeats = this.totalSeats - this.usedSeats;
    next();
});

// Auto-update status based on expiration date
licenseSchema.pre('save', function(next) {
    if (this.expirationDate && this.type !== 'perpetual') {
        const now = new Date();
        const daysUntilExpiration = Math.ceil((this.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiration < 0) {
            this.status = 'expired';
        } else if (daysUntilExpiration <= 30) {
            this.status = 'expiring';
        } else if (this.status !== 'cancelled') {
            this.status = 'active';
        }
    }
    next();
});

// Auto-update compliance status
licenseSchema.pre('save', function(next) {
    const utilizationRate = this.usedSeats / this.totalSeats;

    if (this.usedSeats > this.totalSeats) {
        this.complianceStatus = 'non-compliant';
    } else if (utilizationRate >= 0.9) {
        this.complianceStatus = 'at-risk';
    } else {
        this.complianceStatus = 'compliant';
    }
    next();
});

export default mongoose.model<ILicense>('License', licenseSchema);
