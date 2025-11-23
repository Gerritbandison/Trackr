/**
 * Software & License Management Page
 * 
 * Features:
 * - Software recognition catalog
 * - License entitlement model
 * - True-up reports
 * - SaaS seat optimization
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiPackage,
  FiPlus,
  FiSearch,
  FiKey,
  FiUsers,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
  FiRefreshCw,
  FiSettings,
  FiClock,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import SoftwareForm from '../../../components/ITAM/SoftwareForm';
import LicenseEntitlementView from '../../../components/ITAM/LicenseEntitlementView';
import TrueUpReport from '../../../components/ITAM/TrueUpReport';

const SoftwarePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'licensed', 'unlicensed', 'expiring'
  const [showSoftwareModal, setShowSoftwareModal] = useState(false);
  const [showEntitlementModal, setShowEntitlementModal] = useState(false);
  const [showTrueUpModal, setShowTrueUpModal] = useState(false);
  const [selectedSoftware, setSelectedSoftware] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch software inventory
  const { data: softwareData, isLoading } = useQuery({
    queryKey: ['software', currentPage, searchTerm, filter],
    queryFn: () =>
      itamAPI.software.getAll({
        page: currentPage,
        limit,
        search: searchTerm,
        filter,
      }),
  });

  // Fetch software stats
  const { data: statsData } = useQuery({
    queryKey: ['software-stats'],
    queryFn: () => itamAPI.software.getStats(),
  });

  // Fetch expiring licenses
  const { data: expiringData } = useQuery({
    queryKey: ['expiring-licenses'],
    queryFn: () => itamAPI.software.getExpiring(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      selectedSoftware
        ? itamAPI.software.update(selectedSoftware.id, data)
        : itamAPI.software.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['software']);
      toast.success(selectedSoftware ? 'Software updated' : 'Software added');
      setShowSoftwareModal(false);
      setSelectedSoftware(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save software');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => itamAPI.software.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['software']);
      toast.success('Software deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete software');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const software = softwareData?.data?.data || [];
  const pagination = softwareData?.data?.pagination || {};
  const stats = statsData?.data || {};
  const expiring = expiringData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Software & Licenses
          </h1>
          <p className="text-gray-600 mt-2">
            Manage software inventory, licenses, and entitlements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTrueUpModal(true)}
            className="btn btn-outline flex items-center gap-2 hover:shadow-md transition-shadow"
          >
            <FiTrendingUp />
            True-Up Report
          </button>
          <button
            onClick={() => {
              setSelectedSoftware(null);
              setShowSoftwareModal(true);
            }}
            className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FiPlus />
            Add Software
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Software</div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalSoftware || 0}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiPackage className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Licensed</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.licensed || 0}
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiKey className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Unlicensed</div>
                <div className="text-2xl font-bold text-red-600">
                  {stats.unlicensed || 0}
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <FiAlertCircle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Expiring Soon</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {expiring.length || 0}
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FiClock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Licenses Alert */}
      {expiring.length > 0 && (
        <div className="card border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertCircle className="text-yellow-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Expiring Licenses</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {expiring.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200 hover:border-yellow-300 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 mb-1">{item.name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    Expires: {new Date(item.expirationDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.assignedCount} / {item.totalLicenses} assigned
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card border-2 border-slate-200 hover:border-primary-300 transition-colors">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search software by name, vendor, or version..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm transition-all ${filter === 'all' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('licensed')}
                className={`btn btn-sm transition-all ${filter === 'licensed' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Licensed
              </button>
              <button
                onClick={() => setFilter('unlicensed')}
                className={`btn btn-sm transition-all ${filter === 'unlicensed' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Unlicensed
              </button>
              <button
                onClick={() => setFilter('expiring')}
                className={`btn btn-sm transition-all ${filter === 'expiring' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Expiring
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Software Table */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Software Inventory</h2>
            <div className="text-sm text-gray-600">
              {software.length} item{software.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Software</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Version</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Licenses</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Available</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Expiration</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {software.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-gray-500">
                      <FiPackage className="mx-auto mb-3 text-gray-300" size={48} />
                      <div className="text-lg font-medium">No software found</div>
                      <div className="text-sm mt-1">Add software to get started</div>
                    </td>
                  </tr>
                ) : (
                  software.map((item) => {
                    const available = (item.totalLicenses || 0) - (item.assignedCount || 0);
                    const isExpiring = item.expirationDate && new Date(item.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    const isExpired = item.expirationDate && new Date(item.expirationDate) < new Date();
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.category}</div>
                        </td>
                        <td className="py-3 px-4">{item.vendor}</td>
                        <td className="py-3 px-4 font-mono text-sm">{item.version}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.totalLicenses || 0}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-blue-600">{item.assignedCount || 0}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`font-medium ${available < 0 ? 'text-red-600' : available === 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {available}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {item.expirationDate ? (
                            <div className={`text-sm ${isExpired ? 'text-red-600' : isExpiring ? 'text-yellow-600' : 'text-gray-600'}`}>
                              {new Date(item.expirationDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              available < 0
                                ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200'
                                : available === 0
                                ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
                                : isExpired
                                ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200'
                                : isExpiring
                                ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
                                : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
                            }`}
                          >
                            {available < 0 ? 'Over-licensed' : available === 0 ? 'No Available' : isExpired ? 'Expired' : isExpiring ? 'Expiring' : 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedSoftware(item);
                                setShowEntitlementModal(true);
                              }}
                              className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                            >
                              <FiUsers />
                              Entitlements
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSoftware(item);
                                setShowSoftwareModal(true);
                              }}
                              className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Software Modal */}
      <Modal
        isOpen={showSoftwareModal}
        onClose={() => {
          setShowSoftwareModal(false);
          setSelectedSoftware(null);
        }}
        title={selectedSoftware ? 'Edit Software' : 'Add Software'}
        size="lg"
      >
        <SoftwareForm
          software={selectedSoftware}
          onSuccess={() => {
            setShowSoftwareModal(false);
            setSelectedSoftware(null);
            queryClient.invalidateQueries(['software']);
          }}
          onCancel={() => {
            setShowSoftwareModal(false);
            setSelectedSoftware(null);
          }}
        />
      </Modal>

      {/* Entitlement Modal */}
      <Modal
        isOpen={showEntitlementModal}
        onClose={() => {
          setShowEntitlementModal(false);
          setSelectedSoftware(null);
        }}
        title="License Entitlements"
        size="xl"
      >
        {selectedSoftware && (
          <LicenseEntitlementView
            software={selectedSoftware}
            onClose={() => {
              setShowEntitlementModal(false);
              setSelectedSoftware(null);
            }}
          />
        )}
      </Modal>

      {/* True-Up Report Modal */}
      <Modal
        isOpen={showTrueUpModal}
        onClose={() => setShowTrueUpModal(false)}
        title="True-Up Report"
        size="xl"
      >
        <TrueUpReport onClose={() => setShowTrueUpModal(false)} />
      </Modal>
    </div>
  );
};

export default SoftwarePage;

