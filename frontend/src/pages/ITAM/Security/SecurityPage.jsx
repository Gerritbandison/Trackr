/**
 * Security & Risk Page
 * 
 * Features:
 * - Health fields (EDR status, Patch ring, BitLocker/FileVault)
 * - Automations (offboarding workflows, compliance blocking)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiDownload,
  FiSettings,
  FiActivity,
  FiLock,
  FiServer,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import SecurityHealthView from '../../../components/ITAM/SecurityHealthView';
import OffboardingWorkflow from '../../../components/ITAM/OffboardingWorkflow';

const SecurityPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'compliant', 'non-compliant', 'at-risk'
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showOffboardingModal, setShowOffboardingModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch non-compliant assets
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['non-compliant-assets', currentPage, searchTerm, filter],
    queryFn: () =>
      itamAPI.security.getNonCompliant({
        page: currentPage,
        limit,
        search: searchTerm,
        filter,
      }),
  });

  // Fetch security stats
  const { data: statsData } = useQuery({
    queryKey: ['security-stats'],
    queryFn: () => itamAPI.security.getStats(),
  });

  // Fetch at-risk assets
  const { data: atRiskData } = useQuery({
    queryKey: ['at-risk-assets'],
    queryFn: () => itamAPI.security.getAtRisk(),
  });

  // Refresh security status mutation
  const refreshMutation = useMutation({
    mutationFn: (id) => itamAPI.security.refreshStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['non-compliant-assets']);
      queryClient.invalidateQueries(['security-stats']);
      toast.success('Security status refreshed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to refresh status');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const assets = assetsData?.data?.data || [];
  const pagination = assetsData?.data?.pagination || {};
  const stats = statsData?.data || {};
  const atRisk = atRiskData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Security & Risk
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor security health, compliance, and automated workflows
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOffboardingModal(true)}
            className="btn btn-outline flex items-center gap-2 hover:shadow-md transition-shadow"
          >
            <FiSettings />
            Offboarding Workflow
          </button>
          <button
            onClick={() => {
              refreshMutation.mutate();
              queryClient.invalidateQueries(['non-compliant-assets']);
            }}
            className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FiRefreshCw />
            Refresh All
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Compliant Assets</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.compliant || 0}
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiCheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Non-Compliant</div>
                <div className="text-2xl font-bold text-red-600">
                  {stats.nonCompliant || 0}
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <FiXCircle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">At Risk</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {atRisk.length || 0}
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FiAlertTriangle className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Compliance Rate</div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.complianceRate ? `${stats.complianceRate}%` : '0%'}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiShield className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* At-Risk Assets Alert */}
      {atRisk.length > 0 && (
        <div className="card border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertTriangle className="text-yellow-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">At-Risk Assets</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {atRisk.slice(0, 6).map((asset) => (
                <div
                  key={asset.id}
                  className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200 hover:border-yellow-300 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 mb-1">{asset.assetTag}</div>
                  <div className="text-sm text-gray-600 mb-2">{asset.model}</div>
                  <div className="flex items-center gap-2 mb-2">
                    {asset.health?.edrStatus !== 'healthy' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        EDR: {asset.health?.edrStatus || 'Unknown'}
                      </span>
                    )}
                    {asset.health?.encryptionStatus !== 'enabled' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Encryption: {asset.health?.encryptionStatus || 'Disabled'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAsset(asset);
                      setShowHealthModal(true);
                    }}
                    className="btn btn-sm btn-primary w-full shadow-md hover:shadow-lg transition-shadow"
                  >
                    View Details
                  </button>
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
              placeholder="Search assets..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm transition-all ${filter === 'all' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('compliant')}
                className={`btn btn-sm transition-all ${filter === 'compliant' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Compliant
              </button>
              <button
                onClick={() => setFilter('non-compliant')}
                className={`btn btn-sm transition-all ${filter === 'non-compliant' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Non-Compliant
              </button>
              <button
                onClick={() => setFilter('at-risk')}
                className={`btn btn-sm transition-all ${filter === 'at-risk' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                At Risk
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Security Status</h2>
            <div className="text-sm text-gray-600">
              {assets.length} asset{assets.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Asset Tag</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Model</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">EDR Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Patch Ring</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Encryption</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Check</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Compliance</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      <FiShield className="mx-auto mb-3 text-gray-300" size={48} />
                      <div className="text-lg font-medium">No assets found</div>
                      <div className="text-sm mt-1">All assets are compliant</div>
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => {
                    const isCompliant = asset.health?.isCompliant;
                    const isAtRisk = asset.health?.isAtRisk;
                    
                    return (
                      <tr key={asset.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{asset.assetTag}</div>
                          <div className="text-sm text-gray-500">{asset.serialNumber}</div>
                        </td>
                        <td className="py-3 px-4">{asset.model || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              asset.health?.edrStatus === 'healthy'
                                ? 'bg-green-100 text-green-800'
                                : asset.health?.edrStatus === 'unhealthy'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {asset.health?.edrStatus || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {asset.health?.patchRing || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              asset.health?.encryptionStatus === 'enabled'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {asset.health?.encryptionStatus === 'enabled' ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600">
                            {asset.health?.lastCheck
                              ? new Date(asset.health.lastCheck).toLocaleDateString()
                              : 'Never'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              isCompliant
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
                                : isAtRisk
                                ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
                                : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200'
                            }`}
                          >
                            {isCompliant ? 'Compliant' : isAtRisk ? 'At Risk' : 'Non-Compliant'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowHealthModal(true);
                              }}
                              className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                            >
                              <FiActivity />
                              View
                            </button>
                            <button
                              onClick={() => refreshMutation.mutate(asset.id)}
                              className="btn btn-sm btn-primary shadow-md hover:shadow-lg transition-shadow"
                            >
                              <FiRefreshCw />
                              Refresh
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

      {/* Security Health Modal */}
      <Modal
        isOpen={showHealthModal}
        onClose={() => {
          setShowHealthModal(false);
          setSelectedAsset(null);
        }}
        title="Security Health Details"
        size="lg"
      >
        {selectedAsset && (
          <SecurityHealthView
            asset={selectedAsset}
            onClose={() => {
              setShowHealthModal(false);
              setSelectedAsset(null);
            }}
          />
        )}
      </Modal>

      {/* Offboarding Workflow Modal */}
      <Modal
        isOpen={showOffboardingModal}
        onClose={() => setShowOffboardingModal(false)}
        title="Offboarding Workflow"
        size="xl"
      >
        <OffboardingWorkflow onClose={() => setShowOffboardingModal(false)} />
      </Modal>
    </div>
  );
};

export default SecurityPage;

