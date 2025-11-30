import request from 'supertest';
import express from 'express';
import authRoutes from '../auth.routes';
import { User } from '../../users/user.model';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Authentication API Integration Tests', () => {
    describe('POST /api/v1/auth/register', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'newuser@example.com',
                    password: 'SecurePass123!',
                    name: 'New User',
                    role: 'staff',
                    department: 'Engineering'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.email).toBe('newuser@example.com');
            expect(response.body.data.user.password).toBeUndefined();
        });

        it('should reject registration with existing email', async () => {
            await User.create({
                email: 'existing@example.com',
                password: 'password123',
                name: 'Existing User',
                role: 'staff',
                department: 'IT'
            });

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'existing@example.com',
                    password: 'SecurePass123!',
                    name: 'New User',
                    role: 'staff',
                    department: 'Engineering'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject registration with invalid email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'SecurePass123!',
                    name: 'New User',
                    role: 'staff',
                    department: 'Engineering'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject registration with weak password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'user@example.com',
                    password: '123',
                    name: 'New User',
                    role: 'staff',
                    department: 'Engineering'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            await User.create({
                email: 'testuser@example.com',
                password: 'password123',
                name: 'Test User',
                role: 'staff',
                department: 'IT'
            });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'testuser@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.email).toBe('testuser@example.com');
            expect(response.body.data.user.password).toBeUndefined();
        });

        it('should reject login with invalid email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should reject login with invalid password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'testuser@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should reject login for inactive users', async () => {
            await User.findOneAndUpdate(
                { email: 'testuser@example.com' },
                { isActive: false }
            );

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'testuser@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should update lastLogin timestamp on successful login', async () => {
            const userBefore = await User.findOne({ email: 'testuser@example.com' });
            expect(userBefore?.lastLogin).toBeUndefined();

            await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'testuser@example.com',
                    password: 'password123'
                });

            const userAfter = await User.findOne({ email: 'testuser@example.com' });
            expect(userAfter?.lastLogin).toBeDefined();
        });
    });
});
