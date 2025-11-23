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
  FiPackage,
  FiFileText,
  FiStar,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';
import { vendorsAPI } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import SearchBar from '../../components/ui/SearchBar';
import FilterPanel from '../../components/ui/FilterPanel';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const VendorList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    rating: 'all',
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch vendors
  const { data, isLoading, error } = useQuery({
    queryKey: ['vendors', currentPage, searchTerm, filters, sortBy, sortOrder],
    queryFn: () =>
      vendorsAPI.getAll({
        page: currentPage,
        limit,
        search: searchTerm,
        ...filters,
        sortBy,
        sortOrder,
      }).then((res) => res.data),
  });

  // Delete vendor mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => vendorsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors']);
      toast.success('Vendor deleted successfully');
      setShowDeleteModal(false);
      setSelectedVendor(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete vendor');
    },
  });

  const handleDelete = () => {
    if (selectedVendor) {
      deleteMutation.mutate(selectedVendor._id);
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

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'warning';
    return 'danger';
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'danger';
      case 'pending': return 'warning';
      default: return 'info';
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading vendors: {error.message}</p>
      </div>
    );
  }

  const vendors = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Vendors</h1>
          <p className="text-secondary-600 mt-2">
            Manage vendor relationships and contracts
          </p>
        </div>
        <Link
          to="/vendors/new"
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus size={20} />
          Add Vendor
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Search vendors..."
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
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending' },
            ],
            category: [
              { value: 'all', label: 'All Categories' },
              { value: 'hardware', label: 'Hardware' },
              { value: 'software', label: 'Software' },
              { value: 'services', label: 'Services' },
              { value: 'support', label: 'Support' },
            ],
            rating: [
              { value: 'all', label: 'All Ratings' },
              { value: 'high', label: '4.5+ Stars' },
              { value: 'medium', label: '3.5-4.4 Stars' },
              { value: 'low', label: 'Below 3.5 Stars' },
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
                <p className="text-sm font-medium text-slate-600">Total Vendors</p>
                <p className="text-2xl font-bold text-slate-900">{data?.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <FiPackage className="text-primary-600" size={24} />
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
                  {vendors.reduce((sum, vendor) => sum + (vendor.activeContracts || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <FiFileText className="text-success-600" size={24} />
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
                  ${vendors.reduce((sum, vendor) => sum + (vendor.totalValue || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                <FiDollarSign className="text-warning-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Rating</p>
                <p className="text-2xl font-bold text-slate-900">
                  {vendors.length > 0 
                    ? (vendors.reduce((sum, vendor) => sum + (vendor.rating || 0), 0) / vendors.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FiStar className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      {vendors.length === 0 ? (
        <EmptyState
          icon={FiPackage}
          title="No vendors found"
          description="Get started by adding your first vendor"
          action={() => navigate('/vendors/new')}
          actionLabel="Add Vendor"
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
                        Vendor
                        {sortBy === 'name' && (
                          sortOrder === 'asc' ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('rating')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Rating
                        {sortBy === 'rating' && (
                          sortOrder === 'asc' ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('totalValue')}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                      >
                        Total Value
                        {sortBy === 'totalValue' && (
                          sortOrder === 'asc' ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Contracts
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Last Updated
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                            {vendor.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{vendor.name}</p>
                            <p className="text-sm text-slate-600">{vendor.contactEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="info" text={vendor.category || 'Unknown'} />
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={getStatusVariant(vendor.status)} 
                          text={vendor.status || 'Unknown'} 
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <FiStar 
                            className={`${vendor.rating >= 4 ? 'text-yellow-400' : 'text-slate-300'}`} 
                            size={16} 
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {vendor.rating ? vendor.rating.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          ${vendor.totalValue ? vendor.totalValue.toLocaleString() : '0'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700">
                          {vendor.activeContracts || 0} active
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {vendor.updatedAt ? format(new Date(vendor.updatedAt), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/vendors/${vendor._id}`}
                            className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye size={16} />
                          </Link>
                          <Link
                            to={`/vendors/${vendor._id}/edit`}
                            className="p-2 text-slate-600 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit size={16} />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedVendor(vendor);
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
                  ))}
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
          setSelectedVendor(null);
        }}
        title="Delete Vendor"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete <strong>{selectedVendor?.name}</strong>? 
            This action cannot be undone and will also delete all associated contracts.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedVendor(null);
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
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Vendor'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VendorList;
