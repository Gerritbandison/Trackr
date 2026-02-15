import mongoose, { Document, Schema } from 'mongoose';

// ============================================
// Interfaces
// ============================================

export interface IChecklistItem {
    _id?: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    type: 'asset' | 'license' | 'access' | 'training' | 'document' | 'task' | 'other';
    priority: 'low' | 'normal' | 'high' | 'critical';
    referenceId?: mongoose.Types.ObjectId;
    referenceModel?: 'Asset' | 'License' | 'AssetGroup';
    quantity: number;
    isRequired: boolean;
    estimatedMinutes?: number;
    dueOffsetDays?: number;
    dependsOn?: number[];
    instructions?: string;
    documentUrl?: string;
    // Template-specific
    assetCategory?: string;
    licenseType?: string;
    accessType?: string;
    autoAssign?: boolean;
    assignFromPool?: mongoose.Types.ObjectId;
}

export interface IOnboardingKit extends Document {
    name: string;
    description?: string;
    department?: mongoose.Types.ObjectId;
    departmentName?: string;
    role?: string;
    employeeType?: 'full_time' | 'part_time' | 'contractor' | 'intern' | 'temporary';
    isTemplate: boolean;
    templateId?: mongoose.Types.ObjectId;
    status: 'draft' | 'active' | 'archived';
    items: IChecklistItem[];
    // Legacy fields
    assets: mongoose.Types.ObjectId[];
    licenses: mongoose.Types.ObjectId[];
    estimatedCompletionDays?: number;
    tags: string[];
    metadata?: Record<string, unknown>;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IKitAssignmentItem {
    itemIndex: number;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
    completedAt?: Date;
    completedBy?: mongoose.Types.ObjectId;
    assignedAssetId?: mongoose.Types.ObjectId;
    assignedLicenseId?: mongoose.Types.ObjectId;
    notes?: string;
    blockedReason?: string;
}

export interface IKitAssignment extends Document {
    kitId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    assignedBy: mongoose.Types.ObjectId;
    startDate: Date;
    completedDate?: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    itemStatuses: IKitAssignmentItem[];
    customizations?: {
        excludedItems?: number[];
        additionalItems?: IChecklistItem[];
        notes?: string;
    };
    progress: {
        total: number;
        completed: number;
        percentage: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// Sub-Schemas
// ============================================

const checklistItemSchema = new Schema<IChecklistItem>({
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    type: {
        type: String,
        enum: ['asset', 'license', 'access', 'training', 'document', 'task', 'other'],
        default: 'task'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical'],
        default: 'normal'
    },
    referenceId: { type: Schema.Types.ObjectId },
    referenceModel: { type: String, enum: ['Asset', 'License', 'AssetGroup'] },
    quantity: { type: Number, default: 1, min: 1 },
    isRequired: { type: Boolean, default: true },
    estimatedMinutes: { type: Number, min: 0 },
    dueOffsetDays: { type: Number, min: 0 },
    dependsOn: [{ type: Number }],
    instructions: { type: String, trim: true, maxlength: 2000 },
    documentUrl: { type: String, trim: true },
    // Template-specific
    assetCategory: { type: String, trim: true, maxlength: 100 },
    licenseType: { type: String, trim: true, maxlength: 100 },
    accessType: { type: String, trim: true, maxlength: 100 },
    autoAssign: { type: Boolean, default: false },
    assignFromPool: { type: Schema.Types.ObjectId, ref: 'AssetGroup' }
}, { _id: true });

const assignmentItemSchema = new Schema<IKitAssignmentItem>({
    itemIndex: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'skipped', 'blocked'],
        default: 'pending'
    },
    completedAt: { type: Date },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedAssetId: { type: Schema.Types.ObjectId, ref: 'Asset' },
    assignedLicenseId: { type: Schema.Types.ObjectId, ref: 'License' },
    notes: { type: String, trim: true, maxlength: 500 },
    blockedReason: { type: String, trim: true, maxlength: 500 }
}, { _id: false });

// ============================================
// Main Onboarding Kit Schema
// ============================================

const onboardingKitSchema = new Schema<IOnboardingKit>(
    {
        name: {
            type: String,
            required: [true, 'Kit name is required'],
            trim: true,
            maxlength: 200
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        department: {
            type: Schema.Types.ObjectId,
            ref: 'Department'
        },
        departmentName: {
            type: String,
            trim: true,
            maxlength: 100
        },
        role: {
            type: String,
            trim: true,
            maxlength: 100
        },
        employeeType: {
            type: String,
            enum: ['full_time', 'part_time', 'contractor', 'intern', 'temporary']
        },
        isTemplate: {
            type: Boolean,
            default: false,
            index: true
        },
        templateId: {
            type: Schema.Types.ObjectId,
            ref: 'OnboardingKit'
        },
        status: {
            type: String,
            enum: ['draft', 'active', 'archived'],
            default: 'draft',
            index: true
        },
        items: [checklistItemSchema],
        // Legacy fields for backward compatibility
        assets: [{
            type: Schema.Types.ObjectId,
            ref: 'AssetGroup'
        }],
        licenses: [{
            type: Schema.Types.ObjectId,
            ref: 'License'
        }],
        estimatedCompletionDays: {
            type: Number,
            min: 1,
            max: 365
        },
        tags: [{
            type: String,
            trim: true,
            maxlength: 50
        }],
        metadata: {
            type: Schema.Types.Mixed
        },
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

// ============================================
// Kit Assignment Schema
// ============================================

const kitAssignmentSchema = new Schema<IKitAssignment>(
    {
        kitId: {
            type: Schema.Types.ObjectId,
            ref: 'OnboardingKit',
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        completedDate: {
            type: Date
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            default: 'pending',
            index: true
        },
        itemStatuses: [assignmentItemSchema],
        customizations: {
            excludedItems: [{ type: Number }],
            additionalItems: [checklistItemSchema],
            notes: { type: String, trim: true, maxlength: 1000 }
        },
        progress: {
            total: { type: Number, default: 0 },
            completed: { type: Number, default: 0 },
            percentage: { type: Number, default: 0 }
        }
    },
    {
        timestamps: true
    }
);

// ============================================
// Indexes
// ============================================

onboardingKitSchema.index({ isTemplate: 1, status: 1 });
onboardingKitSchema.index({ department: 1, role: 1 });
onboardingKitSchema.index({ tags: 1 });
onboardingKitSchema.index({ name: 'text', description: 'text' });

kitAssignmentSchema.index({ userId: 1, status: 1 });
kitAssignmentSchema.index({ kitId: 1, status: 1 });
kitAssignmentSchema.index({ startDate: 1 });

// ============================================
// Methods - OnboardingKit
// ============================================

// Get total estimated time
onboardingKitSchema.methods.getTotalEstimatedTime = function(): number {
    return this.items.reduce((total: number, item: IChecklistItem) => 
        total + (item.estimatedMinutes || 0), 0
    );
};

// Get required items count
onboardingKitSchema.methods.getRequiredItemsCount = function(): number {
    return this.items.filter((item: IChecklistItem) => item.isRequired).length;
};

// Clone kit
onboardingKitSchema.methods.clone = async function(name: string, asTemplate: boolean = false): Promise<IOnboardingKit> {
    const OnboardingKit = mongoose.model('OnboardingKit');
    const cloned = new OnboardingKit({
        ...this.toObject(),
        _id: new mongoose.Types.ObjectId(),
        name,
        isTemplate: asTemplate,
        templateId: asTemplate ? undefined : this._id,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
    });
    return await cloned.save();
};

// ============================================
// Methods - KitAssignment
// ============================================

// Update progress
kitAssignmentSchema.methods.updateProgress = function(): void {
    const total = this.itemStatuses.length;
    const completed = this.itemStatuses.filter(
        (item: IKitAssignmentItem) => item.status === 'completed' || item.status === 'skipped'
    ).length;
    
    this.progress = {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };

    // Update overall status
    if (this.progress.percentage === 100) {
        this.status = 'completed';
        this.completedDate = new Date();
    } else if (completed > 0) {
        this.status = 'in_progress';
    }
};

// Update item status
kitAssignmentSchema.methods.updateItemStatus = async function(
    itemIndex: number,
    status: string,
    userId?: mongoose.Types.ObjectId,
    notes?: string
): Promise<IKitAssignment> {
    const itemStatus = this.itemStatuses.find((i: IKitAssignmentItem) => i.itemIndex === itemIndex);
    
    if (itemStatus) {
        itemStatus.status = status;
        if (status === 'completed') {
            itemStatus.completedAt = new Date();
            itemStatus.completedBy = userId;
        }
        if (notes) itemStatus.notes = notes;
    }
    
    this.updateProgress();
    return await this.save();
};

// ============================================
// Static Methods
// ============================================

// Find recommended kits
onboardingKitSchema.statics.findRecommended = async function(
    criteria: { department?: string; role?: string; employeeType?: string },
    limit: number = 5
) {
    const filter: any = { 
        isTemplate: true, 
        status: 'active',
        isActive: true 
    };
    
    if (criteria.department) filter.department = criteria.department;
    if (criteria.role) filter.role = { $regex: criteria.role, $options: 'i' };
    if (criteria.employeeType) filter.employeeType = criteria.employeeType;

    return this.find(filter)
        .populate('department', 'name')
        .limit(limit)
        .lean();
};

// Get assignment statistics
kitAssignmentSchema.statics.getStatistics = async function(filters: any = {}) {
    const match: any = {};
    if (filters.kitId) match.kitId = new mongoose.Types.ObjectId(filters.kitId);
    if (filters.startDate) match.startDate = { $gte: new Date(filters.startDate) };
    if (filters.endDate) match.startDate = { ...match.startDate, $lte: new Date(filters.endDate) };

    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgProgress: { $avg: '$progress.percentage' }
            }
        }
    ]);
};

// ============================================
// Pre-save Hooks
// ============================================

// Initialize item statuses on assignment creation
kitAssignmentSchema.pre('save', async function(next) {
    if (this.isNew && this.itemStatuses.length === 0) {
        const OnboardingKit = mongoose.model('OnboardingKit');
        const kit = await OnboardingKit.findById(this.kitId);
        
        if (kit) {
            const excludedItems = this.customizations?.excludedItems || [];
            
            this.itemStatuses = kit.items
                .map((item: IChecklistItem, index: number) => ({
                    itemIndex: index,
                    status: 'pending' as const,
                    notes: undefined
                }))
                .filter((_, index: number) => !excludedItems.includes(index));
            
            // Add any additional items
            if (this.customizations?.additionalItems?.length) {
                const startIndex = kit.items.length;
                this.customizations.additionalItems.forEach((_, index: number) => {
                    this.itemStatuses.push({
                        itemIndex: startIndex + index,
                        status: 'pending',
                        notes: undefined
                    });
                });
            }
            
            this.updateProgress();
        }
    }
    next();
});

export const OnboardingKit = mongoose.model<IOnboardingKit>('OnboardingKit', onboardingKitSchema);
export const KitAssignment = mongoose.model<IKitAssignment>('KitAssignment', kitAssignmentSchema);
