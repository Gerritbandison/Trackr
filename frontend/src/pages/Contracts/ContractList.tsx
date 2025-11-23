import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiEye,
  FiDollarSign,
  FiFileText,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';
import { contractsAPI } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import SearchBar from '../../components/ui/SearchBar';
import FilterPanel from '../../components/ui/FilterPanel';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ContractList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    vendor: 'all',
    type: 'all',
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch contracts
  const { data, isLoading, error } = useQuery({
    queryKey: ['contracts', currentPage, searchTerm, filters, sortBy, sortOrder],
    queryFn: () =>
      contractsAPI.getAll({
        page: currentPage,
        limit,
        search: searchTerm,
        ...filters,
        sortBy,
        sortOrder,
      }).then((res) => res.data),
  });

  // Delete contract mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => contractsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts']);
      toast.success('Contract deleted successfully');
      setShowDeleteModal(false);
      setSelectedContract(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete contract');
    },
  });

  const handleDelete = () => {
    if (selectedContract) {
      deleteMutation.mutate(selectedContract._id || selectedContract.id);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'danger';
      case 'pending': return 'warning';
      case 'renewed': return 'info';
      default: return 'info';
    }
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'unknown', color: 'slate', text: 'No expiry date' };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'danger', text: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: 'warning', text: `${daysUntilExpiry} days left` };
    } else if (daysUntilExpiry <= 90) {
      return { status: 'expiring-soon', color: 'info', text: `${daysUntilExpiry} days left` };
    } else {
      return { status: 'active', color: 'success', text: `${daysUntilExpiry} days left` };
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading contracts: {error.message}</p>
      </div>
    );
  }

  const contracts = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Contracts</h1>
          <p className="text-secondary-600 mt-2">
            Manage vendor contracts and agreements
          </p>
        </div>
        <Link
          to="/contracts/new"
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus size={20} />
          Add Contract
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Search contracts..."
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-outline flex items-center gap-2"
        >
          <FiFilter size={18} />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={{
            status: [
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'expired', label: 'Expired' },
              { value: 'pending', label: 'Pending' },
              { value: 'renewed', label: 'Renewed' },
            ],
            type: [
              { value: 'all', label: 'All Types' },
              { value: 'hardware', label: 'Hardware' },
              { value: 'software', label: 'Software' },
              { value: 'service', label: 'Service' },
              { value: 'support', label: 'Support' },
            ],
          }}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Contracts</p>
                <p className="text-2xl font-bold text-slate-900">{data?.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <FiFileText className="text-primary-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Contracts</p>
                <p className="text-2xl font-bold text-slate-900">
                  {contracts.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <FiCalendar className="text-success-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-slate-900">
                  {contracts.filter(c => {
                    if (!c.expiryDate) return false;
                    const daysUntilExpiry = Math.ceil((new Date(c.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                <FiCalendar className="text-warning-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Value</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${contracts.reduce((sum, contract) => sum + (contract.value || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FiDollarSign className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      {contracts.length === 0 ? (
        <EmptyState
          icon={FiFileText}
          title="No contracts found"
          description="Get started by adding your first contract"
          action={() => navigate('/contracts/new')}
          actionLabel="Add Contract"
        />
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Contract
                        {sortBy === 'name' && (
                          sortOrder === 'asc' ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Vendor
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('value')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Value
                        {sortBy === 'value' && (
                          sortOrder === 'asc' ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('expiryDate')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Expiry
                        {sortBy === 'expiryDate' && (
                          sortOrder === 'asc' ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Documents
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {contracts.map((contract) => {
                    const expiryStatus = getExpiryStatus(contract.expiryDate);
                    return (
                      <tr key={contract._id || contract.id || contract.contractNumber || `contract-${contracts.indexOf(contract)}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">{contract.name}</p>
                            <p className="text-sm text-slate-600">#{contract.contractNumber || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                              {contract.vendor?.name?.charAt(0).toUpperCase() || 'V'}
                            </div>
                            <span className="text-slate-900">{contract.vendor?.name || 'Unknown Vendor'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="info" text={contract.type || 'Unknown'} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <Badge 
                              variant={getStatusVariant(contract.status)} 
                              text={contract.status || 'Unknown'} 
                            />
                            <div className="text-xs">
                              <Badge 
                                variant={expiryStatus.color} 
                                text={expiryStatus.text} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-700">
                            ${contract.value ? contract.value.toLocaleString() : '0'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-700">
                            {contract.expiryDate ? format(new Date(contract.expiryDate), 'MMM dd, yyyy') : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <FiFileText size={16} className="text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {contract.documentCount || 0} files
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/contracts/${contract._id || contract.id}`}
                              className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <FiEye size={16} />
                            </Link>
                            <Link
                              to={`/contracts/${contract._id || contract.id}/edit`}
                              className="p-2 text-slate-600 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit size={16} />
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedContract(contract);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedContract(null);
        }}
        title="Delete Contract"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete <strong>{selectedContract?.name}</strong>? 
            This action cannot be undone and will also delete all associated documents.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedContract(null);
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="btn btn-danger"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Contract'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ContractList;
