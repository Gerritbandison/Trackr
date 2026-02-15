import mongoose from 'mongoose';
import License from '../license.model';
import { LicenseService } from '../license.service';

// Mock user IDs for testing
const mockUserId1 = new mongoose.Types.ObjectId().toString();
const mockUserId2 = new mongoose.Types.ObjectId().toString();
const mockAdminId = new mongoose.Types.ObjectId().toString();

describe('License Service', () => {
    let licenseService: LicenseService;

    beforeAll(() => {
        licenseService = new LicenseService();
    });

    describe('License Model', () => {
        it('should create a license with valid data', async () => {
            const license = await License.create({
                name: 'Microsoft 365 E3',
                vendor: 'Microsoft',
                type: 'subscription',
                category: 'Productivity',
                totalSeats: 100,
                usedSeats: 50,
                purchaseDate: new Date('2024-01-01'),
                expirationDate: new Date('2027-01-01'),
                purchaseCost: 10000,
                annualCost: 10000
            });

            expect(license.name).toBe('Microsoft 365 E3');
            expect(license.totalSeats).toBe(100);
            expect(license.usedSeats).toBe(50);
            expect(license.availableSeats).toBe(50);
            expect(license.isArchived).toBe(false);
        });

        it('should auto-calculate available seats', async () => {
            const license = await License.create({
                name: 'Adobe Creative Cloud',
                vendor: 'Adobe',
                type: 'subscription',
                category: 'Design',
                totalSeats: 50,
                usedSeats: 30,
                purchaseDate: new Date('2024-01-01'),
                expirationDate: new Date('2027-01-01'),
                purchaseCost: 15000,
                annualCost: 15000
            });

            expect(license.availableSeats).toBe(20);

            license.usedSeats = 40;
            await license.save();
            expect(license.availableSeats).toBe(10);
        });

        it('should auto-calculate cost per seat', async () => {
            const license = await License.create({
                name: 'Slack Business',
                vendor: 'Slack',
                type: 'subscription',
                category: 'Communication',
                totalSeats: 100,
                purchaseDate: new Date('2024-01-01'),
                expirationDate: new Date('2027-01-01'),
                purchaseCost: 5000,
                annualCost: 10000
            });

            expect(license.costPerSeat).toBe(100); // 10000 / 100 seats
        });

        it('should auto-calculate monthly estimate from annual cost', async () => {
            const license = await License.create({
                name: 'Zoom Pro',
                vendor: 'Zoom',
                type: 'subscription',
                category: 'Communication',
                totalSeats: 50,
                purchaseDate: new Date('2024-01-01'),
                expirationDate: new Date('2027-01-01'),
                purchaseCost: 3000,
                annualCost: 12000
            });

            expect(license.monthlyEstimate).toBe(1000); // 12000 / 12
        });

        it('should set status to compliant when seats are available', async () => {
            const license = await License.create({
                name: 'Jira Software',
                vendor: 'Atlassian',
                type: 'subscription',
                category: 'Project Management',
                totalSeats: 100,
                usedSeats: 50,
                purchaseDate: new Date('2024-01-01'),
                expirationDate: new Date('2027-12-01'),
                purchaseCost: 5000,
                annualCost: 5000
            });

            expect(license.complianceStatus).toBe('compliant');
            expect(license.status).toBe('active');
        });

        it('should set status to at-risk when utilization is >= 90%', async () => {
            const license = await License.create({
                name: 'GitHub Enterprise',
                vendor: 'GitHub',
                type: 'subscription',
                category: 'Development',
                totalSeats: 100,
                usedSeats: 92,
                purchaseDate: new Date('2024-01-01'),
                expirationDate: new Date('2027-12-01'),
                purchaseCost: 8000,
                annualCost: 8000
            });

            expect(license.complianceStatus).toBe('at-risk');
        });

        it('should set status to overAllocated when over-allocated', async () => {
            const license = await License.create({
                name: 'Figma Enterprise',
                vendor: 'Figma',
                type: 'subscription',
                category: 'Design',
                totalSeats: 50,
                usedSeats: 55,
                purchaseDate: new Date('2024-01-01'),
                expirationDate: new Date('2027-12-01'),
                purchaseCost: 12000,
                annualCost: 12000
            });

            expect(license.complianceStatus).toBe('overAllocated');
        });

        it('should set status to underUtilized when utilization is < 30%', async () => {
            const license = await License.create({
                name: 'Notion Enterprise',
                vendor: 'Notion',
                type: 'subscription',
                category: 'Productivity',
                totalSeats: 100,
                usedSeats: 20,
                purchaseDate: new Date('2024-01-01'),
                expirationDate: new Date('2027-12-01'),
                purchaseCost: 4000,
                annualCost: 4000
            });

            expect(license.complianceStatus).toBe('underUtilized');
        });

        it('should set status to expiring when expiration is within notification period', async () => {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 20);

            const license = await License.create({
                name: 'Confluence',
                vendor: 'Atlassian',
                type: 'subscription',
                category: 'Documentation',
                totalSeats: 25,
                usedSeats: 20,
                purchaseDate: new Date('2024-01-01'),
                expirationDate,
                purchaseCost: 3000,
                annualCost: 3000,
                renewalNotificationDays: 30
            });

            expect(license.status).toBe('expiring');
        });

        it('should set status to expired when past expiration date', async () => {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() - 10);

            const license = await License.create({
                name: 'Dropbox Business',
                vendor: 'Dropbox',
                type: 'subscription',
                category: 'Storage',
                totalSeats: 50,
                usedSeats: 40,
                purchaseDate: new Date('2023-01-01'),
                expirationDate,
                purchaseCost: 6000,
                annualCost: 6000
            });

            expect(license.status).toBe('expired');
        });

        it('should validate license type enum', async () => {
            const license = new License({
                name: 'Test License',
                vendor: 'Test Vendor',
                type: 'invalid-type' as any,
                category: 'Test',
                totalSeats: 10,
                purchaseDate: new Date(),
                purchaseCost: 1000
            });

            await expect(license.save()).rejects.toThrow();
        });

        it('should require mandatory fields', async () => {
            const license = new License({
                name: 'Test License'
            });

            await expect(license.save()).rejects.toThrow();
        });

        it('should support new license types', async () => {
            const siteLicense = await License.create({
                name: 'Site License Test',
                vendor: 'Test Vendor',
                type: 'site',
                category: 'Test',
                totalSeats: 1000,
                purchaseDate: new Date(),
                purchaseCost: 50000
            });

            expect(siteLicense.type).toBe('site');

            const volumeLicense = await License.create({
                name: 'Volume License Test',
                vendor: 'Test Vendor',
                type: 'volume',
                category: 'Test',
                totalSeats: 500,
                purchaseDate: new Date(),
                purchaseCost: 25000
            });

            expect(volumeLicense.type).toBe('volume');
        });

        it('should track virtuals correctly', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 45);

            const license = await License.create({
                name: 'Virtual Test',
                vendor: 'Test',
                type: 'subscription',
                category: 'Test',
                totalSeats: 100,
                usedSeats: 75,
                purchaseDate: new Date(),
                expirationDate: futureDate,
                purchaseCost: 10000,
                annualCost: 10000
            });

            const licenseObj = license.toObject();
            expect(licenseObj.utilizationRate).toBe(75);
            expect(licenseObj.daysUntilExpiration).toBeGreaterThanOrEqual(44);
            expect(licenseObj.daysUntilExpiration).toBeLessThanOrEqual(46);
        });
    });

    describe('License Service - CRUD', () => {
        let testLicenseId: string;

        it('should create a license', async () => {
            const license = await licenseService.createLicense({
                name: 'Service Test License',
                vendor: 'Test Vendor',
                type: 'subscription',
                category: 'Testing',
                totalSeats: 50,
                purchaseDate: new Date(),
                purchaseCost: 5000
            });

            expect(license).toBeDefined();
            expect(license.name).toBe('Service Test License');
            testLicenseId = license._id.toString();
        });

        it('should get license by ID', async () => {
            const license = await licenseService.getLicenseById(testLicenseId);
            expect(license).toBeDefined();
            expect(license.name).toBe('Service Test License');
        });

        it('should update a license', async () => {
            const updated = await licenseService.updateLicense(testLicenseId, {
                totalSeats: 100,
                annualCost: 8000
            });

            expect(updated).toBeDefined();
            expect(updated!.totalSeats).toBe(100);
            expect(updated!.annualCost).toBe(8000);
        });

        it('should get licenses with pagination', async () => {
            const result = await licenseService.getLicenses({}, { page: 1, limit: 10 });
            
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.total).toBeGreaterThan(0);
            expect(result.page).toBe(1);
        });

        it('should filter licenses by vendor', async () => {
            const result = await licenseService.getLicenses({ vendor: 'Test Vendor' });
            
            expect(result.data).toBeDefined();
            result.data.forEach((license: any) => {
                expect(license.vendor).toBe('Test Vendor');
            });
        });
    });

    describe('License Service - Archive/Restore', () => {
        let archiveTestLicenseId: string;

        beforeAll(async () => {
            const license = await licenseService.createLicense({
                name: 'Archive Test License',
                vendor: 'Archive Vendor',
                type: 'subscription',
                category: 'Testing',
                totalSeats: 25,
                purchaseDate: new Date(),
                purchaseCost: 2500
            });
            archiveTestLicenseId = license._id.toString();
        });

        it('should archive a license', async () => {
            const archived = await licenseService.archiveLicense(
                archiveTestLicenseId,
                mockAdminId,
                'No longer needed'
            );

            expect(archived).toBeDefined();
            expect(archived!.isArchived).toBe(true);
            expect(archived!.archiveReason).toBe('No longer needed');
            expect(archived!.archivedAt).toBeDefined();
        });

        it('should not return archived licenses by default', async () => {
            const result = await licenseService.getLicenses({});
            const found = result.data.find((l: any) => l._id.toString() === archiveTestLicenseId);
            expect(found).toBeUndefined();
        });

        it('should return archived licenses when requested', async () => {
            const result = await licenseService.getLicenses({ isArchived: true });
            const found = result.data.find((l: any) => l._id.toString() === archiveTestLicenseId);
            expect(found).toBeDefined();
        });

        it('should restore an archived license', async () => {
            const restored = await licenseService.restoreLicense(archiveTestLicenseId);

            expect(restored).toBeDefined();
            expect(restored!.isArchived).toBe(false);
            expect(restored!.archivedAt).toBeUndefined();
        });

        it('should throw when archiving already archived license', async () => {
            await licenseService.archiveLicense(archiveTestLicenseId, mockAdminId);
            
            await expect(
                licenseService.archiveLicense(archiveTestLicenseId, mockAdminId)
            ).rejects.toThrow('License is already archived');
        });
    });

    describe('License Service - Seat Allocation', () => {
        let seatTestLicenseId: string;

        beforeAll(async () => {
            const license = await licenseService.createLicense({
                name: 'Seat Test License',
                vendor: 'Seat Vendor',
                type: 'subscription',
                category: 'Testing',
                totalSeats: 5,
                purchaseDate: new Date(),
                purchaseCost: 500
            });
            seatTestLicenseId = license._id.toString();
        });

        it('should allocate a seat to a user', async () => {
            const license = await licenseService.allocateSeat(
                seatTestLicenseId,
                mockUserId1,
                mockAdminId,
                'New employee'
            );

            expect(license).toBeDefined();
            expect(license!.usedSeats).toBe(1);
            expect(license!.assignedTo).toHaveLength(1);
        });

        it('should not allow duplicate seat allocation', async () => {
            await expect(
                licenseService.allocateSeat(seatTestLicenseId, mockUserId1, mockAdminId)
            ).rejects.toThrow('User is already assigned to this license');
        });

        it('should allocate another seat', async () => {
            const license = await licenseService.allocateSeat(
                seatTestLicenseId,
                mockUserId2,
                mockAdminId
            );

            expect(license!.usedSeats).toBe(2);
            expect(license!.assignedTo).toHaveLength(2);
        });

        it('should deallocate a seat from a user', async () => {
            const license = await licenseService.deallocateSeat(
                seatTestLicenseId,
                mockUserId1,
                'Employee left'
            );

            expect(license).toBeDefined();
            expect(license!.usedSeats).toBe(1);
            expect(license!.assignedTo).toHaveLength(1);
        });

        it('should track assignment history', async () => {
            const history = await licenseService.getLicenseAssignmentHistory(seatTestLicenseId);
            
            expect(history.assignmentHistory).toBeDefined();
            expect(history.assignmentHistory.length).toBeGreaterThanOrEqual(2);
            
            // Find the deallocated entry
            const deallocated = history.assignmentHistory.find(
                (h: any) => h.unassignedDate !== undefined
            );
            expect(deallocated).toBeDefined();
        });

        it('should not allocate when no seats available', async () => {
            // Fill up remaining seats
            const license = await License.findById(seatTestLicenseId);
            license!.usedSeats = license!.totalSeats;
            await license!.save();

            await expect(
                licenseService.allocateSeat(seatTestLicenseId, new mongoose.Types.ObjectId().toString(), mockAdminId)
            ).rejects.toThrow('No available seats for this license');
        });
    });

    describe('License Service - Bulk Operations', () => {
        it('should bulk create licenses', async () => {
            const result = await licenseService.bulkCreate([
                {
                    name: 'Bulk License 1',
                    vendor: 'Bulk Vendor',
                    type: 'subscription',
                    category: 'Bulk Test',
                    totalSeats: 10,
                    purchaseDate: new Date(),
                    purchaseCost: 1000
                },
                {
                    name: 'Bulk License 2',
                    vendor: 'Bulk Vendor',
                    type: 'perpetual',
                    category: 'Bulk Test',
                    totalSeats: 20,
                    purchaseDate: new Date(),
                    purchaseCost: 2000
                }
            ]);

            expect(result.success).toBe(2);
            expect(result.failed).toBe(0);
            expect(result.created).toHaveLength(2);
        });

        it('should handle partial bulk create failures', async () => {
            const result = await licenseService.bulkCreate([
                {
                    name: 'Valid License',
                    vendor: 'Test',
                    type: 'subscription',
                    category: 'Test',
                    totalSeats: 10,
                    purchaseDate: new Date(),
                    purchaseCost: 1000
                },
                {
                    name: 'Invalid License',
                    vendor: 'Test',
                    type: 'invalid-type' as any,
                    category: 'Test',
                    totalSeats: 10,
                    purchaseDate: new Date(),
                    purchaseCost: 1000
                }
            ]);

            expect(result.success).toBe(1);
            expect(result.failed).toBe(1);
            expect(result.errors.length).toBe(1);
        });

        it('should bulk update licenses', async () => {
            const licenses = await licenseService.getLicenses({ vendor: 'Bulk Vendor' });
            const ids = licenses.data.map((l: any) => l._id.toString());

            const result = await licenseService.bulkUpdate(
                ids.map((id: string) => ({
                    id,
                    data: { category: 'Updated Category' }
                }))
            );

            expect(result.success).toBe(ids.length);
            expect(result.failed).toBe(0);
        });

        it('should bulk archive licenses', async () => {
            const licenses = await licenseService.getLicenses({ vendor: 'Bulk Vendor' });
            const ids = licenses.data.map((l: any) => l._id.toString());

            const result = await licenseService.bulkArchive(ids, mockAdminId, 'Bulk archive test');

            expect(result.success).toBe(ids.length);
            expect(result.archived).toHaveLength(ids.length);
        });
    });

    describe('License Service - Compliance & Reports', () => {
        beforeAll(async () => {
            // Create test licenses with various compliance states
            await Promise.all([
                licenseService.createLicense({
                    name: 'Compliant License',
                    vendor: 'Compliance Test',
                    type: 'subscription',
                    category: 'Compliance',
                    totalSeats: 100,
                    usedSeats: 50,
                    purchaseDate: new Date(),
                    purchaseCost: 10000
                }),
                licenseService.createLicense({
                    name: 'At Risk License',
                    vendor: 'Compliance Test',
                    type: 'subscription',
                    category: 'Compliance',
                    totalSeats: 100,
                    usedSeats: 95,
                    purchaseDate: new Date(),
                    purchaseCost: 10000
                }),
                licenseService.createLicense({
                    name: 'Over Allocated License',
                    vendor: 'Compliance Test',
                    type: 'subscription',
                    category: 'Compliance',
                    totalSeats: 50,
                    usedSeats: 60,
                    purchaseDate: new Date(),
                    purchaseCost: 5000
                })
            ]);
        });

        it('should generate compliance report', async () => {
            const report = await licenseService.getComplianceReport();

            expect(report).toBeDefined();
            expect(typeof report.compliant).toBe('number');
            expect(typeof report.overAllocated).toBe('number');
            expect(typeof report.atRisk).toBe('number');
            expect(typeof report.total).toBe('number');
            expect(report.details).toBeDefined();
        });

        it('should calculate utilization stats', async () => {
            const stats = await licenseService.getUtilizationStats();

            expect(stats).toBeDefined();
            expect(typeof stats.totalSeats).toBe('number');
            expect(typeof stats.usedSeats).toBe('number');
            expect(typeof stats.availableSeats).toBe('number');
            expect(typeof stats.utilizationRate).toBe('number');
        });
    });

    describe('License Service - Renewals', () => {
        beforeAll(async () => {
            const nearExpiration = new Date();
            nearExpiration.setDate(nearExpiration.getDate() + 15);

            const farExpiration = new Date();
            farExpiration.setDate(farExpiration.getDate() + 60);

            await Promise.all([
                licenseService.createLicense({
                    name: 'Expiring Soon License',
                    vendor: 'Renewal Test',
                    type: 'subscription',
                    category: 'Renewal',
                    totalSeats: 50,
                    purchaseDate: new Date('2024-01-01'),
                    expirationDate: nearExpiration,
                    purchaseCost: 5000,
                    annualCost: 5000
                }),
                licenseService.createLicense({
                    name: 'Expiring Later License',
                    vendor: 'Renewal Test',
                    type: 'subscription',
                    category: 'Renewal',
                    totalSeats: 50,
                    purchaseDate: new Date('2024-01-01'),
                    expirationDate: farExpiration,
                    purchaseCost: 5000,
                    annualCost: 5000
                })
            ]);
        });

        it('should get expiring licenses', async () => {
            const expiring = await licenseService.getExpiringLicenses(30);

            expect(expiring).toBeDefined();
            expect(Array.isArray(expiring)).toBe(true);
            
            const found = expiring.find((l: any) => l.name === 'Expiring Soon License');
            expect(found).toBeDefined();
        });

        it('should get upcoming renewals with urgency', async () => {
            const renewals = await licenseService.getUpcomingRenewals(90);

            expect(renewals).toBeDefined();
            expect(Array.isArray(renewals)).toBe(true);
            
            renewals.forEach((r) => {
                expect(['critical', 'high', 'medium', 'low']).toContain(r.urgency);
                expect(typeof r.daysUntilExpiration).toBe('number');
                expect(typeof r.estimatedRenewalCost).toBe('number');
            });
        });
    });

    describe('License Service - Optimization', () => {
        beforeAll(async () => {
            await Promise.all([
                // Unused license
                licenseService.createLicense({
                    name: 'Unused License',
                    vendor: 'Optimization Test',
                    type: 'subscription',
                    category: 'Optimization',
                    totalSeats: 100,
                    usedSeats: 0,
                    purchaseDate: new Date(),
                    purchaseCost: 10000,
                    annualCost: 10000
                }),
                // Underutilized license
                licenseService.createLicense({
                    name: 'Underutilized License',
                    vendor: 'Optimization Test',
                    type: 'subscription',
                    category: 'Optimization',
                    totalSeats: 100,
                    usedSeats: 15,
                    purchaseDate: new Date(),
                    purchaseCost: 10000,
                    annualCost: 10000
                })
            ]);
        });

        it('should generate optimization recommendations', async () => {
            const result = await licenseService.getOptimizationRecommendations(30);

            expect(result).toBeDefined();
            expect(typeof result.totalPotentialSavings).toBe('number');
            expect(Array.isArray(result.recommendations)).toBe(true);

            result.recommendations.forEach((rec) => {
                expect(['downgrade', 'consolidate', 'cancel', 'reallocate']).toContain(rec.type);
                expect(typeof rec.potentialSavings).toBe('number');
            });
        });

        it('should identify unused licenses for cancellation', async () => {
            const result = await licenseService.getOptimizationRecommendations();
            
            const cancelRecommendations = result.recommendations.filter(
                r => r.type === 'cancel' && r.licenseName === 'Unused License'
            );
            
            expect(cancelRecommendations.length).toBeGreaterThan(0);
        });
    });

    describe('License Service - Statistics', () => {
        it('should generate comprehensive statistics', async () => {
            const stats = await licenseService.getStatistics();

            expect(stats).toBeDefined();
            expect(typeof stats.totalLicenses).toBe('number');
            expect(typeof stats.activeLicenses).toBe('number');
            expect(typeof stats.totalSeats).toBe('number');
            expect(typeof stats.usedSeats).toBe('number');
            expect(typeof stats.availableSeats).toBe('number');
            expect(typeof stats.utilizationRate).toBe('number');
            expect(typeof stats.totalCost).toBe('number');
            expect(typeof stats.totalAnnualCost).toBe('number');
            expect(typeof stats.averageCostPerSeat).toBe('number');
            expect(stats.byVendor).toBeDefined();
            expect(stats.byCategory).toBeDefined();
            expect(stats.byStatus).toBeDefined();
            expect(stats.byComplianceStatus).toBeDefined();
            expect(stats.byType).toBeDefined();
        });

        it('should group statistics by vendor', async () => {
            const stats = await licenseService.getStatistics();
            
            Object.values(stats.byVendor).forEach((vendor: any) => {
                expect(typeof vendor.count).toBe('number');
                expect(typeof vendor.totalSeats).toBe('number');
                expect(typeof vendor.usedSeats).toBe('number');
                expect(typeof vendor.cost).toBe('number');
            });
        });
    });

    describe('License Service - User Queries', () => {
        let userQueryLicenseId: string;

        beforeAll(async () => {
            const license = await licenseService.createLicense({
                name: 'User Query Test License',
                vendor: 'User Query Test',
                type: 'subscription',
                category: 'Testing',
                totalSeats: 10,
                purchaseDate: new Date(),
                purchaseCost: 1000
            });
            userQueryLicenseId = license._id.toString();

            // Allocate a seat
            await licenseService.allocateSeat(userQueryLicenseId, mockUserId1, mockAdminId);
        });

        it('should get licenses for a specific user', async () => {
            const licenses = await licenseService.getUserLicenses(mockUserId1);

            expect(licenses).toBeDefined();
            expect(Array.isArray(licenses)).toBe(true);
            expect(licenses.length).toBeGreaterThan(0);
        });
    });
});
