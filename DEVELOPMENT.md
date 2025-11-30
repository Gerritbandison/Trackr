# Trackr ITAM - Development Setup Guide

Complete guide for setting up the Trackr IT Asset Management platform for local development.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software

- **Node.js** v18.0.0 or higher
  ```bash
  node --version  # Should be >= 18.0.0
  ```

- **npm** v9.0.0 or higher
  ```bash
  npm --version  # Should be >= 9.0.0
  ```

- **MongoDB** v7.0 or higher
  - [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
  - Or use Docker (recommended for development)

- **Git** v2.0 or higher
  ```bash
  git --version
  ```

### Optional but Recommended

- **Docker** & **Docker Compose** (for containerized development)
- **MongoDB Compass** (GUI for MongoDB)
- **Postman** or **Insomnia** (API testing)
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

## 🌍 Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Trackr
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Install Workspace Dependencies

```bash
# Install all workspace dependencies
npm run install --workspaces

# Or install individually
cd backend && npm install
cd ../frontend && npm install
```

## 🗄️ Database Setup

### Option 1: MongoDB with Docker (Recommended)

The easiest way to run MongoDB for development:

```bash
# Start MongoDB using docker-compose
docker-compose up -d mongo

# Verify MongoDB is running
docker ps | grep mongo
```

MongoDB will be available at: `mongodb://trackr_user:trackr_dev_password@localhost:27017/trackr?authSource=admin`

### Option 2: Local MongoDB Installation

If you prefer a local MongoDB installation:

1. **Install MongoDB Community Server**
   - macOS: `brew install mongodb-community@7.0`
   - Ubuntu: `sudo apt-get install mongodb-org`
   - Windows: Download installer from MongoDB website

2. **Start MongoDB Service**
   ```bash
   # macOS
   brew services start mongodb-community@7.0

   # Linux
   sudo systemctl start mongod

   # Windows
   net start MongoDB
   ```

3. **Create Database and User**
   ```bash
   mongosh
   ```

   Then run:
   ```javascript
   use admin
   db.createUser({
     user: "trackr_user",
     pwd: "trackr_dev_password",
     roles: [{ role: "readWrite", db: "trackr" }]
   })

   use trackr
   // Database is now ready
   ```

### Option 3: MongoDB Atlas (Cloud)

For cloud development:

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist your IP address
3. Create a database user
4. Get your connection string
5. Use it in your `.env` file

## 🔙 Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Environment File

```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://trackr_user:trackr_dev_password@localhost:27017/trackr?authSource=admin

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
```

### 4. Build TypeScript

```bash
npm run build
```

### 5. Start Development Server

```bash
npm run dev
```

The backend should now be running at `http://localhost:5000`

### 6. Verify Backend is Running

```bash
curl http://localhost:5000/health
```

You should see:
```json
{
  "uptime": 1.234,
  "message": "OK",
  "timestamp": 1234567890,
  "mongodb": "connected"
}
```

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Create Environment File

```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Trackr ITAM
```

### 4. Start Development Server

```bash
npm run dev
```

The frontend should now be running at `http://localhost:5173`

### 5. Open in Browser

Navigate to [http://localhost:5173](http://localhost:5173)

## 🚀 Running the Application

### Using Docker Compose (Recommended)

Run everything with one command:

```bash
# From project root
docker-compose up

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: localhost:27017

### Using npm Workspaces

Run frontend and backend concurrently:

```bash
# From project root
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## 💻 Development Workflow

### Code Structure

```
Trackr/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── assets/
│   │   │   ├── licenses/
│   │   │   ├── departments/
│   │   │   └── vendors/
│   │   └── server.ts
│   ├── logs/
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── contexts/
    │   ├── hooks/
    │   └── utils/
    └── package.json
```

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code patterns
   - Add TypeScript types
   - Include error handling

3. **Test your changes**
   ```bash
   # Backend
   cd backend
   npm run lint
   npm test
   npm run build

   # Frontend
   cd frontend
   npm run lint
   npm test
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: descriptive commit message"
   ```

5. **Push to remote**
   ```bash
   git push origin feature/your-feature-name
   ```

### Adding a New Backend Module

Example: Adding a "Contracts" module

1. **Create module directory**
   ```bash
   mkdir -p backend/src/modules/contracts
   ```

2. **Create model file** (`contract.model.ts`)
   ```typescript
   import mongoose, { Document, Schema } from 'mongoose';

   export interface IContract extends Document {
     name: string;
     // ... other fields
   }

   const contractSchema = new Schema<IContract>({
     // ... schema definition
   });

   export default mongoose.model<IContract>('Contract', contractSchema);
   ```

3. **Create service file** (`contract.service.ts`)
   ```typescript
   import Contract, { IContract } from './contract.model';

   export class ContractService {
     async getContracts(): Promise<IContract[]> {
       // Implementation
     }
   }

   export const contractService = new ContractService();
   ```

4. **Create controller file** (`contract.controller.ts`)
   ```typescript
   import { Response } from 'express';
   import { contractService } from './contract.service';
   import { AuthRequest } from '../../core/middleware/auth.middleware';

   export const getContracts = async (req: AuthRequest, res: Response): Promise<void> => {
     // Implementation
   };
   ```

5. **Create routes file** (`contract.routes.ts`)
   ```typescript
   import { Router } from 'express';
   import { authenticate, authorize } from '../../core/middleware/auth.middleware';
   import { getContracts } from './contract.controller';

   const router = Router();
   router.use(authenticate);
   router.get('/', authorize('admin', 'manager'), getContracts);

   export default router;
   ```

6. **Register routes in server.ts**
   ```typescript
   import contractRoutes from './modules/contracts/contract.routes';
   app.use('/api/v1/contracts', contractRoutes);
   ```

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- auth.test.ts

# Run with coverage
npm test -- --coverage
```

### Frontend Testing

```bash
cd frontend

# Unit tests
npm test

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Test coverage
npm run test:coverage
```

### Manual API Testing

Use the test credentials for development:

**Admin User:**
- Email: `admin@company.com`
- Password: `password123`

**Manager User:**
- Email: `john.smith@company.com`
- Password: `password123`

**Staff User:**
- Email: `sarah.johnson@company.com`
- Password: `password123`

## 🔍 Troubleshooting

### MongoDB Connection Issues

**Problem:** Cannot connect to MongoDB

**Solutions:**
```bash
# Check if MongoDB is running
docker ps | grep mongo
# or
mongosh

# Check connection string in .env
echo $MONGO_URI

# Restart MongoDB
docker-compose restart mongo
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions:**
```bash
# Find process using port 5000
lsof -i :5000
# or on Windows
netstat -ano | findstr :5000

# Kill the process
kill -9 <PID>

# Or use a different port in backend/.env
PORT=5001
```

### TypeScript Compilation Errors

**Problem:** Type errors during build

**Solutions:**
```bash
# Clear TypeScript cache
rm -rf backend/dist
rm -rf frontend/dist

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check tsconfig.json settings
```

### Frontend Won't Load

**Problem:** Blank page or errors in console

**Solutions:**
```bash
# Check backend is running
curl http://localhost:5000/health

# Check VITE_API_URL in frontend/.env
cat frontend/.env

# Clear browser cache or use incognito mode

# Check browser console for errors
```

### Docker Issues

**Problem:** Docker containers won't start

**Solutions:**
```bash
# Check Docker is running
docker info

# Remove old containers
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Check logs
docker-compose logs
```

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Getting Help

If you encounter issues:

1. Check this documentation
2. Review the [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
3. Check existing [GitHub Issues](https://github.com/your-org/trackr/issues)
4. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

---

**Happy Coding! 🚀**
