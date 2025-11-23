/**
 * ITAM Platform Type Definitions
 * 
 * Comprehensive type definitions for IT Asset Management platform
 * Based on industry best practices for Setyl, Asset Panda, Lansweeper-adjacent stacks
 */

/**
 * Canonical Asset Identifiers
 */
export interface AssetIdentifiers {
  /** Global Asset ID - primary identifier we control */
  globalAssetId: string;
  /** Human-friendly asset tag (e.g., PHL-E14-0123) */
  assetTag?: string;
  /** OEM serial number - truth from manufacturer */
  serialNumber?: string;
  /** Device GUIDs from MDM/EDR systems */
  deviceGuids?: {
    intuneDeviceId?: string;
    defenderDeviceId?: string;
    jamfDeviceId?: string;
    sccmDeviceId?: string;
    crowdStrikeDeviceId?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Asset Lifecycle States
 * State machine: Ordered → Received → In Staging → In Service → In Repair → In Loaner → Lost → Retired/Disposed
 */
export type AssetState =
  | 'Ordered'
  | 'Received'
  | 'In Staging'
  | 'In Service'
  | 'In Repair'
  | 'In Loaner'
  | 'Lost'
  | 'Retired'
  | 'Disposed';

/**
 * Asset Class/Category
 */
export type AssetClass =
  | 'Laptop'
  | 'Desktop'
  | 'Monitor'
  | 'Phone'
  | 'Tablet'
  | 'Dock'
  | 'Keyboard'
  | 'Mouse'
  | 'Headset'
  | 'Webcam'
  | 'Accessory'
  | 'Server'
  | 'Network Device'
  | 'Other';

/**
 * Asset Condition
 */
export type AssetCondition =
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Poor'
  | 'Damaged';

/**
 * Owner Information
 */
export interface AssetOwner {
  userId: string;
  upn: string; // User Principal Name (e.g., gerrit@signers.com)
  displayName?: string;
  department?: string;
  costCenter?: string;
}

/**
 * Location Hierarchy: Region → Office → Room → Rack/Bin
 */
export interface AssetLocation {
  region?: string;
  site?: string; // Office/Site
  room?: string;
  rack?: string;
  bin?: string;
  /** Full location string for display */
  fullLocation?: string;
}

/**
 * Purchase Information
 */
export interface PurchaseInfo {
  po?: string; // Purchase Order number
  date?: string; // ISO date string
  unitCost?: number;
  vendor?: string;
  invoice?: string;
  costCenter?: string;
  project?: string; // For client-issued devices
  customer?: string; // For client-issued devices
}

/**
 * Warranty Information
 */
export interface WarrantyInfo {
  provider?: string;
  start?: string; // ISO date string
  end?: string; // ISO date string
  coverageType?: string;
  isActive?: boolean;
  daysRemaining?: number;
  /** Warranty lookup source (e.g., 'Dell API', 'Lenovo API', 'Manual') */
  source?: string;
  /** Last warranty check timestamp */
  lastCheckedAt?: string;
}

/**
 * Security & Compliance Information
 */
export interface SecurityInfo {
  edr?: string; // EDR provider (e.g., 'Defender', 'CrowdStrike')
  edrStatus?: 'Active' | 'Inactive' | 'Unknown';
  bitLocker?: boolean; // Windows BitLocker
  fileVault?: boolean; // macOS FileVault
  lastCheckInUtc?: string; // ISO timestamp
  patchRing?: string;
  complianceStatus?: 'Compliant' | 'Non-Compliant' | 'Unknown';
  /** Last security scan timestamp */
  lastSecurityScanUtc?: string;
}

/**
 * Asset Relationships
 */
export interface AssetRelationships {
  /** Parent asset (e.g., laptop that owns this dock) */
  parent?: string; // GlobalAssetId
  /** Child assets (e.g., monitors, docks attached to this laptop) */
  children?: string[]; // GlobalAssetId[]
  /** Related contracts */
  contracts?: string[]; // Contract IDs
  /** Related tickets */
  tickets?: string[]; // Ticket IDs
  /** Related software installations */
  software?: string[]; // Software IDs
}

/**
 * Asset Documentation
 */
export interface AssetDocument {
  type: 'Handoff' | 'Warranty' | 'Invoice' | 'PO' | 'WipeCert' | 'Disposal' | 'Other';
  url: string;
  title?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

/**
 * Custom Fields
 * For extensibility - allows additional fields per deployment
 */
export interface CustomFields {
  [key: string]: any;
}

/**
 * Complete Asset Model
 * Minimal JSON structure as per spec
 */
export interface ITAMAsset {
  // Identifiers
  globalAssetId: string;
  assetTag?: string;
  class: AssetClass;
  company?: string;
  model: string;
  serialNumber?: string;
  deviceGuids?: AssetIdentifiers['deviceGuids'];

  // Ownership & Location
  owner?: AssetOwner;
  location?: AssetLocation;

  // Lifecycle
  state: AssetState;
  condition?: AssetCondition;

  // Financial
  purchase?: PurchaseInfo;
  warranty?: WarrantyInfo;

  // Depreciation
  depreciationType?: 'Straight Line' | 'Double Declining' | 'Sum of Years';
  usefulLife?: number;
  salvageValue?: number;

  // Security
  security?: SecurityInfo;

  // Relationships
  relationships?: AssetRelationships;

  // Documentation
  docs?: AssetDocument[];

  // Custom fields
  custom?: CustomFields;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * State Machine Transition Rules
 */
export interface StateTransition {
  from: AssetState;
  to: AssetState;
  /** Conditions that must be met for transition */
  conditions?: {
    ownerRequired?: boolean;
    dataWipeCertRequired?: boolean;
    warrantyCheckRequired?: boolean;
    [key: string]: any;
  };
  /** Validation function name */
  validator?: string;
}

/**
 * State Machine Configuration
 */
export const STATE_TRANSITIONS: StateTransition[] = [
  { from: 'Ordered', to: 'Received' },
  { from: 'Received', to: 'In Staging' },
  { from: 'In Staging', to: 'In Service', conditions: { ownerRequired: true } },
  { from: 'In Service', to: 'In Repair' },
  { from: 'In Service', to: 'In Loaner' },
  { from: 'In Repair', to: 'In Service' },
  { from: 'In Loaner', to: 'In Service' },
  { from: 'In Service', to: 'Lost' },
  { from: 'In Service', to: 'Retired' },
  { from: 'In Service', to: 'Disposed', conditions: { dataWipeCertRequired: true } },
  { from: 'Lost', to: 'In Service' }, // Asset recovered
  { from: 'Retired', to: 'Disposed', conditions: { dataWipeCertRequired: true } },
];

/**
 * Field Validation Rules
 */
export const VALIDATION_RULES = {
  serialNumber: /^[A-Z0-9-]{6,20}$/,
  assetTag: /^[A-Z]{2,5}-[A-Z0-9]{2,5}-\d{3,5}$/,
  globalAssetId: /^AS-\d{4}-\d{6}$/, // AS-2025-000123
};

/**
 * Required Fields by Asset Class
 */
export interface RequiredFieldsByClass {
  'End-user device': string[];
  'Peripherals/consumables': string[];
  'SaaS license': string[];
  [key: string]: string[];
}

export const REQUIRED_FIELDS_BY_CLASS: RequiredFieldsByClass = {
  'End-user device': [
    'model',
    'serialNumber',
    'owner',
    'purchase.unitCost',
    'purchase.po',
    'purchase.invoice',
    'warranty.start',
    'warranty.end',
    'location',
    'state',
    'deviceGuids',
  ],
  'Peripherals/consumables': [
    'model',
    'purchase.unitCost',
    'location',
  ],
  'SaaS license': [
    'model', // App name
    'owner',
    'purchase.unitCost',
    'purchase.date',
    'warranty.end', // Renewal date
  ],
};

/**
 * Contract Types
 */
export type ContractType = 'Lease' | 'SaaS' | 'Support' | 'Maintenance' | 'Other';

/**
 * Contract Model
 */
export interface Contract {
  id: string;
  type: ContractType;
  vendor: string;
  term: number; // Months
  startDate: string;
  endDate: string;
  autoRenew?: boolean;
  noticeWindow?: number; // Days before renewal
  costCenter?: string;
  docLink?: string;
  healthScore?: number; // 0-100
  renewalRisk?: 'Low' | 'Medium' | 'High';
  relatedAssets?: string[]; // GlobalAssetIds
  relatedLicenses?: string[]; // License IDs
}

/**
 * Software License Model
 */
export interface SoftwareLicense {
  id: string;
  name: string;
  edition?: string;
  version?: string;
  type: 'Perpetual' | 'Subscription' | 'SaaS';
  totalSeats?: number;
  assignedSeats?: number;
  availableSeats?: number;
  contractId?: string;
  renewalDate?: string;
  lastActivity?: string; // Last usage timestamp
  assignedTo?: Array<{
    userId: string;
    deviceId?: string;
    assignedAt: string;
  }>;
}

/**
 * Discovery Source
 */
export type DiscoverySource =
  | 'Intune'
  | 'Entra'
  | 'Jamf'
  | 'SCCM'
  | 'Lansweeper'
  | 'SNMP'
  | 'VMware'
  | 'Azure'
  | 'AWS'
  | 'GCP'
  | 'EDR'
  | 'Vulnerability Scanner'
  | 'SSO'
  | 'Vendor API'
  | 'CASB'
  | 'Manual';

/**
 * Discovery Record
 */
export interface DiscoveryRecord {
  source: DiscoverySource;
  deviceId: string; // Source-specific ID
  globalAssetId?: string; // Matched asset
  serialNumber?: string;
  deviceGuid?: string;
  macAddress?: string;
  lastSeen: string; // ISO timestamp
  metadata?: Record<string, any>;
}

/**
 * Reconciliation Result
 */
export interface ReconciliationResult {
  matched: number;
  unmatched: number;
  newAssets: DiscoveryRecord[];
  orphanedAssets: string[]; // GlobalAssetIds with no heartbeat
  conflicts: Array<{
    globalAssetId: string;
    conflict: string;
    resolution?: string;
  }>;
}

/**
 * Check-in/Check-out Record
 */
export interface CheckoutRecord {
  id: string;
  assetId: string; // GlobalAssetId
  custodian: AssetOwner;
  checkedOutAt: string;
  dueDate: string;
  checkedInAt?: string;
  deposit?: number;
  notes?: string;
}

/**
 * Loaner Policy
 */
export interface LoanerPolicy {
  maxConcurrentAssets: number;
  autoEmailDaysBeforeDue: number; // Default: 48 hours = 2 days
  convertToLostAfterDays: number; // Default: 30 days
  requireDeposit?: boolean;
  depositAmount?: number;
}

/**
 * RMA/Ticket Model
 */
export interface RepairTicket {
  id: string;
  assetId: string; // GlobalAssetId
  vendorCaseNumber?: string;
  state: 'Open' | 'In Progress' | 'Waiting Parts' | 'Completed' | 'Closed';
  startedAt: string;
  completedAt?: string;
  loanerAssetId?: string; // GlobalAssetId of loaner
  description?: string;
  cost?: number;
  warrantyCovered?: boolean;
}

/**
 * SLA Metrics
 */
export interface SLAMetrics {
  assetId: string;
  meanTimeInRepair: number; // Hours
  downtimePerUser: number; // Hours
  repeatFailureRate: number; // Percentage
  totalRepairs: number;
}

/**
 * Renewal Notification
 */
export interface RenewalNotification {
  contractId: string;
  daysUntilRenewal: number;
  notificationLevel: 120 | 60 | 30; // Days
  sentAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

/**
 * Depreciation Method
 */
export type DepreciationMethod = 'Straight-Line' | 'Declining-Balance' | 'Units-of-Production';

/**
 * Depreciation Schedule
 */
export interface DepreciationSchedule {
  assetId: string;
  method: DepreciationMethod;
  purchasePrice: number;
  purchaseDate: string;
  usefulLife: number; // Years
  salvageValue?: number;
  monthlyDepreciation?: number;
  currentBookValue?: number;
  depreciationToDate?: number;
}

/**
 * Chargeback Allocation
 */
export interface ChargebackAllocation {
  assetId: string;
  costCenter: string;
  department?: string;
  percentage: number; // 0-100
  monthlyAmount?: number;
}

/**
 * Stock/Inventory Item (Non-serialized)
 */
export interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  unitCost?: number;
  vendor?: string;
  location?: AssetLocation;
  batchNumber?: string;
  expiryDate?: string;
}

/**
 * Kit Definition
 */
export interface KitDefinition {
  id: string;
  name: string;
  description?: string;
  items: Array<{
    stockItemId?: string;
    assetClass?: AssetClass;
    quantity: number;
  }>;
  totalCost?: number;
}

/**
 * Label Format
 */
export type LabelFormat = 'Code128' | 'QR';

/**
 * Label Template
 */
export interface LabelTemplate {
  format: LabelFormat;
  zplTemplate?: string; // ZPL template for Zebra printers
  size: {
    width: number; // mm
    height: number; // mm
  };
  fields: Array<{
    name: string;
    position: { x: number; y: number };
    fontSize?: number;
  }>;
}

/**
 * Workflow Definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  trigger: {
    type: 'StateChange' | 'Schedule' | 'Webhook' | 'Manual';
    condition?: any;
  };
  actions: Array<{
    type: string;
    config: any;
  }>;
  enabled: boolean;
}

/**
 * Webhook Configuration
 */
export interface WebhookConfig {
  id: string;
  url: string;
  events: string[]; // Event types to subscribe to
  secret?: string;
  enabled: boolean;
  lastTriggered?: string;
}

/**
 * RBAC Scope
 */
export interface RBACScope {
  company?: string[];
  site?: string[];
  costCenter?: string[];
  assetClass?: AssetClass[];
}

/**
 * User Role
 */
export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  scopes: RBACScope;
}

/**
 * Multi-Tenant Entity
 */
export interface Tenant {
  id: string;
  name: string;
  dataResidency?: 'US' | 'EU' | 'APAC' | 'Other';
  customFields?: CustomFields;
}

