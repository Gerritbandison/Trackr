# 🚀 ITAM System - Quick Reference Guide

## 📁 File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Charts/          # Chart components (Gauge, Heatmap)
│   │   ├── Common/          # Reusable components
│   │   └── Layout/          # Header, Sidebar, Layout
│   ├── contexts/            # React contexts (Auth)
│   ├── hooks/               # Custom hooks
│   ├── pages/              # Page components
│   │   ├── Assets/         # Asset management
│   │   ├── Users/          # User management
│   │   ├── Licenses/       # License management
│   │   ├── OnboardingKits/ # Onboarding kits
│   │   └── ...
│   ├── config/             # API configuration
│   └── index.css           # Global styles
└── Documentation files

backend/
├── src/
│   ├── controllers/        # Route handlers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Auth, validation, audit
│   ├── utils/             # Helper functions
│   └── services/          # Business logic
└── seed.js                # Database seeding
```

---

## 🔑 Test Credentials

```javascript
// Admin (Full Access)
Email: sarah.johnson@company.com
Password: password123

// Manager (Manage Assets & Users)
Email: michael.chen@company.com
Password: password123

// Staff (View Only)
Email: emily.rodriguez@company.com
Password: password123
```

---

## 🛠️ Common Commands

```bash
# Backend
cd c:\backend
npm install           # Install dependencies
npm run dev          # Start development server (port 5000)
npm run seed         # Seed database with test data
npm start            # Start production server

# Frontend
cd c:\frontend
npm install          # Install dependencies
npm run dev         # Start development server (port 5173)
npm run build       # Build for production
npm run preview     # Preview production build
```

---

## 📡 API Endpoints

### Base URL
```
Development: http://localhost:5000/api/v1
```

### Authentication
```javascript
// Login
POST /auth/login
Body: { email, password }

// Get current user
GET /auth/me
Headers: { Authorization: "Bearer <token>" }

// Update profile
PUT /auth/updatedetails
Body: { name, email, phone, location }

// Update password
PUT /auth/updatepassword
Body: { currentPassword, newPassword }
```

### Assets
```javascript
// Get all assets
GET /assets?page=1&limit=50&search=laptop&status=assigned

// Get single asset
GET /assets/:id

// Create asset
POST /assets
Body: { name, category, manufacturer, model, serialNumber, ... }

// Update asset
PUT /assets/:id
Body: { name, status, condition, ... }

// Delete asset
DELETE /assets/:id

// Assign asset
POST /assets/:id/assign
Body: { userId }

// Unassign asset
POST /assets/:id/unassign

// Warranty lookup (Lenovo)
GET /assets/:id/warranty-lookup?autoUpdate=false
```

### Users
```javascript
// Get all users
GET /users?page=1&limit=50&role=admin&status=active

// Get single user
GET /users/:id

// Create user
POST /users
Body: { name, email, password, role, department, ... }

// Update user
PUT /users/:id
Body: { name, role, status, ... }

// Get user's assets
GET /users/:id/assets

// Get user's licenses
GET /users/:id/licenses
```

### Onboarding Kits
```javascript
// Get all kits
GET /onboarding-kits

// Create kit
POST /onboarding-kits
Body: { 
  name, description, role, 
  assetTemplates: [...],
  licenseTemplates: [...],
  tasks: [...]
}

// Apply kit to user
POST /onboarding-kits/:id/apply
Body: { userId }
```

### System
```javascript
// Health check
GET /system/health

// System statistics
GET /system/stats

// Diagnostics
GET /system/diagnostics

// List all endpoints
GET /system/endpoints
```

---

## 🎨 Component Usage

### Modal
```jsx
import Modal from '../components/Common/Modal';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Edit Asset"
  size="lg" // sm, md, lg, xl
>
  {/* Content */}
</Modal>
```

### Badge
```jsx
import Badge from '../components/Common/Badge';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Expired</Badge>
<Badge variant="info">Info</Badge>
```

### Toast Notifications
```jsx
import toast from 'react-hot-toast';

toast.success('Asset created successfully');
toast.error('Failed to delete asset');
toast.loading('Processing...');
```

### Search Bar
```jsx
import SearchBar from '../components/Common/SearchBar';

<SearchBar
  onSearch={(value) => setSearch(value)}
  placeholder="Search assets..."
/>
```

---

## 🔐 Role-Based Access Control

```javascript
// In components
import { useAuth } from '../../contexts/AuthContext';

const { user, canManage, isAdmin } = useAuth();

// Check permissions
{canManage() && (
  <button>Edit Asset</button>
)}

{isAdmin() && (
  <button>Delete User</button>
)}

