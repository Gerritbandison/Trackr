import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'manager' | 'staff';
    department?: string;
    isActive: boolean;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    lastLogin?: Date;

    // Azure AD / Entra ID Integration Fields
    azureAdId?: string; // Azure AD Object ID
    authProvider: 'local' | 'azure-ad'; // Authentication provider
    azureAdGroups?: string[]; // Cached Azure AD group memberships
    lastSyncDate?: Date; // Last sync from Azure AD
    jobTitle?: string; // Job title from Azure AD
    officeLocation?: string; // Office location from Azure AD
    mobilePhone?: string; // Mobile phone from Azure AD

    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true
        },
        role: {
            type: String,
            enum: ['admin', 'manager', 'staff'],
            default: 'staff',
            required: true
        },
        department: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false
        },
        twoFactorSecret: {
            type: String,
            select: false
        },
        lastLogin: {
            type: Date
        },

        // Azure AD / Entra ID Integration Fields
        azureAdId: {
            type: String,
            unique: true,
            sparse: true
        },
        authProvider: {
            type: String,
            enum: ['local', 'azure-ad'],
            default: 'local',
            required: true
        },
        azureAdGroups: {
            type: [String],
            default: []
        },
        lastSyncDate: {
            type: Date
        },
        jobTitle: {
            type: String,
            trim: true
        },
        officeLocation: {
            type: String,
            trim: true
        },
        mobilePhone: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving (only for local auth users)
userSchema.pre('save', async function (next) {
    // Skip password hashing for Azure AD users
    if (this.authProvider === 'azure-ad') {
        return next();
    }

    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: unknown) {
        next(error as Error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

// Remove password from JSON response
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.twoFactorSecret;
    return obj;
};

// Compound indexes for common query patterns
userSchema.index({ role: 1, isActive: 1 }); // Get active users by role
userSchema.index({ department: 1, isActive: 1 }); // Get active users by department
userSchema.index({ isActive: 1, createdAt: -1 }); // Sort users by creation date

// Azure AD / Entra ID indexes
userSchema.index({ azureAdId: 1 }, { sparse: true }); // Query by Azure AD Object ID
userSchema.index({ authProvider: 1, isActive: 1 }); // Filter by auth provider and active status

export const User = mongoose.model<IUser>('User', userSchema);
