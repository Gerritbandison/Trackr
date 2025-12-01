import HistoryLog, { IHistoryLog } from './history.model';

interface GetHistoryLogsQuery {
    limit?: number;
    sort?: string;
    resourceType?: string;
    action?: string;
    actorId?: string;
}

export const historyService = {
    /**
     * Get all history logs with optional filtering
     */
    async getHistoryLogs(query: GetHistoryLogsQuery = {}): Promise<IHistoryLog[]> {
        const { limit = 100, sort = '-timestamp', resourceType, action, actorId } = query;

        const filter: any = {};
        if (resourceType) filter.resourceType = resourceType;
        if (action) filter.action = action;
        if (actorId) filter.actorId = actorId;

        return await HistoryLog.find(filter)
            .sort(sort)
            .limit(limit)
            .lean();
    },

    /**
     * Get history logs for a specific resource
     */
    async getResourceLogs(resourceType: string, resourceId: string): Promise<IHistoryLog[]> {
        return await HistoryLog.find({
            resourceType: resourceType.charAt(0).toUpperCase() + resourceType.slice(1),
            resourceId
        })
            .sort('-timestamp')
            .lean();
    },

    /**
     * Get user activity logs
     */
    async getUserActivity(userId: string, limit: number = 50): Promise<IHistoryLog[]> {
        return await HistoryLog.find({ actorId: userId })
            .sort('-timestamp')
            .limit(limit)
            .lean();
    },

    /**
     * Get audit log statistics
     */
    async getStats() {
        const [totalLogs, actionBreakdown, recentActivity] = await Promise.all([
            HistoryLog.countDocuments(),
            HistoryLog.aggregate([
                {
                    $group: {
                        _id: '$action',
                        count: { $sum: 1 }
                    }
                }
            ]),
            HistoryLog.find()
                .sort('-timestamp')
                .limit(10)
                .lean()
        ]);

        return {
            totalLogs,
            actionBreakdown: actionBreakdown.reduce((acc: any, item: any) => {
                acc[item._id.toLowerCase()] = item.count;
                return acc;
            }, {}),
            recentActivity
        };
    },

    /**
     * Get a single audit log by ID
     */
    async getById(id: string): Promise<IHistoryLog | null> {
        return await HistoryLog.findById(id).lean();
    }
};
