import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import assetRoutes from './modules/assets/asset.routes';
import { errorHandler } from './core/middleware/error.middleware';
import { auditMiddleware } from './core/middleware/audit.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

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
app.use('/api/v1/assets', assetRoutes);

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
