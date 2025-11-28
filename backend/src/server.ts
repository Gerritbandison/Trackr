import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import assetRoutes from './modules/assets/asset.routes';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import licenseRoutes from './modules/licenses/license.routes';
import departmentRoutes from './modules/departments/department.routes';
import vendorRoutes from './modules/vendors/vendor.routes';
import { errorHandler } from './core/middleware/error.middleware';
import { auditMiddleware } from './core/middleware/audit.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting configuration
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Audit Logging
app.use(auditMiddleware);

// Health Check Endpoint
app.get('/health', (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    };
    res.status(200).json(healthcheck);
});

// Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/licenses', licenseRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/vendors', vendorRoutes);

// Error Handling
app.use(errorHandler);

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/trackr';

const connectDB = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            await mongoose.connect(MONGO_URI);
            console.log('✅ Connected to MongoDB');
            return;
        } catch (err) {
            console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, err);
            if (i < retries - 1) {
                console.log(`⏳ Retrying in 5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    console.error('❌ Failed to connect to MongoDB after multiple attempts');
    process.exit(1);
};

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
