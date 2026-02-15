import mongoose, { Document, Schema } from 'mongoose';

// ============================================
// Interfaces
// ============================================

export interface IRelatedEntity {
    type: 'asset' | 'license' | 'user' | 'vendor' | 'department' | 'location' | 'other';
    id: mongoose.Types.ObjectId;
    name?: string;
}

export interface IDeliveryStatus {
    channel: 'in_app' | 'email' | 'webhook' | 'sms' | 'slack' | 'teams';
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    sentAt?: Date;
    deliveredAt?: Date;
    error?: string;
    attempts: number;
}

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'alert' | 'reminder' | 'system';
    category: 'asset' | 'license' | 'warranty' | 'maintenance' | 'security' | 'user' | 'system' | 'report' | 'other';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    link?: string;
    actionLabel?: string;
    actionUrl?: string;
    relatedEntity?: IRelatedEntity;
    channels: ('in_app' | 'email' | 'webhook' | 'sms' | 'slack' | 'teams')[];
    deliveryStatus: IDeliveryStatus[];
    read: boolean;
    readAt?: Date;
    scheduledFor?: Date;
    expiresAt?: Date;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface INotificationPreferences extends Document {
    userId: mongoose.Types.ObjectId;
    inApp: {
        enabled: boolean;
        categories?: string[];
        minPriority: string;
        quietHoursStart?: string;
        quietHoursEnd?: string;
        timezone?: string;
    };
    email: {
        enabled: boolean;
        categories?: string[];
        minPriority: string;
        digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
        quietHoursStart?: string;
        quietHoursEnd?: string;
        timezone?: string;
    };
    webhook: {
        enabled: boolean;
        url?: string;
        secret?: string;
        categories?: string[];
        minPriority: string;
    };
    slack: {
        enabled: boolean;
        webhookUrl?: string;
        channel?: string;
        categories?: string[];
    };
    teams: {
        enabled: boolean;
        webhookUrl?: string;
        categories?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// Sub-Schemas
// ============================================

const relatedEntitySchema = new Schema<IRelatedEntity>({
    type: {
        type: String,
        enum: ['asset', 'license', 'user', 'vendor', 'department', 'location', 'other'],
        required: true
    },
    id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        trim: true
    }
}, { _id: false });

const deliveryStatusSchema = new Schema<IDeliveryStatus>({
    channel: {
        type: String,
        enum: ['in_app', 'email', 'webhook', 'sms', 'slack', 'teams'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending'
    },
    sentAt: Date,
    deliveredAt: Date,
    error: String,
    attempts: {
        type: Number,
        default: 0
    }
}, { _id: false });

// ============================================
// Main Notification Schema
// ============================================

const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },
        type: {
            type: String,
            enum: ['info', 'warning', 'error', 'success', 'alert', 'reminder', 'system'],
            default: 'info'
        },
        category: {
            type: String,
            enum: ['asset', 'license', 'warranty', 'maintenance', 'security', 'user', 'system', 'report', 'other'],
            default: 'other'
        },
        priority: {
            type: String,
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal'
        },
        link: {
            type: String,
            trim: true
        },
        actionLabel: {
            type: String,
            trim: true,
            maxlength: 50
        },
        actionUrl: {
            type: String,
            trim: true
        },
        relatedEntity: relatedEntitySchema,
        channels: [{
            type: String,
            enum: ['in_app', 'email', 'webhook', 'sms', 'slack', 'teams']
        }],
        deliveryStatus: [deliveryStatusSchema],
        read: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: {
            type: Date
        },
        scheduledFor: {
            type: Date,
            index: true
        },
        expiresAt: {
            type: Date,
            index: true
        },
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

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, category: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, priority: 1, read: 1 });
notificationSchema.index({ scheduledFor: 1 }, { sparse: true });
notificationSchema.index({ expiresAt: 1 }, { sparse: true });
notificationSchema.index({ 'deliveryStatus.channel': 1, 'deliveryStatus.status': 1 });

// ============================================
// Notification Preferences Schema
// ============================================

const channelPrefsSchema = {
    enabled: { type: Boolean, default: true },
    categories: [{ type: String }],
    minPriority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'low' },
    quietHoursStart: { type: String },
    quietHoursEnd: { type: String },
    timezone: { type: String }
};

const notificationPreferencesSchema = new Schema<INotificationPreferences>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        inApp: {
            ...channelPrefsSchema,
            enabled: { type: Boolean, default: true }
        },
        email: {
            ...channelPrefsSchema,
            enabled: { type: Boolean, default: true },
            digestFrequency: { 
                type: String, 
                enum: ['immediate', 'hourly', 'daily', 'weekly'],
                default: 'immediate'
            }
        },
        webhook: {
            enabled: { type: Boolean, default: false },
            url: { type: String, trim: true },
            secret: { type: String },
            categories: [{ type: String }],
            minPriority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' }
        },
        slack: {
            enabled: { type: Boolean, default: false },
            webhookUrl: { type: String, trim: true },
            channel: { type: String, trim: true },
            categories: [{ type: String }]
        },
        teams: {
            enabled: { type: Boolean, default: false },
            webhookUrl: { type: String, trim: true },
            categories: [{ type: String }]
        }
    },
    {
        timestamps: true
    }
);

// ============================================
// Static Methods
// ============================================

// Get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId: mongoose.Types.ObjectId): Promise<number> {
    return this.countDocuments({ userId, read: false });
};

// Get notifications pending delivery
notificationSchema.statics.getPendingDeliveries = async function(channel: string) {
    return this.find({
        'deliveryStatus': {
            $elemMatch: {
                channel,
                status: 'pending',
                attempts: { $lt: 3 }
            }
        },
        $or: [
            { scheduledFor: { $exists: false } },
            { scheduledFor: { $lte: new Date() } }
        ]
    }).populate('userId', 'email name');
};

// Clean up expired notifications
notificationSchema.statics.cleanupExpired = async function() {
    return this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
};

// ============================================
// Methods
// ============================================

// Mark as read
notificationSchema.methods.markAsRead = async function(): Promise<INotification> {
    this.read = true;
    this.readAt = new Date();
    return await this.save();
};

// Update delivery status
notificationSchema.methods.updateDeliveryStatus = async function(
    channel: string,
    status: 'pending' | 'sent' | 'delivered' | 'failed',
    error?: string
): Promise<INotification> {
    const delivery = this.deliveryStatus.find((d: IDeliveryStatus) => d.channel === channel);
    
    if (delivery) {
        delivery.status = status;
        delivery.attempts += 1;
        if (status === 'sent') delivery.sentAt = new Date();
        if (status === 'delivered') delivery.deliveredAt = new Date();
        if (error) delivery.error = error;
    }
    
    return await this.save();
};

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export const NotificationPreferences = mongoose.model<INotificationPreferences>('NotificationPreferences', notificationPreferencesSchema);
