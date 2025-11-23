import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import KeyboardShortcutsHelp from '../ui/KeyboardShortcutsHelp';

const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-gray-50">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link focus:top-0">
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        <Header onToggleSidebar={toggleMobileSidebar} />
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100"
          tabIndex={-1}
        >
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />
    </div>
  );
};

export default Layout;

