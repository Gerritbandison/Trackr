# Linux Deployment Testing Guide - Trackr ITAM

This guide will help you test both development and production deployments on your Linux system.

## Prerequisites Check

Before starting, verify you have the required tools:

```bash
# Check Docker
docker --version
docker-compose --version

# Check Node.js (should be v18 or v20)
node --version
npm --version

# Check MongoDB (for development mode)
mongod --version
```

## Option 1: Test Production Deployment (Recommended)

This tests the full Docker containerized production setup.

### Step 1: Stop Any Running Containers

```bash
cd ~/Trackr
docker-compose -f docker-compose.prod.yml down -v
```

### Step 2: Start Production Deployment

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Watch the logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 3: Wait for Services to Start

Give it about 60 seconds for all services to initialize.

### Step 4: Test the Deployment

**Health Check:**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-12-03T..."}
```

**Frontend Check:**
```bash
curl -I http://localhost
```

Expected: `HTTP/1.1 200 OK`

**Database Connection:**
```bash
# Check backend logs for successful connection
docker-compose -f docker-compose.prod.yml logs backend | grep "MongoDB"
```

Expected to see: `✅ MongoDB connected successfully`

### Step 5: Test in Browser

Open your browser and navigate to:
- **Frontend:** http://localhost
- **Backend API:** http://localhost:5000/api-docs
- **Health:** http://localhost:5000/health

**Default Login:**
- Email: `admin@example.com`
- Password: `admin123`

### Step 6: Test Mobile Access

**Get your Linux machine's IP:**
```bash
hostname -I | awk '{print $1}'
# Or
ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1
```

**Access from mobile device:**
- Make sure mobile is on same WiFi network
- Open browser on mobile: `http://YOUR_IP`

### Step 7: Check Container Status

```bash
# List all containers
docker-compose -f docker-compose.prod.yml ps

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs backend | tail -50
docker-compose -f docker-compose.prod.yml logs frontend | tail -20
docker-compose -f docker-compose.prod.yml logs mongo | tail -20
```

All containers should show status "Up" and be healthy.

### Step 8: Test API Endpoints

```bash
# Register a test user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "department": "IT"
  }'

# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }' | jq -r '.data.token')

echo "JWT Token: $TOKEN"

# Get current user info
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Get assets
curl -X GET http://localhost:5000/api/v1/assets \
  -H "Authorization: Bearer $TOKEN"
```

### Troubleshooting Production Deployment

**If backend container is unhealthy:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Common issues:
# 1. MongoDB connection - check MONGO_URI in .env.prod
# 2. JWT_SECRET missing - add to .env.prod
# 3. Port already in use - stop conflicting services
```

**If frontend can't connect to backend:**
```bash
# Check if backend is accessible from frontend container
docker-compose -f docker-compose.prod.yml exec frontend curl http://backend:5000/health

# Check proxy configuration
docker-compose -f docker-compose.prod.yml logs frontend | grep proxy
```

**If MongoDB fails to start:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs mongo

# Remove volume and restart
docker-compose -f docker-compose.prod.yml down -v
docker volume rm trackr_mongo_data
docker-compose -f docker-compose.prod.yml up -d
```

## Option 2: Test Development Mode

This runs the app in development mode with hot-reloading.

### Prerequisites for Development

```bash
# Install MongoDB (if not installed)
# Ubuntu/Debian:
sudo apt-get install mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
mongosh --eval "db.version()"
```

### Step 1: Set Up Environment

```bash
cd ~/Trackr

# Create backend .env file
cp backend/.env.example backend/.env

# Edit backend/.env and set:
# MONGO_URI=mongodb://localhost:27017/trackr
# JWT_SECRET=your-secret-key-change-this
# NODE_ENV=development
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Or install individually
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Step 3: Start Development Servers

```bash
# Start both frontend and backend
npm run dev:all

# Or start separately in different terminals:
# Terminal 1: npm run dev:backend
# Terminal 2: npm run dev:frontend
```

### Step 4: Test Development Mode

**Backend (port 5000):**
```bash
curl http://localhost:5000/health
```

**Frontend (port 5173):**
```bash
curl -I http://localhost:5173
```

**Access in browser:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api-docs

### Step 5: Test Hot Reload

Make a small change to a file and verify it reloads automatically:

```bash
# Backend test
echo "// Test comment" >> backend/src/server.ts
# Watch backend console - should restart

