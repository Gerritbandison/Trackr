import { Router, Request, Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { OnboardingKit } from './onboarding-kit.model';
import { authenticate, authorize, AuthRequest } from '../../core/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all onboarding kits
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const kits = await OnboardingKit.find()
            .populate('createdBy', 'name email')
            .populate('assets')
            .populate('licenses')
            .sort('-createdAt')
            .lean();

        res.json({ success: true, data: kits });
    } catch (error) {
        next(error);
    }
});

// Get kit by ID
router.get('/:id', [
    param('id').isMongoId()
], async (req: Request, res: Response, next: NextFunction) => {
    try {
        const kit = await OnboardingKit.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('assets')
            .populate('licenses')
            .lean();

        if (!kit) {
            res.status(404).json({ success: false, message: 'Onboarding kit not found' });
            return;
        }

        res.json({ success: true, data: kit });
    } catch (error) {
        next(error);
    }
});

// Create kit (admin/manager only)
router.post('/', authorize('admin', 'manager'), async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const kit = new OnboardingKit({
            ...req.body,
            createdBy: req.user._id
        });

        await kit.save();
        res.status(201).json({ success: true, data: kit });
    } catch (error) {
        next(error);
    }
});

// Update kit (admin/manager only)
router.put('/:id', authorize('admin', 'manager'), [
    param('id').isMongoId()
], async (req: Request, res: Response, next: NextFunction) => {
    try {
        const kit = await OnboardingKit.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).lean();

        if (!kit) {
            res.status(404).json({ success: false, message: 'Onboarding kit not found' });
            return;
        }

        res.json({ success: true, data: kit });
    } catch (error) {
        next(error);
    }
});

// Delete kit (admin only)
router.delete('/:id', authorize('admin'), [
    param('id').isMongoId()
], async (req: Request, res: Response, next: NextFunction) => {
    try {
        const kit = await OnboardingKit.findByIdAndDelete(req.params.id).lean();

        if (!kit) {
            res.status(404).json({ success: false, message: 'Onboarding kit not found' });
            return;
        }

        res.json({ success: true, message: 'Onboarding kit deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Apply kit to user (admin/manager only)
router.post('/:id/apply', authorize('admin', 'manager'), [
    param('id').isMongoId()
], async (req: Request, res: Response, next: NextFunction) => {
    try {
        const kit = await OnboardingKit.findById(req.params.id)
            .populate('assets')
            .populate('licenses')
            .lean();

        if (!kit) {
            res.status(404).json({ success: false, message: 'Onboarding kit not found' });
            return;
        }

        // Here you would assign the assets and licenses to the user
        // For now, just return success
        res.json({
            success: true,
            message: 'Onboarding kit applied successfully',
            data: {
                kit,
                userId: req.body.userId
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get recommended kits
router.get('/recommended', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { department, role } = req.query;

        const filter: any = { isActive: true };
        if (department) filter.department = department;
        if (role) filter.role = role;

        const kits = await OnboardingKit.find(filter)
            .populate('assets')
            .populate('licenses')
            .limit(5)
            .lean();

        res.json({ success: true, data: kits });
    } catch (error) {
        next(error);
    }
});

export default router;
