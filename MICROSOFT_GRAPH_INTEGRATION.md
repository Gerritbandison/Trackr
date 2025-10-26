# Microsoft Graph Integration for License Tracking

## Overview

This integration connects your asset management system with Microsoft Graph API to track Microsoft 365 licenses, monitor user assignments, and analyze billing across your tenant.

## Features

### 1. License Synchronization
- Sync all Microsoft 365 licenses from your Azure AD tenant
- Track total seats, assigned seats, and available seats for each license type
- Automatic categorization of licenses (Office 365, Windows, Security, Power Platform, Dynamics, Teams, Visio, Project)
- Status tracking (active, low stock, exhausted)

### 2. User Assignment Tracking
- View which users have which licenses assigned
- See detailed user information (name, email, user principal name)
- Identify license utilization patterns

### 3. Billing & Pricing
- Estimated pricing for each license type
- Total monthly cost calculation
- Next billing date tracking
- Cost optimization insights (unused seats)

### 4. Statistics & Analytics
- Total licenses count
- Overall utilization rate
- License distribution by category
- Low stock alerts
- Savings potential identification

## Backend Implementation

### Files Created

1. **`src/controllers/microsoftGraph.controller.js`**
   - Handles Microsoft Graph API authentication
   - Syncs licenses from Azure AD
   - Retrieves user assignments
   - Calculates pricing and billing information

2. **`src/models/MicrosoftLicense.js`**
   - Mongoose schema for storing license data
   - Includes fields for SKU, seats, status, category, pricing

3. **`src/routes/microsoftGraph.routes.js`**
   - Defines API endpoints for Microsoft Graph operations
   - Protected routes requiring admin/manager permissions

### API Endpoints

```
POST /api/v1/microsoft-graph/sync
- Sync licenses from Microsoft Graph
- Requires: tenantId, clientId, clientSecret
- Returns: licenses array and assignments

GET /api/v1/microsoft-graph/stats
- Get license statistics
- Returns: total licenses, seats, utilization, categories

POST /api/v1/microsoft-graph/users
- Get users with license assignments
- Requires: tenantId, clientId, clientSecret
- Returns: users array with assigned licenses

POST /api/v1/microsoft-graph/pricing
- Get license pricing information
- Requires: tenantId, clientId, clientSecret
- Returns: pricing data and billing info
```

## Frontend Implementation

### Files Created

1. **`src/pages/Licenses/MicrosoftLicenses.jsx`**
   - Main Microsoft Licenses page component
   - Four view modes: Overview, Licenses, Users, Pricing
   - Configuration modal for Azure AD credentials
   - Real-time sync functionality

### Route Added

```javascript
/licenses/microsoft - Microsoft 365 Licenses page
```

### Link Added

Added "Microsoft 365" button to the License List page for easy access.

## Microsoft Graph API Setup

### Prerequisites

1. Azure AD app registration
2. Client credentials (Tenant ID, Client ID, Client Secret)
3. Required permissions in Azure AD

### Required Permissions

- `Organization.Read.All` - Read organization information
- `Directory.Read.All` - Read directory data
- `User.Read.All` - Read all users' full profiles

### Setup Steps

