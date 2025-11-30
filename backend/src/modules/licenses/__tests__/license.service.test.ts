import License from '../license.model';

describe('License Service', () => {
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
                expirationDate: new Date('2025-01-01'),
                purchaseCost: 10000,
                renewalCost: 10000
            });

            expect(license.name).toBe('Microsoft 365 E3');
            expect(license.totalSeats).toBe(100);
            expect(license.usedSeats).toBe(50);
            expect(license.availableSeats).toBe(50);
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
                expirationDate: new Date('2025-01-01'),
                purchaseCost: 15000,
                renewalCost: 15000
            });

            expect(license.availableSeats).toBe(20);

            license.usedSeats = 40;
            await license.save();
            expect(license.availableSeats).toBe(10);
        });

        it('should set status to compliant when seats are available', async () => {
            const license = await License.create({
                name: 'Slack Business',
                vendor: 'Slack',
                type: 'subscription',
                category: 'Communication',
                totalSeats: 100,
                usedSeats: 50,
                purchaseDate: new Date('2024-01-01'),
                expirationDate: new Date('2026-12-01'),
                purchaseCost: 5000,
                renewalCost: 5000
            });

            expect(license.complianceStatus).toBe('compliant');
            expect(license.status).toBe('active');
        });

        it('should set status to at-risk when utilization is >= 90%', async () => {
            const license = await License.create({
                name: 'Zoom Pro',
                vendor: 'Zoom',
                type: 'subscription',
                category: 'Communication',
                totalSeats: 100,
                usedSeats: 90,
                purchaseDate: new Date('2024-01-01'),
                expirationDate: new Date('2026-12-01'),
                purchaseCost: 8000,
                renewalCost: 8000
            });

            expect(license.complianceStatus).toBe('at-risk');
        });

        it('should set status to non-compliant when over-allocated', async () => {
            const license = await License.create({
                name: 'GitHub Enterprise',
                vendor: 'GitHub',
                type: 'subscription',
                category: 'Development',
                totalSeats: 50,
                usedSeats: 55,
                purchaseDate: new Date('2024-01-01'),
                expirationDate: new Date('2026-12-01'),
                purchaseCost: 12000,
                renewalCost: 12000
            });

            expect(license.complianceStatus).toBe('non-compliant');
        });

        it('should set status to expiring when expiration is within 30 days', async () => {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 20);

            const license = await License.create({
                name: 'Jira Software',
                vendor: 'Atlassian',
                type: 'subscription',
                category: 'Project Management',
                totalSeats: 25,
                usedSeats: 20,
                purchaseDate: new Date('2024-01-01'),
                expirationDate,
                purchaseCost: 3000,
                renewalCost: 3000
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
                renewalCost: 6000
            });

            expect(license.status).toBe('expired');
        });

        it('should validate license type enum', async () => {
            const license = new License({
                name: 'Test License',
                vendor: 'Test Vendor',
                type: 'invalid-type',
                category: 'Test',
                totalSeats: 10,
                usedSeats: 5,
                purchaseDate: new Date(),
                expirationDate: new Date(),
                purchaseCost: 1000,
                renewalCost: 1000
            });

            await expect(license.save()).rejects.toThrow();
        });

        it('should require mandatory fields', async () => {
            const license = new License({
                name: 'Test License'
            });

            await expect(license.save()).rejects.toThrow();
        });
    });
});
