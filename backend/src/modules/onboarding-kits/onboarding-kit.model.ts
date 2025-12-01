import mongoose, { Document, Schema } from 'mongoose';

export interface IOnboardingKit extends Document {
    name: string;
    description?: string;
    department?: string;
    role?: string;
    assets: mongoose.Types.ObjectId[];
    licenses: mongoose.Types.ObjectId[];
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const onboardingKitSchema = new Schema<IOnboardingKit>(
    {
        name: {
            type: String,
            required: [true, 'Kit name is required'],
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        department: {
            type: String,
            trim: true
        },
        role: {
            type: String,
            trim: true
        },
        assets: [{
            type: Schema.Types.ObjectId,
            ref: 'AssetGroup'
        }],
        licenses: [{
            type: Schema.Types.ObjectId,
            ref: 'License'
        }],
        isActive: {
            type: Boolean,
            default: true
        },
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

export const OnboardingKit = mongoose.model<IOnboardingKit>('OnboardingKit', onboardingKitSchema);
