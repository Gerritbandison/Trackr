import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiDollarSign, FiCalendar, FiKey } from 'react-icons/fi';
import { licensesAPI } from '../../config/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge, { getStatusVariant } from '../../components/Common/Badge';
import { format } from 'date-fns';

const LicenseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['license', id],
    queryFn: () => licensesAPI.getById(id).then((res) => res.data.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const license = data;
  const usedSeats = license.assignedUsers?.length || 0;
  const availableSeats = license.totalSeats - usedSeats;
  const utilization = Math.round((usedSeats / license.totalSeats) * 100);

  const daysUntilExpiry = Math.ceil((new Date(license.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/licenses')} className="btn btn-outline mt-1">
            <FiArrowLeft />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white text-2xl shadow-md">
                🔑
              </div>
              <div>
                <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">{license.name}</h1>
                <p className="text-secondary-600 text-lg mt-1">{license.vendor}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-1">
              <Badge variant={getStatusVariant(license.status)}>{license.status}</Badge>
              <Badge variant={license.autoRenew ? 'success' : 'gray'}>
                {license.autoRenew ? '🔄 Auto-Renew' : 'Manual Renewal'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="card bg-gradient-to-r from-accent-50/50 to-transparent">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-secondary-900">Seat Utilization</h3>
            <span className="text-2xl font-bold text-accent-600">{utilization}%</span>
          </div>
          <div className="relative h-4 bg-secondary-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilization > 80
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : utilization > 50
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
              }`}
              style={{ width: `${utilization}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-secondary-600">
              <span className="font-bold text-secondary-900">{usedSeats}</span> seats used
            </span>
            <span className="text-secondary-600">
              <span className="font-bold text-secondary-900">{availableSeats}</span> available
            </span>
            <span className="text-secondary-600">
              <span className="font-bold text-secondary-900">{license.totalSeats}</span> total
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiDollarSign className="text-emerald-600" size={16} />
                  <span className="text-xs text-secondary-500 uppercase font-semibold">Cost</span>
                </div>
                <p className="font-bold text-secondary-900 text-lg">
                  ${license.cost?.toLocaleString() || 'N/A'}
                </p>
                <p className="text-xs text-secondary-500 capitalize">{license.billingCycle || 'annual'}</p>
              </div>
            </div>
            <div className="card hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiUsers className="text-blue-600" size={16} />
                  <span className="text-xs text-secondary-500 uppercase font-semibold">Users</span>
                </div>
                <p className="font-bold text-secondary-900 text-lg">{usedSeats}</p>
                <p className="text-xs text-secondary-500">of {license.totalSeats} seats</p>
              </div>
            </div>
            <div className="card hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiCalendar className={daysUntilExpiry < 30 ? 'text-red-600' : 'text-amber-600'} size={16} />
                  <span className="text-xs text-secondary-500 uppercase font-semibold">Expires</span>
                </div>
                <p className={`font-bold text-lg ${daysUntilExpiry < 0 ? 'text-red-600' : daysUntilExpiry < 30 ? 'text-amber-600' : 'text-secondary-900'}`}>
                  {daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry}d`}
                </p>
                <p className="text-xs text-secondary-500">{format(new Date(license.expirationDate), 'MMM dd, yyyy')}</p>
              </div>
            </div>
            <div className="card hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiKey className="text-accent-600" size={16} />
                  <span className="text-xs text-secondary-500 uppercase font-semibold">Type</span>
                </div>
                <p className="font-bold text-secondary-900">{license.type}</p>
              </div>
            </div>
          </div>

          {/* License Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-secondary-900">License Details</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">License Key</p>
                  <p className="font-mono text-sm font-semibold text-secondary-900 bg-secondary-50 px-3 py-2 rounded-lg">
                    {license.licenseKey || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Department</p>
                  <p className="font-semibold text-secondary-900">
                    {license.department?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Purchase Date</p>
                  <p className="font-semibold text-secondary-900">
                    {license.purchaseDate ? format(new Date(license.purchaseDate), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Renewal Date</p>
                  <p className="font-semibold text-secondary-900">
                    {license.renewalDate ? format(new Date(license.renewalDate), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-secondary-900">Assigned Users</h3>
              <p className="text-sm text-secondary-500 mt-1">{usedSeats} out of {license.totalSeats} seats in use</p>
            </div>
            <div className="card-body">
              {license.assignedUsers && license.assignedUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {license.assignedUsers.map((user, index) => (
                    <Link
                      key={user._id}
                      to={`/users/${user._id}`}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-secondary-50 to-transparent rounded-lg hover:shadow-md hover:from-accent-50 transition-all group border border-transparent hover:border-accent-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-110 transition-transform">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-secondary-900 group-hover:text-accent-600 transition-colors">{user.name}</div>
                        <div className="text-sm text-secondary-500">{user.email}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FiUsers className="mx-auto text-secondary-300 mb-3" size={48} />
                  <p className="text-secondary-500 font-medium">No users assigned yet</p>
                  <p className="text-sm text-secondary-400 mt-1">{license.totalSeats} seats available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Seat Utilization</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Used</span>
                  <span className="text-sm font-medium">{usedSeats}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="text-sm font-medium">{availableSeats}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-sm font-medium">{license.totalSeats}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      utilization > 80
                        ? 'bg-red-600'
                        : utilization > 50
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>
                <p className="text-center text-sm font-medium mt-2">
                  {utilization}% Utilized
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseDetails;

