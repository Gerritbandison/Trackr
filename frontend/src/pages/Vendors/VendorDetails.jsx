import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiDollarSign,
  FiFileText,
  FiPackage,
  FiStar,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
} from 'react-icons/fi';
import { vendorsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import VendorForm from './VendorForm';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { canManage } = useAuth();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Check if creating new vendor
  const isNewVendor = location.pathname === '/vendors/new';

  // Fetch vendor details
  const { data: vendor, isLoading: loadingVendor } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorsAPI.getById(id).then((res) => res.data.data),
    enabled: !!id && !isNewVendor,
  });

  // Fetch vendor contracts
  const { data: contractsData } = useQuery({
    queryKey: ['vendor-contracts', id],
    queryFn: () => vendorsAPI.getContracts(id).then((res) => res.data.data),
    enabled: !!id && !isNewVendor,
  });

  // Fetch vendor assets
  const { data: assetsData } = useQuery({
    queryKey: ['vendor-assets', id],
    queryFn: () => vendorsAPI.getAssets(id).then((res) => res.data.data),
    enabled: !!id && !isNewVendor,
  });

  // Fetch vendor stats
  const { data: statsData } = useQuery({
    queryKey: ['vendor-stats', id],
    queryFn: () => vendorsAPI.getStats(id).then((res) => res.data.data),
    enabled: !!id && !isNewVendor,
  });

  // Delete vendor mutation
  const deleteMutation = useMutation({
    mutationFn: () => vendorsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors']);
      toast.success('Vendor deleted successfully');
      navigate('/vendors');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete vendor');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (loadingVendor) {
    return <LoadingSpinner fullScreen />;
  }

  // Create or Edit Vendor
  const isEditingVendor = location.pathname.includes('/edit');
  const isCreatingVendor = isNewVendor || isEditingVendor;

  if (isCreatingVendor && !isEditingVendor) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/vendors')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Create New Vendor</h1>
            <p className="text-secondary-600 mt-2">Add a new vendor to the system</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <VendorForm
              onClose={() => navigate('/vendors')}
              onSuccess={(newVendor) => {
                if (newVendor?._id) {
                  navigate(`/vendors/${newVendor._id}`);
                } else {
                  navigate('/vendors');
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isEditingVendor && vendor) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/vendors/${id}`)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Edit Vendor</h1>
            <p className="text-secondary-600 mt-2">Update vendor information</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <VendorForm
              vendor={vendor}
              onClose={() => navigate(`/vendors/${id}`)}
              onSuccess={() => {
                navigate(`/vendors/${id}`);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Vendor not found</p>
        <Link to="/vendors" className="btn btn-primary mt-4">
          Back to Vendors
        </Link>
      </div>
    );
  }

  const contracts = contractsData || [];
  const assets = assetsData || [];
  const stats = statsData || {};

  // Prepare chart data
  const contractStatusData = contracts.reduce((acc, contract) => {
    const status = contract.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(contractStatusData).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: status === 'active' ? '#10b981' : status === 'expired' ? '#ef4444' : '#f59e0b',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/vendors')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">{vendor.name}</h1>
            <p className="text-secondary-600 mt-2">Vendor Details & Performance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canManage() && (
            <>
              <Link
                to={`/vendors/${id}/edit`}
                className="btn btn-outline flex items-center gap-2"
              >
                <FiEdit size={18} />
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger flex items-center gap-2"
              >
                <FiTrash2 size={18} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Contracts</p>
                <p className="text-2xl font-bold text-slate-900">{contracts.length}</p>
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
                <p className="text-sm font-medium text-slate-600">Total Value</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${vendor.totalValue ? vendor.totalValue.toLocaleString() : '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <FiDollarSign className="text-success-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Assets</p>
                <p className="text-2xl font-bold text-slate-900">{assets.length}</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                <FiPackage className="text-warning-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Rating</p>
                <p className="text-2xl font-bold text-slate-900">
                  {vendor.rating ? vendor.rating.toFixed(1) : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FiStar className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-bold text-slate-900">Vendor Information</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Company Name</label>
                  <p className="text-slate-900 font-medium">{vendor.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Category</label>
                  <Badge variant="info">{vendor.category || 'Unknown'}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <Badge 
                    variant={vendor.status === 'active' ? 'success' : 'danger'}
                  >
                    {vendor.status || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Rating</label>
                  <div className="flex items-center gap-1">
                    <FiStar className="text-yellow-400" size={16} />
                    <span className="text-slate-900 font-medium">
                      {vendor.rating ? vendor.rating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Contact Email</label>
                  <div className="flex items-center gap-2">
                    <FiMail size={16} className="text-slate-400" />
                    <a 
                      href={`mailto:${vendor.email || vendor.contactEmail}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {vendor.email || vendor.contactEmail || 'N/A'}
                    </a>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Phone</label>
                  <div className="flex items-center gap-2">
                    <FiPhone size={16} className="text-slate-400" />
                    <span className="text-slate-900">{vendor.phone || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Website</label>
                  <div className="flex items-center gap-2">
                    <FiGlobe size={16} className="text-slate-400" />
                    {vendor.website ? (
                      <a 
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {vendor.website}
                      </a>
                    ) : (
                      <span className="text-slate-500">N/A</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Address</label>
                  <div className="flex items-center gap-2">
                    <FiMapPin size={16} className="text-slate-400" />
                    <span className="text-slate-900">
                      {vendor.address?.street || typeof vendor.address === 'string' 
                        ? (typeof vendor.address === 'string' 
                            ? vendor.address 
                            : `${vendor.address.street || ''}, ${vendor.address.city || ''}, ${vendor.address.state || ''} ${vendor.address.zipCode || ''}`.trim().replace(/^,\s*|,\s*$/g, ''))
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {vendor.description && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Description</label>
                  <p className="text-slate-900 mt-1">{vendor.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contracts */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Contracts</h3>
                {canManage() && (
                  <button
                    onClick={() => navigate('/contracts/new', { state: { vendorId: id } })}
                    className="btn btn-primary btn-sm flex items-center gap-2"
                  >
                    <FiPlus size={16} />
                    Add Contract
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {contracts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FiFileText size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No contracts found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contracts.map((contract) => (
                    <div key={contract._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{contract.name}</h4>
                        <p className="text-sm text-slate-600">
                          Value: ${contract.value ? contract.value.toLocaleString() : '0'} • 
                          Status: <Badge variant={contract.status === 'active' ? 'success' : 'warning'}>{contract.status}</Badge>
                        </p>
                      </div>
                      <Link
                        to={`/contracts/${contract._id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Status Chart */}
          {statusChartData.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-bold text-slate-900">Contract Status</h3>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">Vendor created</p>
                    <p className="text-xs text-slate-500">
                      {vendor.createdAt ? format(new Date(vendor.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">Last updated</p>
                    <p className="text-xs text-slate-500">
                      {vendor.updatedAt ? format(new Date(vendor.updatedAt), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Vendor"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete <strong>{vendor.name}</strong>? 
            This action cannot be undone and will also delete all associated contracts.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
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

export default VendorDetails;
