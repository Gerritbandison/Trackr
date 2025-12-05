# Trackr ITAM - Functional Gaps & Priorities

**Focus:** Core ITAM functionality needed for daily use
**Date:** December 2, 2025

---

## What Users Can't Do Right Now 🚫

### Asset Management Workflow Gaps

#### 1. **Can't Track Real Asset Lifecycle**
**Current State:** Assets have status (Active, Retired, Repair, In Stock) but no workflow

**What's Missing:**
```
User wants to:
1. Receive a new laptop → Can't record "Received" state
2. Assign to user → Can only manually change "assignedUser" field
3. Track who had it previously → No history of assignments
4. Move between locations → Location is just a text field
5. Send for repair → Can mark "Repair" but no repair tracking
6. Return from user → No check-in process
7. Retire the asset → Can mark "Retired" but no disposal workflow
```

**Why It Matters:** Without lifecycle tracking, you can't answer:
- "Where is this laptop?"
- "Who had this before?"
- "Is it available to assign?"
- "When was it last serviced?"

**Quick Fix:**
```typescript
// Add to asset model
assignmentHistory: [{
  userId: ObjectId,
  assignedDate: Date,
  returnedDate: Date,
  notes: String
}],
currentAssignment: {
  userId: ObjectId,
  assignedDate: Date,
  expectedReturnDate: Date
},
locationHistory: [{
  location: String,
  movedDate: Date,
  movedBy: ObjectId
}]
```

#### 2. **Can't Bulk Import Assets**
**Current State:** Manual entry only, one asset at a time

**What's Missing:**
- CSV import for initial inventory
- Excel template for bulk upload
- Validation during import
- Error reporting for failed imports
- Preview before committing

**Why It Matters:**
- Entering 500 laptops manually = 40+ hours of work
- High error rate with manual entry
- Can't migrate from existing systems

**Quick Fix:**
- Add `/api/v1/assets/bulk-import` endpoint
- Accept CSV with columns: name, serialNumber, assetTag, category, purchaseDate, purchasePrice
- Return success/error report

#### 3. **Can't Export Data**
**Current State:** No export functionality

**What's Missing:**
- Export to Excel/CSV
- Filtered exports (e.g., "all laptops in IT department")
- Export with custom fields
- Scheduled exports

**Why It Matters:**
- Can't share data with stakeholders
- Can't backup data
- Can't analyze in Excel/Power BI

**Quick Fix:**
```typescript
// Add to asset routes
router.get('/export', async (req, res) => {
  const assets = await assetService.getAssets(filter);
  const csv = convertToCSV(assets);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=assets.csv');
  res.send(csv);
});
```

#### 4. **Can't Track Asset Condition**
**Current State:** No condition field

**What's Missing:**
- Condition rating (Excellent, Good, Fair, Poor)
- Condition notes
- Condition history
- Photos of damage

**Why It Matters:**
- Can't decide if asset should be retired
- Can't charge users for damage
- Can't track degradation over time

**Quick Fix:**
```typescript
// Add to asset model
condition: {
  type: String,
  enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
  default: 'Excellent'
},
conditionNotes: String,
conditionHistory: [{
  condition: String,
  notes: String,
  checkedBy: ObjectId,
  checkedDate: Date
}]
```

---

### License Management Workflow Gaps

#### 1. **Can't Track What Software Is Actually Installed**
**Current State:** License tracking only, no installation tracking

**What's Missing:**
- Link licenses to actual software installations
- Track where software is installed
- Reconcile purchased licenses vs. installed instances
- Identify unlicensed software

**Why It Matters:**
- You might have 100 licenses but 150 installations (non-compliant!)
- Can't reclaim unused licenses
- Can't prove compliance in audit

**Impact:** This is a **MAJOR GAP** for license management

