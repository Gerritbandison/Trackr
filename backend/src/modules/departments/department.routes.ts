import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import { validationResult } from 'express-validator';
import Department from './department.model';
import { authenticate, authorize, AuthRequest } from '../../core/middleware/auth.middleware';
import mongoose from 'mongoose';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all departments
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { isActive } = req.query;
        const filter: Record<string, boolean> = {};
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const departments = await Department.find(filter).populate('manager', 'name email');
        res.json({ success: true, data: departments, count: departments.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching departments', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Get department by ID
router.get('/:id', param('id').isMongoId(), async (req: AuthRequest, res: Response) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id!)) {
            res.status(400).json({ success: false, message: 'Invalid department ID' });
            return;
        }

        const department = await Department.findById(req.params.id!).populate('manager', 'name email department');
        if (!department) {
            res.status(404).json({ success: false, message: 'Department not found' });
            return;
        }

        res.json({ success: true, data: department });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching department', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// Create department (admin only)
router.post('/',
    authorize('admin'),
    [
        body('name').trim().notEmpty().withMessage('Department name is required'),
        body('budget').optional().isNumeric().withMessage('Budget must be a number')
    ],
    async (req: AuthRequest, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, errors: errors.array() });
                return;
            }

            const department = new Department(req.body);
            await department.save();

            res.status(201).json({ success: true, message: 'Department created successfully', data: department });
        } catch (error) {
            res.status(400).json({ success: false, message: 'Error creating department', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
);

// Update department (admin only)
router.put('/:id',
    authorize('admin'),
    [
        param('id').isMongoId(),
        body('name').optional().trim().notEmpty(),
        body('budget').optional().isNumeric()
    ],
    async (req: AuthRequest, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, errors: errors.array() });
                return;
            }

            const department = await Department.findByIdAndUpdate(req.params.id!, req.body, { new: true, runValidators: true });
            if (!department) {
                res.status(404).json({ success: false, message: 'Department not found' });
                return;
            }

            res.json({ success: true, message: 'Department updated successfully', data: department });
        } catch (error) {
            res.status(400).json({ success: false, message: 'Error updating department', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
);

// Delete department (admin only)
router.delete('/:id',
    authorize('admin'),
    param('id').isMongoId(),
    async (req: AuthRequest, res: Response) => {
        try {
            const department = await Department.findByIdAndUpdate(req.params.id!, { isActive: false }, { new: true });
            if (!department) {
                res.status(404).json({ success: false, message: 'Department not found' });
                return;
            }

            res.json({ success: true, message: 'Department deactivated successfully', data: department });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error deleting department', error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
);

export default router;
