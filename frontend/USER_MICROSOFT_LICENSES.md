# User Microsoft Licenses Integration

## Overview

Added functionality to display Microsoft 365 licenses assigned to each user directly on their profile page. This integration connects user profiles with Microsoft Graph API to show all licenses assigned to individual users.

## Features

### User Profile Integration
- **Microsoft Licenses Tab**: Each user profile now displays their assigned Microsoft licenses
- **License Details**: Shows license name, SKU, category, status, and service plans
- **Assigned Date**: Displays when each license was assigned
- **Category Icons**: Visual icons for different license categories (Office 365, Power Platform, Teams, etc.)
- **Service Plans**: Shows up to 3 service plans with "more" indicator for additional plans

### License Categories Displayed
- 📧 Office 365
- 🪟 Windows
- 🔒 Security
- ⚡ Power Platform
- 💼 Dynamics
- 💬 Teams
- 📊 Visio
- 📅 Project
- 📮 Exchange
- 🌐 SharePoint
- ☁️ Azure AD

## Backend Implementation

### Files Modified

1. **`backend/src/controllers/user.controller.js`**
   - Added `getUserMicrosoftLicenses` function
   - Returns Microsoft licenses for a specific user
   - Includes mock data for testing

2. **`backend/src/routes/user.routes.js`**
   - Added route: `GET /api/v1/users/:id/microsoft-licenses`
   - Protected route requiring authentication

### API Endpoint

```
GET /api/v1/users/:id/microsoft-licenses
```

**Request:**
- Path parameter: `id` (user ID)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "skuId": "c7df2760-2c81-4ef7-b578-5a53939807c3",
      "skuPartNumber": "Microsoft 365 E5",
      "name": "Microsoft 365 E5",
      "category": "office365",
      "status": "Active",
      "assignedDate": "2024-01-01T00:00:00.000Z",
      "servicePlans": [
        {
          "servicePlanName": "Microsoft 365 Apps for enterprise",
          "provisioningStatus": "Success"
        }
      ]
    }
  ]
}
```

## Frontend Implementation

### Files Modified

1. **`frontend/src/config/api.js`**
   - Added `getUserMicrosoftLicenses` API method

2. **`frontend/src/pages/Users/UserDetails.jsx`**
   - Added Microsoft licenses query
   - Added Microsoft licenses section to Software & Apps tab
   - Integrated with existing license display
   - Updated tab count to include Microsoft licenses

### Component Features

- **Automatic Fetching**: Fetches Microsoft licenses when user details page loads
- **Mock Data Fallback**: Uses mock data when API is unavailable
- **User Matching**: Matches users by name or email from mock data
- **Category Icons**: Displays appropriate icons for each license category
- **Service Plans**: Shows included service plans for each license
- **Status Badges**: Visual indicators for license status

## Mock Data Integration

### Sample Users with Licenses

**John Smith** - Has 3 licenses:
- Microsoft 365 E5
- Power BI Pro
- Microsoft Teams Phone Standard

**Sarah Johnson** - Has 2 licenses:
- Microsoft 365 E3
- Enterprise Mobility + Security E5

### Matching Logic

The system matches users by:
1. User name (case-insensitive partial match)
2. Email address (exact match)

If no match is found, an empty array is returned.

## User Experience

### How to View

1. Navigate to Users page
2. Click on any user to view their details
3. Click on "Software & Apps" tab
4. Scroll down to "Microsoft 365 Licenses" section
5. View all assigned licenses with details

### Display Format

Each license shows:
- **License Icon**: Category-specific emoji
- **License Name**: Full product name
- **SKU Part Number**: Microsoft SKU identifier
- **Service Plans**: Included services (up to 3 shown)
- **Status Badge**: Active/Inactive status
- **Assigned Date**: When license was assigned

## Integration Flow

```
User Details Page
    ↓
Fetch User Data
    ↓
Fetch Microsoft Licenses
    ↓
Display in "Microsoft 365 Licenses" Section
    ↓
User Can View All Assigned Licenses
```

## Production Integration

To integrate with actual Microsoft Graph API:

1. **Update Backend Controller**
   - Replace mock data with Microsoft Graph API call
   - Use user's email to query Microsoft Graph
   - Parse license details from Graph API response

2. **Authentication**
   - Use existing Azure AD credentials
   - Pass credentials to Microsoft Graph API
   - Handle token refresh and errors

3. **Data Mapping**
   - Map Graph API response to frontend format
   - Include all relevant license details
   - Handle service plan information

## Benefits

1. **Complete Visibility**: See all Microsoft licenses for each user
2. **License Management**: Identify what licenses users have
3. **Cost Tracking**: Understand license allocation per user
4. **Compliance**: Track license assignments for audit purposes
5. **Optimization**: Identify unused or duplicate licenses

## Future Enhancements

- Add license assignment/unassignment functionality
- Show license expiration dates
- Display license usage statistics
- Add filters and search for licenses
- Export license reports
- Integration with actual Microsoft Graph API
- License cost per user calculation
- License history and changes

## Files Modified

### Backend
- `src/controllers/user.controller.js` - Added Microsoft licenses endpoint
- `src/routes/user.routes.js` - Added route definition

### Frontend
- `src/config/api.js` - Added API method
- `src/pages/Users/UserDetails.jsx` - Added Microsoft licenses display
- `src/data/mockMicrosoftLicenses.js` - Mock data source

## Testing

To test the feature:

1. Start backend server: `cd C:\backend && npm run dev`
2. Start frontend server: `cd C:\frontend && npm run dev`
3. Login to the application
4. Navigate to Users page
5. Click on any user
6. Click "Software & Apps" tab
7. Scroll to "Microsoft 365 Licenses" section
8. View assigned licenses

## Troubleshooting

### No Licenses Showing

- Check user name/email matches mock data
- Verify API endpoint is accessible
- Check browser console for errors
- Ensure user has licenses assigned in mock data

### Incorrect License Display

- Verify license data structure matches expected format
- Check category mapping is correct
- Ensure service plans are properly formatted

## Documentation

For more information:
- `MICROSOFT_GRAPH_INTEGRATION.md` - Microsoft Graph setup
- `MICROSOFT_LICENSES_SUPPORTED.md` - Supported license types
- `MICROSOFT_LICENSES_MOCK_DATA.md` - Mock data details


