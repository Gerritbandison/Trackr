import { Request, Response, NextFunction } from 'express';
import { historyService } from './history.service';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { limit, sort, resourceType, action, actorId } = req.query;

        const logs = await historyService.getHistoryLogs({
            limit: limit ? parseInt(limit as string) : undefined,
            sort: sort as string,
            resourceType: resourceType as string,
            action: action as string,
            actorId: actorId as string
        });

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        next(error);
    }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const log = await historyService.getById(req.params.id);

        if (!log) {
            res.status(404).json({
                success: false,
                message: 'Audit log not found'
            });
            return;
        }

        res.json({
            success: true,
            data: log
        });
    } catch (error) {
        next(error);
    }
};

export const getResourceLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { targetType, targetId } = req.params;

        const logs = await historyService.getResourceLogs(targetType, targetId);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        next(error);
    }
};

export const getUserActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

        const logs = await historyService.getUserActivity(userId, limit);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        next(error);
    }
};

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const stats = await historyService.getStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
