import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiBell, FiLogOut, FiUser, FiChevronDown, FiMenu } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsAPI } from '../../config/api';
import NotificationPanel from '../ui/NotificationPanel';
import GlobalSearch from '../ui/GlobalSearch';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Fetch unread notification count
  const { data: notificationData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsAPI.getAll({ unreadOnly: true }).then((res) => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = notificationData?.unreadCount || 0;

  return (
    <header className="h-18 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 backdrop-blur-md border-b-2 border-slate-200 flex items-center gap-6 px-8 shadow-soft sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2.5 hover:bg-slate-100 rounded-xl transition-all hover:scale-105"
      >
        <FiMenu size={22} className="text-slate-700" />
      </button>

      {/* Welcome Message */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-xs text-slate-500">Here's what's happening today</p>
          </div>
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-success-50 to-success-100 border-2 border-success-200 text-success-700 rounded-full text-xs font-bold shadow-sm">
          <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse shadow-sm"></span>
          {user?.role?.toUpperCase()}
        </span>
      </div>

      {/* Global Search - Import this component */}
      <GlobalSearch />

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          onClick={() => setShowNotifications(true)}
          className="relative p-3 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all group border-2 border-transparent hover:border-primary-200"
        >
          <FiBell size={22} className="group-hover:scale-110 group-hover:rotate-3 transition-all duration-200" strokeWidth={2} />
          {unreadCount > 0 && (
            <>
              <span className="absolute top-1.5 right-1.5 px-1.5 min-w-[20px] h-[20px] bg-gradient-to-r from-red-500 to-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            </>
          )}
        </button>

        {/* Notification Panel */}
        <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-2xl transition-all border-2 border-transparent hover:border-slate-200 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-accent-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-all duration-200">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-600 capitalize font-medium">{user?.role}</p>
            </div>
            <FiChevronDown size={18} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />

              {/* Dropdown */}
              <div className="absolute right-0 mt-3 w-72 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-strong border-2 border-slate-200 py-3 z-20 animate-scale-in">
                <div className="px-5 py-4 border-b-2 border-slate-100 bg-gradient-to-r from-primary-50/30 to-transparent">
                  <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{user?.email}</p>
                  <p className="text-xs text-slate-600 capitalize mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-lg font-semibold text-xs border border-primary-200">
                      {user?.role?.toUpperCase()}
                    </span>
                  </p>
                </div>
                <div className="py-2">
                  <Link
                    to={`/users/${user?._id || ''}`}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium group/item"
                    onClick={() => setShowDropdown(false)}
                  >
                    <FiUser size={18} className="group-hover/item:text-primary-600 transition-colors" />
                    <span>My Profile</span>
                  </Link>
                  <div className="border-t border-slate-100 my-2"></div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors group/item"
                  >
                    <FiLogOut size={18} className="group-hover/item:scale-110 transition-transform" />
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

