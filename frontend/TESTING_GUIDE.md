# ITAM Platform - Comprehensive Testing Guide

## 🧪 Testing Checklist

### 1. Authentication & Authorization
- [ ] **Login**
  - Test with admin credentials: `admin@company.com` / `password123`
  - Test with manager credentials: `john.smith@company.com` / `password123`
  - Test with staff credentials: `sarah.johnson@company.com` / `password123`
  - Test invalid credentials (should show error)
  - Test logout functionality

- [ ] **Role-Based Access Control**
  - Admin can access all features
  - Manager can access most features (no user management)
  - Staff has limited access (view only)

### 2. Asset Management ⭐

#### 2.1 Asset Creation & Buying from CDW
- [ ] **Purchase from CDW (Buying Feature)**
  1. Navigate to Assets → Click "Create Asset" or "New Asset"
  2. Click "Buy from CDW" button
  3. CDW Product Selector modal should open
  4. Test search functionality:
     - Search for "ThinkPad" → Should show Lenovo laptops
     - Search for "Dell" → Should show Dell products
     - Search for "Surface" → Should show Microsoft products
  5. Test category filtering:
     - Select "Laptops" → Only laptops shown
     - Select "Monitors" → Only monitors shown
     - Select "Docking Stations" → Only docks shown
  6. Select a product (e.g., Lenovo ThinkPad X1 Carbon)
  7. Product details should auto-populate:
     - Name: Lenovo ThinkPad X1 Carbon Gen 11
     - Manufacturer: Lenovo
     - Model: X1 Carbon
     - Category: laptop
     - Purchase Price: $1399.99
     - Vendor: CDW
     - CDW SKU: CDW12345
     - CDW URL: Link to product page
  8. Verify "View on CDW" link appears and works
  9. Complete asset form with remaining fields:
     - Serial Number
     - Asset Tag (optional, auto-generated if blank)
     - Purchase Date
     - Warranty Expiry
     - Status: Available
     - Condition: Excellent
     - Location
     - Notes (pre-filled with CDW purchase info)
  10. Submit form → Asset should be created successfully
  11. Verify asset appears in asset list with CDW vendor info

#### 2.2 Manual Asset Creation
- [ ] Create asset manually (without CDW)
  - Fill all required fields
  - Test validation (required fields)
  - Test duplicate serial number error
  - Test duplicate asset tag error

#### 2.3 Asset Listing & Search
- [ ] View asset list
  - Test pagination
  - Test search functionality
  - Test filtering by status
  - Test filtering by category
  - Test sorting

#### 2.4 Asset Details & Assignment
- [ ] View asset details
  - All information displayed correctly
  - Warranty timeline visible
  - Assignment history visible

- [ ] Assign asset to user
  - Select user from dropdown
  - Add notes (optional)
  - Submit assignment
  - Verify asset status changes to "assigned"
  - Verify user shows asset in their profile

- [ ] Unassign asset
  - Asset returns to "available" status
  - User no longer shows asset

#### 2.5 Asset Editing & Updates
- [ ] Edit asset
  - Update asset information
  - Change status
  - Update condition
  - Save changes
  - Verify updates reflected in list

#### 2.6 Asset Deletion
- [ ] Delete asset
  - Confirm deletion
  - Verify asset removed from list

### 3. Asset Groups 📦

#### 3.1 Create Asset Group
- [ ] Manual creation
  - Set group name
  - Add description
  - Set grouping criteria (category, manufacturer, status, model, location)
  - Configure low stock alerts
  - Create group

- [ ] Auto-generate groups
  - Click "Auto-Generate" button
  - Modal opens showing suggested groups
  - Select groups to create (multiple selection)
  - Create selected groups
  - Verify groups created with correct criteria

#### 3.2 View & Manage Asset Groups
- [ ] View group list
  - See all groups
  - See asset counts
  - See criteria badges with icons
  - See low stock alerts

- [ ] View group details
  - See group information
  - See criteria breakdown with icons
  - See statistics (total, available, assigned, etc.)
  - See assets in group
  - Bulk actions on assets

#### 3.3 Group Actions
- [ ] Edit group
  - Modify criteria
  - Update alerts
  - Save changes

- [ ] Duplicate group
  - Create copy with "(Copy)" suffix
  - Verify new group created

- [ ] Delete group
  - Confirm deletion
  - Verify group removed

#### 3.4 Bulk Actions on Assets in Group
- [ ] Select multiple assets
- [ ] Bulk assign assets
- [ ] Bulk update status
- [ ] Bulk update location
- [ ] Export selected assets

### 4. Vendor Management 🚚

#### 4.1 Vendor CRUD Operations
- [ ] Create vendor
  - Add vendor name
  - Add contact information
  - Add address
  - Save vendor

- [ ] View vendor list
- [ ] View vendor details
  - See vendor information
  - See associated contracts
  - See associated assets
  - See statistics

- [ ] Create contract from vendor details
  - Click "Add Contract" button
  - Contract form opens in modal
  - Vendor pre-selected
  - Fill contract details
  - Create contract
  - Verify contract appears in vendor's contracts list

- [ ] Edit vendor
- [ ] Delete vendor

### 5. Contract Management 📄

