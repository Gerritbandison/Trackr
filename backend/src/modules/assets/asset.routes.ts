import { Router, Request, Response, NextFunction } from 'express';
import { assetService } from './asset.service';

const router = Router();

// Get all assets
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assets = await assetService.getAssets();
        res.json({ success: true, data: assets, error: null });
    } catch (error) {
        next(error);
    }
});

// Get asset by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.getAssetById(req.params.id);
        if (!asset) {
            return res.status(404).json({ success: false, data: null, error: 'Asset not found' });
        }
        res.json({ success: true, data: asset, error: null });
    } catch (error) {
        next(error);
    }
});

// Get asset depreciation
router.get('/:id/depreciation', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const depreciation = await assetService.calculateDepreciation(req.params.id);
        if (!depreciation) {
            return res.status(404).json({ success: false, data: null, error: 'Asset not found' });
        }
        res.json({ success: true, data: depreciation, error: null });
    } catch (error) {
        next(error);
    }
});

// Create asset
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.createAsset(req.body);
        res.status(201).json({ success: true, data: asset, error: null });
    } catch (error) {
        next(error);
    }
});

// Update asset
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.updateAsset(req.params.id, req.body);
        if (!asset) {
            return res.status(404).json({ success: false, data: null, error: 'Asset not found' });
        }
        res.json({ success: true, data: asset, error: null });
    } catch (error) {
        next(error);
    }
});

// Delete asset
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.deleteAsset(req.params.id);
        if (!asset) {
            return res.status(404).json({ success: false, data: null, error: 'Asset not found' });
        }
        res.json({ success: true, data: null, error: null });
    } catch (error) {
        next(error);
    }
});

export default router;
