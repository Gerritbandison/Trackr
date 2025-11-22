# Trackr ITAM Dashboard - Component Usage Guide

This document provides examples of how to use the three new TypeScript components (`AssetCard`, `LicenseExpiryHeatmap`, and `ComplianceGauge`) together in a dashboard layout with responsive design and dark mode support.

## Components Overview

### 1. AssetCard.tsx
Displays individual asset information in a card format with responsive design and dark mode support.

### 2. LicenseExpiryHeatmap.tsx
Shows a monthly heatmap visualization of license expiration dates with color-coded urgency levels.

### 3. ComplianceGauge.tsx
Displays compliance metrics with a circular gauge and detailed breakdown.

## Dashboard Layout Example

```tsx
import React from 'react';
import AssetCard from '../components/AssetCard';
import LicenseExpiryHeatmap from '../components/LicenseExpiryHeatmap';
import ComplianceGauge from '../components/ComplianceGauge';
import DarkModeToggle from '../components/Common/DarkModeToggle';
import { useDarkMode } from '../hooks/useDarkMode';

const DashboardExample = () => {
  // Example data
  const assets = [
    {
      _id: '1',
      name: 'MacBook Pro 16"',
      category: 'laptop',
      manufacturer: 'Apple',
      model: 'M3 Pro',
      assetTag: 'AST-001',
      serialNumber: 'SN123456',
      status: 'assigned',
      condition: 'excellent',
      location: 'San Francisco',
      purchaseDate: '2024-01-15',
      purchasePrice: 2499,
      warrantyExpiry: '2027-01-15',
      assignedTo: {
        _id: 'u1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    },
    // ... more assets
  ];

  const licenses = [
    {
      _id: 'l1',
      name: 'Microsoft Office 365',
      expirationDate: '2024-12-31',
      status: 'active',
    },
    // ... more licenses
  ];

  const complianceMetrics = {
    overallScore: 87,
    totalAssets: 245,
    compliantAssets: 213,
    nonCompliantAssets: 18,
    pendingReview: 14,
    categories: {
      software: 92,
      hardware: 85,
      licenses: 90,
      warranties: 88,
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Dark Mode Toggle - Add to Header */}
      <div className="p-6 flex justify-end">
        <DarkModeToggle size="md" />
      </div>

      {/* Main Dashboard Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Row: Asset List & Compliance Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Asset List Container */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Asset Inventory
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {assets.map((asset) => (
                <AssetCard
                  key={asset._id}
                  asset={asset}
                  onCardClick={(asset) => {
                    console.log('Asset clicked:', asset);
                    // Navigate to asset details
                  }}
                />
              ))}
            </div>
          </div>

          {/* Compliance Gauge */}
          <div className="lg:col-span-1">
            <ComplianceGauge
              metrics={complianceMetrics}
              size="md"
              showDetails={true}
            />
          </div>
        </div>

        {/* Bottom Row: License Expiry Heatmap */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <LicenseExpiryHeatmap
            licenses={licenses}
            year={2024}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardExample;
```

## Responsive Breakpoints

All components are responsive and adapt to different screen sizes:

- **sm** (≥640px): Small tablets and large phones
- **md** (≥768px): Tablets
- **lg** (≥1024px): Desktops and laptops

## Dark Mode Usage

### Using the Hook
```tsx
import { useDarkMode } from '../hooks/useDarkMode';

const MyComponent = () => {
  const { isDark, toggle, enable, disable } = useDarkMode();

  return (
    <button onClick={toggle}>
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
};
```

### Using the Toggle Component
```tsx
import DarkModeToggle from '../components/Common/DarkModeToggle';

// In your Header or Layout
<DarkModeToggle size="md" showLabel={false} />
```

## Component Props

### AssetCard
- `asset`: Asset object with required fields
- `onCardClick?`: Optional click handler
- `className?`: Additional CSS classes

### LicenseExpiryHeatmap
- `licenses`: Array of license objects
- `year?`: Year to display (defaults to current year)
- `className?`: Additional CSS classes

### ComplianceGauge
- `metrics`: ComplianceMetrics object
- `size?`: 'sm' | 'md' | 'lg' (default: 'md')
- `showDetails?`: Boolean to show/hide details (default: true)
- `className?`: Additional CSS classes

## Integration with Existing Dashboard

To integrate these components into the existing `Dashboard.jsx`:

1. Convert `Dashboard.jsx` to TypeScript or import components as needed
2. Add the `DarkModeToggle` to the Header component
3. Replace existing chart components with the new heatmap and gauge
4. Add asset cards to display asset list

## Figma Design Spec

The layout is based on the Figma JSON export in `design-specs/dashboard-layout.figma.json`, which defines:
- Grid layout with asset list and compliance gauge in top row
- License expiry heatmap in bottom row
- Responsive breakpoints for different screen sizes
- Color tokens and design system values

## Notes

- All components support Tailwind's dark mode classes
- Components are fully typed with TypeScript interfaces
- Responsive design uses Tailwind's responsive utilities
- Dark mode is controlled via the `dark` class on the root element

