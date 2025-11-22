# Microsoft Licenses Mock Data

## Overview

Comprehensive mock data for Microsoft 365 licenses has been implemented to enable testing and development without requiring Azure AD credentials.

## Mock Data Structure

The mock data includes 17 different Microsoft license types with detailed information including:

### License Types Included

1. **Microsoft 365 E5** - 50 seats (45 assigned, 5 available) - $57/month
2. **Microsoft 365 E3** - 125 seats (120 assigned, 5 available) - $32/month
3. **Microsoft 365 Business Premium** - 30 seats (28 assigned, 2 available) - $22/month
4. **Office 365 E5** - 40 seats (35 assigned, 5 available) - $38/month
5. **Power BI Pro** - 20 seats (18 assigned, 2 available) - $10/month
6. **Power BI Premium P1** - 1 seat (1 assigned, 0 available) - $20/month
7. **Microsoft Teams Phone Standard** - 25 seats (22 assigned, 3 available) - $8/month
8. **Microsoft Teams Audio Conferencing** - 20 seats (15 assigned, 5 available) - $4/month
9. **Enterprise Mobility + Security E5** - 40 seats (38 assigned, 2 available) - $22/month
10. **Microsoft Defender for Office 365 Plan 2** - 200 seats (all assigned) - $5/month
11. **Dynamics 365 Sales Enterprise** - 15 seats (12 assigned, 3 available) - $95/month
12. **Dynamics 365 Customer Service Professional** - 10 seats (8 assigned, 2 available) - $50/month
13. **Visio Plan 2** - 5 seats (all assigned) - $15/month
14. **Project Plan 3** - 10 seats (7 assigned, 3 available) - $30/month
15. **SharePoint Online Plan 2** - 50 seats (all assigned) - $8/month
16. **Exchange Online Plan 2** - 200 seats (180 assigned, 20 available) - $8/month
17. **Windows 10 Enterprise E3** - 100 seats (95 assigned, 5 available) - $10/month

### License Categories Covered

- **Office 365** (4 licenses) - 245 total seats
- **Power Platform** (4 licenses) - 41 total seats
- **Teams** (2 licenses) - 45 total seats
- **Security** (2 licenses) - 240 total seats
- **Dynamics** (2 licenses) - 25 total seats
- **Visio** (1 license) - 5 total seats
- **Project** (1 license) - 10 total seats
- **SharePoint** (1 license) - 50 total seats
- **Exchange** (1 license) - 200 total seats
- **Windows** (1 license) - 100 total seats

### Statistics

- **Total Licenses**: 17
- **Total Seats**: 1,119
- **Assigned Seats**: 949
- **Available Seats**: 170
- **Total Monthly Cost**: $14,367

### User Assignments

The mock data includes 5 sample users with realistic license assignments:

1. **John Smith** - Microsoft 365 E5, Power BI Pro, Teams Phone
2. **Sarah Johnson** - Microsoft 365 E3, EMS E5
3. **Michael Chen** - Microsoft 365 E3, Dynamics Sales, Dynamics Customer Service
4. **Emily Davis** - Microsoft 365 E5, Power BI Pro, Project Plan 3
5. **David Wilson** - Microsoft 365 Business Premium, Teams Phone

### Service Plans

Each license includes detailed service plan information with provisioning status, such as:
- Microsoft 365 Apps for enterprise
- Exchange Online
- SharePoint Online
- Microsoft Teams
- Microsoft Defender
- Dynamics 365 modules
- And more...

## Implementation

### File Structure

```
frontend/src/
├── data/
│   └── mockMicrosoftLicenses.js    # Mock data definition
└── pages/Licenses/
    └── MicrosoftLicenses.jsx      # Component with mock data fallback
```

### Usage

The Microsoft Licenses component automatically falls back to mock data when:
1. Azure AD credentials are not configured
2. API requests fail
3. Testing without backend connection

### Mock Data Features

- ✅ Realistic SKU IDs and part numbers
- ✅ Accurate pricing based on Microsoft retail rates
- ✅ Seat allocation and availability tracking
- ✅ Service plan details for each license
- ✅ User assignment data
- ✅ Category-based organization
- ✅ Low stock alerts (Defender, Business Premium)
- ✅ Status tracking (active, exhausted)

## Benefits

1. **Development**: Test the UI without Azure AD setup
2. **Demo**: Show functionality to stakeholders
3. **Training**: Learn the system with realistic data
4. **Offline**: Work without backend connection
5. **Fallback**: Graceful degradation when API unavailable

## Integration

The mock data is seamlessly integrated into the Microsoft Licenses page:

```javascript
import mockMicrosoftLicenses from '../../data/mockMicrosoftLicenses';

// In query functions:
try {
  const res = await microsoftGraphAPI.syncLicenses(credentials);
  return res.data;
} catch (error) {
  console.log('API not available, using mock data');
  return { data: mockMicrosoftLicenses.licenses };
}
```

## Visual Indicators

When mock data is being used, a yellow warning banner is displayed:

> ⚠️ **Using Mock Data**  
> Displaying sample Microsoft license data for demonstration. Configure Azure AD credentials to sync real license data from your tenant.

## Sample License Object

```javascript
{
  skuId: 'c7df2760-2c81-4ef7-b578-5a53939807c3',
  skuPartNumber: 'Microsoft 365 E5',
  name: 'Microsoft 365 E5',
  consumedUnits: 45,
  prepaidUnits: 50,
  enabled: 50,
  available: 5,
  status: 'active',
  category: 'office365',
  unitPrice: 57,
  totalCost: 2565,
  billingCycle: 'monthly',
  servicePlans: [
    { servicePlanId: '...', servicePlanName: 'Microsoft 365 Apps for enterprise', provisioningStatus: 'Success' },
    // ... more service plans
  ],
  lastSynced: new Date('2024-01-15T10:30:00Z'),
}
```

## License Status

The mock data includes various license statuses:

- **Active**: Sufficient available seats
- **Low**: Few available seats remaining
- **Exhausted**: All seats assigned

## Data Updates

To update the mock data:

1. Edit `frontend/src/data/mockMicrosoftLicenses.js`
2. Add or modify license entries
3. Update statistics accordingly
4. Maintain consistent format

## Testing Scenarios

The mock data supports testing:

- ✅ License overview and statistics
- ✅ Individual license details
- ✅ User assignments by license
- ✅ Pricing and billing calculations
- ✅ Category filtering
- ✅ Search functionality
- ✅ Low stock alerts
- ✅ Utilization charts

## Documentation

For more information, see:
- `MICROSOFT_GRAPH_INTEGRATION.md` - Integration details
- `MICROSOFT_LICENSES_SUPPORTED.md` - Supported license types

## Maintenance

Keep mock data updated with:
- Latest Microsoft SKU part numbers
- Current pricing information
- New service plans
- Updated user assignments

