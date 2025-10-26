import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiBell, FiLogOut, FiUser, FiChevronDown, FiMenu } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsAPI } from '../../config/api';
import NotificationPanel from '../Common/NotificationPanel';
import GlobalSearch from '../Common/GlobalSearch';

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch unread notification count
  const { data: notificationData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsAPI.getAll({ unreadOnly: true }).then((res) => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = notificationData?.unreadCount || 0;

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/80 flex items-center gap-6 px-6 shadow-sm sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FiMenu size={20} />
      </button>

      {/* Welcome Message */}
      <div className="hidden lg:flex items-center gap-3">
        <h2 className="text-lg font-bold text-secondary-900">
          Welcome, {user?.name?.split(' ')[0]} 👋
        </h2>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          {user?.role}
        </span>
      </div>

      {/* Global Search - Import this component */}
      <GlobalSearch />

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button 
          onClick={() => setShowNotifications(true)}
          className="relative p-2.5 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all group"
        >
          <FiBell size={20} className="group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <>
              <span className="absolute top-1.5 right-1.5 px-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            </>
          )}
        </button>

        {/* Notification Panel */}
        <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-3 py-2 text-secondary-700 hover:bg-secondary-50 rounded-xl transition-all border border-transparent hover:border-secondary-200"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold shadow-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-secondary-900 leading-tight">{user?.name}</p>
              <p className="text-xs text-secondary-500 capitalize">{user?.role}</p>
            </div>
            <FiChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />

              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-strong border border-gray-100 py-2 z-20 animate-scale-in">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-secondary-900">{user?.name}</p>
                  <p className="text-xs text-secondary-500">{user?.email}</p>
                  <p className="text-xs text-secondary-500 capitalize mt-1">
                    Role: <span className="font-semibold text-primary-600">{user?.role}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    /* Navigate to profile */
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                >
                  <FiUser size={16} />
                  <span className="font-medium">My Profile</span>
                </button>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                  >
                    <FiLogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

