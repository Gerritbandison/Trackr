import License, { ILicense } from './license.model';
import mongoose from 'mongoose';
import { PaginationOptions, PaginatedResult } from '../../core/utils/pagination';
import { convertToCSV, parseCSV, validateImportData } from '../../core/utils/csv';

// ============================================
// Interfaces
// ============================================

interface LicenseFilter {
    vendor?: string;
    type?: string;
    status?: string;
    category?: string;
    complianceStatus?: string;
    isArchived?: boolean;
    search?: string;
    expiringWithin?: number;
    minUtilization?: number;
    maxUtilization?: number;
    [key: string]: string | number | boolean | undefined;
}

interface BulkUpdateItem {
    id: string;
    data: Partial<ILicense>;
}

interface ComplianceReport {
    compliant: number;
    overAllocated: number;
    underUtilized: number;
    atRisk: number;
    total: number;
    details: {
        overAllocatedLicenses: any[];
        atRiskLicenses: any[];
        underUtilizedLicenses: any[];
    };
}

interface RenewalItem {
    license: any;
    daysUntilExpiration: number;
    estimatedRenewalCost: number;
    urgency: 'critical' | 'high' | 'medium' | 'low';
}

interface OptimizationRecommendation {
    licenseId: string;
    licenseName: string;
    vendor: string;
    type: 'downgrade' | 'consolidate' | 'cancel' | 'reallocate';
    reason: string;
    currentCost: number;
    potentialSavings: number;
    utilizationRate: number;
    details: string;
}

interface LicenseStatistics {
    totalLicenses: number;
    activeLicenses: number;
    totalSeats: number;
    usedSeats: number;
    availableSeats: number;
    utilizationRate: number;
    totalCost: number;
    totalAnnualCost: number;
    averageCostPerSeat: number;
    byVendor: Record<string, { count: number; totalSeats: number; usedSeats: number; cost: number }>;
    byCategory: Record<string, { count: number; totalSeats: number; usedSeats: number; cost: number }>;
    byStatus: Record<string, number>;
    byComplianceStatus: Record<string, number>;
    byType: Record<string, number>;
}

// ============================================
// License Service Class
// ============================================

export class LicenseService {
    // ============================================
    // CRUD Operations
    // ============================================

