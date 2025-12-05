import { Request, Response, NextFunction } from 'express';
import { assetGroupService } from './asset-group.service';
import { AuthRequest } from '../../core/middleware/auth.middleware';

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const groups = await assetGroupService.getAssetGroups(req.query);
        res.json({
            success: true,
            data: groups
        });
    } catch (error) {
        next(error);
    }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const group = await assetGroupService.getAssetGroupById(req.params.id!);

        if (!group) {
            res.status(404).json({
                success: false,
                message: 'Asset group not found'
            });
            return;
        }

        res.json({
            success: true,
            data: group
        });
    } catch (error) {
        next(error);
    }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
            return;
        }

        const groupData = {
            ...req.body,
            createdBy: req.user._id
        };

        const group = await assetGroupService.createAssetGroup(groupData);

        res.status(201).json({
            success: true,
            data: group
        });
    } catch (error) {
        next(error);
    }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const group = await assetGroupService.updateAssetGroup(req.params.id!, req.body);

        if (!group) {
            res.status(404).json({
                success: false,
                message: 'Asset group not found'
            });
            return;
        }

        res.json({
            success: true,
            data: group
        });
    } catch (error) {
        next(error);
    }
};

export const deleteGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const group = await assetGroupService.deleteAssetGroup(req.params.id!);

        if (!group) {
            res.status(404).json({
                success: false,
                message: 'Asset group not found'
            });
            return;
        }

        res.json({
            success: true,
            message: 'Asset group deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const getLowStockAlerts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const alerts = await assetGroupService.getLowStockAlerts();

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        next(error);
    }
};

export const addAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { assetIds } = req.body;

        if (!Array.isArray(assetIds) || assetIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Asset IDs array is required'
            });
            return;
        }

        const group = await assetGroupService.addAssets(req.params.id!, assetIds);

        if (!group) {
            res.status(404).json({
                success: false,
                message: 'Asset group not found'
            });
            return;
        }

        res.json({
            success: true,
            data: group
        });
    } catch (error) {
        next(error);
    }
};

export const removeAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { assetIds } = req.body;

        if (!Array.isArray(assetIds) || assetIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Asset IDs array is required'
            });
            return;
        }

        const group = await assetGroupService.removeAssets(req.params.id!, assetIds);

        if (!group) {
            res.status(404).json({
                success: false,
                message: 'Asset group not found'
            });
            return;
        }

        res.json({
            success: true,
            data: group
        });
    } catch (error) {
        next(error);
    }
};
