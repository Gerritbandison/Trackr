/**
 * Data Quality & Normalization Page
 * 
 * Features:
 * - Normalization catalogs
 * - Guardrails (regex, picklists, required rules)
 * - Drift monitors
 * - Duplicate detection and merging
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiDatabase,
  FiSettings,
  FiGitMerge,
  FiX,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import NormalizationCatalog from '../../../components/ITAM/NormalizationCatalog';
import DuplicateView from '../../../components/ITAM/DuplicateView';

const DataQualityPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'duplicates', 'drift', 'invalid'
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch drift report
  const { data: driftData, isLoading: driftLoading } = useQuery({
    queryKey: ['drift-report'],
    queryFn: () => itamAPI.dataQuality.getDriftReport(),
  });

  // Fetch duplicates
  const { data: duplicatesData, isLoading: duplicatesLoading } = useQuery({
    queryKey: ['duplicates', currentPage, searchTerm, filter],
    queryFn: () =>
      itamAPI.dataQuality.findDuplicates({
        page: currentPage,
        limit,
        search: searchTerm,
        filter,
      }),
  });

  // Fetch normalization catalog
  const { data: catalogData } = useQuery({
    queryKey: ['normalization-catalog'],
    queryFn: () => itamAPI.dataQuality.getNormalizationCatalog(),
  });

  // Merge duplicates mutation
  const mergeMutation = useMutation({
    mutationFn: (data) => itamAPI.dataQuality.mergeDuplicates(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['duplicates']);
      queryClient.invalidateQueries(['drift-report']);
      toast.success('Duplicates merged successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to merge duplicates');
    },
  });

  if (driftLoading || duplicatesLoading) {
    return <LoadingSpinner />;
  }

  const drift = driftData?.data || {};
  const duplicates = duplicatesData?.data?.data || [];
  const pagination = duplicatesData?.data?.pagination || {};
  const catalog = catalogData?.data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Data Quality
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor data quality, normalize values, and detect duplicates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCatalogModal(true)}
            className="btn btn-outline flex items-center gap-2 hover:shadow-md transition-shadow"
          >
            <FiSettings />
            Normalization Catalog
          </button>
          <button
            onClick={() => {
              queryClient.invalidateQueries(['drift-report']);
              queryClient.invalidateQueries(['duplicates']);
              toast.success('Data quality check refreshed');
            }}
            className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FiRefreshCw />
            Refresh Check
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Data Quality Score</div>
                <div className="text-2xl font-bold text-green-600">
                  {drift.qualityScore || 0}%
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
                <div className="text-sm text-gray-600 mb-1">Duplicates Found</div>
                <div className="text-2xl font-bold text-red-600">
                  {duplicates.length || 0}
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <FiAlertTriangle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Drift Issues</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {drift.driftCount || 0}
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FiRefreshCw className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Normalization Rules</div>
                <div className="text-2xl font-bold text-blue-600">
                  {catalog.rules?.length || 0}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiDatabase className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drift Issues */}
      {drift.issues && drift.issues.length > 0 && (
        <div className="card border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertTriangle className="text-yellow-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Data Drift Issues</h3>
            </div>
            <div className="space-y-2">
              {drift.issues.slice(0, 5).map((issue, index) => (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 hover:border-yellow-300 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 mb-1">{issue.field}</div>
                  <div className="text-sm text-gray-600">{issue.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Affected: {issue.count} records
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
              placeholder="Search duplicates..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm transition-all ${filter === 'all' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('duplicates')}
                className={`btn btn-sm transition-all ${filter === 'duplicates' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Duplicates
              </button>
              <button
                onClick={() => setFilter('drift')}
                className={`btn btn-sm transition-all ${filter === 'drift' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Drift
              </button>
              <button
                onClick={() => setFilter('invalid')}
                className={`btn btn-sm transition-all ${filter === 'invalid' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Invalid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Duplicates Table */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Duplicate Records</h2>
            <div className="text-sm text-gray-600">
              {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''} found
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Record 1</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Record 2</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Match Score</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fields</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {duplicates.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500">
                      <FiCheckCircle className="mx-auto mb-3 text-gray-300" size={48} />
                      <div className="text-lg font-medium">No duplicates found</div>
                      <div className="text-sm mt-1">All records are unique</div>
                    </td>
                  </tr>
                ) : (
                  duplicates.map((duplicate) => (
                    <tr key={duplicate.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium">{duplicate.record1?.assetTag || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{duplicate.record1?.serialNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{duplicate.record2?.assetTag || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{duplicate.record2?.serialNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {duplicate.matchScore || 0}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {duplicate.matchingFields?.join(', ') || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDuplicates(duplicate);
                              setShowDuplicateModal(true);
                            }}
                            className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                          >
                            <FiGitMerge />
                            Review
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to merge these duplicates?')) {
                                mergeMutation.mutate({
                                  record1Id: duplicate.record1?.id,
                                  record2Id: duplicate.record2?.id,
                                });
                              }
                            }}
                            className="btn btn-sm btn-primary shadow-md hover:shadow-lg transition-shadow"
                          >
                            <FiGitMerge />
                            Merge
                          </button>
                        </div>
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

      {/* Normalization Catalog Modal */}
      <Modal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        title="Normalization Catalog"
        size="xl"
      >
        <NormalizationCatalog onClose={() => setShowCatalogModal(false)} />
      </Modal>

      {/* Duplicate Review Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setSelectedDuplicates(null);
        }}
        title="Review Duplicates"
        size="lg"
      >
        {selectedDuplicates && (
          <DuplicateView
            duplicate={selectedDuplicates}
            onMerge={(data) => {
              mergeMutation.mutate(data);
              setShowDuplicateModal(false);
              setSelectedDuplicates(null);
            }}
            onClose={() => {
              setShowDuplicateModal(false);
              setSelectedDuplicates(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default DataQualityPage;

