import jwt from 'jsonwebtoken';
import { User } from '../../users/user.model';

describe('Authentication Service', () => {
    describe('Password Hashing', () => {
        it('should hash password on user creation', async () => {
            const user = await User.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
                role: 'staff',
                department: 'IT'
            });

            expect(user.password).not.toBe('password123');
            expect(user.password.length).toBeGreaterThan(20);
        });

        it('should not rehash password if not modified', async () => {
            const user = await User.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
                role: 'staff',
                department: 'IT'
            });

            const originalHash = user.password;
            user.name = 'Updated Name';
            await user.save();

            expect(user.password).toBe(originalHash);
        });

        it('should compare passwords correctly', async () => {
            const user = await User.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
                role: 'staff',
                department: 'IT'
            });

            const isMatch = await user.comparePassword('password123');
            expect(isMatch).toBe(true);

            const isNotMatch = await user.comparePassword('wrongpassword');
            expect(isNotMatch).toBe(false);
        });
    });

    describe('Token Generation', () => {
        it('should generate valid JWT token', () => {
            const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
            const userId = '507f1f77bcf86cd799439011';
            const role = 'admin';

            const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });

            const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
            expect(decoded.id).toBe(userId);
            expect(decoded.role).toBe(role);
        });

        it('should reject invalid tokens', () => {
            const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
            const invalidToken = 'invalid.token.here';

            expect(() => {
                jwt.verify(invalidToken, JWT_SECRET);
            }).toThrow();
        });
    });

    describe('User Model Validation', () => {
        it('should require email', async () => {
            const user = new User({
                password: 'password123',
                name: 'Test User',
                role: 'staff',
                department: 'IT'
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require unique email', async () => {
            await User.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
                role: 'staff',
                department: 'IT'
            });

            const duplicateUser = new User({
                email: 'test@example.com',
                password: 'password456',
                name: 'Another User',
                role: 'staff',
                department: 'IT'
            });

            await expect(duplicateUser.save()).rejects.toThrow();
        });

        it('should validate email format', async () => {
            const user = new User({
                email: 'invalid-email',
                password: 'password123',
                name: 'Test User',
                role: 'staff',
                department: 'IT'
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should enforce valid roles', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
                role: 'invalid-role',
                department: 'IT'
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should set default values correctly', async () => {
            const user = await User.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
                role: 'staff',
                department: 'IT'
            });

            expect(user.isActive).toBe(true);
            expect(user.createdAt).toBeDefined();
            expect(user.updatedAt).toBeDefined();
        });
    });
});