**What You Need:**
```typescript
// New model: SoftwareInstallation
{
  softwareName: String,
  version: String,
  installedOn: {
    assetId: ObjectId,
    computerName: String
  },
  installedBy: ObjectId,
  installedDate: Date,
  licenseId: ObjectId, // Link to license
  discoverySource: String, // 'manual', 'import', 'agent'
}

// Then compare:
// Licenses.totalSeats vs. SoftwareInstallations.count()
```

#### 2. **Can't See License History**
**Current State:** Can assign/unassign licenses but no history

**What's Missing:**
- Who had this license before?
- When was it assigned/unassigned?
- Why was it unassigned?
- License reassignment tracking

**Quick Fix:**
```typescript
// Add to license model
assignmentHistory: [{
  userId: ObjectId,
  assignedDate: Date,
  unassignedDate: Date,
  reason: String,
  assignedBy: ObjectId
}]
```

#### 3. **Can't Attach License Keys Securely**
**Current State:** License key is in the model but exposed in API

**What's Missing:**
- Encrypted license key storage
- Permission-based access (only admins see keys)
- Key retrieval audit log
- Multiple keys per license (different versions)

**Why It Matters:**
- License keys are sensitive
- Need to know who accessed keys
- Many licenses have multiple keys

**Quick Fix:**
```typescript
// License key should not be in regular queries
// Add separate endpoint:
router.get('/:id/key', authorize('admin'), async (req, res) => {
  const license = await License.findById(req.params.id).select('+licenseKey');
  // Log the access
  await auditLog.create({
    action: 'LICENSE_KEY_ACCESSED',
    userId: req.user.id,
    resourceId: license.id
  });
  return res.json({ licenseKey: license.licenseKey });
});
```

---

### Missing Core ITAM Features

#### 1. **No Asset Check-Out/Check-In System**
**Problem:** Users can't borrow equipment (laptops, monitors, cables, etc.)

**Real-World Scenario:**
```
Employee needs to work from home temporarily:
1. User requests loaner laptop
2. IT approves request
3. User picks up laptop → Check-out recorded
4. Due date set (e.g., 2 weeks)
5. User returns laptop → Check-in recorded
6. Condition assessed on return
7. If damaged, charge user
```

**What You Need:**
```typescript
// New model: CheckOut
{
  assetId: ObjectId,
  userId: ObjectId,
  checkedOutBy: ObjectId, // IT staff who processed
  checkedOutDate: Date,
  dueDate: Date,
  returnedDate: Date,
  conditionAtCheckout: String,
  conditionAtReturn: String,
  notes: String,
  status: 'active' | 'overdue' | 'returned'
}

// Routes needed:
POST /api/v1/checkouts - Create checkout
GET /api/v1/checkouts/overdue - Get overdue items
POST /api/v1/checkouts/:id/return - Return item
GET /api/v1/users/:id/checkouts - User's borrowed items
```

**Priority:** 🟡 HIGH (common workflow)

#### 2. **No Warranty Tracking**
**Problem:** Can't track if assets are under warranty

**Real-World Scenario:**
```
Laptop breaks:
1. Check if under warranty → Can't tell!
2. If yes, contact vendor for repair → Don't have warranty info
3. If no, pay for repair → Could have been free if known
```

**What You Need:**
```typescript
// Add to asset model
warranty: {
  provider: String,
  startDate: Date,
  endDate: Date,
  coverageType: String, // 'Standard', 'Extended', 'Premium'
  warrantyNumber: String,
  supportPhone: String,
  terms: String
},

// Helper function
isUnderWarranty(): boolean {
  return this.warranty && this.warranty.endDate > new Date();
}

// Routes needed:
GET /api/v1/assets/warranty/expiring?days=30
GET /api/v1/assets/warranty/expired
```

**Priority:** 🔴 CRITICAL (costs money if missing)

#### 3. **No Maintenance/Repair Tracking**
**Problem:** Can't track when assets need service or repair history

