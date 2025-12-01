import { User, IUser } from './user.model';
import mongoose from 'mongoose';
import { PaginationOptions, PaginatedResult } from '../../core/utils/pagination';

interface UserFilter {
    role?: string;
    department?: string;
    isActive?: boolean;
    [key: string]: string | boolean | undefined;
}

export class UserService {
    // Get all users with pagination
    async getUsers(filter: UserFilter = {}, options: PaginationOptions = {}): Promise<PaginatedResult<any>> {
        try {
            const { page = 1, limit = 50, sort = '-createdAt' } = options;
            const skip = (page - 1) * limit;

            const [data, total] = await Promise.all([
                User.find(filter)
                    .select('-password -twoFactorSecret -__v')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                User.countDocuments(filter)
            ]);

            const pages = Math.ceil(total / limit);

            return {
                data,
                total,
                page,
                limit,
                pages,
                hasNext: page < pages,
                hasPrev: page > 1
            };
        } catch (error) {
            throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get user by ID
    async getUserById(id: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid user ID format');
            }
            return await User.findById(id)
                .select('-password -twoFactorSecret -__v')
                .lean();
        } catch (error) {
            throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get user by email
    async getUserByEmail(email: string): Promise<any> {
        try {
            return await User.findOne({ email })
                .select('-password -twoFactorSecret -__v')
                .lean();
        } catch (error) {
            throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Create user
    async createUser(data: Partial<IUser>): Promise<IUser> {
        try {
            const existingUser = await User.findOne({ email: data.email });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            const user = new User(data);
            await user.save();
            return user;
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new Error(`Validation failed: ${error.message}`);
            }
            throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Update user
    async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid user ID format');
            }

            // Don't allow password updates through this method
            const { password, ...updateData } = data as { password?: string; [key: string]: unknown };

            const user = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password -twoFactorSecret');

            return user;
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new Error(`Validation failed: ${error.message}`);
            }
            throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Delete user (soft delete by deactivating)
    async deleteUser(id: string): Promise<IUser | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid user ID format');
            }

            // Soft delete - just deactivate the user
            return await User.findByIdAndUpdate(
                id,
                { isActive: false },
                { new: true }
            ).select('-password -twoFactorSecret');
        } catch (error) {
            throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Permanently delete user
    async permanentlyDeleteUser(id: string): Promise<IUser | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid user ID format');
            }
            return await User.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Failed to permanently delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Reactivate user
    async reactivateUser(id: string): Promise<IUser | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid user ID format');
            }

            return await User.findByIdAndUpdate(
                id,
                { isActive: true },
                { new: true }
            ).select('-password -twoFactorSecret');
        } catch (error) {
            throw new Error(`Failed to reactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get users by role
    async getUsersByRole(role: string): Promise<any[]> {
        try {
            return await User.find({ role })
                .select('-password -twoFactorSecret -__v')
                .lean();
        } catch (error) {
            throw new Error(`Failed to fetch users by role: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get users by department
    async getUsersByDepartment(department: string): Promise<any[]> {
        try {
            return await User.find({ department })
                .select('-password -twoFactorSecret -__v')
                .lean();
        } catch (error) {
            throw new Error(`Failed to fetch users by department: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const userService = new UserService();
