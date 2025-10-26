import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import AssetList from './pages/Assets/AssetList';
import AssetDetails from './pages/Assets/AssetDetails';
import BulkQRGenerator from './pages/Assets/BulkQRGenerator';
import UserList from './pages/Users/UserList';
import UserDetails from './pages/Users/UserDetails';
import LicensesDashboard from './pages/Licenses/LicensesDashboard';
import LicenseList from './pages/Licenses/LicenseList';
import LicenseDetails from './pages/Licenses/LicenseDetails';
import LicenseRenewals from './pages/Licenses/LicenseRenewals';
import LicenseOptimization from './pages/Licenses/LicenseOptimization';
import MicrosoftLicenses from './pages/Licenses/MicrosoftLicenses';
import WarrantyDashboard from './pages/Warranties/WarrantyDashboard';
import DepartmentList from './pages/Departments/DepartmentList';
import DepartmentDetails from './pages/Departments/DepartmentDetails';
import AssetGroupList from './pages/AssetGroups/AssetGroupList';
import OnboardingKitList from './pages/OnboardingKits/OnboardingKitList';
import OnboardingKitForm from './pages/OnboardingKits/OnboardingKitForm';
import OnboardingKitDetails from './pages/OnboardingKits/OnboardingKitDetails';
import SpendOverview from './pages/Spend/SpendOverview';
import ComplianceOverview from './pages/Compliance/ComplianceOverview';
import FinancialDashboard from './pages/Finance/FinancialDashboard';
import Reports from './pages/Reports/Reports';
import CustomReportBuilder from './pages/Reports/CustomReportBuilder';
import Settings from './pages/Settings/Settings';
import LoadingSpinner from './components/Common/LoadingSpinner';

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
  return (
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
        <Route index element={<Dashboard />} />
        
        {/* Assets */}
        <Route path="assets" element={<AssetList />} />
        <Route path="assets/new" element={<AssetDetails />} />
        <Route
          path="assets/qr-generator"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <BulkQRGenerator />
            </ProtectedRoute>
          }
        />
        <Route path="assets/:id" element={<AssetDetails />} />
        <Route path="assets/:id/edit" element={<AssetDetails />} />
        
        {/* Asset Groups */}
        <Route
          path="asset-groups"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <AssetGroupList />
            </ProtectedRoute>
          }
        />
        <Route
          path="asset-groups/new"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <AssetGroupList />
            </ProtectedRoute>
          }
        />
        <Route
          path="asset-groups/:id"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <AssetGroupList />
            </ProtectedRoute>
          }
        />
        
        {/* Users */}
        <Route path="users" element={<UserList />} />
        <Route path="users/new" element={<UserDetails />} />
        <Route path="users/:id" element={<UserDetails />} />
        <Route path="users/:id/edit" element={<UserDetails />} />
        
        {/* Onboarding Kits */}
        <Route
          path="onboarding-kits"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <OnboardingKitList />
            </ProtectedRoute>
          }
        />
        <Route
          path="onboarding-kits/new"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <OnboardingKitForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="onboarding-kits/:id"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <OnboardingKitDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="onboarding-kits/:id/edit"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <OnboardingKitForm />
            </ProtectedRoute>
          }
        />
        
        {/* Licenses */}
        <Route
          path="licenses/dashboard"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <LicensesDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="licenses" element={<LicenseList />} />
        <Route path="licenses/new" element={<LicenseDetails />} />
        <Route path="licenses/renewals" element={<LicenseRenewals />} />
        <Route
          path="licenses/optimization"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <LicenseOptimization />
            </ProtectedRoute>
          }
        />
        <Route
          path="licenses/microsoft"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <MicrosoftLicenses />
            </ProtectedRoute>
          }
        />
        <Route path="licenses/:id" element={<LicenseDetails />} />
        <Route path="licenses/:id/edit" element={<LicenseDetails />} />
        
        {/* Warranties */}
        <Route
          path="warranties"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <WarrantyDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Departments */}
        <Route
          path="departments"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <DepartmentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="departments/:id"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <DepartmentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="departments/:id/edit"
          element={
            <ProtectedRoute requiredRole={['admin']}>
              <DepartmentList />
            </ProtectedRoute>
          }
        />
        
        {/* Spend & Finance */}
        <Route
          path="spend"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <SpendOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <FinancialDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Compliance & Risk */}
        <Route
          path="compliance"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <ComplianceOverview />
            </ProtectedRoute>
          }
        />
        
        {/* Reports */}
        <Route
          path="reports"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/custom"
          element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
              <CustomReportBuilder />
            </ProtectedRoute>
          }
        />
        
        {/* Settings */}
        <Route
          path="settings"
          element={
            <ProtectedRoute requiredRole="admin">
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

