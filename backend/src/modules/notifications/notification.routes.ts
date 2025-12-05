import { Router, Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { Notification } from './notification.model';
import { authenticate, AuthRequest } from '../../core/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all notifications for current user
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const { unreadOnly } = req.query;
        const filter: any = { userId: req.user._id };

        if (unreadOnly === 'true') {
            filter.read = false;
        }

        const notifications = await Notification.find(filter)
            .sort('-createdAt')
            .limit(50)
            .lean();

        res.json({ success: true, data: notifications });
    } catch (error) {
        next(error);
    }
});

// Mark notification as read
router.put('/:id/read', [
    param('id').isMongoId()
], async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: { read: true } },
            { new: true }
        ).lean();

        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }

        res.json({ success: true, data: notification });
    } catch (error) {
        next(error);
    }
});

// Mark all notifications as read
router.put('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { $set: { read: true } }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
});

// Delete notification
router.delete('/:id', [
    param('id').isMongoId()
], async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }

        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        }).lean();

        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }

        res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
