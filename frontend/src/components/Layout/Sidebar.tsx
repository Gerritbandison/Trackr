import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiKey,
  FiGrid,
  FiFileText,
  FiSettings,
  FiLayers,
  FiGift,
  FiDollarSign,
  FiShield,
  FiTrendingUp,
  FiTruck,
  FiFile,
  FiBox,
  FiRefreshCw,
  FiTool,
  FiSearch,
  FiDatabase,
  FiCalendar,
  FiCode,
  FiAlertTriangle,
  FiMapPin,
  FiPrinter,
  FiGitBranch,
  FiBarChart2,
  FiCheckCircle,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  collapsed?: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  to?: string;
  icon?: React.ElementType;
  label: string;
  show: boolean;
  type?: 'divider';
}

interface AuthContextType {
  user: any;
  canManage: () => boolean;
  isAdmin: () => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }) => {
  const { user, canManage, isAdmin } = useAuth() as AuthContextType;

  const navItems: NavItem[] = [
    { to: '/', icon: FiHome, label: 'Dashboard', show: true },
    { to: '/assets', icon: FiPackage, label: 'Assets', show: true },
    { to: '/asset-groups', icon: FiLayers, label: 'Asset Groups', show: canManage() },
    { to: '/licenses', icon: FiKey, label: 'Licenses', show: true },
    { to: '/warranties', icon: FiShield, label: 'Warranties', show: canManage() },
    { to: '/users', icon: FiUsers, label: 'People', show: true },
    { to: '/onboarding-kits', icon: FiGift, label: 'Onboarding', show: canManage() },
    { to: '/departments', icon: FiGrid, label: 'Departments', show: canManage() },

    // ITAM Operations Section
    { type: 'divider', label: 'ITAM Operations', show: canManage() },
    { to: '/itam/receiving', icon: FiBox, label: 'Receiving', show: canManage() },
    { to: '/itam/staging', icon: FiRefreshCw, label: 'Staging', show: canManage() },
    { to: '/itam/loaners', icon: FiPackage, label: 'Loaners', show: canManage() },
    { to: '/itam/warranty', icon: FiTool, label: 'Warranty & Repairs', show: canManage() },
    { to: '/itam/financials', icon: FiDollarSign, label: 'Financials', show: canManage() },
    { to: '/itam/contracts/renewals', icon: FiCalendar, label: 'Contract Renewals', show: canManage() },
    { to: '/itam/discovery', icon: FiSearch, label: 'Discovery', show: canManage() },
    { to: '/itam/stock', icon: FiDatabase, label: 'Stock & Inventory', show: canManage() },
    { to: '/itam/software', icon: FiCode, label: 'Software & Licenses', show: canManage() },
    { to: '/itam/compliance', icon: FiShield, label: 'Compliance & Audit', show: canManage() },
    { to: '/itam/security', icon: FiAlertTriangle, label: 'Security & Risk', show: canManage() },
    { to: '/itam/locations', icon: FiMapPin, label: 'Locations & Shipping', show: canManage() },
    { to: '/itam/labels', icon: FiPrinter, label: 'Labels & Printing', show: canManage() },
    { to: '/itam/workflows', icon: FiGitBranch, label: 'Workflows & Automations', show: canManage() },
    { to: '/itam/reporting', icon: FiBarChart2, label: 'Reporting & BI', show: canManage() },
    { to: '/itam/data-quality', icon: FiCheckCircle, label: 'Data Quality', show: canManage() },
    { to: '/itam/apis', icon: FiCode, label: 'APIs & Extensibility', show: canManage() },

    // Business Operations Section
    { type: 'divider', label: 'Business Operations', show: canManage() },
    { to: '/vendors', icon: FiTruck, label: 'Vendors', show: canManage() },
    { to: '/contracts', icon: FiFile, label: 'Contracts', show: canManage() },
    { to: '/spend', icon: FiDollarSign, label: 'Spend Analytics', show: canManage() },
    { to: '/finance', icon: FiTrendingUp, label: 'Financial Reporting', show: canManage() },
    { to: '/compliance', icon: FiShield, label: 'Compliance', show: canManage() },
    { to: '/reports', icon: FiFileText, label: 'Reports', show: canManage() },
    { to: '/settings', icon: FiSettings, label: 'Settings', show: isAdmin() },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside className={`
        ${collapsed ? 'w-20' : 'w-64'}
        bg-gradient-to-br from-slate-100 via-slate-50 to-white
        border-r-2 border-slate-200 flex flex-col shadow-soft
        transition-all duration-300 ease-in-out
        fixed lg:relative h-full z-40
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-18 flex items-center px-6 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/30">
                <FiPackage className="text-white" size={20} />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-500 rounded-full border-2 border-white"></div>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent leading-tight">
                  Trackr ITAM
                </h1>
                <p className="text-[10px] text-slate-500 font-medium leading-none">Enterprise Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav role="navigation" aria-label="Main navigation" className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {!collapsed && (
            <div className="text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3 mb-3">
              Main Menu
            </div>
          )}
          {navItems.map((item, index) => {
            // Handle divider items
            if (item.type === 'divider') {
              return item.show && !collapsed ? (
                <div key={`divider-${index}`} className="text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3 mb-3 mt-6">
                  {item.label}
                </div>
              ) : null;
            }

            // Handle regular nav items
            return item.show ? (
              <NavLink
                key={item.to}
                to={item.to!}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-2xl font-semibold transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30 scale-[1.02]'
                    : 'text-slate-700 hover:bg-white hover:shadow-md hover:text-primary-600'
                  }`
                }
                title={collapsed ? item.label : ''}
              >
                {({ isActive }) => (
                  <>
                    <div className={`${isActive ? '' : 'group-hover:scale-110 group-hover:rotate-3'} transition-all duration-200`}>
                      {item.icon && <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />}
                    </div>
                    {!collapsed && (
                      <>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {isActive && (
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.15s' }}></div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            ) : null;
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3.5 rounded-2xl bg-gradient-to-br from-primary-50/50 via-cyan-50/30 to-white hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 border-transparent hover:border-primary-200`}>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-200 flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-white shadow-md">
                <div className="w-full h-full rounded-full bg-success-400 animate-ping"></div>
              </div>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-600 capitalize flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-success-500 shadow-sm"></span>
                  <span className="truncate">{user?.role}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

