import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiEye, FiPlus, FiEdit, FiClock, FiCloud, FiUsers } from 'react-icons/fi';
import { licensesAPI } from '../../config/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import SearchBar from '../../components/Common/SearchBar';
import Pagination from '../../components/Common/Pagination';
import Badge, { getStatusVariant } from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import LicenseForm from './LicenseForm';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const LicenseList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const { canManage } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['licenses', page, search, statusFilter],
    queryFn: () => {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      return licensesAPI.getAll(params).then((res) => res.data);
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <LoadingSpinner />;

  const { data: licenses, pagination } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Software & Licenses</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Manage software licenses, subscriptions, and seat allocations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/licenses/dashboard"
            className="btn btn-outline flex items-center gap-2"
          >
            <FiEye size={18} />
            Dashboard
          </Link>
          <Link
            to="/licenses/microsoft"
            className="btn btn-outline flex items-center gap-2"
          >
            <FiCloud size={18} />
            Microsoft 365
          </Link>
          <Link
            to="/licenses/renewals"
            className="btn btn-outline flex items-center gap-2"
          >
            <FiClock size={18} />
            Renewal Timeline
          </Link>
          {canManage && (
            <button
              onClick={() => {
                setEditingLicense(null);
                setShowLicenseModal(true);
              }}
              className="btn btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <FiPlus size={20} />
              Add License
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-1 bg-accent-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-secondary-900">Filter & Search</h3>
            <span className="ml-auto text-sm text-secondary-500">
              {pagination?.totalResults || 0} licenses found
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <SearchBar
                onSearch={setSearch}
                placeholder="Search by name, vendor, type..."
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input bg-white"
              >
                <option value="">📊 All Status</option>
                <option value="active">✅ Active</option>
                <option value="expired">❌ Expired</option>
                <option value="trial">🔄 Trial</option>
              </select>
            </div>
          </div>
          {(search || statusFilter) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-secondary-600">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm">
                  Search: {search}
                  <button onClick={() => setSearch('')} className="hover:text-accent-900">×</button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('')} className="hover:text-accent-900">×</button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-transparent">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary-900">License Inventory</h3>
          <div className="text-sm text-secondary-600">
            Showing {licenses?.length || 0} of {pagination?.totalResults || 0} licenses
          </div>
        </div>
        <div className="space-y-0">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="pb-3 px-4">License Details</th>
                <th className="pb-3 px-4">Type</th>
                <th className="pb-3 px-4">Seats</th>
                <th className="pb-3 px-4">Utilization</th>
                <th className="pb-3 px-4">Expiration</th>
                <th className="pb-3 px-4">Cost</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses?.map((license, index) => {
                const usedSeats = license.assignedUsers?.length || 0;
                const utilization = Math.round(
                  (usedSeats / license.totalSeats) * 100
                );
                const daysUntilExpiry = Math.ceil(
                  (new Date(license.expirationDate) - new Date()) /
                    (1000 * 60 * 60 * 24)
                );

                return (
                  <tr key={license._id} className="table-row-bubble animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                          🔑
                        </div>
                        <div>
                          <div className="font-semibold text-secondary-900">
                            {license.name}
                          </div>
                          <div className="text-sm text-secondary-500">{license.vendor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-mono bg-secondary-50 px-2 py-1 rounded text-secondary-700">
                        {license.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-semibold text-secondary-900">
                        {usedSeats} / {license.totalSeats}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <div className="flex-1 bg-secondary-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              utilization > 80
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : utilization > 50
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold min-w-[40px] ${
                          utilization > 80
                            ? 'text-red-600'
                            : utilization > 50
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}>
                          {utilization}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="text-sm font-medium text-secondary-900">
                          {format(new Date(license.expirationDate), 'MMM dd, yyyy')}
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            daysUntilExpiry < 0
                              ? 'text-red-600'
                              : daysUntilExpiry < 30
                              ? 'text-amber-600'
                              : 'text-secondary-500'
                          }`}
                        >
                          {daysUntilExpiry < 0
                            ? '❌ Expired'
                            : `⏰ ${daysUntilExpiry} days left`}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-bold text-secondary-900">
                        ${license.cost?.toLocaleString() || 'N/A'}
                      </span>
                      <div className="text-xs text-secondary-500">{license.billingCycle || 'annual'}</div>
                    </td>
                    <td>
                      <Badge variant={getStatusVariant(license.status)}>
                        {license.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {canManage && (
                          <button
                            onClick={() => {
                              setEditingLicense(license);
                              setShowLicenseModal(true);
                            }}
                            className="p-2 text-secondary-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit License"
                          >
                            <FiEdit size={18} />
                          </button>
                        )}
                        <Link
                          to={`/licenses/${license._id}`}
                          className="p-2 text-secondary-600 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total > 1 && (
          <Pagination
            currentPage={pagination.current}
            totalPages={pagination.total}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* License Form Modal */}
      {showLicenseModal && (
        <Modal
          isOpen={showLicenseModal}
          onClose={() => {
            setShowLicenseModal(false);
            setEditingLicense(null);
          }}
          title={editingLicense ? 'Edit License' : 'Add New License'}
          size="lg"
        >
          <LicenseForm
            license={editingLicense}
            onClose={() => {
              setShowLicenseModal(false);
              setEditingLicense(null);
            }}
            onSuccess={() => {
              setShowLicenseModal(false);
              setEditingLicense(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default LicenseList;

