/**
 * Contract Renewals Page
 * 
 * Features:
 * - Renewal calendar
 * - Renewal notifications (120/60/30-day)
 * - Health scoring
 * - Auto-renewal workflows
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiFileText,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiFilter,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import { format, addDays, differenceInDays, isAfter, isBefore } from 'date-fns';
import ContractRenewalForm from '../../../components/ITAM/ContractRenewalForm';
import ContractHealthScore from '../../../components/ITAM/ContractHealthScore';

const ContractRenewalsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'overdue', 'renewed'
  const [daysFilter, setDaysFilter] = useState(90); // 30, 60, 90, 120
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch contracts with renewals
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['contracts', 'renewals', currentPage, searchTerm, filter, daysFilter],
    queryFn: () =>
      itamAPI.contracts.getRenewals({
        page: currentPage,
        limit,
        search: searchTerm,
        filter,
        days: daysFilter,
      }),
  });

  // Fetch renewal notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['contract-renewal-notifications'],
    queryFn: () => itamAPI.contracts.getRenewalNotifications(),
  });

  // Acknowledge renewal mutation
  const acknowledgeMutation = useMutation({
    mutationFn: ({ contractId, data }) =>
      itamAPI.contracts.acknowledgeRenewal(contractId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts']);
      queryClient.invalidateQueries(['contract-renewal-notifications']);
      toast.success('Renewal acknowledged');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to acknowledge renewal');
    },
  });

  const handleRenewal = (contract) => {
    setSelectedContract(contract);
    setShowRenewalModal(true);
  };

  const handleAcknowledge = (contractId, decision) => {
    acknowledgeMutation.mutate({
      contractId,
      data: {
        decision, // 'renew', 'cancel', 'negotiate'
        acknowledgedAt: new Date().toISOString(),
      },
    });
  };

  const getRenewalStatus = (contract) => {
    if (!contract.endDate) return 'Unknown';
    const daysUntilRenewal = differenceInDays(new Date(contract.endDate), new Date());
    
    if (daysUntilRenewal < 0) return 'Overdue';
    if (daysUntilRenewal <= 30) return 'Urgent';
    if (daysUntilRenewal <= 60) return 'Due Soon';
    if (daysUntilRenewal <= 120) return 'Upcoming';
    return 'Future';
  };

  const getRenewalStatusColor = (status) => {
    switch (status) {
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Urgent':
        return 'bg-orange-100 text-orange-800';
      case 'Due Soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const contracts = contractsData?.data?.data || [];
  const pagination = contractsData?.data?.pagination || {};
  const notifications = notificationsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Contract Renewals</h1>
          <p className="text-gray-600 mt-2">
            Manage contract renewals and track health scores
          </p>
        </div>
        <div className="flex items-center gap-3">
          {notifications.length > 0 && (
            <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {notifications.length} notifications
            </div>
          )}
        </div>
      </div>

      {/* Renewal Notifications */}
      {notifications.length > 0 && (
        <div className="card border-l-4 border-red-500">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertCircle className="text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Renewal Notifications</h3>
            </div>
            <div className="space-y-3">
              {notifications.map((notification) => {
                const contract = notification.contract;
                const status = getRenewalStatus(contract);
                
                return (
                  <div
                    key={notification.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900">{contract.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRenewalStatusColor(status)}`}>
                            {status}
                          </span>
                          <span className="text-sm text-gray-600">
                            {notification.daysUntilRenewal} days until renewal
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Vendor:</span> {contract.vendor} •{' '}
                          <span className="font-medium">Type:</span> {contract.type} •{' '}
                          <span className="font-medium">End Date:</span>{' '}
                          {format(new Date(contract.endDate), 'MMM dd, yyyy')}
                        </div>
                        {notification.healthScore !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Health Score:</span>
                            <span className={`font-medium ${getHealthScoreColor(notification.healthScore)}`}>
                              {notification.healthScore}/100
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcknowledge(contract.id, 'renew')}
                          className="btn btn-sm btn-primary flex items-center gap-1"
                        >
                          <FiCheckCircle />
                          Renew
                        </button>
                        <button
                          onClick={() => handleRenewal(contract)}
                          className="btn btn-sm btn-outline"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search contracts..."
            />
            <div className="flex gap-2">
              <select
                value={daysFilter}
                onChange={(e) => setDaysFilter(parseInt(e.target.value))}
                className="input"
              >
                <option value={30}>Next 30 days</option>
                <option value={60}>Next 60 days</option>
                <option value={90}>Next 90 days</option>
                <option value={120}>Next 120 days</option>
              </select>
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`btn btn-sm ${filter === 'upcoming' ? 'btn-primary' : 'btn-outline'}`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('overdue')}
                className={`btn btn-sm ${filter === 'overdue' ? 'btn-primary' : 'btn-outline'}`}
              >
                Overdue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Contract</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">End Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Days Until</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Health Score</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      No contracts found
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract) => {
                    const status = getRenewalStatus(contract);
                    const daysUntil = contract.endDate
                      ? differenceInDays(new Date(contract.endDate), new Date())
                      : null;

                    return (
                      <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{contract.name}</div>
                          <div className="text-sm text-gray-500">{contract.id}</div>
                        </td>
                        <td className="py-3 px-4">{contract.vendor}</td>
                        <td className="py-3 px-4">{contract.type}</td>
                        <td className="py-3 px-4">
                          {contract.endDate
                            ? format(new Date(contract.endDate), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {daysUntil !== null ? (
                            <div className={daysUntil < 0 ? 'text-red-600 font-medium' : ''}>
                              {daysUntil < 0
                                ? `${Math.abs(daysUntil)} days overdue`
                                : `${daysUntil} days`}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {contract.healthScore !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${getHealthScoreColor(contract.healthScore)}`}>
                                {contract.healthScore}
                              </span>
                              <button
                                onClick={() => {
                                  // Show health score details
                                }}
                                className="text-sm text-gray-500 hover:text-gray-700"
                              >
                                View
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                // Calculate health score
                                itamAPI.contracts.getHealthScore(contract.id).then((res) => {
                                  queryClient.invalidateQueries(['contracts']);
                                });
                              }}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              Calculate
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getRenewalStatusColor(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleRenewal(contract)}
                            className="btn btn-sm btn-primary flex items-center gap-1"
                          >
                            <FiCalendar />
                            Renew
                          </button>
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

      {/* Renewal Modal */}
      <Modal
        isOpen={showRenewalModal}
        onClose={() => {
          setShowRenewalModal(false);
          setSelectedContract(null);
        }}
        title="Contract Renewal"
      >
        <ContractRenewalForm
          contract={selectedContract}
          onSuccess={() => {
            setShowRenewalModal(false);
            setSelectedContract(null);
            queryClient.invalidateQueries(['contracts']);
          }}
          onCancel={() => {
            setShowRenewalModal(false);
            setSelectedContract(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default ContractRenewalsPage;