    /**
     * Get all licenses with pagination and filtering
     */
    async getLicenses(filter: LicenseFilter = {}, options: PaginationOptions = {}): Promise<PaginatedResult<any>> {
        try {
            const { page = 1, limit = 50, sort = '-createdAt' } = options;
            const skip = (page - 1) * limit;

            // Build query
            const query: any = {};
            
            // Default: exclude archived unless explicitly requested
            if (filter.isArchived === undefined) {
                query.isArchived = false;
            } else if (filter.isArchived !== undefined) {
                query.isArchived = filter.isArchived;
            }

            // Standard filters
            if (filter.vendor) query.vendor = filter.vendor;
            if (filter.type) query.type = filter.type;
            if (filter.status) query.status = filter.status;
            if (filter.category) query.category = filter.category;
            if (filter.complianceStatus) query.complianceStatus = filter.complianceStatus;

            // Text search
            if (filter.search) {
                query.$text = { $search: filter.search };
            }

            // Expiring within X days
            if (filter.expiringWithin) {
                const now = new Date();
                const futureDate = new Date();
                futureDate.setDate(now.getDate() + filter.expiringWithin);
                query.expirationDate = { $gte: now, $lte: futureDate };
            }

            // Utilization filters
            if (filter.minUtilization !== undefined || filter.maxUtilization !== undefined) {
                const utilizationConditions: any[] = [];
                if (filter.minUtilization !== undefined) {
                    utilizationConditions.push({
                        $expr: {
                            $gte: [
                                { $multiply: [{ $divide: ['$usedSeats', '$totalSeats'] }, 100] },
                                filter.minUtilization
                            ]
                        }
                    });
                }
                if (filter.maxUtilization !== undefined) {
                    utilizationConditions.push({
                        $expr: {
                            $lte: [
                                { $multiply: [{ $divide: ['$usedSeats', '$totalSeats'] }, 100] },
                                filter.maxUtilization
                            ]
                        }
                    });
                }
                if (utilizationConditions.length > 0) {
                    query.$and = utilizationConditions;
                }
            }

            const [data, total] = await Promise.all([
                License.find(query)
                    .select('-__v')
                    .populate('assignedTo', 'name email department')
                    .populate('archivedBy', 'name email')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                License.countDocuments(query)
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

    /**
     * Get license by ID
     */
    async getLicenseById(id: string, includeSensitive: boolean = false): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid license ID format');
            }

            let query = License.findById(id)
                .select('-__v')
                .populate('assignedTo', 'name email department')
                .populate('assignmentHistory.userId', 'name email')
                .populate('assignmentHistory.assignedBy', 'name email')
                .populate('archivedBy', 'name email');

            if (includeSensitive) {
                query = query.select('+licenseKey +productKey');
            }

            return await query.lean();
        } catch (error) {
            throw new Error(`Failed to fetch license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create license
     */
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

    /**
     * Update license
     */
    async updateLicense(id: string, data: Partial<ILicense>): Promise<ILicense | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid license ID format');
            }

            const license = await License.findById(id);
            if (!license) {
                return null;
            }

            // Update fields
            Object.assign(license, data);
            return await license.save();
        } catch (error) {
            if (error instanceof mongoose.Error.ValidationError) {
                throw new Error(`Validation failed: ${error.message}`);
            }
            throw new Error(`Failed to update license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Hard delete license (use archive for soft delete)
     */
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

    // ============================================
    // Soft Delete (Archive/Restore)
    // ============================================

    /**
     * Archive (soft delete) a license
     */
    async archiveLicense(id: string, userId: string, reason?: string): Promise<ILicense | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid license ID format');
            }

            const license = await License.findById(id);
            if (!license) {
                return null;
            }

            if (license.isArchived) {
                throw new Error('License is already archived');
            }

            license.isArchived = true;
            license.archivedAt = new Date();
            license.archivedBy = new mongoose.Types.ObjectId(userId);
            if (reason) {
                license.archiveReason = reason;
            }

            return await license.save();
        } catch (error) {
            throw new Error(`Failed to archive license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Restore an archived license
     */
    async restoreLicense(id: string): Promise<ILicense | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid license ID format');
            }

            const license = await License.findById(id);
            if (!license) {
                return null;
            }

            if (!license.isArchived) {
                throw new Error('License is not archived');
            }

            license.isArchived = false;
            license.archivedAt = undefined;
            license.archivedBy = undefined;
            license.archiveReason = undefined;

            return await license.save();
        } catch (error) {
            throw new Error(`Failed to restore license: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // Bulk Operations
    // ============================================

    /**
     * Bulk create licenses
     */
    async bulkCreate(licenses: Partial<ILicense>[]): Promise<{
        success: number;
        failed: number;
        errors: string[];
        created: ILicense[];
    }> {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
            created: [] as ILicense[]
        };

        for (let i = 0; i < licenses.length; i++) {
            try {
                const license = new License(licenses[i]);
                const saved = await license.save();
                results.success++;
                results.created.push(saved);
            } catch (error) {
                results.failed++;
                results.errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return results;
    }

    /**
     * Bulk update licenses
     */
    async bulkUpdate(updates: BulkUpdateItem[]): Promise<{
        success: number;
        failed: number;
        errors: string[];
        updated: ILicense[];
    }> {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
            updated: [] as ILicense[]
        };

        for (const update of updates) {
            try {
                if (!mongoose.Types.ObjectId.isValid(update.id)) {
                    results.failed++;
                    results.errors.push(`ID ${update.id}: Invalid ID format`);
                    continue;
                }

                const license = await License.findById(update.id);
                if (!license) {
                    results.failed++;
                    results.errors.push(`ID ${update.id}: License not found`);
                    continue;
                }

                Object.assign(license, update.data);
                const saved = await license.save();
                results.success++;
                results.updated.push(saved);
            } catch (error) {
                results.failed++;
                results.errors.push(`ID ${update.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return results;
    }

    /**
     * Bulk archive licenses
     */
    async bulkArchive(ids: string[], userId: string, reason?: string): Promise<{
        success: number;
        failed: number;
        errors: string[];
        archived: string[];
    }> {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
            archived: [] as string[]
        };

        const now = new Date();
        const userObjectId = new mongoose.Types.ObjectId(userId);

        for (const id of ids) {
            try {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    results.failed++;
                    results.errors.push(`ID ${id}: Invalid ID format`);
                    continue;
                }

                const result = await License.findByIdAndUpdate(
                    id,
                    {
                        isArchived: true,
                        archivedAt: now,
                        archivedBy: userObjectId,
                        archiveReason: reason
                    },
                    { new: true }
                );

                if (result) {
                    results.success++;
                    results.archived.push(id);
                } else {
                    results.failed++;
                    results.errors.push(`ID ${id}: License not found`);
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return results;
    }

    // ============================================
    // Seat Allocation
    // ============================================

    /**
     * Allocate a seat to a user
     */
    async allocateSeat(licenseId: string, userId: string, assignedBy: string, reason?: string): Promise<ILicense | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(licenseId) || 
                !mongoose.Types.ObjectId.isValid(userId) || 
                !mongoose.Types.ObjectId.isValid(assignedBy)) {
                throw new Error('Invalid ID format');
            }

            const license = await License.findById(licenseId);
            if (!license) {
                throw new Error('License not found');
            }

            if (license.isArchived) {
                throw new Error('Cannot allocate seat on archived license');
            }

            if (license.usedSeats >= license.totalSeats) {
                throw new Error('No available seats for this license');
            }

            const userObjectId = new mongoose.Types.ObjectId(userId);
            if (license.assignedTo.some(id => id.equals(userObjectId))) {
                throw new Error('User is already assigned to this license');
            }

            const now = new Date();

            license.assignedTo.push(userObjectId);
            license.usedSeats += 1;
            license.assignmentHistory.push({
                userId: userObjectId,
                assignedDate: now,
                assignedBy: new mongoose.Types.ObjectId(assignedBy),
                reason
            });

            return await license.save();
        } catch (error) {
            throw new Error(`Failed to allocate seat: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Deallocate a seat from a user
     */
    async deallocateSeat(licenseId: string, userId: string, reason?: string): Promise<ILicense | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(licenseId) || !mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid ID format');
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

            // Update assignment history
            const currentHistory = license.assignmentHistory.find(
                h => h.userId.equals(userObjectId) && !h.unassignedDate
            );
            if (currentHistory) {
                currentHistory.unassignedDate = now;
                if (reason) {
                    currentHistory.reason = (currentHistory.reason ? currentHistory.reason + '; ' : '') + `Unassigned: ${reason}`;
                }
            }

            license.assignedTo.splice(userIndex, 1);
            license.usedSeats = Math.max(0, license.usedSeats - 1);

            return await license.save();
        } catch (error) {
            throw new Error(`Failed to deallocate seat: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Bulk allocate seats
     */
    async bulkAllocateSeats(licenseId: string, userIds: string[], assignedBy: string, reason?: string): Promise<{
        success: number;
        failed: number;
        errors: string[];
    }> {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const userId of userIds) {
            try {
                await this.allocateSeat(licenseId, userId, assignedBy, reason);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push(`User ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return results;
    }

    // ============================================
    // Legacy Assignment Methods (compatibility)
    // ============================================

    async assignLicense(licenseId: string, userId: string, assignedBy: string, reason?: string): Promise<ILicense | null> {
        return this.allocateSeat(licenseId, userId, assignedBy, reason);
    }

    async unassignLicense(licenseId: string, userId: string, reason?: string): Promise<ILicense | null> {
        return this.deallocateSeat(licenseId, userId, reason);
    }

    // ============================================
    // Compliance & Reporting
    // ============================================

    /**
     * Get comprehensive compliance report
     */
    async getComplianceReport(): Promise<ComplianceReport> {
        try {
            const [compliant, overAllocated, underUtilized, atRisk] = await Promise.all([
                License.countDocuments({ isArchived: false, complianceStatus: 'compliant' }),
                License.countDocuments({ isArchived: false, complianceStatus: 'overAllocated' }),
                License.countDocuments({ isArchived: false, complianceStatus: 'underUtilized' }),
                License.countDocuments({ isArchived: false, complianceStatus: 'at-risk' })
            ]);

            const [overAllocatedLicenses, atRiskLicenses, underUtilizedLicenses] = await Promise.all([
                License.find({ isArchived: false, complianceStatus: 'overAllocated' })
                    .select('name vendor totalSeats usedSeats category')
                    .lean(),
                License.find({ isArchived: false, complianceStatus: 'at-risk' })
                    .select('name vendor totalSeats usedSeats category')
                    .lean(),
                License.find({ isArchived: false, complianceStatus: 'underUtilized' })
                    .select('name vendor totalSeats usedSeats category annualCost')
                    .lean()
            ]);

            return {
                compliant,
                overAllocated,
                underUtilized,
                atRisk,
                total: compliant + overAllocated + underUtilized + atRisk,
                details: {
                    overAllocatedLicenses,
                    atRiskLicenses,
                    underUtilizedLicenses
                }
            };
        } catch (error) {
            throw new Error(`Failed to generate compliance report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get utilization statistics
     */
    async getUtilizationStats(): Promise<{
        totalSeats: number;
        usedSeats: number;
        availableSeats: number;
        utilizationRate: number;
    }> {
        try {
            const licenses = await License.find({ isArchived: false, status: 'active' })
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

    // ============================================
    // Renewal Management
    // ============================================

    /**
     * Get expiring licenses
     */
    async getExpiringLicenses(days: number = 30): Promise<any[]> {
        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + days);

            return await License.find({
                isArchived: false,
                expirationDate: { $gte: now, $lte: futureDate },
                status: { $nin: ['cancelled', 'expired'] }
            })
                .select('-__v')
                .populate('assignedTo', 'name email')
                .sort({ expirationDate: 1 })
                .lean();
        } catch (error) {
            throw new Error(`Failed to fetch expiring licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get upcoming renewals with urgency levels
     */
    async getUpcomingRenewals(days: number = 90, includeAutoRenew: boolean = true): Promise<RenewalItem[]> {
        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + days);

            const query: any = {
                isArchived: false,
                type: { $ne: 'perpetual' },
                status: { $nin: ['cancelled', 'expired'] },
                $or: [
                    { expirationDate: { $gte: now, $lte: futureDate } },
                    { renewalDate: { $gte: now, $lte: futureDate } }
                ]
            };

            if (!includeAutoRenew) {
                query.autoRenew = false;
            }

            const licenses = await License.find(query)
                .select('-__v -licenseKey -productKey')
                .populate('assignedTo', 'name email')
                .sort({ expirationDate: 1 })
                .lean();

            return licenses.map(license => {
                const daysUntilExpiration = license.expirationDate
                    ? Math.ceil((new Date(license.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : 999;

                let urgency: 'critical' | 'high' | 'medium' | 'low';
                if (daysUntilExpiration <= 7) urgency = 'critical';
                else if (daysUntilExpiration <= 14) urgency = 'high';
                else if (daysUntilExpiration <= 30) urgency = 'medium';
                else urgency = 'low';

                return {
                    license,
                    daysUntilExpiration,
                    estimatedRenewalCost: license.annualCost || license.purchaseCost,
                    urgency
                };
            });
        } catch (error) {
            throw new Error(`Failed to fetch upcoming renewals: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update renewal reminder status
     */
    async markRenewalReminderSent(licenseId: string, daysBefore: number): Promise<ILicense | null> {
        try {
            const license = await License.findById(licenseId);
            if (!license) return null;

            const reminder = license.renewalReminders.find(r => r.daysBefore === daysBefore);
            if (reminder) {
                reminder.sent = true;
                reminder.sentAt = new Date();
            } else {
                license.renewalReminders.push({
                    daysBefore,
                    sent: true,
                    sentAt: new Date()
                });
            }

            license.lastRenewalCheck = new Date();
            return await license.save();
        } catch (error) {
            throw new Error(`Failed to update renewal reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // Cost Optimization
    // ============================================

    /**
     * Get cost optimization recommendations
     */
    async getOptimizationRecommendations(underutilizationThreshold: number = 30): Promise<{
        totalPotentialSavings: number;
        recommendations: OptimizationRecommendation[];
    }> {
        try {
            const recommendations: OptimizationRecommendation[] = [];

            // Find underutilized licenses
            const underutilizedLicenses = await License.find({
                isArchived: false,
                status: 'active',
                usedSeats: { $gt: 0 },
                $expr: {
                    $lt: [
                        { $multiply: [{ $divide: ['$usedSeats', '$totalSeats'] }, 100] },
                        underutilizationThreshold
                    ]
                }
            })
                .select('name vendor totalSeats usedSeats annualCost purchaseCost type')
                .lean();

            for (const license of underutilizedLicenses) {
                const utilizationRate = (license.usedSeats / license.totalSeats) * 100;
                const annualCost = license.annualCost || license.purchaseCost;
                const optimalSeats = Math.ceil(license.usedSeats * 1.2); // 20% buffer
                const potentialSavings = annualCost * (1 - optimalSeats / license.totalSeats);

                recommendations.push({
                    licenseId: license._id.toString(),
                    licenseName: license.name,
                    vendor: license.vendor,
                    type: 'downgrade',
                    reason: `Low utilization (${utilizationRate.toFixed(1)}%)`,
                    currentCost: annualCost,
                    potentialSavings: parseFloat(potentialSavings.toFixed(2)),
                    utilizationRate: parseFloat(utilizationRate.toFixed(2)),
                    details: `Consider reducing from ${license.totalSeats} to ${optimalSeats} seats`
                });
            }

            // Find unused licenses (0 seats used)
            const unusedLicenses = await License.find({
                isArchived: false,
                status: 'active',
                usedSeats: 0
            })
                .select('name vendor totalSeats annualCost purchaseCost')
                .lean();

            for (const license of unusedLicenses) {
                const annualCost = license.annualCost || license.purchaseCost;
                recommendations.push({
                    licenseId: license._id.toString(),
                    licenseName: license.name,
                    vendor: license.vendor,
                    type: 'cancel',
                    reason: 'No seats in use',
                    currentCost: annualCost,
                    potentialSavings: annualCost,
                    utilizationRate: 0,
                    details: 'Consider cancelling this license as it has no active users'
                });
            }

            // Find duplicate vendors for consolidation
            const vendorCounts = await License.aggregate([
                { $match: { isArchived: false, status: 'active' } },
                { $group: { _id: { vendor: '$vendor', category: '$category' }, count: { $sum: 1 }, totalCost: { $sum: { $ifNull: ['$annualCost', '$purchaseCost'] } } } },
                { $match: { count: { $gt: 1 } } }
            ]);

            for (const vendor of vendorCounts) {
                if (vendor.count >= 3) {
                    recommendations.push({
                        licenseId: '',
                        licenseName: `Multiple ${vendor._id.vendor} licenses`,
                        vendor: vendor._id.vendor,
                        type: 'consolidate',
                        reason: `${vendor.count} separate licenses from same vendor in ${vendor._id.category}`,
                        currentCost: vendor.totalCost,
                        potentialSavings: vendor.totalCost * 0.15, // Estimate 15% savings from consolidation
                        utilizationRate: 0,
                        details: `Consider consolidating ${vendor.count} ${vendor._id.vendor} licenses for volume discount`
                    });
                }
            }

            const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);

            return {
                totalPotentialSavings: parseFloat(totalPotentialSavings.toFixed(2)),
                recommendations: recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings)
            };
        } catch (error) {
            throw new Error(`Failed to generate optimization recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // Statistics
    // ============================================

    /**
     * Get comprehensive license statistics
     */
    async getStatistics(includeArchived: boolean = false): Promise<LicenseStatistics> {
        try {
            const query: any = {};
            if (!includeArchived) {
                query.isArchived = false;
            }

            const licenses = await License.find(query)
                .select('name vendor category type status complianceStatus totalSeats usedSeats purchaseCost annualCost')
                .lean();

            const activeLicenses = licenses.filter(l => l.status === 'active');

            const stats: LicenseStatistics = {
                totalLicenses: licenses.length,
                activeLicenses: activeLicenses.length,
                totalSeats: 0,
                usedSeats: 0,
                availableSeats: 0,
                utilizationRate: 0,
                totalCost: 0,
                totalAnnualCost: 0,
                averageCostPerSeat: 0,
                byVendor: {},
                byCategory: {},
                byStatus: {},
                byComplianceStatus: {},
                byType: {}
            };

            for (const license of licenses) {
                stats.totalSeats += license.totalSeats;
                stats.usedSeats += license.usedSeats;
                stats.totalCost += license.purchaseCost || 0;
                stats.totalAnnualCost += license.annualCost || license.purchaseCost || 0;

                // By vendor
                if (!stats.byVendor[license.vendor]) {
                    stats.byVendor[license.vendor] = { count: 0, totalSeats: 0, usedSeats: 0, cost: 0 };
                }
                stats.byVendor[license.vendor].count++;
                stats.byVendor[license.vendor].totalSeats += license.totalSeats;
                stats.byVendor[license.vendor].usedSeats += license.usedSeats;
                stats.byVendor[license.vendor].cost += license.annualCost || license.purchaseCost || 0;

                // By category
                if (!stats.byCategory[license.category]) {
                    stats.byCategory[license.category] = { count: 0, totalSeats: 0, usedSeats: 0, cost: 0 };
                }
                stats.byCategory[license.category].count++;
                stats.byCategory[license.category].totalSeats += license.totalSeats;
                stats.byCategory[license.category].usedSeats += license.usedSeats;
                stats.byCategory[license.category].cost += license.annualCost || license.purchaseCost || 0;

                // By status
                stats.byStatus[license.status] = (stats.byStatus[license.status] || 0) + 1;

                // By compliance status
                stats.byComplianceStatus[license.complianceStatus] = (stats.byComplianceStatus[license.complianceStatus] || 0) + 1;

                // By type
                stats.byType[license.type] = (stats.byType[license.type] || 0) + 1;
            }

            stats.availableSeats = stats.totalSeats - stats.usedSeats;
            stats.utilizationRate = stats.totalSeats > 0 
                ? parseFloat(((stats.usedSeats / stats.totalSeats) * 100).toFixed(2))
                : 0;
            stats.averageCostPerSeat = stats.totalSeats > 0
                ? parseFloat((stats.totalAnnualCost / stats.totalSeats).toFixed(2))
                : 0;

            return stats;
        } catch (error) {
            throw new Error(`Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // History & User Queries
    // ============================================

    /**
     * Get assignment history for a license
     */
    async getLicenseAssignmentHistory(licenseId: string): Promise<any> {
        try {
            if (!mongoose.Types.ObjectId.isValid(licenseId)) {
                throw new Error('Invalid license ID format');
            }

            const license = await License.findById(licenseId)
                .select('assignmentHistory name vendor')
                .populate('assignmentHistory.userId', 'name email department')
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

    /**
     * Get all licenses assigned to a specific user
     */
    async getUserLicenses(userId: string): Promise<any[]> {
        try {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid user ID format');
            }

            return await License.find({ 
                assignedTo: userId,
                isArchived: false 
            })
                .select('-__v -licenseKey -productKey')
                .lean();
        } catch (error) {
            throw new Error(`Failed to get user licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // ============================================
    // Import/Export
    // ============================================

    /**
     * Export licenses to CSV
     */
    async exportToCSV(filter: LicenseFilter = {}): Promise<string> {
        try {
            const query: any = { ...filter };
            if (query.isArchived === undefined) {
                query.isArchived = false;
            }

            const licenses = await License.find(query)
                .select('-__v -_id')
                .populate('assignedTo', 'name email')
                .lean();

            const flattenedLicenses = licenses.map(license => ({
                name: license.name,
                vendor: license.vendor,
                type: license.type,
                category: license.category,
                status: license.status,
                complianceStatus: license.complianceStatus,
                totalSeats: license.totalSeats,
                usedSeats: license.usedSeats,
                availableSeats: license.totalSeats - license.usedSeats,
                utilizationRate: ((license.usedSeats / license.totalSeats) * 100).toFixed(2) + '%',
                purchaseDate: license.purchaseDate ? new Date(license.purchaseDate).toISOString().split('T')[0] : '',
                purchaseCost: license.purchaseCost || 0,
                expirationDate: license.expirationDate ? new Date(license.expirationDate).toISOString().split('T')[0] : '',
                renewalDate: license.renewalDate ? new Date(license.renewalDate).toISOString().split('T')[0] : '',
                annualCost: license.annualCost || 0,
                autoRenew: license.autoRenew || false,
                billingCycle: license.billingCycle || '',
                assignedUsers: license.assignedTo ? (license.assignedTo as any[]).map(u => u.name).join('; ') : '',
                tags: license.tags ? license.tags.join('; ') : '',
                notes: license.notes || '',
                isArchived: license.isArchived,
                createdAt: new Date(license.createdAt).toISOString(),
                updatedAt: new Date(license.updatedAt).toISOString()
            }));

            return convertToCSV(flattenedLicenses);
        } catch (error) {
            throw new Error(`Failed to export licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Bulk import licenses from CSV
     */
    async bulkImport(csvData: string): Promise<{
        success: number;
        failed: number;
        errors: string[];
        imported: any[];
    }> {
        try {
            const data = parseCSV(csvData);
            const requiredFields = ['name', 'vendor', 'type', 'category', 'totalSeats', 'purchaseDate', 'purchaseCost'];
            const validation = validateImportData(data, requiredFields);

            if (!validation.valid) {
                return {
                    success: 0,
                    failed: data.length,
                    errors: validation.errors,
                    imported: []
                };
            }

            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[],
                imported: [] as any[]
            };

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                try {
                    if (row.licenseKey) {
                        const existing = await License.findOne({ licenseKey: row.licenseKey });
                        if (existing) {
                            results.failed++;
                            results.errors.push(`Row ${i + 2}: License with key '${row.licenseKey}' already exists`);
                            continue;
                        }
                    }

                    const validTypes = ['perpetual', 'subscription', 'trial', 'site', 'volume', 'oem'];
                    if (!validTypes.includes(row.type)) {
                        results.failed++;
                        results.errors.push(`Row ${i + 2}: Invalid license type '${row.type}'`);
                        continue;
                    }

                    const license = new License({
                        name: row.name,
                        vendor: row.vendor,
                        type: row.type,
                        category: row.category,
                        licenseKey: row.licenseKey || undefined,
                        description: row.description || undefined,
                        status: row.status || 'active',
                        totalSeats: parseInt(row.totalSeats),
                        usedSeats: row.usedSeats ? parseInt(row.usedSeats) : 0,
                        purchaseDate: new Date(row.purchaseDate),
                        purchaseCost: parseFloat(row.purchaseCost),
                        expirationDate: row.expirationDate ? new Date(row.expirationDate) : undefined,
                        renewalDate: row.renewalDate ? new Date(row.renewalDate) : undefined,
                        annualCost: row.annualCost ? parseFloat(row.annualCost) : undefined,
                        autoRenew: row.autoRenew === 'true' || row.autoRenew === '1',
                        billingCycle: row.billingCycle || undefined,
                        notes: row.notes || undefined,
                        tags: row.tags ? row.tags.split(';').map((t: string) => t.trim()) : [],
                        assignedTo: [],
                        assignmentHistory: []
                    });

                    const saved = await license.save();
                    results.success++;
                    results.imported.push(saved);
                } catch (error) {
                    results.failed++;
                    results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to import licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const licenseService = new LicenseService();
