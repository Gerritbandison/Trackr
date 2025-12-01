import { Router } from 'express';
import { param } from 'express-validator';
import { getAll, getById, getResourceLogs, getUserActivity, getStats } from './history.controller';
import { authenticate } from '../../core/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all audit logs with optional filters
router.get('/', getAll);

// Get audit log statistics
router.get('/stats/summary', getStats);

// Get audit logs for a specific resource
router.get('/resource/:targetType/:targetId', [
    param('targetType').trim().notEmpty().withMessage('Target type is required'),
    param('targetId').trim().notEmpty().withMessage('Target ID is required')
], getResourceLogs);

// Get user activity logs
router.get('/user/:userId', [
    param('userId').trim().notEmpty().withMessage('User ID is required')
], getUserActivity);

// Get single audit log by ID
router.get('/:id', [
    param('id').isMongoId().withMessage('Invalid audit log ID')
], getById);

export default router;
