import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiPackage,
  FiUsers,
  FiKey,
  FiQrCode,
  FiDownload,
  FiPrinter,
  FiFileText,
  FiBell,
  FiRefreshCw,
} from 'react-icons/fi';

const QuickActions = () => {
  const actions = [
    {
      icon: FiPlus,
      label: 'Add Asset',
      color: 'from-blue-500 to-blue-600',
      href: '/assets/new',
      description: 'Create new hardware asset',
    },
    {
      icon: FiUsers,
      label: 'Add User',
      color: 'from-green-500 to-green-600',
      href: '/users/new',
      description: 'Register new user',
    },
    {
      icon: FiKey,
      label: 'Add License',
      color: 'from-purple-500 to-purple-600',
      href: '/licenses/new',
      description: 'Add software license',
    },
    {
      icon: FiQrCode,
      label: 'Generate QR',
      color: 'from-orange-500 to-orange-600',
      href: '/assets/qr-generator',
      description: 'Bulk QR code generation',
    },
    {
      icon: FiDownload,
      label: 'Export Data',
      color: 'from-indigo-500 to-indigo-600',
      href: '/reports',
      description: 'Export to CSV/PDF',
    },
    {
      icon: FiBell,
      label: 'Alerts',
      color: 'from-red-500 to-red-600',
      href: '#',
      description: 'View all alerts',
      badge: 3,
    },
  ];

  return (
    <div className="card">
      <div className="card-header bg-gradient-to-r from-accent-50 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
            <FiRefreshCw className="text-accent-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">Quick Actions</h3>
            <p className="text-sm text-secondary-600">Frequently used operations</p>
          </div>
        </div>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="group relative p-4 rounded-xl border-2 border-gray-200 hover:border-accent-300 bg-white hover:bg-gradient-to-br hover:from-accent-50 hover:to-transparent transition-all duration-200 hover:shadow-md"
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-accent-700 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                </div>
                {action.badge && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {action.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;

