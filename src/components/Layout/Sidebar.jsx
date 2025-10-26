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
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }) => {
  const { user, canManage, isAdmin } = useAuth();

  const navItems = [
    { to: '/', icon: FiHome, label: 'Dashboard', show: true },
    { to: '/assets', icon: FiPackage, label: 'Assets', show: true },
    { to: '/asset-groups', icon: FiLayers, label: 'Asset Groups', show: canManage() },
    { to: '/licenses', icon: FiKey, label: 'Licenses', show: true },
    { to: '/warranties', icon: FiShield, label: 'Warranties', show: canManage() },
    { to: '/users', icon: FiUsers, label: 'People', show: true },
    { to: '/onboarding-kits', icon: FiGift, label: 'Onboarding', show: canManage() },
    { to: '/departments', icon: FiGrid, label: 'Departments', show: canManage() },
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
        bg-gradient-to-b from-white to-secondary-50/30
        border-r border-gray-200 flex flex-col shadow-sm
        transition-all duration-300 ease-in-out
        fixed lg:relative h-full z-40
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center flex-shrink-0">
            <FiPackage className="text-white" size={18} />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-secondary-900 leading-tight">
                Trackr ITAM
              </h1>
              <p className="text-[10px] text-secondary-500 leading-none">Asset Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3 mb-3">
            Main Menu
          </div>
        )}
        {navItems.map((item) =>
          item.show ? (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                    : 'text-secondary-700 hover:bg-white hover:shadow-sm'
                }`
              }
              title={collapsed ? item.label : ''}
            >
              {({ isActive }) => (
                <>
                  <div className={`${isActive ? '' : 'group-hover:scale-110'} transition-transform duration-200`}>
                    <item.icon size={20} />
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ) : null
        )}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-xl bg-gradient-to-br from-secondary-50 to-primary-50/30 hover:shadow-md transition-all duration-200 cursor-pointer group`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-secondary-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-secondary-500 capitalize flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {user?.role}
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

