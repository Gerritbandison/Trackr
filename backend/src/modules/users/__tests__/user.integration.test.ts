import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import userRoutes from '../user.routes';
import { User } from '../user.model';

const app = express();
app.use(express.json());
app.use('/api/v1/users', userRoutes);

// Use the same secret as setup.ts
const JWT_SECRET = 'test-secret-key-for-testing-only';

const generateToken = (userId: string, role: string) => {
    return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

describe('User API Integration Tests', () => {
    let adminToken: string;
    let managerToken: string;
    let staffToken: string;
    let adminUser: any;
    let managerUser: any;
    let staffUser: any;

    beforeEach(async () => {
        // Create test users
        adminUser = await User.create({
            email: 'admin@example.com',
            password: 'password123',
            name: 'Admin User',
            role: 'admin',
            department: 'IT'
        });

        managerUser = await User.create({
            email: 'manager@example.com',
            password: 'password123',
            name: 'Manager User',
            role: 'manager',
            department: 'Engineering'
        });

        staffUser = await User.create({
            email: 'staff@example.com',
            password: 'password123',
            name: 'Staff User',
            role: 'staff',
            department: 'Sales'
        });

        // Generate tokens
        adminToken = generateToken(adminUser._id.toString(), adminUser.role);
        managerToken = generateToken(managerUser._id.toString(), managerUser.role);
        staffToken = generateToken(staffUser._id.toString(), staffUser.role);
    });

    describe('GET /api/v1/users', () => {
        it('should allow admin to get all users', async () => {
            const response = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${adminToken}`);

            if (response.status !== 200) {
                console.error('Admin get users failed:', response.body);
            }
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(3);
        });

        it('should allow manager to get all users', async () => {
            const response = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should reject staff from getting all users', async () => {
            const response = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${staffToken}`);

            expect(response.status).toBe(403);
        });

        it('should reject requests without token', async () => {
            const response = await request(app)
                .get('/api/v1/users');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/v1/users/:id', () => {
        it('should allow admin to get any user', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${staffUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('staff@example.com');
        });

        it('should allow manager to get any user', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${staffUser._id}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(200);
        });

        it('should allow staff to get their own profile', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${staffUser._id}`)
                .set('Authorization', `Bearer ${staffToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.email).toBe('staff@example.com');
        });

        it('should reject staff from getting other users', async () => {
            const response = await request(app)
                .get(`/api/v1/users/${adminUser._id}`)
                .set('Authorization', `Bearer ${staffToken}`);

            expect(response.status).toBe(403);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/api/v1/users/507f1f77bcf86cd799439099')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/v1/users', () => {
        it('should allow admin to create new user', async () => {
            const response = await request(app)
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'newuser@example.com',
                    password: 'SecurePass123!',
                    name: 'New User',
                    role: 'staff',
                    department: 'Marketing'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('newuser@example.com');
        });

        it('should reject non-admin from creating users', async () => {
            const response = await request(app)
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    email: 'newuser@example.com',
                    password: 'SecurePass123!',
                    name: 'New User',
                    role: 'staff',
                    department: 'Marketing'
                });

            expect(response.status).toBe(403);
        });

        it('should reject duplicate email', async () => {
            const response = await request(app)
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'admin@example.com',
                    password: 'SecurePass123!',
                    name: 'Duplicate User',
                    role: 'staff',
                    department: 'Marketing'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/v1/users/:id', () => {
        it('should allow admin to update any user', async () => {
            const response = await request(app)
                .put(`/api/v1/users/${staffUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Name',
                    department: 'Engineering'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Name');
        });

        it('should allow user to update their own profile', async () => {
            const response = await request(app)
                .put(`/api/v1/users/${staffUser._id}`)
                .set('Authorization', `Bearer ${staffToken}`)
                .send({
                    name: 'Self Updated Name'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe('Self Updated Name');
        });

        it('should reject staff from updating other users', async () => {
            const response = await request(app)
                .put(`/api/v1/users/${adminUser._id}`)
                .set('Authorization', `Bearer ${staffToken}`)
                .send({
                    name: 'Unauthorized Update'
                });

            expect(response.status).toBe(403);
        });

        it('should not allow updating email', async () => {
            const response = await request(app)
                .put(`/api/v1/users/${staffUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'newemail@example.com'
                });

            expect(response.status).toBe(200);

            const user = await User.findById(staffUser._id);
            expect(user?.email).toBe('staff@example.com');
        });
    });

    describe('DELETE /api/v1/users/:id', () => {
        it('should allow admin to delete user (soft delete)', async () => {
            const response = await request(app)
                .delete(`/api/v1/users/${staffUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const user = await User.findById(staffUser._id);
            expect(user?.isActive).toBe(false);
        });

        it('should reject non-admin from deleting users', async () => {
            const response = await request(app)
                .delete(`/api/v1/users/${staffUser._id}`)
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(403);
        });
    });
});