# Frontend test
# Edit any .jsx file in frontend/src/
# Browser should reload automatically
```

## Option 3: Quick Smoke Test Script

Save this as `test-deployment.sh`:

```bash
#!/bin/bash

echo "=================================="
echo "  Trackr Deployment Smoke Test"
echo "=================================="
echo ""

# Test backend health
echo "Testing backend health..."
HEALTH=$(curl -s http://localhost:5000/health)
if [[ $HEALTH == *"ok"* ]]; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    echo "Response: $HEALTH"
fi

# Test frontend
echo ""
echo "Testing frontend..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [[ $FRONTEND == "200" ]]; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend not accessible (HTTP $FRONTEND)"
fi

# Test API docs
echo ""
echo "Testing API documentation..."
API_DOCS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api-docs)
if [[ $API_DOCS == "200" ]]; then
    echo "✅ API documentation accessible"
else
    echo "❌ API docs not accessible (HTTP $API_DOCS)"
fi

# Test login endpoint
echo ""
echo "Testing login endpoint..."
LOGIN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

if [[ $LOGIN == *"token"* ]]; then
    echo "✅ Login endpoint working"
else
    echo "❌ Login endpoint failed"
    echo "Response: $LOGIN"
fi

echo ""
echo "=================================="
echo "Test Summary:"
echo "Check the results above"
echo "=================================="
```

Make it executable and run:
```bash
chmod +x test-deployment.sh
./test-deployment.sh
```

## Performance Testing (Optional)

### Load Test with Apache Bench

```bash
# Install ab if needed
sudo apt-get install apache2-utils

# Test backend health endpoint (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:5000/health

# Test frontend
ab -n 100 -c 10 http://localhost/
```

### Monitor Resource Usage

```bash
# Watch container resources
docker stats

# Check disk usage
docker system df

# Check logs size
docker-compose -f docker-compose.prod.yml logs --tail=0 | wc -l
```

## Common Issues and Solutions

### Port Already in Use

```bash
# Find what's using port 5000
sudo lsof -i :5000
# Or
sudo netstat -tulpn | grep :5000

# Kill the process
sudo kill -9 <PID>
```

### Permission Denied

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or:
newgrp docker
```

### MongoDB Connection Refused

```bash
# Check MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check MongoDB logs
sudo journalctl -u mongod -f
```

### Out of Memory

```bash
# Check available memory
free -h

# Clean up Docker
docker system prune -a --volumes

# Restart Docker
sudo systemctl restart docker
```

## Network Configuration for Mobile Access

If you can't access from mobile device:

### Check Firewall

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 5000/tcp
sudo ufw allow 5173/tcp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --reload

# Check firewall status
sudo ufw status    # Ubuntu
sudo firewall-cmd --list-all    # CentOS
```

### Test Network Connectivity

```bash
# From your Linux machine, get IP
ip addr show | grep "inet " | grep -v 127.0.0.1

# Test from mobile (using curl on another device)
curl http://YOUR_LINUX_IP:5000/health
```

## Success Criteria

Your deployment is successful if:

✅ All containers are running and healthy
✅ Backend health check returns `{"status":"ok"}`
✅ Frontend loads in browser
✅ Can log in with admin credentials
✅ API documentation is accessible
✅ Can access from mobile device on same network
✅ No errors in container logs

## Next Steps After Testing

1. **Change default passwords** - Update admin password immediately
2. **Configure .env.prod** - Set proper JWT secrets and MongoDB credentials
3. **Set up backups** - Configure MongoDB backup strategy
4. **Enable HTTPS** - Set up SSL/TLS certificates for production
5. **Configure monitoring** - Set up Sentry or similar error tracking
6. **Review logs** - Set up log rotation and monitoring

## Quick Reference Commands

```bash
# Start production
docker-compose -f docker-compose.prod.yml up -d

# Stop production
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart a service
docker-compose -f docker-compose.prod.yml restart backend

# Rebuild after code changes
docker-compose -f docker-compose.prod.yml up -d --build

# Clean everything
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a --volumes
```