**Real-World Scenario:**
```
Laptop has been slow:
1. Send for repair → Can mark status "Repair" but that's it
2. What's wrong? → No field for problem description
3. Who's fixing it? → Can't track
4. Cost? → Can't track
5. When will it be done? → Can't track
6. History of repairs? → Can't see
```

**What You Need:**
```typescript
// New model: MaintenanceRecord
{
  assetId: ObjectId,
  type: 'Repair' | 'Preventive Maintenance' | 'Upgrade',
  description: String,
  reportedBy: ObjectId,
  reportedDate: Date,
  assignedTo: String, // Technician or vendor
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled',
  cost: Number,
  startDate: Date,
  completedDate: Date,
  resolution: String,
  parts: [{ name: String, cost: Number }]
}

// Routes needed:
POST /api/v1/assets/:id/maintenance - Create maintenance record
GET /api/v1/assets/:id/maintenance-history - Get history
GET /api/v1/maintenance/pending - Get pending repairs
```

**Priority:** 🟡 HIGH (track TCO and reliability)

#### 4. **No Contract Management**
**Problem:** Can't track vendor contracts, leases, or service agreements

**Real-World Scenarios:**
```
Scenario 1 - Lease Management:
Company leases 50 laptops:
- Can't track lease terms
- Can't track monthly payments
- Can't track lease end date
- Can't plan for lease renewal/return

Scenario 2 - Service Contracts:
Company has Dell support contract:
- Can't track which assets are covered
- Can't track contract renewal date
- Can't track support level (next-day, 4-hour, etc.)
- Can't link to vendor

Scenario 3 - Software Licenses:
Company has Microsoft EA:
- Can't track contract dates
- Can't track true-up dates
- Can't track spending caps
- Can't track contract terms
```

**What You Need:**
```typescript
// New model: Contract
{
  contractNumber: String,
  type: 'Purchase' | 'Lease' | 'Maintenance' | 'Support' | 'License Agreement',
  vendorId: ObjectId,
  startDate: Date,
  endDate: Date,
  renewalDate: Date,
  autoRenew: Boolean,
  value: Number,
  paymentSchedule: String, // 'Monthly', 'Quarterly', 'Annual', 'One-time'
  status: 'Active' | 'Expiring' | 'Expired' | 'Cancelled',
  terms: String,
  attachments: [String], // S3 URLs for PDFs
  coveredAssets: [ObjectId], // For leases/support
  coveredLicenses: [ObjectId], // For license agreements
  notifications: {
    renewalAlert: Number, // days before renewal
    expirationAlert: Number
  }
}

// Routes needed:
GET /api/v1/contracts/expiring?days=30
GET /api/v1/contracts/active
GET /api/v1/assets/:id/contracts - What contracts cover this asset
POST /api/v1/contracts/:id/renew - Renew contract
```

**Priority:** 🔴 CRITICAL (prevents missed renewals and waste)

#### 5. **No Location Management**
**Problem:** Location is just a text field, can't track multi-site assets

**Real-World Scenario:**
```
Company has 3 offices:
- San Francisco HQ
- New York Office
- Austin Office

Need to:
- Track which assets are at which location
- Know asset counts per location
- Transfer assets between locations
- Generate location-based reports

Current problem:
location: "SF" vs "San Francisco" vs "HQ" → inconsistent data
```

**What You Need:**
```typescript
// New model: Location
{
  name: String, // "San Francisco HQ"
  type: 'Office' | 'Warehouse' | 'Remote' | 'Data Center',
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  parent: ObjectId, // For building → floor → room hierarchy
  isActive: Boolean,
  manager: ObjectId,
  capacity: Number
}

// Update asset model
locationId: ObjectId, // Reference to Location
locationHistory: [{
  locationId: ObjectId,
  movedDate: Date,
  movedBy: ObjectId,
  reason: String
}]

// Routes needed:
GET /api/v1/locations - List all locations
GET /api/v1/locations/:id/assets - Assets at this location
POST /api/v1/assets/:id/transfer - Transfer to new location
```

