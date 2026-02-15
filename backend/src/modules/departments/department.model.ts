import mongoose, { Document, Schema } from 'mongoose';

// ============================================
// Interfaces
// ============================================

export interface IBudgetAllocation {
    _id?: mongoose.Types.ObjectId;
    category: string;
    amount: number;
    fiscalYear: number;
    spent: number;
    notes?: string;
}

export interface IBudget {
    annualBudget?: number;
    fiscalYear?: number;
    currency: string;
    allocations: IBudgetAllocation[];
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
}

export interface IDepartment extends Document {
    name: string;
    code?: string;
    description?: string;
    
    // Hierarchy
    parentDepartment?: mongoose.Types.ObjectId;
    
    // Management
    manager?: mongoose.Types.ObjectId;
    headCount?: number;
    
    // Cost center & budget
    costCenter?: string;
    budget?: IBudget;
    
    // Location
    location?: mongoose.Types.ObjectId;
    locationName?: string;
    
    // Contact
    email?: string;
    phone?: string;
    slackChannel?: string;
    
    // Status
    isActive: boolean;
    
    // Metadata
    tags: string[];
    metadata?: Record<string, unknown>;
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Methods
    getChildren(): Promise<IDepartment[]>;
    getAncestors(): Promise<IDepartment[]>;
    getFullPath(): Promise<string>;
    getBudgetRemaining(): number;
}

// ============================================
// Sub-Schemas
// ============================================

const budgetAllocationSchema = new Schema<IBudgetAllocation>({
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    fiscalYear: { type: Number, required: true },
    spent: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true }
}, { _id: true });

const budgetSchema = new Schema<IBudget>({
    annualBudget: { type: Number, min: 0 },
    fiscalYear: { type: Number },
    currency: { type: String, default: 'USD', maxlength: 3 },
    allocations: [budgetAllocationSchema],
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
}, { _id: false });

// ============================================
// Main Schema
// ============================================

const departmentSchema = new Schema<IDepartment>(
    {
        name: {
            type: String,
            required: [true, 'Department name is required'],
            unique: true,
            trim: true
        },
        code: {
            type: String,
            trim: true,
            uppercase: true,
            sparse: true,
            unique: true
        },
        description: {
            type: String,
            trim: true
        },
        // Hierarchy support
        parentDepartment: {
            type: Schema.Types.ObjectId,
            ref: 'Department',
            default: null
        },
        manager: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        headCount: {
            type: Number,
            min: 0,
            default: 0
        },
        costCenter: {
            type: String,
            trim: true
        },
        budget: budgetSchema,
        location: {
            type: Schema.Types.ObjectId,
            ref: 'Location'
        },
        locationName: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
        },
        phone: {
            type: String,
            trim: true
        },
        slackChannel: {
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
    },
    {
        timestamps: true
    }
);

// ============================================
// Indexes
// ============================================

departmentSchema.index({ isActive: 1, createdAt: -1 });
departmentSchema.index({ parentDepartment: 1 });
departmentSchema.index({ manager: 1 });
departmentSchema.index({ costCenter: 1 });
departmentSchema.index({ tags: 1 });
departmentSchema.index({ name: 'text', description: 'text' });

// ============================================
// Virtuals
// ============================================

// Virtual populate for children
departmentSchema.virtual('children', {
    ref: 'Department',
    localField: '_id',
    foreignField: 'parentDepartment'
});

// Virtual populate for employees
departmentSchema.virtual('employees', {
    ref: 'User',
    localField: '_id',
    foreignField: 'department'
});

// ============================================
// Methods
// ============================================

// Get all child departments
departmentSchema.methods.getChildren = async function(): Promise<IDepartment[]> {
    return await mongoose.model('Department').find({ parentDepartment: this._id, isActive: true });
};

// Get all ancestors (parent chain)
departmentSchema.methods.getAncestors = async function(): Promise<IDepartment[]> {
    const ancestors: IDepartment[] = [];
    let current: IDepartment | null = this;

    while (current?.parentDepartment) {
        const parent = await mongoose.model('Department').findById(current.parentDepartment);
        if (!parent) break;
        ancestors.push(parent);
        current = parent;
    }

    return ancestors.reverse(); // Root first
};

// Get full path (e.g., "Company > Engineering > Backend")
departmentSchema.methods.getFullPath = async function(): Promise<string> {
    const ancestors = await this.getAncestors();
    const names = [...ancestors.map((a: IDepartment) => a.name), this.name];
    return names.join(' > ');
};

// Get remaining budget
departmentSchema.methods.getBudgetRemaining = function(): number {
    if (!this.budget?.annualBudget) return 0;
    
    const totalSpent = this.budget.allocations?.reduce(
        (sum: number, alloc: IBudgetAllocation) => sum + (alloc.spent || 0), 
        0
    ) || 0;
    
    return this.budget.annualBudget - totalSpent;
};

// ============================================
// Static Methods
// ============================================

// Get department tree starting from root
departmentSchema.statics.getTree = async function(rootId?: string) {
    const buildTree = async (parentId: mongoose.Types.ObjectId | null): Promise<any[]> => {
        const departments = await this.find({ 
            parentDepartment: parentId, 
            isActive: true 
        }).populate('manager', 'name email').lean();

        return Promise.all(departments.map(async (dept: any) => ({
            ...dept,
            children: await buildTree(dept._id)
        })));
    };

    if (rootId) {
        const root = await this.findById(rootId).populate('manager', 'name email').lean();
        if (!root) return null;
        return {
            ...root,
            children: await buildTree(new mongoose.Types.ObjectId(rootId))
        };
    }

    return buildTree(null);
};

// Get all descendants of a department
departmentSchema.statics.getDescendants = async function(departmentId: string): Promise<IDepartment[]> {
    const descendants: IDepartment[] = [];
    
    const collectDescendants = async (parentId: mongoose.Types.ObjectId) => {
        const children = await this.find({ parentDepartment: parentId });
        for (const child of children) {
            descendants.push(child);
            await collectDescendants(child._id);
        }
    };

    await collectDescendants(new mongoose.Types.ObjectId(departmentId));
    return descendants;
};

// ============================================
// Pre-save Hooks
// ============================================

// Prevent circular hierarchy
departmentSchema.pre('save', async function(next) {
    if (this.parentDepartment && this.isModified('parentDepartment')) {
        // Check if parent is not self
        if (this.parentDepartment.toString() === this._id.toString()) {
            throw new Error('Department cannot be its own parent');
        }

        // Check if parent is not a descendant
        const Department = mongoose.model('Department');
        const descendants = await (Department as any).getDescendants(this._id.toString());
        const descendantIds = descendants.map((d: IDepartment) => d._id.toString());
        
        if (descendantIds.includes(this.parentDepartment.toString())) {
            throw new Error('Cannot set a descendant as parent (circular hierarchy)');
        }
    }
    next();
});

// Enable virtuals in JSON
departmentSchema.set('toJSON', { virtuals: true });
departmentSchema.set('toObject', { virtuals: true });

export default mongoose.model<IDepartment>('Department', departmentSchema);
