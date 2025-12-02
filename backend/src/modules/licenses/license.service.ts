import License, { ILicense } from './license.model';
import mongoose from 'mongoose';
import { PaginationOptions, PaginatedResult } from '../../core/utils/pagination';

interface LicenseFilter {
    vendor?: string;
    type?: string;
    status?: string;
    category?: string;
    complianceStatus?: string;
    [key: string]: string | undefined;
}

export class LicenseService {
    // Get all licenses with pagination
    async getLicenses(filter: LicenseFilter = {}, options: PaginationOptions = {}): Promise<PaginatedResult<any>> {
        try {
            const { page = 1, limit = 50, sort = '-createdAt' } = options;
            const skip = (page - 1) * limit;

            const [data, total] = await Promise.all([
                License.find(filter)
                    .select('-__v')
                    .populate('assignedTo', 'name email')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                License.countDocuments(filter)
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
            throw new Error(`Failed to fetch licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get license by ID
    async getLicenseById(id: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid license ID format');
            }
            return await License.findById(id)
                .select('-__v')
                .populate('assignedTo', 'name email department')
                .lean();
        } catch (error) {
            throw new Error(`Failed to fetch license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Create license
    async createLicense(data: Partial<ILicense>): Promise<ILicense> {
        try {
            const license = new License(data);
            return await license.save();
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new Error(`Validation failed: ${error.message}`);
            }
            throw new Error(`Failed to create license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Update license
    async updateLicense(id: string, data: Partial<ILicense>): Promise<ILicense | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid license ID format');
            }

            const license = await License.findByIdAndUpdate(
                id,
                data,
                { new: true, runValidators: true }
            ).populate('assignedTo', 'name email');

            return license;
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new Error(`Validation failed: ${error.message}`);
            }
            throw new Error(`Failed to update license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Delete license
    async deleteLicense(id: string): Promise<ILicense | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid license ID format');
            }
            return await License.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Failed to delete license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Assign license to user with history tracking
    async assignLicense(licenseId: string, userId: string, assignedBy: string, reason?: string): Promise<ILicense | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(licenseId) || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(assignedBy)) {
                throw new Error('Invalid license, user, or assignedBy ID format');
            }

            const license = await License.findById(licenseId);
            if (!license) {
                throw new Error('License not found');
            }

            if (license.usedSeats >= license.totalSeats) {
                throw new Error('No available seats for this license');
            }

            // Check if user is already assigned
            const userObjectId = new mongoose.Types.ObjectId(userId);
            if (license.assignedTo.some(id => id.equals(userObjectId))) {
                throw new Error('User is already assigned to this license');
            }

            const now = new Date();

            // Add to current assignments
            license.assignedTo.push(userObjectId);
            license.usedSeats += 1;

            // Add to assignment history
            license.assignmentHistory.push({
                userId: userObjectId,
                assignedDate: now,
                assignedBy: new mongoose.Types.ObjectId(assignedBy),
                reason
            });

            return await license.save();
        } catch (error) {
            throw new Error(`Failed to assign license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Unassign license from user with history tracking
    async unassignLicense(licenseId: string, userId: string, reason?: string): Promise<ILicense | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(licenseId) || !mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid license or user ID format');
            }

            const license = await License.findById(licenseId);
            if (!license) {
                throw new Error('License not found');
            }

            const userObjectId = new mongoose.Types.ObjectId(userId);
            const userIndex = license.assignedTo.findIndex(id => id.equals(userObjectId));

            if (userIndex === -1) {
                throw new Error('User is not assigned to this license');
            }

            const now = new Date();

            // Find the current assignment in history and mark it as unassigned
            const currentHistory = license.assignmentHistory.find(
                h => h.userId.equals(userObjectId) && !h.unassignedDate
            );

            if (currentHistory) {
                currentHistory.unassignedDate = now;
                if (reason) {
                    currentHistory.reason = (currentHistory.reason ? currentHistory.reason + '; ' : '') + `Unassigned: ${reason}`;
                }
            }

            // Remove from current assignments
            license.assignedTo.splice(userIndex, 1);
            license.usedSeats = Math.max(0, license.usedSeats - 1);

            return await license.save();
        } catch (error) {
            throw new Error(`Failed to unassign license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get expiring licenses (within specified days)
    async getExpiringLicenses(days: number = 30): Promise<any[]> {
        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + days);

            return await License.find({
                expirationDate: {
                    $gte: now,
                    $lte: futureDate
                },
                status: { $ne: 'cancelled' }
            })
                .select('-__v')
                .populate('assignedTo', 'name email')
                .lean();
        } catch (error) {
            throw new Error(`Failed to fetch expiring licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get compliance report
    async getComplianceReport(): Promise<{
        compliant: number;
        atRisk: number;
        nonCompliant: number;
        total: number;
    }> {
        try {
            const [compliant, atRisk, nonCompliant] = await Promise.all([
                License.countDocuments({ complianceStatus: 'compliant' }),
                License.countDocuments({ complianceStatus: 'at-risk' }),
                License.countDocuments({ complianceStatus: 'non-compliant' })
            ]);

            return {
                compliant,
                atRisk,
                nonCompliant,
                total: compliant + atRisk + nonCompliant
            };
        } catch (error) {
            throw new Error(`Failed to generate compliance report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get utilization statistics
    async getUtilizationStats(): Promise<{
        totalSeats: number;
        usedSeats: number;
        availableSeats: number;
        utilizationRate: number;
    }> {
        try {
            const licenses = await License.find({ status: 'active' })
                .select('totalSeats usedSeats')
                .lean();

            const totalSeats = licenses.reduce((sum, license) => sum + license.totalSeats, 0);
            const usedSeats = licenses.reduce((sum, license) => sum + license.usedSeats, 0);
            const availableSeats = totalSeats - usedSeats;
            const utilizationRate = totalSeats > 0 ? (usedSeats / totalSeats) * 100 : 0;

            return {
                totalSeats,
                usedSeats,
                availableSeats,
                utilizationRate: parseFloat(utilizationRate.toFixed(2))
            };
        } catch (error) {
            throw new Error(`Failed to calculate utilization stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get assignment history for a license
    async getLicenseAssignmentHistory(licenseId: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(licenseId)) {
                throw new Error('Invalid license ID format');
            }

            const license = await License.findById(licenseId)
                .select('assignmentHistory name vendor licenseKey')
                .populate('assignmentHistory.userId', 'name email')
                .populate('assignmentHistory.assignedBy', 'name email')
                .lean();

            if (!license) {
                throw new Error('License not found');
            }

            return license;
        } catch (error) {
            throw new Error(`Failed to get assignment history: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Get all licenses assigned to a specific user
    async getUserLicenses(userId: string): Promise<any[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid user ID format');
            }

            return await License.find({ assignedTo: userId })
                .select('-__v')
                .lean();
        } catch (error) {
            throw new Error(`Failed to get user licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const licenseService = new LicenseService();