**Priority:** 🟡 HIGH (essential for multi-site)

#### 6. **No Reporting/Analytics**
**Problem:** Can't answer basic business questions

**Questions Users Can't Answer:**
- What's the total value of our IT assets?
- What's our spend by category this year?
- Which assets are depreciating fastest?
- How many assets are assigned vs. available?
- What's our asset utilization rate?
- Which department has the most equipment?
- What equipment is expiring warranties this month?
- What's our license compliance status?

**What You Need:**
```typescript
// New routes for analytics
GET /api/v1/reports/asset-value - Total asset value by category
GET /api/v1/reports/asset-count - Asset counts by status/category
GET /api/v1/reports/depreciation - Depreciation summary
GET /api/v1/reports/spend - Spending over time
GET /api/v1/reports/utilization - Asset utilization rates
GET /api/v1/reports/compliance - License compliance status
GET /api/v1/reports/expiring-warranties - Warranties expiring soon

// Response format:
{
  totalValue: Number,
  byCategory: {
    'Laptops': { count: 150, value: 225000 },
    'Monitors': { count: 200, value: 80000 }
  },
  byStatus: {
    'Active': { count: 300, value: 450000 },
    'In Stock': { count: 50, value: 75000 }
  }
}
```

**Priority:** 🔴 CRITICAL (can't demonstrate value without reports)

---

## Data Model Fixes Needed 🔧

### Asset Model - Missing Fields

```typescript
// Current asset model is too basic
// Add these fields for real-world use:

{
  // Identification
  manufacturer: String, // HP, Dell, Apple
  model: String, // "Latitude 7420", "MacBook Pro 16"
  sku: String, // Manufacturer SKU

  // Financial
  costCenter: String,
  purchaseOrderNumber: String,
  supplier: String, // Where you bought it
  residualValue: Number, // Actual value when disposed

  // Assignment
  assignedTo: ObjectId, // Reference to User (not string!)
  assignedDate: Date,
  assignmentHistory: [{ userId, assignedDate, returnedDate }],

  // Location
  locationId: ObjectId, // Reference to Location (not string!)
  sublocation: String, // "Floor 3, Desk 42"

  // Warranty
  warranty: {
    provider: String,
    startDate: Date,
    endDate: Date,
    terms: String
  },

  // Condition & Maintenance
  condition: String,
  conditionNotes: String,
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,

  // Lifecycle
  receivedDate: Date,
  deployedDate: Date,
  retiredDate: Date,
  disposalMethod: String,
  disposalDate: Date,

  // Leasing
  isLeased: Boolean,
  leaseProvider: String,
  leaseStartDate: Date,
  leaseEndDate: Date,
  leaseMonthlyPayment: Number,

  // Attachments & Notes
  photos: [String], // S3 URLs
  documents: [String], // Purchase receipts, warranty docs
  notes: String,

  // Custom Fields (for extensibility)
  customFields: Map
}
```

### License Model - Missing Fields

```typescript
// Current license model is good but missing:

{
  // Product Info
  productName: String, // "Microsoft Office"
  productVersion: String, // "2021", "365"
  publisher: String, // "Microsoft"

  // License Details
  licenseType: String, // 'Named User', 'Concurrent', 'Device', 'Core-based'
  agreementType: String, // 'Enterprise Agreement', 'Select Plus', 'Standard'

  // Contract Link
  contractId: ObjectId, // Link to contract

  // Support & Maintenance
  maintenanceIncluded: Boolean,
  maintenanceStartDate: Date,
  maintenanceEndDate: Date,
  supportLevel: String, // 'Standard', 'Premium'

  // Deployment
  deploymentType: String, // 'On-Premise', 'Cloud', 'Hybrid'

  // Compliance
  lastAuditDate: Date,
  complianceRisk: String, // 'Low', 'Medium', 'High'
  actualUsage: Number, // For metered licenses

  // Financial
  proofOfPurchase: String, // S3 URL
  invoiceNumber: String,

  // Department Allocation
  departmentId: ObjectId,
  costCenter: String
}
```

---

## Quick Wins - What to Build First 🎯

### Week 1-2: Basic Workflow Improvements
**Effort:** Low | **Impact:** High

1. **Asset Assignment History**
   - Add `assignmentHistory` array to asset model
   - Track who had asset and when
   - 1-2 days of work

2. **License Assignment History**
   - Add `assignmentHistory` array to license model
   - Track license reassignments
   - 1 day of work

3. **Bulk Import Assets**
   - CSV upload endpoint
   - Basic validation
   - 2-3 days of work

4. **Export to CSV**
   - Add export endpoints for assets and licenses
   - 1 day of work

### Week 3-4: Asset Lifecycle
**Effort:** Medium | **Impact:** Very High

5. **Warranty Tracking**
   - Add warranty fields to asset model
   - Expiring warranty endpoint
   - 2-3 days of work

6. **Location Management**
   - Create Location model
   - Update asset model with locationId
   - Asset transfer endpoint
   - 3-4 days of work

7. **Asset Condition Tracking**
   - Add condition field and history
   - 1-2 days of work

### Week 5-6: Essential Features
**Effort:** Medium | **Impact:** Very High

8. **Check-Out/Check-In System**
   - Create CheckOut model
   - Check-out/return endpoints
   - Overdue tracking
   - 4-5 days of work

9. **Basic Maintenance Tracking**
   - Create MaintenanceRecord model
   - CRUD endpoints
   - Maintenance history per asset
   - 3-4 days of work

### Week 7-8: Business Value
**Effort:** Medium | **Impact:** Critical

10. **Contract Management**
    - Create Contract model
    - CRUD endpoints
    - Link to assets/licenses
    - Renewal alerts
    - 5-6 days of work

11. **Basic Reporting**
    - Asset value by category
    - Asset count by status
    - Spend tracking
    - License compliance summary
    - 4-5 days of work

---

## What Makes This Usable?

### Minimum Viable ITAM Platform Needs:

✅ **Currently Have:**
- Basic asset & license CRUD
- User management
- Audit logging

❌ **Still Need (Minimum):**
1. **Warranty tracking** - Or you'll waste money
2. **Location management** - Or you can't find anything
3. **Contract tracking** - Or you'll miss renewals
4. **Basic reporting** - Or you can't show value
5. **Bulk import/export** - Or it's unusable at scale
6. **Assignment history** - Or you have no accountability

**Time to MVP:** ~6-8 weeks if focused

---

## Priority Matrix

### Must Have (Blocks real-world use)
- ⭐⭐⭐ Warranty tracking
- ⭐⭐⭐ Location management
- ⭐⭐⭐ Contract management
- ⭐⭐⭐ Basic reporting
- ⭐⭐⭐ Bulk import/export

### Should Have (Needed for efficiency)
- ⭐⭐ Check-out/check-in
- ⭐⭐ Maintenance tracking
- ⭐⭐ Assignment history
- ⭐⭐ Condition tracking

### Nice to Have (Improves UX)
- ⭐ Software installation tracking
- ⭐ Photo attachments
- ⭐ Advanced analytics
- ⭐ Mobile app

---

## Bottom Line

**You have 40% of a working ITAM system.**

**To make it actually usable in the real world, you need:**
1. Warranty tracking (3-4 days)
2. Location management (3-4 days)
3. Contract management (5-6 days)
4. Basic reporting (4-5 days)
5. Bulk operations (3-4 days)

**Total: ~3-4 weeks of focused work to get to MVP**

After that, it would be genuinely usable for small-to-medium companies (<500 assets).

The rest (maintenance tracking, check-out system, advanced features) can be added incrementally based on user feedback.
