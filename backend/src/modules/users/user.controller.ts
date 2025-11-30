import { Response } from 'express';
import { userService } from './user.service';
import { AuthRequest } from '../../core/middleware/auth.middleware';
import { validationResult } from 'express-validator';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, department, isActive } = req.query;

        const filter: Record<string, string | boolean> = {};
        if (role) filter.role = role as string;
        if (department) filter.department = department as string;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const users = await userService.getUsers(filter);

        res.status(200).json({
            success: true,
            data: users,
            count: users.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const requestedUserId = req.params.id as string;
        const currentUser = req.user;

        // Check if user is trying to access their own profile or is admin/manager
        if (currentUser?.role === 'staff' && currentUser._id.toString() !== requestedUserId) {
            res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own profile.'
            });
            return;
        }

        const user = await userService.getUserById(requestedUserId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }

        const user = await userService.createUser(req.body);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array()
            });
            return;
        }

        const requestedUserId = req.params.id as string;
        const currentUser = req.user;

        // Check if user is authorized (admin or updating own profile)
        const isAdmin = currentUser?.role === 'admin';
        const isOwnProfile = currentUser?._id.toString() === requestedUserId;

        if (!isAdmin && !isOwnProfile) {
            res.status(403).json({
                success: false,
                message: 'Access denied. You can only update your own profile.'
            });
            return;
        }

        // Remove email from update data (email should not be updatable)
        const updateData = { ...req.body };
        delete updateData.email;

        const user = await userService.updateUser(requestedUserId, updateData);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await userService.deleteUser(req.params.id as string);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'User deactivated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const reactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await userService.reactivateUser(req.params.id as string);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'User reactivated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reactivating user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getUsersByRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await userService.getUsersByRole(req.params.role as string);

        res.status(200).json({
            success: true,
            data: users,
            count: users.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users by role',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getUsersByDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await userService.getUsersByDepartment(req.params.department as string);

        res.status(200).json({
            success: true,
            data: users,
            count: users.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users by department',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
