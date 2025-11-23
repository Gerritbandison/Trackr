/**
 * Warranty & Repairs Page
 * 
 * Features:
 * - Warranty lookup and enrichment
 * - RMA ticket management
 * - SLA metrics tracking
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiTool,
  FiRefreshCw,
  FiPlus,
} from 'react-icons/fi';
import { assetsAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import WarrantyLookupForm from '../../../components/ITAM/WarrantyLookupForm';
import RepairTicketForm from '../../../components/ITAM/RepairTicketForm';

const WarrantyPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'expiring', 'expired'
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch assets with warranty info
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets', 'warranty', currentPage, searchTerm, filter],
    queryFn: () =>
      assetsAPI.getAll({
        page: currentPage,
        limit,
        search: searchTerm,
        filter,
      }),
  });

  // Warranty lookup mutation
  const warrantyLookupMutation = useMutation({
    mutationFn: ({ assetId, manufacturer }) =>
      assetsAPI.lookupWarranty(assetId, manufacturer),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      toast.success('Warranty information updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to lookup warranty');
    },
  });

  // Create repair ticket mutation
  const createRepairMutation = useMutation({
    mutationFn: ({ assetId, data }) => assetsAPI.createRepairTicket(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      queryClient.invalidateQueries(['repair-tickets']);
      toast.success('Repair ticket created');
      setShowRepairModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create repair ticket');
    },
  });

  const handleWarrantyLookup = (asset, manufacturer) => {
    warrantyLookupMutation.mutate({ assetId: asset.id, manufacturer });
  };

  const handleCreateRepair = (asset) => {
    setSelectedAsset(asset);
    setShowRepairModal(true);
  };

  const getWarrantyStatus = (warranty) => {
    if (!warranty?.end) return 'Unknown';
    const daysRemaining = differenceInDays(new Date(warranty.end), new Date());
    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining <= 30) return 'Expiring';
    return 'Active';
  };

  const getWarrantyStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Expiring':
        return 'bg-yellow-100 text-yellow-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const assets = assetsData?.data?.data || [];
  const pagination = assetsData?.data?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Warranty & Repairs</h1>
          <p className="text-gray-600 mt-2">
            Manage warranty information and repair tickets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLookupModal(true)}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiRefreshCw />
            Bulk Lookup
          </button>
          <button
            onClick={() => setShowRepairModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiPlus />
            New Repair Ticket
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search by asset, serial number, or model..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-outline'}`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('expiring')}
                className={`btn btn-sm ${filter === 'expiring' ? 'btn-primary' : 'btn-outline'}`}
              >
                Expiring Soon
              </button>
              <button
                onClick={() => setFilter('expired')}
                className={`btn btn-sm ${filter === 'expired' ? 'btn-primary' : 'btn-outline'}`}
              >
                Expired
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assets with Warranty */}
      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Asset</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Serial Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Warranty Provider</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">End Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No assets found
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => {
                    const warrantyStatus = getWarrantyStatus(asset.warranty);
                    const daysRemaining = asset.warranty?.end
                      ? differenceInDays(new Date(asset.warranty.end), new Date())
                      : null;

                    return (
                      <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{asset.model}</div>
                            <div className="text-sm text-gray-500">{asset.assetTag}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{asset.serialNumber || 'N/A'}</td>
                        <td className="py-3 px-4">
                          {asset.warranty?.provider || 'Not configured'}
                        </td>
                        <td className="py-3 px-4">
                          {asset.warranty?.end ? (
                            <div>
                              <div>{format(new Date(asset.warranty.end), 'MMM dd, yyyy')}</div>
                              {daysRemaining !== null && (
                                <div className="text-xs text-gray-500">
                                  {daysRemaining >= 0
                                    ? `${daysRemaining} days remaining`
                                    : `${Math.abs(daysRemaining)} days expired`}
                                </div>
                              )}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getWarrantyStatusColor(
                              warrantyStatus
                            )}`}
                          >
                            {warrantyStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleWarrantyLookup(asset, asset.manufacturer)}
                              disabled={warrantyLookupMutation.isPending}
                              className="btn btn-sm btn-outline flex items-center gap-1"
                            >
                              <FiRefreshCw />
                              Lookup
                            </button>
                            <button
                              onClick={() => handleCreateRepair(asset)}
                              className="btn btn-sm btn-primary flex items-center gap-1"
                            >
                              <FiTool />
                              Repair
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

      {/* Warranty Lookup Modal */}
      <Modal
        isOpen={showLookupModal}
        onClose={() => setShowLookupModal(false)}
        title="Bulk Warranty Lookup"
      >
        <WarrantyLookupForm onSuccess={() => setShowLookupModal(false)} />
      </Modal>

      {/* Repair Ticket Modal */}
      <Modal
        isOpen={showRepairModal}
        onClose={() => {
          setShowRepairModal(false);
          setSelectedAsset(null);
        }}
        title="Create Repair Ticket"
      >
        <RepairTicketForm
          asset={selectedAsset}
          onSuccess={(data) => {
            createRepairMutation.mutate({ assetId: selectedAsset?.id, data });
          }}
          onCancel={() => {
            setShowRepairModal(false);
            setSelectedAsset(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default WarrantyPage;

