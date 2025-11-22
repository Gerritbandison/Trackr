# API Configuration Guide

## Overview

Comprehensive guide for configuring the ITAM Platform API endpoints, authentication, and environment variables.

---

## Environment Variables

### Required Variables

#### `VITE_API_URL`
- **Description**: Backend API base URL
- **Development**: `http://localhost:5000/api/v1`
- **Production**: `https://api.yourcompany.com/api/v1`
- **Default**: `/api/v1` (relative path for same-origin)

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Optional Variables

#### `VITE_API_TIMEOUT`
- **Description**: API request timeout in milliseconds
- **Default**: `30000` (30 seconds)
- **Recommended**: `30000` for most cases, `60000` for large file uploads

```env
VITE_API_TIMEOUT=30000
```

#### `VITE_API_LOGGING`
- **Description**: Enable request/response logging in development
- **Default**: `true` in development mode
- **Production**: Should be `false` for security

```env
VITE_API_LOGGING=true
```

#### `VITE_DEBUG_MODE`
- **Description**: Enable detailed error messages
- **Default**: `true` in development mode
- **Production**: Should be `false` for security

```env
VITE_DEBUG_MODE=true
```

#### `VITE_APP_NAME`
- **Description**: Application name for display
- **Default**: `ITAM Platform`

```env
VITE_APP_NAME=ITAM Platform
```

---

## Configuration Files

### 1. Environment File (.env)

Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=ITAM Platform
VITE_APP_ENV=development
VITE_API_TIMEOUT=30000
VITE_API_LOGGING=true
VITE_DEBUG_MODE=true
```

### 2. Production Environment (.env.production)

For production deployment:

```env
VITE_API_URL=https://api.yourcompany.com/api/v1
VITE_APP_NAME=ITAM Platform
VITE_APP_ENV=production
VITE_API_TIMEOUT=30000
VITE_API_LOGGING=false
VITE_DEBUG_MODE=false
```

### 3. Development Environment (.env.development)

For development:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=ITAM Platform (Dev)
VITE_APP_ENV=development
VITE_API_TIMEOUT=30000
VITE_API_LOGGING=true
VITE_DEBUG_MODE=true
```

---

## API Configuration Structure

### Base Configuration

The API is configured in `src/config/api.js`:

```javascript
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Authentication

#### Request Interceptor
- Automatically adds `Authorization: Bearer <token>` header to all requests
- Token retrieved from `localStorage.getItem('token')`

#### Response Interceptor
- Handles 401 errors automatically
- Attempts token refresh on authentication failure
- Redirects to login if refresh fails

### Error Handling

#### Network Errors
- Detects network failures
- Provides user-friendly error messages
- Logs detailed errors in development mode

#### HTTP Errors
- Formats error responses consistently
- Extracts error messages from API responses
- Provides fallback messages when API doesn't return error details

---

## API Endpoints

### Authentication Endpoints

```javascript
authAPI.login(credentials)
authAPI.register(userData)
authAPI.logout()
authAPI.getMe()
authAPI.updateDetails(data)
authAPI.updatePassword(data)
```

### ITAM Endpoints

All ITAM endpoints are organized under `itamAPI`:

#### Receiving & Acquisition
```javascript
itamAPI.receiving.getExpected(params)
itamAPI.receiving.ingestPO(data)
itamAPI.receiving.receiveAsset(data)
itamAPI.receiving.bulkReceive(data)
```

#### Staging & Deployment
```javascript
itamAPI.staging.getProfileMappings()
itamAPI.staging.deploy(data)
itamAPI.staging.uploadHandoffDoc(assetId, file)
```

#### Loaners & Check-in/Check-out
```javascript
itamAPI.loaners.checkout(data)
itamAPI.loaners.checkin(id, data)
itamAPI.loaners.getPolicy()
itamAPI.loaners.getOverdue()
```

#### Warranty & Repairs
```javascript
assetsAPI.lookupWarranty(id, manufacturer)
assetsAPI.createRepairTicket(id, data)
assetsAPI.getRepairTickets(id)
assetsAPI.getSLAMetrics(id)
```

#### Software & Licenses
```javascript
itamAPI.software.getAll(params)
itamAPI.software.getEntitlements(id)
itamAPI.software.getTrueUpReport(params)
itamAPI.software.optimizeSeats(data)
```

#### Compliance & Audit
```javascript
itamAPI.compliance.getAttestations(params)
itamAPI.compliance.createAttestation(data)
itamAPI.compliance.completeAttestation(id, data)
itamAPI.compliance.getAuditPack(params)
itamAPI.compliance.uploadWipeCert(id, file)
```

#### Security & Risk
```javascript
itamAPI.security.getHealthStatus(id)
itamAPI.security.getNonCompliant(params)
itamAPI.security.executeOffboarding(data)
itamAPI.security.getRiskScore(id)
```

#### Locations & Shipping
```javascript
itamAPI.locations.getAll(params)
itamAPI.locations.getTree()
itamAPI.locations.create(data)
itamAPI.locations.trackShipment(params)
```

#### Labels & Printing
```javascript
itamAPI.labels.getTemplates(params)
itamAPI.labels.createTemplate(data)
itamAPI.labels.printLabel(templateId, assetId)
itamAPI.labels.generateLabel(templateId, assetId)
```

#### Workflows & Automations
```javascript
itamAPI.workflows.getAll(params)
itamAPI.workflows.create(data)
itamAPI.workflows.execute(id, data)
itamAPI.workflows.executeNewHire(data)
```

#### APIs & Extensibility
```javascript
itamAPI.apis.getKeys()
itamAPI.apis.createKey(data)
itamAPI.apis.bulkImport(formData)
```

#### Data Quality
```javascript
itamAPI.dataQuality.getDriftReport()
itamAPI.dataQuality.getNormalizationCatalog()
itamAPI.dataQuality.findDuplicates(params)
itamAPI.dataQuality.mergeDuplicates(data)
```

#### Reporting & BI
```javascript
itamAPI.reporting.getDashboard(params)
itamAPI.reporting.exportData(params)
itamAPI.reporting.scheduleExport(data)
itamAPI.reporting.getPowerBISchema()
```

---

## Development Proxy Configuration

For development, Vite proxy is configured in `vite.config.js`:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/api'),
    },
  },
}
```

