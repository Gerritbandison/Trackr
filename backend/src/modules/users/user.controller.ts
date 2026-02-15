import { Response } from 'express';
import { userService } from './user.service';
import { AuthRequest } from '../../core/middleware/auth.middleware';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../../core/utils/response';
import { getPaginationParams } from '../../core/utils/pagination';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, department, isActive } = req.query;

        const filter: Record<string, string | boolean> = {};
        if (role) filter.role = role as string;
        if (department) filter.department = department as string;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const { page, limit } = getPaginationParams(req.query);
        const sort = req.query.sort as string || '-createdAt';
        const result = await userService.getUsers(filter, { page, limit, sort });

        ApiResponse.paginated(
            res,
            result.data,
            result.total,
            result.page,
            result.limit
        );
    } catch (error) {
        ApiResponse.error(res, 'Error fetching users', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const requestedUserId = req.params.id as string;
        const currentUser = req.user;

        // Check if user is trying to access their own profile or is admin/manager
        if (currentUser?.role === 'staff' && currentUser._id.toString() !== requestedUserId) {
            ApiResponse.forbidden(res, 'Access denied. You can only view your own profile.');
            return;
        }

        const user = await userService.getUserById(requestedUserId);

        if (!user) {
            ApiResponse.notFound(res, 'User not found');
            return;
        }

        ApiResponse.success(res, user);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching user', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            ApiResponse.badRequest(res, 'Validation failed', errors.array());
            return;
        }

        const user = await userService.createUser(req.body);
        ApiResponse.created(res, user, 'User created successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error creating user', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            ApiResponse.badRequest(res, 'Validation failed', errors.array());
            return;
        }

        const requestedUserId = req.params.id as string;
        const currentUser = req.user;

        // Check if user is authorized (admin or updating own profile)
        const isAdmin = currentUser?.role === 'admin';
        const isOwnProfile = currentUser?._id.toString() === requestedUserId;

        if (!isAdmin && !isOwnProfile) {
            ApiResponse.forbidden(res, 'Access denied. You can only update your own profile.');
            return;
        }

        // Remove email from update data (email should not be updatable)
        const updateData = { ...req.body };
        delete updateData.email;

        const user = await userService.updateUser(requestedUserId, updateData);

        if (!user) {
            ApiResponse.notFound(res, 'User not found');
            return;
        }

        ApiResponse.success(res, user, 'User updated successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error updating user', error instanceof Error ? error.message : 'Unknown error', 400);
    }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await userService.deleteUser(req.params.id as string);

        if (!user) {
            ApiResponse.notFound(res, 'User not found');
            return;
        }

        ApiResponse.success(res, user, 'User deactivated successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error deleting user', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const reactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await userService.reactivateUser(req.params.id as string);

        if (!user) {
            ApiResponse.notFound(res, 'User not found');
            return;
        }

        ApiResponse.success(res, user, 'User reactivated successfully');
    } catch (error) {
        ApiResponse.error(res, 'Error reactivating user', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getUsersByRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await userService.getUsersByRole(req.params.role as string);
        ApiResponse.success(res, users);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching users by role', error instanceof Error ? error.message : 'Unknown error');
    }
};

export const getUsersByDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await userService.getUsersByDepartment(req.params.department as string);
        ApiResponse.success(res, users);
    } catch (error) {
        ApiResponse.error(res, 'Error fetching users by department', error instanceof Error ? error.message : 'Unknown error');
    }
};
