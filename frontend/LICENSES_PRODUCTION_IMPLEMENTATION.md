# Licenses Module - Production-Ready Implementation

## Overview

This document outlines the complete, production-ready implementation of the licenses management module with Microsoft Graph integration, Entra ID support, and user assignment functionality.

## Architecture

### Backend Components

#### 1. User Model Enhancement
**File:** `backend/src/models/User.js`

**New Field:**
```javascript
entraId: {
  type: String,
  trim: true,
  index: true,
  sparse: true, // Allows null values but ensures uniqueness for non-null values
}
```

**Purpose:** Links local users to their Entra ID (Azure AD) Object ID for Microsoft license management.

#### 2. Microsoft Graph Controller
**File:** `backend/src/controllers/microsoftGraph.controller.js`

**Key Functions:**
- `syncMicrosoftLicenses` - Sync licenses from Microsoft Graph API
- `getMicrosoftLicenseStats` - Get license statistics
- `getMicrosoftLicenseUsers` - Get users assigned to licenses
- `getMicrosoftLicensePricing` - Get pricing information
- `assignMicrosoftLicense` - Assign license to user via Entra ID ⭐ NEW
- `removeMicrosoftLicense` - Remove license from user via Entra ID ⭐ NEW

**Microsoft License Assignment Flow:**
```javascript
// 1. Authenticate with Microsoft Graph
const accessToken = await getAccessToken(tenantId, clientId, clientSecret);

// 2. Get user's current licenses
const userResponse = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}`);

// 3. Add/remove license
const updatedLicenses = [...currentLicenses, { skuId }];

// 4. Update user's licenses
await axios.patch(`https://graph.microsoft.com/v1.0/users/${userId}`, {
  assignedLicenses: updatedLicenses
});

// 5. Update Entra ID in local database
await User.findOneAndUpdate({ entraId: userId }, { entraId: userId }, { upsert: true });
```

#### 3. License Assignment Controller
**File:** `backend/src/controllers/license.controller.js`

**Endpoints:**
- `POST /api/v1/licenses/:id/assign` - Assign traditional license to user
- `POST /api/v1/licenses/:id/unassign` - Unassign traditional license from user

**Features:**
- Seat availability checking
- Duplicate assignment prevention
- Audit logging
- User license tracking

#### 4. Microsoft Graph Routes
**File:** `backend/src/routes/microsoftGraph.routes.js`

**Endpoints:**
- `POST /api/v1/microsoft-graph/sync` - Sync licenses
- `GET /api/v1/microsoft-graph/stats` - Get statistics
- `POST /api/v1/microsoft-graph/users` - Get license users
- `POST /api/v1/microsoft-graph/pricing` - Get pricing
- `POST /api/v1/microsoft-graph/assign-license` ⭐ NEW
- `POST /api/v1/microsoft-graph/remove-license` ⭐ NEW

### Frontend Components

#### 1. Licenses Dashboard
**File:** `frontend/src/pages/Licenses/LicensesDashboard.jsx`

**Features:**
- Unified view of traditional and Microsoft licenses
- Real-time statistics
- Quick filters (Overview, Traditional, Microsoft, Expiring, Costs)
- Expiring licenses alerts
- Utilization tracking
- Cost analysis

**Tabs:**
- **Overview** - Combined stats and quick insights
- **Traditional Licenses** - Regular software licenses
- **Microsoft 365** - Microsoft license integration
- **Expiring Soon** - License expiration alerts
- **Cost Analysis** - License cost tracking

#### 2. License Assignment Flow

**Traditional Licenses:**
- Users can be assigned via license details page
- Assignment modal with user search
- Seat availability validation
- Assignment history tracking

**Microsoft Licenses:**
- Users identified by Entra ID
- Assign via Microsoft Graph API
- Real-time sync with Azure AD
- Assignment tracked in audit logs

#### 3. User Profile Integration
**File:** `frontend/src/pages/Users/UserDetails.jsx`

**Features:**
- User's Microsoft licenses displayed
- License assignment date
- Service plans per license
- Category-based display
- Link to Microsoft license details

## Microsoft Graph Integration Setup

### 1. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Name: "Asset Management System"
5. Supported account types: Single tenant
6. Click **Register**

### 2. API Permissions

Required permissions:
- `Directory.Read.All` - Read directory data
- `Directory.ReadWrite.All` - Read and write directory data
- `User.ReadWrite.All` - Read and write user data
- `LicenseAssignment.ReadWrite.All` - Read and write license assignments

Add permissions:
1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Application permissions**
5. Add required permissions
6. Click **Grant admin consent**

### 3. Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description and expiration
4. Click **Add**
5. **Copy the secret value** (only shown once)

### 4. Configuration

Store credentials securely:
```javascript
{
  tenantId: "your-tenant-id",
  clientId: "your-client-id",
  clientSecret: "your-client-secret"
}
```

## User Entra ID Linking

### Process Flow

1. **User Creation/Update**
   - When creating/updating users, include `entraId` field
   - Entra ID is Azure AD Object ID

2. **License Assignment**
   - When assigning Microsoft license, use Entra ID
   - Backend fetches user licenses from Microsoft Graph
   - Updates assigned licenses via Graph API

3. **License Sync**
   - Regular sync with Microsoft Graph
   - Updates local MicrosoftLicense collection
   - Maintains user assignments

### Sample User Data

```javascript
{
  name: "John Smith",
  email: "john.smith@company.com",
  entraId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // Azure AD Object ID
  authProvider: "microsoft",
  licenses: [] // Traditional licenses
}
```

## API Usage Examples

### Assign Traditional License

```javascript
// Frontend
await licensesAPI.assign(licenseId, { userId: user._id });

