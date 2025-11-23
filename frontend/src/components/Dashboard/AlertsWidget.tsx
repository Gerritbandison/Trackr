import { useState } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertCircle,
  FiClock,
  FiShield,
  FiKey,
  FiPackage,
  FiChevronRight,
  FiX,
} from 'react-icons/fi';
import Badge from '../ui/Badge';

const AlertsWidget = () => {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const alerts = [
    {
      id: 1,
      type: 'critical',
      icon: FiShield,
      title: 'Warranty Expiring Soon',
      message: '3 hardware warranties expiring in next 7 days',
      count: 3,
      href: '/warranties',
      color: 'red',
    },
    {
      id: 2,
      type: 'warning',
      icon: FiKey,
      title: 'License Expiration',
      message: '2 software licenses expiring in next 30 days',
      count: 2,
      href: '/licenses/renewals',
      color: 'yellow',
    },
    {
      id: 3,
      type: 'info',
      icon: FiPackage,
      title: 'Low Stock Alert',
      message: '5 asset groups running low on inventory',
      count: 5,
      href: '/asset-groups',
      color: 'blue',
    },
    {
      id: 4,
      type: 'info',
      icon: FiClock,
      title: 'Pending Assignments',
      message: '12 assets waiting to be assigned to users',
      count: 12,
      href: '/assets?status=available',
      color: 'blue',
    },
  ];

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));

  const handleDismiss = (id) => {
    setDismissedAlerts([...dismissedAlerts, id]);
  };

  if (visibleAlerts.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-success-50 via-emerald-50/50 to-white rounded-3xl border-2 border-success-200 shadow-lg">
        <div className="p-8 text-center">
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
            <FiAlertCircle className="text-white" size={36} strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-3xl bg-white/20 animate-pulse"></div>
          </div>
          <h3 className="text-2xl font-bold text-success-900 mb-2">All Clear! ✨</h3>
          <p className="text-sm text-success-700 font-medium">No active alerts at this time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/30 to-white rounded-3xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 via-red-50/30 to-transparent px-6 py-5 border-b-2 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-lg">
              <FiAlertCircle className="text-white" size={22} strokeWidth={2.5} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Active Alerts</h3>
            <p className="text-sm text-slate-600 font-medium">{visibleAlerts.length} items require attention</p>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-6">
        <div className="space-y-4">
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${alert.type === 'critical'
                  ? 'border-red-200 bg-gradient-to-br from-red-50/50 to-red-50/30'
                  : alert.type === 'warning'
                    ? 'border-accent-200 bg-gradient-to-br from-accent-50/50 to-yellow-50/30'
                    : 'border-primary-200 bg-gradient-to-br from-primary-50/50 to-blue-50/30'
                }`}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${alert.type === 'critical'
                  ? 'from-red-600 to-red-700'
                  : alert.type === 'warning'
                    ? 'from-accent-600 to-amber-700'
                    : 'from-primary-600 to-blue-700'
                } opacity-0 group-hover:opacity-5 transition-opacity`}></div>

              {/* Dismiss button */}
              <button
                onClick={() => handleDismiss(alert.id)}
                className="absolute top-3 right-3 p-2 rounded-xl hover:bg-white/70 transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <FiX size={18} className="text-slate-600" strokeWidth={2.5} />
              </button>

              {/* Decorative dot */}
              <div className={`absolute top-4 left-4 w-2 h-2 rounded-full ${alert.type === 'critical'
                  ? 'bg-red-500'
                  : alert.type === 'warning'
                    ? 'bg-accent-500'
                    : 'bg-primary-500'
                } animate-pulse`}></div>

              <Link to={alert.href} className="flex items-start gap-4 p-5">
                {/* Icon */}
                <div
                  className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${alert.color === 'red'
                      ? 'bg-gradient-to-br from-red-600 to-red-700'
                      : alert.color === 'yellow'
                        ? 'bg-gradient-to-br from-accent-600 to-amber-700'
                        : 'bg-gradient-to-br from-primary-600 to-blue-700'
                    }`}
                >
                  {React.createElement(alert.icon, { className: "text-white", size: 22, strokeWidth: 2.5 })}
                  <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${alert.type === 'critical'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : alert.type === 'warning'
                          ? 'bg-accent-100 text-accent-700 border border-accent-200'
                          : 'bg-primary-100 text-primary-700 border border-primary-200'
                      }`}>
                      {alert.count}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">{alert.message}</p>
                </div>

                {/* Arrow */}
                <FiChevronRight className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0" size={20} />
              </Link>
            </div>
          ))}
        </div>

        {/* View All Link */}
        {visibleAlerts.length > 0 && (
          <div className="mt-6 pt-6 border-t-2 border-slate-200">
            <Link
              to="/alerts"
              className="flex items-center justify-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors group/link"
            >
              View All Alerts
              <FiChevronRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsWidget;