1. Go to Azure Portal (https://portal.azure.com)
2. Navigate to Azure Active Directory > App registrations
3. Create a new app registration or use existing one
4. Note down:
   - Tenant ID (Directory ID)
   - Application (Client) ID
5. Go to Certificates & secrets
6. Create a new client secret
7. Copy the secret value (you'll need this for configuration)
8. Go to API permissions
9. Add the required permissions listed above
10. Grant admin consent for your organization

### Configuration

In the Microsoft Licenses page:
1. Click "Configure" button
2. Enter your Tenant ID
3. Enter your Client ID (Application ID)
4. Enter your Client Secret
5. Click "Save & Sync"

The credentials are stored locally in the browser for security.

## Usage

### Syncing Licenses

1. Navigate to Licenses > Microsoft 365
2. Click "Sync Licenses" button
3. Wait for the sync to complete
4. View the synced data across all tabs

### Viewing Licenses

1. Go to the "Licenses" tab
2. See all available Microsoft licenses
3. View seat allocation and availability
4. Identify low stock licenses

### Tracking User Assignments

1. Go to the "Users" tab
2. See all users with Microsoft licenses
3. View which licenses each user has
4. Identify underutilized or unused licenses

### Analyzing Billing

1. Go to the "Pricing" tab
2. View unit prices for each license
3. See total monthly cost
4. Identify cost optimization opportunities

## License Categories

The system automatically categorizes licenses into 12+ categories with over 100+ license types:

- **Office 365** 📧 - Office applications and email (10+ variants)
- **Windows** 🪟 - Windows licensing (Enterprise, E3, E5)
- **Security** 🔒 - Enterprise Mobility and Security, Defender, Intune, Compliance
- **Power Platform** ⚡ - Power BI, Power Apps, Power Automate
- **Dynamics** 💼 - Dynamics 365 licenses (Sales, Marketing, Field Service, HR, etc.)
- **Teams** 💬 - Microsoft Teams licenses (Essentials, Premium, Phone System)
- **Visio** 📊 - Visio diagramming tool
- **Project** 📅 - Project management tool
- **Exchange** 📮 - Email and calendaring services
- **SharePoint** 🌐 - Collaboration and document management
- **Azure AD** ☁️ - Identity and access management
- **Other** 📦 - Other Microsoft products and services

## Pricing Information

Pricing includes comprehensive coverage of Microsoft 365 products with 100+ SKUs including:

**Microsoft 365/Office 365:**
- Microsoft 365 E5: $57/month
- Microsoft 365 E3: $32/month
- Microsoft 365 Business Premium: $22/month
- Office 365 E5: $38/month
- Office 365 E3: $23/month

**Power Platform:**
- Power BI Premium: $20/month
- Power BI Pro: $10/month
- Power Apps Per User: $20/month

**Dynamics 365:**
- Dynamics Sales Enterprise: $95/month
- Dynamics Customer Engagement: $115/month
- Dynamics Operations: $180/month
- Dynamics Marketing: $1,500/month

**Security & Compliance:**
- EMS E5: $22/month
- Microsoft Defender for Office 365: $5/month
- Microsoft Intune: $8/month

**Collaboration:**
- Teams Premium: $10/month
- Teams Essentials: $4/month
- SharePoint Plan 2: $8/month
- Exchange Online Plan 2: $8/month

*See MICROSOFT_LICENSES_SUPPORTED.md for complete pricing list.*

*Note: Actual pricing may vary based on your Microsoft agreement, EA discounts, and volume licensing.*

## Security Considerations

1. **Credentials Storage**: Credentials are stored locally in the browser (localStorage)
2. **API Permissions**: Minimal required permissions are requested
3. **HTTPS**: All API calls are made over HTTPS
4. **Token Expiration**: Access tokens expire after 1 hour
5. **Role-Based Access**: Only admins and managers can sync licenses

## Troubleshooting

### Authentication Errors

- Verify Tenant ID, Client ID, and Client Secret are correct
- Ensure permissions are granted in Azure AD
- Check that admin consent is provided

### No Licenses Returned

- Verify your tenant has active Microsoft 365 subscriptions
- Check that the app has the required permissions
- Ensure admin consent is granted

### Sync Failures

- Check network connectivity
- Verify Microsoft Graph API is accessible
- Review browser console for detailed error messages

## Future Enhancements

- Store credentials securely in backend
- Add license assignment/unassignment functionality
- Implement automatic license sync on schedule
- Add email notifications for low stock
- Generate license optimization reports
- Track license usage trends over time
- Integrate with Microsoft billing API for actual pricing

## Dependencies

### Backend
- axios - HTTP client for Microsoft Graph API
- mongoose - Database operations

### Frontend
- @tanstack/react-query - Data fetching and caching
- react-hot-toast - Toast notifications
- date-fns - Date formatting (if needed)

## Support

For issues or questions:
1. Check Microsoft Graph API documentation
2. Review Azure AD app registration settings
3. Verify API permissions
4. Check browser console for errors

## License

This integration follows the same license as the main application.