This allows:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API calls: `/api/v1/*` → proxied to `http://localhost:5000/api/v1/*`

---

## Production Configuration

### API URL Configuration

For production, set the full API URL:

```env
VITE_API_URL=https://api.yourcompany.com/api/v1
```

### CORS Configuration

Ensure backend CORS is configured to allow:
- Origin: Your frontend domain
- Methods: GET, POST, PUT, DELETE, PATCH
- Headers: Authorization, Content-Type
- Credentials: true (if using cookies)

### Security Headers

Production should include:
- HTTPS only
- Secure token storage
- API logging disabled
- Debug mode disabled

---

## Testing API Configuration

### Check API Connection

```javascript
// Test API connection
import { authAPI } from './config/api';

authAPI.getMe()
  .then(response => console.log('API connected:', response.data))
  .catch(error => console.error('API connection failed:', error));
```

### Verify Environment Variables

```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('API Timeout:', import.meta.env.VITE_API_TIMEOUT);
console.log('Debug Mode:', import.meta.env.VITE_DEBUG_MODE);
```

---

## Troubleshooting

### Issue: API calls failing with CORS errors

**Solution**: 
1. Check backend CORS configuration
2. Verify `VITE_API_URL` is correct
3. Ensure backend is running and accessible

### Issue: 401 errors not refreshing token

**Solution**:
1. Verify `refreshToken` is stored in localStorage
2. Check refresh endpoint is accessible
3. Verify token refresh endpoint returns correct format

### Issue: API timeout errors

**Solution**:
1. Increase `VITE_API_TIMEOUT` for slow operations
2. Check network connectivity
3. Verify backend is responding

### Issue: API logging not working

**Solution**:
1. Set `VITE_API_LOGGING=true` in `.env`
2. Check browser console for errors
3. Verify development mode is active

---

## Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use `.env.example` as a template
- Use different values for development/production

### 2. Error Handling
- Always handle API errors in components
- Use toast notifications for user feedback
- Log detailed errors in development only

### 3. Authentication
- Store tokens securely (localStorage is acceptable for JWTs)
- Implement token refresh before expiration
- Clear tokens on logout

### 4. Performance
- Set appropriate timeout values
- Use React Query for caching
- Implement request deduplication

### 5. Security
- Disable API logging in production
- Disable debug mode in production
- Use HTTPS in production
- Validate and sanitize all API inputs

---

## API Endpoint Summary

### Total Endpoints: 100+

**Organized by Module:**
- Authentication: 6 endpoints
- Users: 9 endpoints
- Assets: 25+ endpoints
- Licenses: 7 endpoints
- ITAM Receiving: 6 endpoints
- ITAM Staging: 7 endpoints
- ITAM Loaners: 8 endpoints
- ITAM Software: 10 endpoints
- ITAM Compliance: 8 endpoints
- ITAM Security: 8 endpoints
- ITAM Locations: 9 endpoints
- ITAM Labels: 7 endpoints
- ITAM Workflows: 8 endpoints
- ITAM APIs: 5 endpoints
- ITAM Data Quality: 6 endpoints
- ITAM Reporting: 5 endpoints
- And 20+ more endpoints for other modules

---

## Quick Reference

### Setup for Development
1. Copy `.env.example` to `.env`
2. Set `VITE_API_URL=http://localhost:5000/api/v1`
3. Ensure backend is running on port 5000
4. Start frontend: `npm run dev`

### Setup for Production
1. Create `.env.production`
2. Set `VITE_API_URL=https://api.yourcompany.com/api/v1`
3. Set `VITE_API_LOGGING=false`
4. Set `VITE_DEBUG_MODE=false`
5. Build: `npm run build`

---

**Last Updated**: 2024
**Version**: 1.0.0

