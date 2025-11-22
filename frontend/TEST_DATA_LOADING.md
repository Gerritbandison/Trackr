# Test Data Loading Guide

## Overview

The application now includes comprehensive test data that can be loaded to align with current upgrades. This test data includes:

- **Users** (8 sample users with different roles)
- **Departments** (7 departments)
- **Assets** (10 assets including laptops, monitors, mobile devices, servers, printers)
- **Licenses** (5 non-Microsoft licenses including Adobe, Slack, Zoom, etc.)
- **Vendors** (5 vendors)
- **Contracts** (3 contracts)
- **Asset Groups** (4 asset groups)
- **Onboarding Kits** (3 kits)
- **Microsoft Licenses** (17 Microsoft 365 licenses with detailed data)

## Features

### Automatic Test Data Loading

Test data is automatically enabled in development mode. When the app starts:

1. The `TestDataInitializer` component checks if test data should be loaded
2. If the API is not connected, it shows a banner indicating mock data is being used
3. Test data is available throughout the application

### Test Data Initializer Component

A banner appears in the top-right corner when:
- The API is not connected (yellow banner)
- Test data is explicitly enabled (blue banner)

The banner allows you to:
- Enable/disable test data
- Check API connection status
- View test data statistics
- Dismiss the banner

## Usage

### In Development Mode

Test data is automatically enabled in development mode. You can:

1. **View the Test Data Initializer banner** - It appears in the top-right corner
2. **Toggle test data** - Click "Enable/Disable Test Data" button
3. **Check API status** - Click "Check API" to verify backend connection

### Programmatic Access

You can access test data programmatically:

```javascript
import { getTestData, getAllTestData } from './utils/testDataLoader';

// Get specific test data
const users = getTestData('users');
const assets = getTestData('assets');
const licenses = getTestData('licenses');

// Get all test data
const allData = getAllTestData();
```

### Using the React Hook

```javascript
import { useTestData } from './hooks/useTestData';

function MyComponent() {
  const { isEnabled, getData, stats } = useTestData();
  
  const users = getData('users');
  const assets = getData('assets');
  
  return (
    <div>
      <p>Test data enabled: {isEnabled ? 'Yes' : 'No'}</p>
      <p>Total users: {stats?.users}</p>
      <p>Total assets: {stats?.assets}</p>
    </div>
  );
}
```

## Test Data Structure

### Users

8 sample users with different roles:
- 1 Admin (John Smith)
- 2 Managers (Sarah Johnson, Lisa Anderson)
- 5 Staff members (various departments)

Each user includes:
- Name, email, role
- Department assignment
- Position/Title
- Contact information
- Status

### Assets

10 sample assets including:
- Laptops (Dell, HP, MacBook, Lenovo)
- Monitors (Dell UltraSharp)
- Mobile devices (iPhone, iPad)
- Servers (Dell PowerEdge)
- Printers (HP LaserJet)

Each asset includes:
- Asset tag and serial number
- Manufacturer and model
- Purchase information
- Warranty details
- Assignment status
- Location and condition

### Licenses

5 non-Microsoft licenses:
- Adobe Creative Cloud
- Slack Workspace
- Zoom Business
- Autodesk AutoCAD
- VMware vSphere

Each license includes:
- Vendor information
- Seat allocation (total, used, available)
- Pricing details
- Expiration and renewal dates
- Assigned users

### Microsoft Licenses

17 Microsoft 365 licenses with comprehensive data:
- Microsoft 365 E5, E3, Business Premium
- Office 365 E5
- Power BI Pro and Premium
- Teams Phone and Audio Conferencing
- Enterprise Mobility + Security E5
- Microsoft Defender for Office 365
- Dynamics 365 Sales and Customer Service
- Visio, Project, SharePoint, Exchange
- Windows 10 Enterprise E3

Includes:
- Detailed SKU information
- Service plans
- User assignments
- Pricing and billing data
- Statistics and analytics

## Configuration

### Enable/Disable Test Data

Test data can be controlled via:

1. **LocalStorage flag**: `enableTestData`
   - Set to `'true'` to enable
   - Set to `'false'` to disable
   - In development, defaults to enabled unless explicitly disabled

2. **Environment mode**:
   - Development mode: Test data enabled by default
   - Production mode: Test data disabled by default (must be explicitly enabled)

### API Fallback

When the API is not available, the app automatically falls back to mock data:

1. API connection is checked on app startup
2. If unavailable, mock data is used
3. Test Data Initializer banner shows API status
4. Components can check API availability and use mock data as fallback

## Integration with Components

### Microsoft Licenses Component

The Microsoft Licenses component already uses mock data:

```javascript
import mockMicrosoftLicenses from '../../data/mockMicrosoftLicenses';

// In query functions:
const { data } = useQuery({
  queryKey: ['microsoft-licenses'],
  queryFn: async () => {
    // Use mock data for now
    return { data: { licenses: mockMicrosoftLicenses.licenses } };
  },
});
```

### Other Components

You can integrate test data into other components:

```javascript
import { getTestData, shouldLoadTestData } from '../../utils/testDataLoader';

function MyComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-data'],
    queryFn: async () => {
      // Try API first
      try {
        const response = await myAPI.getAll();
        return response.data;
      } catch (error) {
        // Fallback to test data
        if (shouldLoadTestData()) {
          return getTestData('myResourceType');
        }
        throw error;
      }
    },
  });
}
```

## File Structure

```
src/
├── data/
│   ├── testData.js              # Main test data file
│   └── mockMicrosoftLicenses.js # Microsoft licenses mock data
├── utils/
│   └── testDataLoader.js        # Test data utility functions
├── hooks/
│   └── useTestData.js           # React hook for test data
└── components/
    └── Common/
        └── TestDataInitializer.jsx # Component for initializing test data
```

## Benefits

1. **Development**: Test the UI without backend setup
2. **Demo**: Show functionality to stakeholders
3. **Training**: Learn the system with realistic data
4. **Offline**: Work without backend connection
5. **Fallback**: Graceful degradation when API unavailable
6. **Testing**: Consistent test data for automated tests

## Next Steps

To fully integrate test data:

1. **Backend Seeding** (Optional): Modify `TestDataInitializer` to seed the backend API with test data
2. **Component Integration**: Update components to use test data as fallback
3. **Customization**: Add more test data based on your needs
4. **API Mocking**: Use test data for API mocking in tests

## Maintenance

Keep test data updated with:
- Latest asset models and specifications
- Current pricing information
- New license types
- Updated user assignments
- Realistic dates and relationships

## Support

For questions or issues with test data:
- Check the `TestDataInitializer` component for status
- Review `testDataLoader.js` for utility functions
- See component examples for integration patterns

