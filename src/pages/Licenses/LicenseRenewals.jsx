import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiKey, FiClock, FiCheckCircle, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import { licensesAPI } from '../../config/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge from '../../components/Common/Badge';

const LicenseRenewals = () => {
  // Fetch all licenses
  const { data, isLoading } = useQuery({
    queryKey: ['licenses-renewals'],
    queryFn: () => licensesAPI.getAll({ limit: 1000 }).then((res) => res.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const licenses = data?.data || [];

  // Categorize licenses by renewal timeline
  const now = new Date();
  const overdue = [];
  const next7Days = [];
  const next30Days = [];
  const next90Days = [];
  const later = [];

  licenses.forEach((license) => {
    if (!license.expirationDate) {
      later.push(license);
      return;
    }

    const expiryDate = new Date(license.expirationDate);
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      overdue.push(license);
    } else if (daysUntilExpiry <= 7) {
      next7Days.push(license);
    } else if (daysUntilExpiry <= 30) {
      next30Days.push(license);
    } else if (daysUntilExpiry <= 90) {
      next90Days.push(license);
    } else {
      later.push(license);
    }
  });

  const columns = [
    { title: 'Overdue', items: overdue, color: 'red', icon: FiAlertCircle },
    { title: 'Next 7 Days', items: next7Days, color: 'orange', icon: FiClock },
    { title: 'Next 30 Days', items: next30Days, color: 'yellow', icon: FiCalendar },
    { title: 'Next 90 Days', items: next90Days, color: 'blue', icon: FiCheckCircle },
    { title: 'Later', items: later, color: 'gray', icon: FiKey },
  ];

  const getColorClasses = (color) => {
    const classes = {
      red: 'bg-red-50 border-red-200 text-red-900',
      orange: 'bg-orange-50 border-orange-200 text-orange-900',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      gray: 'bg-gray-50 border-gray-200 text-gray-900',
    };
    return classes[color] || classes.gray;
  };

  const getHeaderClasses = (color) => {
    const classes = {
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return classes[color] || classes.gray;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">License Renewals Timeline</h1>
        <p className="text-secondary-600 mt-2 text-lg">
          Kanban board view of upcoming license renewals
        </p>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {columns.map((column) => (
          <div key={column.title} className="flex-shrink-0 w-80">
            {/* Column Header */}
            <div className={`rounded-t-lg p-4 ${getHeaderClasses(column.color)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <column.icon size={20} />
                  <h3 className="font-bold text-lg">{column.title}</h3>
                </div>
                <span className="px-2 py-1 bg-white/50 rounded-full text-sm font-semibold">
                  {column.items.length}
                </span>
              </div>
            </div>

            {/* Column Body */}
            <div className={`border-x border-b rounded-b-lg p-3 space-y-3 min-h-[600px] ${getColorClasses(column.color)}`}>
              {column.items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <column.icon size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No licenses</p>
                </div>
              ) : (
                column.items.map((license) => {
                  const expiryDate = license.expirationDate ? new Date(license.expirationDate) : null;
                  const daysUntilExpiry = expiryDate
                    ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <Link
                      key={license._id}
                      to={`/licenses/${license._id}`}
                      className="block bg-white rounded-lg p-4 border-2 border-transparent hover:border-primary-400 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 flex-1">{license.name}</h4>
                        {daysUntilExpiry !== null && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            daysUntilExpiry < 0
                              ? 'bg-red-100 text-red-800'
                              : daysUntilExpiry <= 7
                              ? 'bg-orange-100 text-orange-800'
                              : daysUntilExpiry <= 30
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {daysUntilExpiry < 0 ? 'OVERDUE' : `${daysUntilExpiry}d`}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{license.vendor}</p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Seats</span>
                          <span className="font-semibold">
                            {license.assignedUsers?.length || 0}/{license.totalSeats}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Cost</span>
                          <span className="font-semibold text-green-700">
                            ${license.cost}/{license.billingCycle}
                          </span>
                        </div>

                        {expiryDate && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Renewal</span>
                            <span className="font-semibold">
                              {expiryDate.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Badge variant={license.status === 'active' ? 'success' : 'default'}>
                          {license.status}
                        </Badge>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Renewal Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-red-700 font-medium">Overdue</p>
              <p className="text-3xl font-bold text-red-900">{overdue.length}</p>
            </div>
            <div>
              <p className="text-sm text-orange-700 font-medium">Next Week</p>
              <p className="text-3xl font-bold text-orange-900">{next7Days.length}</p>
            </div>
            <div>
              <p className="text-sm text-yellow-700 font-medium">Next Month</p>
              <p className="text-3xl font-bold text-yellow-900">{next30Days.length}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Next Quarter</p>
              <p className="text-3xl font-bold text-blue-900">{next90Days.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">Later</p>
              <p className="text-3xl font-bold text-gray-900">{later.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseRenewals;