// In routes (backend)
router.post(
  '/assets',
  protect,                    // Require authentication
  authorize('admin', 'manager'), // Require specific roles
  createAsset
);
```

---

## 📊 Data Fetching with React Query

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsAPI } from '../../config/api';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['assets', page, search],
  queryFn: () => assetsAPI.getAll({ page, search }).then(res => res.data),
});

// Mutate data
const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: (data) => assetsAPI.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['assets']);
    toast.success('Asset created');
  },
  onError: (error) => {
    toast.error(error.response?.data?.message || 'Failed');
  },
});

// Use mutation
createMutation.mutate(formData);
```

---

## 🎯 Common Tasks

### Adding a New Page

1. **Create page component**
```jsx
// src/pages/NewFeature/NewFeature.jsx
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const NewFeature = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['feature'],
    queryFn: () => api.get('/feature').then(res => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return <div>New Feature Content</div>;
};

export default NewFeature;
```

2. **Add route**
```jsx
// src/App.jsx
import NewFeature from './pages/NewFeature/NewFeature';

<Route path="/new-feature" element={<NewFeature />} />
```

3. **Add navigation**
```jsx
// src/components/Layout/Sidebar.jsx
const navItems = [
  // ... existing items
  { to: '/new-feature', icon: FiStar, label: 'New Feature', show: true },
];
```

### Adding an API Endpoint

1. **Backend - Create controller**
```javascript
// src/controllers/feature.controller.js
export const getFeatures = asyncHandler(async (req, res) => {
  const features = await Feature.find();
  res.json({ success: true, data: features });
});
```

2. **Backend - Create route**
```javascript
// src/routes/feature.routes.js
import express from 'express';
import { getFeatures } from '../controllers/feature.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);
router.get('/', getFeatures);

export default router;
```

3. **Backend - Register route**
```javascript
// src/routes/index.js
import featureRoutes from './feature.routes.js';
router.use('/features', featureRoutes);
```

4. **Frontend - Add to API config**
```javascript
// src/config/api.js
export const featuresAPI = {
  getAll: () => api.get('/features'),
  getById: (id) => api.get(`/features/${id}`),
  create: (data) => api.post('/features', data),
};
```

### Adding Bulk Operations

```javascript
// backend/src/controllers/asset.controller.js
import { bulkAssignAssets } from '../utils/bulkOperations.js';

export const bulkAssign = asyncHandler(async (req, res) => {
  const { assetIds, userId } = req.body;
  const result = await bulkAssignAssets(assetIds, userId, req.user.id);
  
  res.json({
    success: true,
    data: result,
    message: `${result.success.length} assets assigned successfully`
  });
});
```

---

## 🐛 Debugging Tips

### Check API Connection
```bash
# Test health endpoint
curl http://localhost:5000/api/v1/system/health

# View all endpoints
curl http://localhost:5000/api/v1/system/endpoints
```

### Common Issues

**Issue**: "Cannot connect to backend"
```javascript
// Check VITE_API_URL in .env
VITE_API_URL=http://localhost:5000/api/v1
```

**Issue**: "Unauthorized 401"
```javascript
// Check if token is valid
localStorage.getItem('token')

// Re-login if expired
```

**Issue**: "MongoDB connection error"
```javascript
// Check MONGODB_URI in backend .env
MONGODB_URI=mongodb://localhost:27017/itam

// Verify MongoDB is running
mongod --version
```

---

## 📝 Environment Variables

### Backend (.env)
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/itam
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
FRONTEND_URL=http://localhost:5173
API_VERSION=v1
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 🎨 Styling

### Tailwind Classes
```jsx
// Common patterns
<div className="card">            {/* White card with shadow */}
<div className="card-header">     {/* Card header section */}
<div className="card-body">       {/* Card body with padding */}
<button className="btn btn-primary">  {/* Primary button */}
<button className="btn btn-secondary"> {/* Secondary button */}
<button className="btn btn-danger">   {/* Danger button */}
```

### Custom Colors
```javascript
// Defined in tailwind.config.js
primary: Blue/Purple gradient
secondary: Dark gray
accent: Pink/Purple
success: Green
warning: Yellow
danger: Red
info: Light blue
```

---

## 📚 Resources

- **Backend API**: http://localhost:5000/api/v1
- **Frontend**: http://localhost:5173
- **Database**: MongoDB on port 27017
- **Documentation**: See VERIFICATION_REPORT.md, FEATURES_ROADMAP.md, OPTIMIZATION_SUMMARY.md

---

## 🆘 Quick Fixes

```bash
# Reset database
npm run seed

# Clear node_modules
rm -rf node_modules && npm install

# Clear browser cache
Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)

# Check logs
# Backend: Check terminal where npm run dev is running
# Frontend: Check browser console (F12)

# Restart services
# Kill processes and restart npm run dev
```

---

**Last Updated**: October 2025  
**Version**: 1.0.0

