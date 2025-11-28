import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
    name: string;
    description?: string;
    manager?: mongoose.Types.ObjectId;
    costCenter?: string;
    budget?: number;
    location?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
    {
        name: {
            type: String,
            required: [true, 'Department name is required'],
            unique: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        manager: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        costCenter: {
            type: String,
            trim: true
        },
        budget: {
            type: Number,
            min: [0, 'Budget cannot be negative']
        },
        location: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IDepartment>('Department', departmentSchema);