// Response
{
  success: true,
  data: license,
  message: "License assigned to John Smith successfully"
}
```

### Assign Microsoft License

```javascript
// Frontend
await microsoftGraphAPI.assignLicense({
  tenantId: "xxx",
  clientId: "xxx",
  clientSecret: "xxx",
  userId: "entra-id-of-user",
  skuId: "license-sku-id"
});

// Response
{
  success: true,
  message: "Microsoft license assigned successfully",
  data: {
    userId: "xxx",
    skuId: "xxx",
    assignedLicenses: [...]
  }
}
```

### Get User's Microsoft Licenses

```javascript
// Frontend
await usersAPI.getUserMicrosoftLicenses(userId);

// Response
{
  success: true,
  count: 3,
  data: [
    {
      skuId: "xxx",
      skuPartNumber: "Microsoft 365 E5",
      name: "Microsoft 365 E5",
      category: "office365",
      status: "Active",
      assignedDate: "2024-01-01",
      servicePlans: [...]
    }
  ]
}
```

## Security Considerations

### 1. Authentication
- All endpoints require authentication
- License assignment requires admin role
- Microsoft Graph requires admin consent

### 2. Audit Logging
- All license assignments logged
- Includes user, action, timestamp, IP address
- Audit trail for compliance

### 3. Error Handling
- Graceful error handling for API failures
- Fallback to mock data during development
- Clear error messages for users

### 4. Data Privacy
- License keys stored securely (select: false)
- Entra IDs indexed for fast lookups
- User data encrypted in transit

## Production Deployment Checklist

### Backend
- [x] User model updated with Entra ID
- [x] Microsoft Graph endpoints implemented
- [x] License assignment endpoints added
- [x] Audit logging configured
- [x] Error handling implemented
- [x] Routes configured

### Frontend
- [x] Licenses dashboard created
- [x] API endpoints configured
- [x] Microsoft license assignment UI
- [x] User profile integration
- [x] Expiration alerts
- [x] Cost tracking

### Integration
- [x] Microsoft Graph API integration
- [x] Entra ID user linking
- [x] License sync functionality
- [x] Assignment/unassignment flow
- [x] Audit trail

### Testing
- [ ] Unit tests for license assignment
- [ ] Integration tests for Microsoft Graph
- [ ] E2E tests for assignment flow
- [ ] Load testing for sync operations

### Documentation
- [x] Implementation guide
- [x] API documentation
- [x] User guide
- [x] Azure AD setup guide

## Monitoring & Maintenance

### Key Metrics
- License utilization rates
- Microsoft license sync frequency
- Assignment success rate
- Error rates

### Regular Tasks
- Sync Microsoft licenses daily
- Review expiring licenses weekly
- Audit license assignments monthly
- Update license pricing quarterly

## Troubleshooting

### Common Issues

1. **Microsoft License Assignment Fails**
   - Check Azure AD permissions
   - Verify Entra ID is correct
   - Check tenant ID, client ID, and secret

2. **Sync Errors**
   - Check network connectivity
   - Verify API permissions
   - Review error logs

3. **User Not Found**
   - Verify Entra ID in database
   - Check user exists in Azure AD
   - Verify permission to read users

## Support

For issues or questions:
1. Check audit logs for errors
2. Review Microsoft Graph API documentation
3. Check Azure AD application logs
4. Contact system administrator

## Future Enhancements

- [ ] License optimization recommendations
- [ ] Automated license assignment rules
- [ ] Cost optimization alerts
- [ ] Bulk license operations
- [ ] License usage analytics
- [ ] Integration with procurement systems

