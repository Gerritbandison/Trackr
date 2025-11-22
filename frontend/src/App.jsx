import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';
import TestDataInitializer from './components/ui/TestDataInitializer';

// Lazy load heavy components for route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const AssetList = lazy(() => import('./pages/Assets/AssetList'));
const AssetDetails = lazy(() => import('./pages/Assets/AssetDetails'));
const BulkQRGenerator = lazy(() => import('./pages/Assets/BulkQRGenerator'));
const UserList = lazy(() => import('./pages/Users/UserList'));
const UserDetails = lazy(() => import('./pages/Users/UserDetails'));
const LicensesDashboard = lazy(() => import('./pages/Licenses/LicensesDashboard'));
const LicenseList = lazy(() => import('./pages/Licenses/LicenseList'));
const LicenseDetails = lazy(() => import('./pages/Licenses/LicenseDetails'));
const LicenseRenewals = lazy(() => import('./pages/Licenses/LicenseRenewals'));
const LicenseOptimization = lazy(() => import('./pages/Licenses/LicenseOptimization'));
const MicrosoftLicenses = lazy(() => import('./pages/Licenses/MicrosoftLicenses'));
const WarrantyDashboard = lazy(() => import('./pages/Warranties/WarrantyDashboard'));
const DepartmentList = lazy(() => import('./pages/Departments/DepartmentList'));
const DepartmentDetails = lazy(() => import('./pages/Departments/DepartmentDetails'));
const AssetGroupList = lazy(() => import('./pages/AssetGroups/AssetGroupList'));
const OnboardingKitList = lazy(() => import('./pages/OnboardingKits/OnboardingKitList'));
const OnboardingKitForm = lazy(() => import('./pages/OnboardingKits/OnboardingKitForm'));
const OnboardingKitDetails = lazy(() => import('./pages/OnboardingKits/OnboardingKitDetails'));
const SpendOverview = lazy(() => import('./pages/Spend/SpendOverview'));
const ComplianceOverview = lazy(() => import('./pages/Compliance/ComplianceOverview'));
const FinancialDashboard = lazy(() => import('./pages/Finance/FinancialDashboard'));
const BudgetTracking = lazy(() => import('./pages/Finance/BudgetTracking'));
const VendorList = lazy(() => import('./pages/Vendors/VendorList'));
const VendorDetails = lazy(() => import('./pages/Vendors/VendorDetails'));
const ContractList = lazy(() => import('./pages/Contracts/ContractList'));
const ContractDetails = lazy(() => import('./pages/Contracts/ContractDetails'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const CustomReportBuilder = lazy(() => import('./pages/Reports/CustomReportBuilder'));
const Settings = lazy(() => import('./pages/Settings/Settings'));

// ITAM Pages - Lazy loaded
const ReceivingPage = lazy(() => import('./pages/ITAM/Receiving/ReceivingPage'));
const StagingPage = lazy(() => import('./pages/ITAM/Staging/StagingPage'));
const LoanersPage = lazy(() => import('./pages/ITAM/Loaners/LoanersPage'));
const WarrantyPage = lazy(() => import('./pages/ITAM/Warranty/WarrantyPage'));
const FinancialsPage = lazy(() => import('./pages/ITAM/Financials/FinancialsPage'));
const ContractRenewalsPage = lazy(() => import('./pages/ITAM/Contracts/ContractRenewalsPage'));
const DiscoveryPage = lazy(() => import('./pages/ITAM/Discovery/DiscoveryPage'));
const StockPage = lazy(() => import('./pages/ITAM/Stock/StockPage'));
const SoftwarePage = lazy(() => import('./pages/ITAM/Software/SoftwarePage'));
const CompliancePage = lazy(() => import('./pages/ITAM/Compliance/CompliancePage'));
const SecurityPage = lazy(() => import('./pages/ITAM/Security/SecurityPage'));
const LocationsPage = lazy(() => import('./pages/ITAM/Locations/LocationsPage'));
const LabelsPage = lazy(() => import('./pages/ITAM/Labels/LabelsPage'));
const WorkflowsPage = lazy(() => import('./pages/ITAM/Workflows/WorkflowsPage'));
const ReportingPage = lazy(() => import('./pages/ITAM/Reporting/ReportingPage'));
const DataQualityPage = lazy(() => import('./pages/ITAM/DataQuality/DataQualityPage'));
const APIsPage = lazy(() => import('./pages/ITAM/APIs/APIsPage'));

// Wrapper component for lazy-loaded routes
const LazyRoute = ({ children }) => (
  <Suspense fallback={<LoadingSpinner fullScreen />}>
    {children}
  </Suspense>
);

// Protected Route wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole) {
    const hasPermission = Array.isArray(requiredRole)
      ? requiredRole.includes(user.role)
      : user.role === requiredRole;

    if (!hasPermission) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

// Public Route wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  // Main App Component
  return (
    <ErrorBoundary>
      <TestDataInitializer />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LazyRoute><Dashboard /></LazyRoute>} />

          {/* Assets */}
          <Route path="assets" element={<LazyRoute><AssetList /></LazyRoute>} />
          <Route path="assets/new" element={<LazyRoute><AssetDetails /></LazyRoute>} />
          <Route
            path="assets/qr-generator"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><BulkQRGenerator /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route path="assets/:id" element={<LazyRoute><AssetDetails /></LazyRoute>} />
          <Route path="assets/:id/edit" element={<LazyRoute><AssetDetails /></LazyRoute>} />

          {/* Asset Groups */}
          <Route
            path="asset-groups"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><AssetGroupList /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="asset-groups/new"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><AssetGroupList /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="asset-groups/:id"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><AssetGroupList /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="asset-groups/:id/edit"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><AssetGroupList /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Users */}
          <Route path="users" element={<LazyRoute><UserList /></LazyRoute>} />
          <Route path="users/new" element={<LazyRoute><UserDetails /></LazyRoute>} />
          <Route path="users/:id" element={<LazyRoute><UserDetails /></LazyRoute>} />
          <Route path="users/:id/edit" element={<LazyRoute><UserDetails /></LazyRoute>} />

          {/* Onboarding Kits */}
          <Route
            path="onboarding-kits"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><OnboardingKitList /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="onboarding-kits/new"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><OnboardingKitForm /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="onboarding-kits/:id"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><OnboardingKitDetails /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="onboarding-kits/:id/edit"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><OnboardingKitForm /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Licenses */}
          <Route
            path="licenses/dashboard"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><LicensesDashboard /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route path="licenses" element={<LazyRoute><LicenseList /></LazyRoute>} />
          <Route path="licenses/new" element={<LazyRoute><LicenseDetails /></LazyRoute>} />
          <Route path="licenses/renewals" element={<LazyRoute><LicenseRenewals /></LazyRoute>} />
          <Route
            path="licenses/optimization"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><LicenseOptimization /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="licenses/microsoft"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><MicrosoftLicenses /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route path="licenses/:id" element={<LazyRoute><LicenseDetails /></LazyRoute>} />
          <Route path="licenses/:id/edit" element={<LazyRoute><LicenseDetails /></LazyRoute>} />

          {/* Warranties */}
          <Route
            path="warranties"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><WarrantyDashboard /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Departments */}
          <Route
            path="departments"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><DepartmentList /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="departments/:id"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><DepartmentDetails /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="departments/:id/edit"
            element={
              <ProtectedRoute requiredRole={['admin']}>
                <LazyRoute><DepartmentList /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Spend & Finance */}
          <Route
            path="spend"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><SpendOverview /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="finance"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><FinancialDashboard /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/budget"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><BudgetTracking /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Receiving */}
          <Route
            path="itam/receiving"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><ReceivingPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Staging */}
          <Route
            path="itam/staging"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><StagingPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Loaners */}
          <Route
            path="itam/loaners"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><LoanersPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Warranty */}
          <Route
            path="itam/warranty"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><WarrantyPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Financials */}
          <Route
            path="itam/financials"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><FinancialsPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Contract Renewals */}
          <Route
            path="itam/contracts/renewals"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><ContractRenewalsPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Discovery & Reconciliation */}
          <Route
            path="itam/discovery"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><DiscoveryPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Stock & Inventory */}
          <Route
            path="itam/stock"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><StockPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Software & Licenses */}
          <Route
            path="itam/software"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><SoftwarePage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Compliance & Audit */}
          <Route
            path="itam/compliance"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><CompliancePage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Security & Risk */}
          <Route
            path="itam/security"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><SecurityPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Locations & Shipping */}
          <Route
            path="itam/locations"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><LocationsPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Labels & Printing */}
          <Route
            path="itam/labels"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><LabelsPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Workflows & Automations */}
          <Route
            path="itam/workflows"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><WorkflowsPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Reporting & BI */}
          <Route
            path="itam/reporting"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><ReportingPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - Data Quality */}
          <Route
            path="itam/data-quality"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><DataQualityPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* ITAM - APIs & Extensibility */}
          <Route
            path="itam/apis"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><APIsPage /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Vendors */}
          <Route
            path="vendors"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><VendorList /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="vendors/new"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><VendorDetails /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="vendors/:id"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><VendorDetails /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="vendors/:id/edit"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><VendorDetails /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Contracts */}
          <Route
            path="contracts"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><ContractList /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="contracts/new"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><ContractDetails /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="contracts/:id"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><ContractDetails /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="contracts/:id/edit"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><ContractDetails /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Compliance & Risk */}
          <Route
            path="compliance"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><ComplianceOverview /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Reports */}
          <Route
            path="reports"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><Reports /></LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="reports/custom"
            element={
              <ProtectedRoute requiredRole={['admin', 'manager']}>
                <LazyRoute><CustomReportBuilder /></LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Settings */}
          <Route
            path="settings"
            element={
              <ProtectedRoute requiredRole="admin">
                <LazyRoute><Settings /></LazyRoute>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
