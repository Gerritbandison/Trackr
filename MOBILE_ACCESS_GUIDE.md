# Mobile Access Guide - Trackr ITAM

## What Happened

Your deployment script ran but encountered a MongoDB credential mismatch. The backend container couldn't connect to MongoDB, causing the health check to fail.

**Issue:** MongoDB was created with one set of credentials, but the backend was using different ones.

**Solution:** I've created the correct `.env.prod` file and a fix script to reset the deployment.

## Fix the Deployment

Run this command to fix and restart the deployment:

```bash
./fix-deployment.sh
```

Or manually:
```bash
# Stop containers and remove volumes
docker-compose -f docker-compose.prod.yml down -v

# Start with correct credentials
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml logs backend
```

## Accessing on Your iPhone

### Step 1: Get Your Computer's IP Address

On **Linux**:
```bash
hostname -I | awk '{print $1}'
```

On **Mac**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

On **Windows**:
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

### Step 2: Ensure Same Network

Make sure your iPhone and computer are on the **same WiFi network**.

### Step 3: Access from iPhone

Open Safari on your iPhone and go to:
```
http://YOUR_IP_ADDRESS
```

For example:
- `http://192.168.1.100`
- `http://10.0.0.50`

### Step 4: Add to Home Screen (Optional)

For a native app experience:

1. Tap the **Share** button (⬆️) in Safari
2. Scroll down and tap **"Add to Home Screen"**
3. Name it "Trackr"
4. Tap **"Add"**

Now you have a Trackr icon on your iPhone!

## Default Login Credentials

Once the app loads, you'll need to log in. The default admin account is:

- **Email:** `admin@example.com`
- **Password:** `admin123`

⚠️ **Change this password immediately after first login!**

## Production Deployment Credentials

Your MongoDB credentials (keep these secure):

- **Username:** `trackr_admin`
- **Password:** `7l23qMe2wFYJSPr5hVDkr9J6QKSyWhd1`

## Troubleshooting

### Can't Connect from iPhone

1. **Check firewall:** Temporarily disable or allow ports 80 and 5000
2. **Verify network:** Both devices must be on same WiFi
3. **Check containers:** Run `docker-compose -f docker-compose.prod.yml ps`
4. **View logs:** Run `docker-compose -f docker-compose.prod.yml logs backend`

### Backend Health Check Failing

```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart backend only
docker-compose -f docker-compose.prod.yml restart backend
```

### MongoDB Connection Issues

```bash
# Check MongoDB logs
docker-compose -f docker-compose.prod.yml logs mongo

# Verify MongoDB is healthy
docker-compose -f docker-compose.prod.yml ps mongo
```

## URLs to Access

Once deployed successfully:

- **Frontend (Mobile/Desktop):** `http://YOUR_IP_ADDRESS`
- **Backend API:** `http://YOUR_IP_ADDRESS:5000`
- **Health Check:** `http://YOUR_IP_ADDRESS:5000/health`
- **API Docs:** `http://YOUR_IP_ADDRESS:5000/api-docs`

## Mobile-Optimized Features

The Trackr app is fully responsive with:

✅ Touch-optimized interface
✅ Mobile-friendly forms
✅ Responsive tables and charts
✅ QR code scanning (camera access)
✅ Barcode generation for asset labels
✅ Works in portrait and landscape

## Development vs Production Access

### Development Mode (for testing):
```bash
# Start dev servers
npm run dev:all

# Access at:
http://YOUR_IP_ADDRESS:5173
```

### Production Mode (for real use):
```bash
# Start production containers
docker-compose -f docker-compose.prod.yml up -d

# Access at:
http://YOUR_IP_ADDRESS
```

## Need Help?

Check the main documentation:
- `README.md` - General overview
- `TROUBLESHOOTING_GUIDE.md` - Common issues
- `DOCKER.md` - Docker deployment details
