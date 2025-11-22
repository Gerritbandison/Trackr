# Mock Data Guide

## Overview

Comprehensive mock data has been added for all 17 ITAM modules to enable full functionality testing without a backend API. The mock data system automatically activates when test data mode is enabled.

## How It Works

### Automatic Activation

Mock data is automatically used when:
1. **Development Mode**: Test data is enabled by default in development
2. **API Unavailable**: When the backend API is not reachable, the system automatically falls back to mock data
3. **Manual Enable**: Set `enableTestData` to `'true'` in localStorage

### Mock Data Coverage

Mock data is available for all 17 ITAM modules:

1. **Receiving** (`/itam/receiving`)
   - Expected assets from POs
   - Receiving statistics
   - PO ingestion data

2. **Staging** (`/itam/staging`)
   - Assets in staging
   - Profile mappings
   - Deployment-ready assets

3. **Loaners** (`/itam/loaners`)
   - Active loaners
   - Available loaner assets
   - Overdue loaners

4. **Warranty** (`/itam/warranty`)
   - Assets with warranty information
   - Repair tickets
   - RMA tracking

5. **Financials** (`/itam/financials`)
   - Depreciation schedules
   - Chargeback data
   - Financial statistics

6. **Contract Renewals** (`/itam/contracts/renewals`)
   - Contracts expiring soon
   - Renewal notifications
   - Contract health scores

7. **Discovery** (`/itam/discovery`)
   - Discovery records
   - Orphaned assets
   - Reconciliation conflicts

8. **Stock** (`/itam/stock`)
   - Stock items
   - Low stock alerts
   - Inventory levels

9. **Software** (`/itam/software`)
   - Software entries
   - License entitlements
   - True-up data

10. **Compliance** (`/itam/compliance`)
    - Attestations
    - Wipe certificates
    - Audit packs

11. **Security** (`/itam/security`)
    - Security health status
    - Non-compliant assets
    - Risk scores

12. **Locations** (`/itam/locations`)
    - Hierarchical location tree
    - Active shipments
    - Location details

13. **Labels** (`/itam/labels`)
    - Label templates
    - Print jobs
    - Label generation

14. **Workflows** (`/itam/workflows`)
    - Workflow definitions
    - Execution history
    - New hire workflows

15. **APIs** (`/itam/apis`)
    - API keys
    - Webhooks
    - Bulk operations

16. **Data Quality** (`/itam/data-quality`)
    - Duplicate detection
    - Drift reports
    - Normalization catalog

17. **Reporting** (`/itam/reporting`)
    - Dashboard data
    - Scheduled exports
    - Report builder data

## Enabling Mock Data

### Method 1: Development Mode (Automatic)

In development mode, mock data is enabled by default. No action needed.

### Method 2: Manual Enable via localStorage

```javascript
// Enable test data
localStorage.setItem('enableTestData', 'true');

// Disable test data
localStorage.setItem('enableTestData', 'false');

// Reload the page for changes to take effect
```

### Method 3: Via Test Data Banner

The application shows a banner when:
- Test data is enabled
- API is not connected

Use the banner controls to enable/disable test data on the fly.

## Mock Data Structure

Mock data is organized in `src/data/itamMockData.js` with the following structure:

```javascript
{
  receiving: {
    expectedAssets: [...],
    stats: {...}
  },
  staging: {
    assets: [...],
    stats: {...}
  },
  // ... other modules
}
```

## API Interceptor

The mock data system uses Axios interceptors to:
1. **Intercept API calls** when test data is enabled
2. **Return mock responses** that match the expected API format
3. **Handle network errors** by falling back to mock data
4. **Log mock responses** in development mode for debugging

## Testing Features

### Realistic Data

All mock data includes:
- Realistic dates (relative to current date)
- Complete data structures matching API responses
- Statistics and aggregated data
- Various states (pending, completed, overdue, etc.)

### Date Helpers

Mock data uses helper functions for dates:
- `daysAgo(n)` - Date n days in the past
- `daysFromNow(n)` - Date n days in the future

This ensures dates are always relative to the current date, making the data appear fresh.

## Example Usage

### Viewing Mock Data in Pages

Simply navigate to any ITAM page while test data is enabled:
- `/itam/receiving` - Shows expected assets from POs
- `/itam/staging` - Shows assets in staging
- `/itam/loaners` - Shows active loaners
- `/itam/warranty` - Shows warranty information
- And so on...

### Testing Functionality

All pages support full functionality with mock data:
- ✅ Search and filtering
- ✅ Pagination
- ✅ Form submissions (simulated)
- ✅ Modal interactions
- ✅ Statistics display
- ✅ Empty states
- ✅ Error handling

## Customizing Mock Data

To add or modify mock data:

1. Edit `src/data/itamMockData.js`
2. Add your data following the existing structure
3. Ensure data matches the expected API response format
4. Rebuild the application

## Files Involved

- `src/data/itamMockData.js` - Main mock data file
- `src/utils/mockAPIInterceptor.js` - API interceptor logic
- `src/utils/testDataLoader.js` - Test data loader utilities
- `src/config/api.js` - API configuration with interceptors

## Notes

- Mock data is **development-only** by default
- In production, mock data only activates if explicitly enabled
- Mock data responses match the real API response format
- All pages work seamlessly with or without mock data
- Network errors automatically trigger mock data fallback

## Troubleshooting

### Mock Data Not Showing

1. Check if test data is enabled: `localStorage.getItem('enableTestData')`
2. Verify you're in development mode
3. Check browser console for API errors
4. Ensure the API endpoint matches the mock data path

### Mock Data Not Updating

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Check if data is being cached by React Query
4. Verify mock data file was saved correctly

### API Still Being Called

1. Check if test data is explicitly disabled
2. Verify API URL configuration
3. Check network tab to see actual API calls
4. Ensure mock interceptor is properly configured

## Next Steps

1. Navigate to any ITAM page
2. Verify data is displayed
3. Test all functionality (search, filter, pagination)
4. Verify forms work correctly
5. Check statistics and aggregated data

All 17 ITAM modules now have comprehensive mock data for full testing!

