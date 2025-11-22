# Quick API Setup Guide

## 🚀 Quick Start

### 1. Create Environment File

```bash
# Copy the example file
cp .env.example .env
```

### 2. Configure API URL

Edit `.env` file:

```env
# For local development
VITE_API_URL=http://localhost:5000/api/v1

# For production
# VITE_API_URL=https://api.yourcompany.com/api/v1
```

### 3. Start Development Server

```bash
npm run dev
```

The API will automatically use the configured URL.

---

## 🔧 Configuration Options

### Development Configuration

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_API_TIMEOUT=30000
VITE_API_LOGGING=true
VITE_DEBUG_MODE=true
```

### Production Configuration

```env
VITE_API_URL=https://api.yourcompany.com/api/v1
VITE_API_TIMEOUT=30000
VITE_API_LOGGING=false
VITE_DEBUG_MODE=false
```

---

## ✅ Verification

### Check API Connection

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to any page in the app
4. Check for API requests to your configured URL

### Test Authentication

1. Try logging in
2. Check console for API logs (if `VITE_API_LOGGING=true`)
3. Verify token is stored in localStorage

---

## 📝 Notes

- API URL can be absolute (with domain) or relative (`/api/v1`)
- Vite proxy handles `/api` requests in development
- All API endpoints are automatically authenticated
- Token refresh happens automatically on 401 errors

---

**See `API_CONFIGURATION.md` for detailed documentation**

