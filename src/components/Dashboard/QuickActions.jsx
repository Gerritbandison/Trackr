import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiPackage,
  FiUsers,
  FiKey,
  FiDownload,
  FiPrinter,
  FiFileText,
  FiBell,
  FiRefreshCw,
  FiGrid,
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
      icon: FiGrid,
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
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/30 to-white rounded-3xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 via-cyan-50/30 to-transparent px-6 py-5 border-b-2 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shadow-lg">
              <FiRefreshCw className="text-white" size={22} strokeWidth={2.5} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Quick Actions</h3>
            <p className="text-sm text-slate-600 font-medium">Frequently used operations</p>
          </div>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50/30 p-5 rounded-2xl border-2 border-slate-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              {/* Decorative dot */}
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-slate-300 group-hover:bg-primary-500 transition-colors"></div>
              
              {action.badge && (
                <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-xs flex items-center justify-center font-bold shadow-lg z-10 animate-pulse">
                  {action.badge}
                </span>
              )}

              <div className="relative flex flex-col items-center text-center gap-3">
                {/* Icon */}
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <action.icon className="text-white" size={24} strokeWidth={2.5} />
                  <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {/* Label and Description */}
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-sm text-slate-900 group-hover:text-primary-700 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;

