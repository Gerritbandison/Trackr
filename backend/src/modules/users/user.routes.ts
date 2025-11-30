import { Router } from 'express';
import { body, param } from 'express-validator';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    reactivateUser,
    getUsersByRole,
    getUsersByDepartment
} from './user.controller';
import { authenticate, authorize } from '../../core/middleware/auth.middleware';

const router = Router();

// Validation rules
const createUserValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('role')
        .isIn(['admin', 'manager', 'staff'])
        .withMessage('Role must be admin, manager, or staff'),
    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Department must not exceed 100 characters')
];

const updateUserValidation = [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('role')
        .optional()
        .isIn(['admin', 'manager', 'staff'])
        .withMessage('Role must be admin, manager, or staff'),
    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Department must not exceed 100 characters')
];

const idValidation = [
    param('id').isMongoId().withMessage('Invalid user ID')
];

// All routes require authentication
router.use(authenticate);

// Get all users - accessible by admin and manager
router.get('/', authorize('admin', 'manager'), getUsers);

// Get users by role - accessible by admin and manager
router.get('/role/:role', authorize('admin', 'manager'), getUsersByRole);

// Get users by department - accessible by admin and manager
router.get('/department/:department', authorize('admin', 'manager'), getUsersByDepartment);

// Get user by ID - accessible by all authenticated users (can view own profile)
router.get('/:id', idValidation, getUserById);

// Create user - admin only
router.post('/', authorize('admin'), createUserValidation, createUser);

// Update user - admin or self (authorization handled in controller)
router.put('/:id', updateUserValidation, updateUser);

// Delete user (deactivate) - admin only
router.delete('/:id', authorize('admin'), idValidation, deleteUser);

// Reactivate user - admin only
router.patch('/:id/reactivate', authorize('admin'), idValidation, reactivateUser);

export default router;
