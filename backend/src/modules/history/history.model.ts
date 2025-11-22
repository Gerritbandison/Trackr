import mongoose, { Schema, Document } from 'mongoose';

export interface IHistoryLog extends Document {
    timestamp: Date;
    actorId: string; // User ID who performed the action
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    resourceType: string; // e.g., 'Asset'
    resourceId: string;
    previousValue?: any;
    newValue?: any;
}

const HistoryLogSchema: Schema = new Schema({
    timestamp: { type: Date, default: Date.now },
    actorId: { type: String, required: true }, // In a real app, this would be a Ref to User
    action: { type: String, required: true, enum: ['CREATE', 'UPDATE', 'DELETE'] },
    resourceType: { type: String, required: true },
    resourceId: { type: String, required: true },
    previousValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
});

export default mongoose.model<IHistoryLog>('HistoryLog', HistoryLogSchema);