#### 5.1 Contract CRUD Operations
- [ ] Create contract
  - From contracts page
  - From vendor details page (modal)
  - Fill all required fields:
    - Contract name
    - Contract number
    - Vendor (required)
    - Type (service, software, hardware, etc.)
    - Status (active, pending, expired, etc.)
    - Start date
    - Expiry date (required)
    - Value
    - Auto-renewal
    - Description
  - Submit and verify

- [ ] View contract list
  - See all contracts
  - Filter by status
  - Filter by type
  - Search contracts

- [ ] View contract details
  - See all contract information
  - See associated vendor
  - See renewal alerts

- [ ] Edit contract
- [ ] Delete contract

### 6. License Management 🔑

#### 6.1 License CRUD Operations
- [ ] Create license
  - Software name
  - License type
  - Total seats
  - Purchase information
  - Expiry date
  - Assign to users

- [ ] View license list
- [ ] View license details
- [ ] Assign license to user
- [ ] Unassign license from user
- [ ] Edit license
- [ ] Delete license

### 7. User Management 👥

#### 7.1 User CRUD Operations
- [ ] Create user
  - Name
  - Email
  - Role (admin, manager, staff)
  - Department
  - Contact information

- [ ] View user list
- [ ] View user details
  - See assigned assets
  - See assigned licenses
  - See Microsoft licenses

- [ ] Edit user
- [ ] Delete user

### 8. Department Management 🏢

#### 8.1 Department Operations
- [ ] Create department
- [ ] View department list
- [ ] View department details
  - See department members
  - See department assets
- [ ] Add user to department
- [ ] Remove user from department
- [ ] Edit department
- [ ] Delete department

### 9. Warranty Management 🛡️

#### 9.1 Warranty Operations
- [ ] View warranty dashboard
- [ ] See warranty timeline for assets
- [ ] Track warranty expirations
- [ ] Receive warranty expiration alerts

### 10. Reports & Analytics 📊

#### 10.1 Reporting Features
- [ ] Generate asset reports
- [ ] Generate license reports
- [ ] Export to CSV
- [ ] Custom report builder
- [ ] View spend analytics
- [ ] View financial dashboard

### 11. Settings ⚙️

#### 11.1 System Settings
- [ ] View settings page
- [ ] Update system configuration
- [ ] Configure integrations
- [ ] View integration status
- [ ] Two-factor authentication setup

### 12. Dashboard 📈

#### 12.1 Dashboard Features
- [ ] View dashboard statistics
- [ ] See asset status distribution
- [ ] See asset category breakdown
- [ ] See license utilization
- [ ] Quick access to key metrics
- [ ] Navigate to different sections

### 13. Onboarding Kits 🎁

#### 13.1 Onboarding Operations
- [ ] Create onboarding kit
- [ ] View kit list
- [ ] View kit details
- [ ] Assign kit to new user
- [ ] Edit kit
- [ ] Delete kit

### 14. QR Code Generation 🎯

#### 14.1 QR Code Features
- [ ] Generate QR code for individual asset
- [ ] Bulk QR code generation
- [ ] Download QR codes
- [ ] Print QR codes

## 🐛 Known Issues & Testing Notes

### CDW Integration
- Currently uses mock data when CDW API is not available
- Mock products are available for testing purchasing flow
- Real CDW API integration requires backend configuration

### Test Data
The platform includes mock data for:
- CDW products (10 sample products)
- Asset categories
- Vendor information
- License types

## ✅ Priority Test Cases

### Critical Path Testing (Must Test)
1. **Purchasing Flow**: CDW product selection → Asset creation
2. **Asset Assignment**: Create asset → Assign to user
3. **Asset Groups**: Auto-generate groups → View assets in group → Bulk actions
4. **Contract Creation**: From vendor page → Verify contract appears
5. **User Management**: Create user → Assign assets → View user profile

### High Priority
- Asset CRUD operations
- License management
- Vendor and contract management
- Asset group bulk operations
- Report generation

### Medium Priority
- Department management
- Onboarding kits
- QR code generation
- Advanced filtering and search

## 🚀 Quick Test Script

### Test Purchasing Feature (5 minutes)
1. Login as admin
2. Go to Assets → Create New Asset
3. Click "Buy from CDW"
4. Search for "ThinkPad"
5. Select first product
6. Verify form auto-populated
7. Fill in serial number
8. Set purchase date
9. Submit form
10. Verify asset created with CDW info

### Test Asset Groups (5 minutes)
1. Go to Asset Groups
2. Click "Auto-Generate"
3. Select 2-3 suggested groups
4. Click "Create X Groups"
5. Click on one group to view details
6. Verify assets listed
7. Select 2 assets
8. Click bulk actions
9. Test bulk assign or status update

### Test Contract Creation from Vendor (3 minutes)
1. Go to Vendors
2. Click on a vendor (or create one)
3. Click "Add Contract" button
4. Fill contract form
5. Submit
6. Verify contract appears in vendor's contracts list

## 📝 Notes

- All features should work with mock data when backend APIs are not available
- Error handling should display user-friendly messages
- Loading states should be shown during API calls
- Success toasts should confirm actions
- Form validation should prevent invalid submissions

