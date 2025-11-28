import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import { validationResult } from 'express-validator';
import Vendor, { IVendor } from './vendor.model';
import { authenticate, authorize, AuthRequest } from '../../core/middleware/auth.middleware';
import mongoose from 'mongoose';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all vendors
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { status, category } = req.query;
        const filter: Record<string, string> = {};
        if (status) filter.status = status as string;
        if (category) filter.category = category as string;

        const vendors = await Vendor.find(filter);
        res.json({ success: true, data: vendors, count: vendors.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching vendors', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Get vendor by ID
router.get('/:id', param('id').isMongoId(), async (req: AuthRequest, res: Response) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            res.status(400).json({ success: false, message: 'Invalid vendor ID' });
            return;
        }

        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            res.status(404).json({ success: false, message: 'Vendor not found' });
            return;
        }

        res.json({ success: true, data: vendor });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching vendor', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Create vendor (admin/manager)
router.post('/',
    authorize('admin', 'manager'),
    [
        body('name').trim().notEmpty().withMessage('Vendor name is required'),
        body('email').optional().isEmail().withMessage('Invalid email address')
    ],
    async (req: AuthRequest, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, errors: errors.array() });
                return;
            }

            const vendor = new Vendor(req.body);
            await vendor.save();

            res.status(201).json({ success: true, message: 'Vendor created successfully', data: vendor });
        } catch (error) {
            res.status(400).json({ success: false, message: 'Error creating vendor', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
);

// Update vendor (admin/manager)
router.put('/:id',
    authorize('admin', 'manager'),
    [
        param('id').isMongoId(),
        body('name').optional().trim().notEmpty(),
        body('email').optional().isEmail()
    ],
    async (req: AuthRequest, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, errors: errors.array() });
                return;
            }

            const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            if (!vendor) {
                res.status(404).json({ success: false, message: 'Vendor not found' });
                return;
            }

            res.json({ success: true, message: 'Vendor updated successfully', data: vendor });
        } catch (error) {
            res.status(400).json({ success: false, message: 'Error updating vendor', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
);

// Delete vendor (admin only)
router.delete('/:id',
    authorize('admin'),
    param('id').isMongoId(),
    async (req: AuthRequest, res: Response) => {
        try {
            const vendor = await Vendor.findByIdAndDelete(req.params.id);
            if (!vendor) {
                res.status(404).json({ success: false, message: 'Vendor not found' });
                return;
            }

            res.json({ success: true, message: 'Vendor deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error deleting vendor', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
);

export default router;
