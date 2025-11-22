/**
 * Compliance & Audit Page
 * 
 * Features:
 * - Immutable history tracking
 * - Attestations (quarterly confirm gear)
 * - Controls (Disposed requires WipeCert)
 * - Audit packs
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiShield,
  FiPlus,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiFileText,
  FiDownload,
  FiUpload,
  FiCalendar,
  FiUserCheck,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import AttestationForm from '../../../components/ITAM/AttestationForm';
import AuditPackView from '../../../components/ITAM/AuditPackView';
import WipeCertUpload from '../../../components/ITAM/WipeCertUpload';

const CompliancePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed', 'overdue'
  const [showAttestationModal, setShowAttestationModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showWipeCertModal, setShowWipeCertModal] = useState(false);
  const [selectedAttestation, setSelectedAttestation] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch attestations
  const { data: attestationsData, isLoading } = useQuery({
    queryKey: ['attestations', currentPage, searchTerm, filter],
    queryFn: () =>
      itamAPI.compliance.getAttestations({
        page: currentPage,
        limit,
        search: searchTerm,
        filter,
      }),
  });

  // Fetch compliance stats
  const { data: statsData } = useQuery({
    queryKey: ['compliance-stats'],
    queryFn: () => itamAPI.compliance.getStats(),
  });

  // Fetch pending attestations
  const { data: pendingData } = useQuery({
    queryKey: ['pending-attestations'],
    queryFn: () => itamAPI.compliance.getPendingAttestations(),
  });

  // Complete attestation mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, data }) => itamAPI.compliance.completeAttestation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attestations']);
      queryClient.invalidateQueries(['compliance-stats']);
      toast.success('Attestation completed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete attestation');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const attestations = attestationsData?.data?.data || [];
  const pagination = attestationsData?.data?.pagination || {};
  const stats = statsData?.data || {};
  const pending = pendingData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Compliance & Audit
          </h1>
          <p className="text-gray-600 mt-2">
            Manage attestations, audit packs, and compliance controls
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAuditModal(true)}
            className="btn btn-outline flex items-center gap-2 hover:shadow-md transition-shadow"
          >
            <FiFileText />
            Audit Pack
          </button>
          <button
            onClick={() => {
              setSelectedAttestation(null);
              setShowAttestationModal(true);
            }}
            className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FiPlus />
            Create Attestation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Attestations</div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalAttestations || 0}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiShield className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Completed</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.completed || 0}
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
                <div className="text-sm text-gray-600 mb-1">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {pending.length || 0}
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FiClock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Overdue</div>
                <div className="text-2xl font-bold text-red-600">
                  {stats.overdue || 0}
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <FiAlertCircle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Attestations Alert */}
      {pending.length > 0 && (
        <div className="card border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertCircle className="text-yellow-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Pending Attestations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pending.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200 hover:border-yellow-300 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 mb-1">{item.name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    Due: {new Date(item.dueDate).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAttestation(item);
                      setShowAttestationModal(true);
                    }}
                    className="btn btn-sm btn-primary w-full shadow-md hover:shadow-lg transition-shadow"
                  >
                    Complete
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
              placeholder="Search attestations..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm transition-all ${filter === 'all' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`btn btn-sm transition-all ${filter === 'pending' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`btn btn-sm transition-all ${filter === 'completed' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter('overdue')}
                className={`btn btn-sm transition-all ${filter === 'overdue' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Overdue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attestations Table */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Attestations</h2>
            <div className="text-sm text-gray-600">
              {attestations.length} item{attestations.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned To</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Completed Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attestations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500">
                      <FiShield className="mx-auto mb-3 text-gray-300" size={48} />
                      <div className="text-lg font-medium">No attestations found</div>
                      <div className="text-sm mt-1">Create an attestation to get started</div>
                    </td>
                  </tr>
                ) : (
                  attestations.map((item) => {
                    const isOverdue = item.status === 'pending' && new Date(item.dueDate) < new Date();
                    const isCompleted = item.status === 'completed';
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">{item.assignedTo?.name || 'Unassigned'}</td>
                        <td className="py-3 px-4">
                          <div className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                            {new Date(item.dueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {item.completedDate ? (
                            <div className="text-sm text-gray-600">
                              {new Date(item.completedDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              isCompleted
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
                                : isOverdue
                                ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200'
                                : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
                            }`}
                          >
                            {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {!isCompleted && (
                              <button
                                onClick={() => {
                                  setSelectedAttestation(item);
                                  setShowAttestationModal(true);
                                }}
                                className="btn btn-sm btn-primary shadow-md hover:shadow-lg transition-shadow"
                              >
                                <FiUserCheck />
                                Complete
                              </button>
                            )}
                            {item.type === 'disposal' && !item.wipeCert && (
                              <button
                                onClick={() => {
                                  setSelectedAttestation(item);
                                  setShowWipeCertModal(true);
                                }}
                                className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                              >
                                <FiUpload />
                                Upload Wipe Cert
                              </button>
                            )}
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

      {/* Attestation Modal */}
      <Modal
        isOpen={showAttestationModal}
        onClose={() => {
          setShowAttestationModal(false);
          setSelectedAttestation(null);
        }}
        title={selectedAttestation ? 'Complete Attestation' : 'Create Attestation'}
        size="lg"
      >
        <AttestationForm
          attestation={selectedAttestation}
          onSuccess={() => {
            setShowAttestationModal(false);
            setSelectedAttestation(null);
            queryClient.invalidateQueries(['attestations']);
          }}
          onCancel={() => {
            setShowAttestationModal(false);
            setSelectedAttestation(null);
          }}
        />
      </Modal>

      {/* Audit Pack Modal */}
      <Modal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        title="Audit Pack"
        size="xl"
      >
        <AuditPackView onClose={() => setShowAuditModal(false)} />
      </Modal>

      {/* Wipe Cert Upload Modal */}
      <Modal
        isOpen={showWipeCertModal}
        onClose={() => {
          setShowWipeCertModal(false);
          setSelectedAttestation(null);
        }}
        title="Upload Wipe Certificate"
        size="md"
      >
        {selectedAttestation && (
          <WipeCertUpload
            attestation={selectedAttestation}
            onSuccess={() => {
              setShowWipeCertModal(false);
              setSelectedAttestation(null);
              queryClient.invalidateQueries(['attestations']);
            }}
            onCancel={() => {
              setShowWipeCertModal(false);
              setSelectedAttestation(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default CompliancePage;

