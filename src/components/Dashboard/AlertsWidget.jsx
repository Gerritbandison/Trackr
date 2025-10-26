import { useState } from 'react';
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
import Badge from '../Common/Badge';

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
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="card-body text-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-green-600" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">All Clear!</h3>
          <p className="text-sm text-green-700">No active alerts at this time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-gradient-to-r from-red-50 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <FiAlertCircle className="text-red-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">Active Alerts</h3>
            <p className="text-sm text-secondary-600">{visibleAlerts.length} items require attention</p>
          </div>
        </div>
      </div>
      <div className="card-body">
        <div className="space-y-3">
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`group relative p-4 rounded-lg border-2 ${
                alert.type === 'critical'
                  ? 'border-red-200 bg-red-50'
                  : alert.type === 'warning'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-blue-200 bg-blue-50'
              } hover:shadow-md transition-all duration-200`}
            >
              <button
                onClick={() => handleDismiss(alert.id)}
                className="absolute top-2 right-2 p-1 rounded-lg hover:bg-white/50 transition-colors opacity-0 group-hover:opacity-100"
              >
                <FiX size={16} className="text-gray-500" />
              </button>

              <Link to={alert.href} className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    alert.color === 'red'
                      ? 'bg-red-100'
                      : alert.color === 'yellow'
                      ? 'bg-yellow-100'
                      : 'bg-blue-100'
                  }`}
                >
                  <alert.icon
                    className={`${
                      alert.color === 'red'
                        ? 'text-red-600'
                        : alert.color === 'yellow'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}
                    size={20}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{alert.title}</h4>
                    <Badge
                      variant={alert.type === 'critical' ? 'danger' : alert.type === 'warning' ? 'warning' : 'info'}
                      text={alert.count.toString()}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
                <FiChevronRight className="text-gray-400 group-hover:text-gray-600 transition-colors" size={20} />
              </Link>
            </div>
          ))}
        </div>

        {visibleAlerts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link
              to="/alerts"
              className="flex items-center justify-center gap-2 text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors"
            >
              View All Alerts
              <FiChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsWidget;

