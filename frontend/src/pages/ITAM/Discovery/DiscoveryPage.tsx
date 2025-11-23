/**
 * Discovery & Reconciliation Page
 * 
 * Features:
 * - Discovery source configuration
 * - Reconciliation UI
 * - Conflict resolution
 * - Orphaned asset detection
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiSettings,
  FiDownload,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import DiscoverySourceConfig from '../../../components/ITAM/DiscoverySourceConfig';
import ReconciliationResults from '../../../components/ITAM/ReconciliationResults';

const DiscoveryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'matched', 'unmatched', 'conflicts', 'orphaned'
  const [selectedSource, setSelectedSource] = useState(null);
  const [showSourceConfig, setShowSourceConfig] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch discovery sources
  const { data: sourcesData } = useQuery({
    queryKey: ['discovery-sources'],
    queryFn: () => itamAPI.discovery.getSources(),
  });

  // Fetch discovery records
  const { data: recordsData, isLoading } = useQuery({
    queryKey: ['discovery-records', currentPage, searchTerm, filter],
    queryFn: () =>
      itamAPI.discovery.getRecords({
        page: currentPage,
        limit,
        search: searchTerm,
        filter,
      }),
  });

  // Fetch orphaned assets
  const { data: orphanedData } = useQuery({
    queryKey: ['orphaned-assets'],
    queryFn: () => itamAPI.discovery.getOrphaned(),
  });

  // Fetch conflicts
  const { data: conflictsData } = useQuery({
    queryKey: ['discovery-conflicts'],
    queryFn: () => itamAPI.discovery.getConflicts(),
  });

  // Trigger sync mutation
  const syncMutation = useMutation({
    mutationFn: (source) => itamAPI.discovery.triggerSync(source),
    onSuccess: () => {
      queryClient.invalidateQueries(['discovery-records']);
      toast.success('Discovery sync triggered');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to trigger sync');
    },
  });

  // Reconcile mutation
  const reconcileMutation = useMutation({
    mutationFn: (data) => itamAPI.discovery.reconcile(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries(['discovery-records']);
      queryClient.invalidateQueries(['assets']);
      toast.success(
        `Reconciliation complete: ${result.data.matched} matched, ${result.data.unmatched} unmatched`
      );
      setShowReconcile(true);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reconcile');
    },
  });

  const handleSync = (source) => {
    if (window.confirm(`Trigger sync for ${source}?`)) {
      syncMutation.mutate(source);
    }
  };

  const handleReconcile = () => {
    if (window.confirm('Start reconciliation? This may take a few moments.')) {
      // Ensure sources is an array before mapping
      const sourcesArray = Array.isArray(sourcesData?.data) ? sourcesData.data : [];
      reconcileMutation.mutate({
        sources: sourcesArray.map((s) => (typeof s === 'string' ? s : s.name)) || [],
        autoMatch: true,
        createNewAssets: false,
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Ensure sources is always an array
  const sources = Array.isArray(sourcesData?.data) ? sourcesData.data : (sourcesData?.data ? [sourcesData.data] : []);
  const records = recordsData?.data?.data || [];
  const pagination = recordsData?.data?.pagination || {};
  const orphaned = orphanedData?.data || [];
  const conflicts = conflictsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Discovery & Reconciliation</h1>
          <p className="text-gray-600 mt-2">
            Sync assets from discovery sources and reconcile inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSourceConfig(true)}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiSettings />
            Sources
          </button>
          <button
            onClick={handleReconcile}
            disabled={reconcileMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiRefreshCw className={reconcileMutation.isPending ? 'animate-spin' : ''} />
            Reconcile
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="text-sm text-gray-600 mb-1">Discovery Sources</div>
            <div className="text-2xl font-bold text-gray-900">{sources.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-sm text-gray-600 mb-1">Unmatched Records</div>
            <div className="text-2xl font-bold text-yellow-600">
              {records.filter((r) => !r.globalAssetId).length}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-sm text-gray-600 mb-1">Conflicts</div>
            <div className="text-2xl font-bold text-red-600">{conflicts.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="text-sm text-gray-600 mb-1">Orphaned Assets</div>
            <div className="text-2xl font-bold text-orange-600">{orphaned.length}</div>
          </div>
        </div>
      </div>

      {/* Discovery Sources */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Discovery Sources</h3>
            <button
              onClick={() => setShowSourceConfig(true)}
              className="btn btn-sm btn-outline"
            >
              Configure
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sources.map((source) => (
              <div
                key={source.name}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{source.name}</div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      source.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {source.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Last sync: {source.lastSync ? format(new Date(source.lastSync), 'MMM dd, HH:mm') : 'Never'}
                </div>
                <button
                  onClick={() => handleSync(source.name)}
                  disabled={syncMutation.isPending || !source.enabled}
                  className="btn btn-sm btn-primary w-full"
                >
                  <FiRefreshCw className={syncMutation.isPending ? 'animate-spin' : ''} />
                  Sync Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Discovery Records */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4 mb-4">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search discovery records..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('matched')}
                className={`btn btn-sm ${filter === 'matched' ? 'btn-primary' : 'btn-outline'}`}
              >
                Matched
              </button>
              <button
                onClick={() => setFilter('unmatched')}
                className={`btn btn-sm ${filter === 'unmatched' ? 'btn-primary' : 'btn-outline'}`}
              >
                Unmatched
              </button>
              <button
                onClick={() => setFilter('conflicts')}
                className={`btn btn-sm ${filter === 'conflicts' ? 'btn-primary' : 'btn-outline'}`}
              >
                Conflicts
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Device ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Serial Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Matched Asset</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Seen</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No discovery records found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{record.source}</td>
                      <td className="py-3 px-4 font-mono text-sm">{record.deviceId}</td>
                      <td className="py-3 px-4">{record.serialNumber || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {record.globalAssetId ? (
                          <span className="text-primary-600 font-medium">{record.globalAssetId}</span>
                        ) : (
                          <span className="text-gray-400">Not matched</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {record.lastSeen ? format(new Date(record.lastSeen), 'MMM dd, HH:mm') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        {record.globalAssetId ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Matched
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Unmatched
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {!record.globalAssetId && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              // Manual match dialog
                            }}
                          >
                            Match
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
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

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="card border-l-4 border-red-500">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertCircle className="text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Conflicts</h3>
            </div>
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="font-medium text-gray-900 mb-2">{conflict.assetId}</div>
                  <div className="text-sm text-gray-600">{conflict.conflict}</div>
                  {conflict.resolution && (
                    <div className="mt-2 text-sm text-green-600">
                      Resolution: {conflict.resolution}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Source Config Modal */}
      <Modal
        isOpen={showSourceConfig}
        onClose={() => setShowSourceConfig(false)}
        title="Discovery Source Configuration"
      >
        <DiscoverySourceConfig
          sources={sources}
          onSuccess={() => {
            setShowSourceConfig(false);
            queryClient.invalidateQueries(['discovery-sources']);
          }}
        />
      </Modal>

      {/* Reconciliation Results Modal */}
      <Modal
        isOpen={showReconcile}
        onClose={() => setShowReconcile(false)}
        title="Reconciliation Results"
      >
        <ReconciliationResults
          result={reconcileMutation.data?.data}
          onClose={() => setShowReconcile(false)}
        />
      </Modal>
    </div>
  );
};

export default DiscoveryPage;

