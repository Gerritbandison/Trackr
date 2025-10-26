import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiEdit, FiTrash2, FiUserMinus, FiShoppingCart, FiPackage,
  FiUser, FiMapPin, FiDollarSign, FiShield, FiClock, FiCheckCircle, FiRefreshCw 
} from 'react-icons/fi';
import { assetsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge, { getStatusVariant, getConditionVariant } from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useState } from 'react';
import AssetForm from './AssetForm';
import AssignAssetModal from './AssignAssetModal';
import WarrantyTimeline from '../../components/Common/WarrantyTimeline';
import DepreciationCard from '../../components/Common/DepreciationCard';
import EOLCard from '../../components/Common/EOLCard';
import EOLBadge from '../../components/Common/EOLBadge';
import QRCodeGenerator from '../../components/Common/QRCodeGenerator';

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [warrantyData, setWarrantyData] = useState(null);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);

  // Fetch asset details
  const { data, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsAPI.getById(id).then((res) => res.data.data),
  });

  // Unassign mutation
  const unassignMutation = useMutation({
    mutationFn: () => assetsAPI.unassign(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['asset', id]);
      queryClient.invalidateQueries(['assets']);
      toast.success('Asset unassigned successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unassign asset');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => assetsAPI.delete(id),
    onSuccess: () => {
      toast.success('Asset deleted successfully');
      navigate('/assets');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete asset');
    },
  });

  const handleUnassign = () => {
    if (window.confirm('Are you sure you want to unassign this asset?')) {
      unassignMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${asset?.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleAssign = () => {
    setShowAssignModal(true);
  };

  // Lenovo warranty lookup mutation
  const warrantyLookupMutation = useMutation({
    mutationFn: (autoUpdate) => assetsAPI.lookupLenovoWarranty(id, autoUpdate),
    onSuccess: (response, autoUpdate) => {
      setWarrantyData(response.data);
      setShowWarrantyModal(true);
      
      if (autoUpdate) {
        // If we updated the asset, refresh the data and show success message
        queryClient.invalidateQueries(['asset', id]);
        queryClient.invalidateQueries(['assets']); // Also refresh the assets list
        toast.success('Asset updated with Lenovo warranty information!');
      } else {
        // If we just looked up data, show different message
        toast.success('Warranty information retrieved from Lenovo!');
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to lookup warranty information';
      toast.error(errorMessage);
      console.error('Warranty lookup error:', error.response?.data);
    },
  });

  const handleWarrantyLookup = (autoUpdate = false) => {
    warrantyLookupMutation.mutate(autoUpdate);
  };

  if (isLoading) return <LoadingSpinner />;

  const asset = data;

  // Build lifecycle timeline
  const timelineEvents = [
    {
      icon: FiShoppingCart,
      color: 'emerald',
      title: 'Purchased',
      date: asset.purchaseDate,
      details: asset.purchasePrice ? `$${asset.purchasePrice.toLocaleString()}` : null,
    },
    {
      icon: FiPackage,
      color: 'blue',
      title: 'Added to Inventory',
      date: asset.createdAt,
      details: `Asset Tag: ${asset.assetTag || 'N/A'}`,
    },
    asset.assignedTo && {
      icon: FiUser,
      color: 'purple',
      title: 'Assigned',
      date: asset.assignedDate,
      details: `To: ${asset.assignedTo.name}`,
    },
    asset.warrantyExpiry && {
      icon: FiShield,
      color: new Date(asset.warrantyExpiry) < new Date() ? 'red' : 'amber',
      title: 'Warranty Status',
      date: asset.warrantyExpiry,
      details: new Date(asset.warrantyExpiry) < new Date() ? 'Expired' : 'Active',
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => navigate('/assets')} 
            className="btn btn-outline mt-1"
          >
            <FiArrowLeft />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl shadow-md">
                {asset.category === 'laptop' && '💻'}
                {asset.category === 'desktop' && '🖥️'}
                {asset.category === 'monitor' && '📺'}
                {asset.category === 'phone' && '📱'}
                {asset.category === 'dock' && '🔌'}
                {!['laptop', 'desktop', 'monitor', 'phone', 'dock'].includes(asset.category) && '📦'}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">{asset.name}</h1>
                <p className="text-secondary-600 text-lg mt-1">
                  {asset.manufacturer} {asset.model}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-1">
              <Badge variant={getStatusVariant(asset.status)}>{asset.status}</Badge>
              <Badge variant={getConditionVariant(asset.condition)}>{asset.condition}</Badge>
              <EOLBadge asset={asset} />
              <span className="text-sm text-secondary-500">
                ID: <span className="font-mono font-semibold">{asset.serialNumber || 'N/A'}</span>
              </span>
            </div>
          </div>
        </div>
        {canManage() && (
          <div className="flex gap-2">
            <button onClick={handleEdit} className="btn btn-outline flex items-center gap-2">
              <FiEdit />
              Edit Asset
            </button>
            <button 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="btn btn-danger flex items-center gap-2"
            >
              <FiTrash2 />
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {/* Lifecycle Timeline */}
      <div className="card overflow-hidden">
        <div className="card-header bg-gradient-to-r from-primary-50 to-transparent">
          <div className="flex items-center gap-2">
            <FiClock className="text-primary-600" size={20} />
            <h3 className="text-xl font-semibold text-secondary-900">Asset Lifecycle Timeline</h3>
          </div>
          <p className="text-sm text-secondary-600 mt-1">Complete history and key milestones</p>
        </div>
        <div className="card-body">
          <div className="relative">
            {timelineEvents.map((event, index) => {
              const Icon = event.icon;
              const colorClasses = {
                emerald: 'bg-emerald-500 text-white',
                blue: 'bg-blue-500 text-white',
                purple: 'bg-purple-500 text-white',
                amber: 'bg-amber-500 text-white',
                red: 'bg-red-500 text-white',
              };
              
              return (
                <div key={index} className="flex gap-4 pb-8 last:pb-0 group">
                  {/* Timeline Line */}
                  {index < timelineEvents.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-secondary-200 to-transparent"></div>
                  )}
                  
                  {/* Icon */}
                  <div className={`relative z-10 w-12 h-12 rounded-xl ${colorClasses[event.color]} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}>
                    <Icon size={20} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-secondary-900">{event.title}</h4>
                      <span className="text-sm text-secondary-500">
                        {event.date ? format(new Date(event.date), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                    {event.details && (
                      <p className="text-sm text-secondary-600">{event.details}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiMapPin className="text-primary-600" size={16} />
                  <span className="text-xs text-secondary-500 uppercase font-semibold">Location</span>
                </div>
                <p className="font-semibold text-secondary-900">{asset.location || 'N/A'}</p>
              </div>
            </div>
            <div className="card hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiDollarSign className="text-emerald-600" size={16} />
                  <span className="text-xs text-secondary-500 uppercase font-semibold">Value</span>
                </div>
                <p className="font-semibold text-secondary-900">
                  {asset.purchasePrice ? `$${asset.purchasePrice.toLocaleString()}` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="card hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiShield className="text-amber-600" size={16} />
                  <span className="text-xs text-secondary-500 uppercase font-semibold">Warranty</span>
                </div>
                <p className="font-semibold text-secondary-900">
                  {asset.warrantyExpiry ? (
                    new Date(asset.warrantyExpiry) > new Date() ? '✓ Active' : '✗ Expired'
                  ) : 'N/A'}
                </p>
              </div>
            </div>
            <div className="card hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiUser className="text-purple-600" size={16} />
                  <span className="text-xs text-secondary-500 uppercase font-semibold">Assigned</span>
                </div>
                <p className="font-semibold text-secondary-900 truncate">
                  {asset.assignedTo?.name || 'Unassigned'}
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-secondary-900">Detailed Information</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Category</p>
                  <p className="font-semibold text-secondary-900 capitalize">{asset.category}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Serial Number</p>
                  <p className="font-semibold text-secondary-900 font-mono text-sm">
                    {asset.serialNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Asset Tag</p>
                  <p className="font-semibold text-secondary-900">{asset.assetTag || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Manufacturer</p>
                  <p className="font-semibold text-secondary-900">{asset.manufacturer || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Model</p>
                  <p className="font-semibold text-secondary-900">{asset.model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Supplier</p>
                  <p className="font-semibold text-secondary-900">{asset.supplier || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase & Warranty */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-secondary-900">Financial & Warranty Information</h3>
                {asset.manufacturer?.toLowerCase().includes('lenovo') && asset.serialNumber && canManage() && (
                  <button
                    onClick={() => handleWarrantyLookup(true)}
                    disabled={warrantyLookupMutation.isPending}
                    className="btn btn-primary btn-sm flex items-center gap-2 text-sm"
                    title="Lookup and update warranty from Lenovo"
                  >
                    <FiRefreshCw className={warrantyLookupMutation.isPending ? 'animate-spin' : ''} size={14} />
                    {warrantyLookupMutation.isPending ? 'Looking up...' : 'Update from Lenovo'}
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Purchase Date</p>
                  <p className="font-semibold text-secondary-900">
                    {asset.purchaseDate
                      ? format(new Date(asset.purchaseDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Purchase Price</p>
                  <p className="font-semibold text-secondary-900 text-lg">
                    {asset.purchasePrice
                      ? `$${asset.purchasePrice.toLocaleString()}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Warranty Provider</p>
                  <p className="font-semibold text-secondary-900">{asset.warrantyProvider || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Warranty Status</p>
                  {asset.warrantyExpiry && (
                    <Badge variant={new Date(asset.warrantyExpiry) < new Date() ? 'danger' : 'success'}>
                      {new Date(asset.warrantyExpiry) < new Date() ? 'Expired' : 'Active'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Warranty Timeline Visualization */}
              {asset.purchaseDate && asset.warrantyExpiry && (
                <div className="mt-6">
                  <WarrantyTimeline
                    purchaseDate={asset.purchaseDate}
                    warrantyStart={asset.purchaseDate}
                    warrantyEnd={asset.warrantyExpiry}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Asset Depreciation */}
          <DepreciationCard asset={asset} />

          {/* End-of-Life Status */}
          <EOLCard asset={asset} />

          {/* Notes */}
          {asset.notes && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-semibold text-secondary-900">Notes</h3>
              </div>
              <div className="card-body">
                <p className="text-secondary-700 leading-relaxed">{asset.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment */}
          <div className="card">
            <div className="card-header bg-gradient-to-r from-purple-50 to-transparent">
              <h3 className="text-lg font-semibold text-secondary-900">Current Assignment</h3>
            </div>
            <div className="card-body">
              {asset.assignedTo ? (
                <div>
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-purple-50 to-transparent rounded-lg">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {asset.assignedTo.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <Link
                        to={`/users/${asset.assignedTo._id}`}
                        className="font-semibold text-purple-600 hover:text-purple-700 hover:underline block"
                      >
                        {asset.assignedTo.name}
                      </Link>
                      <p className="text-sm text-secondary-500">{asset.assignedTo.email}</p>
                    </div>
                  </div>
                  {asset.assignedDate && (
                    <div className="flex items-center gap-2 text-sm text-secondary-600 mb-4 px-3">
                      <FiCheckCircle className="text-emerald-500" size={16} />
                      <span>Assigned on {format(new Date(asset.assignedDate), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  {canManage() && (
                    <button
                      onClick={handleUnassign}
                      disabled={unassignMutation.isPending}
                      className="btn btn-outline w-full flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    >
                      <FiUserMinus />
                      Unassign Asset
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FiUser className="mx-auto text-secondary-300 mb-3" size={48} />
                  <p className="text-secondary-500 font-medium">Not assigned</p>
                  <p className="text-sm text-secondary-400 mt-1">This asset is available</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {canManage() && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-secondary-900">Quick Actions</h3>
              </div>
              <div className="card-body space-y-2">
                <button 
                  onClick={handleEdit}
                  className="w-full btn btn-outline flex items-center justify-center gap-2"
                >
                  <FiEdit size={16} />
                  Edit Details
                </button>
                <button 
                  onClick={handleAssign}
                  className="w-full btn btn-outline flex items-center justify-center gap-2"
                  disabled={asset.status !== 'available' && !asset.assignedTo}
                >
                  <FiUser size={16} />
                  {asset.assignedTo ? 'Reassign' : 'Assign Asset'}
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="w-full btn btn-outline flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                >
                  <FiTrash2 size={16} />
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Asset'}
                </button>
              </div>
            </div>
          )}

          {/* QR Code */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">QR Code</h3>
            </div>
            <div className="card-body">
              <QRCodeGenerator 
                asset={asset} 
                size={200}
                title={`${asset.name} - QR Code`}
                showAssetInfo={true}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-secondary-900">Record Information</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Created</p>
                <p className="text-sm font-semibold text-secondary-900">
                  {format(new Date(asset.createdAt), 'MMM dd, yyyy')}
                </p>
                <p className="text-xs text-secondary-500">
                  {format(new Date(asset.createdAt), 'HH:mm:ss')}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500 uppercase tracking-wide mb-1">Last Updated</p>
                <p className="text-sm font-semibold text-secondary-900">
                  {format(new Date(asset.updatedAt), 'MMM dd, yyyy')}
                </p>
                <p className="text-xs text-secondary-500">
                  {format(new Date(asset.updatedAt), 'HH:mm:ss')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowEditModal(false)}
          title="Edit Asset"
          size="lg"
        >
          <AssetForm
            asset={asset}
            onSuccess={() => {
              setShowEditModal(false);
              queryClient.invalidateQueries(['asset', id]);
              queryClient.invalidateQueries(['assets']);
            }}
          />
        </Modal>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignAssetModal
          asset={asset}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            queryClient.invalidateQueries(['asset', id]);
            queryClient.invalidateQueries(['assets']);
          }}
        />
      )}

      {/* Warranty Information Modal */}
      {showWarrantyModal && warrantyData && (
        <Modal
          isOpen={true}
          onClose={() => setShowWarrantyModal(false)}
          title="🔍 Lenovo Warranty Information"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <FiShield className="text-blue-600" size={24} />
                <div>
                  <h4 className="font-bold text-blue-900">{warrantyData.data.productName}</h4>
                  <p className="text-sm text-blue-700">{warrantyData.data.productType}</p>
                </div>
              </div>
              {warrantyData.data.model && (
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Model:</span> {warrantyData.data.model}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Serial Number</p>
                <p className="font-mono font-semibold text-gray-900">{warrantyData.data.serialNumber}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Warranty Status</p>
                <Badge variant={warrantyData.data.isActive ? 'success' : 'danger'}>
                  {warrantyData.data.warrantyStatus}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Warranty Start</p>
                <p className="font-semibold text-gray-900">
                  {warrantyData.data.warrantyStart 
                    ? format(new Date(warrantyData.data.warrantyStart), 'MMM dd, yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Warranty End</p>
                <p className="font-semibold text-gray-900">
                  {warrantyData.data.warrantyEnd 
                    ? format(new Date(warrantyData.data.warrantyEnd), 'MMM dd, yyyy')
                    : 'N/A'}
                </p>
              </div>
            </div>

            {warrantyData.data.warrantyType && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Warranty Type</p>
                <p className="font-semibold text-gray-900">{warrantyData.data.warrantyType}</p>
              </div>
            )}

            {warrantyData.data.warrantyDescription && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-700">{warrantyData.data.warrantyDescription}</p>
              </div>
            )}

            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              Data retrieved from {warrantyData.source} at {format(new Date(warrantyData.fetchedAt), 'MMM dd, yyyy HH:mm:ss')}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium text-blue-900 mb-2">This will update:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Warranty Provider → Lenovo</li>
                {warrantyData.data.warrantyStart && <li>• Purchase Date → {format(new Date(warrantyData.data.warrantyStart), 'MMM dd, yyyy')}</li>}
                {warrantyData.data.warrantyStart && <li>• Warranty Start → {format(new Date(warrantyData.data.warrantyStart), 'MMM dd, yyyy')}</li>}
                {warrantyData.data.warrantyEnd && <li>• Warranty End → {format(new Date(warrantyData.data.warrantyEnd), 'MMM dd, yyyy')}</li>}
                {warrantyData.data.productName && warrantyData.data.productName !== 'Unknown' && <li>• Asset Name → {warrantyData.data.productName}</li>}
                {warrantyData.data.model && warrantyData.data.model !== 'Unknown' && <li>• Model → {warrantyData.data.model}</li>}
                {warrantyData.data.productName?.toLowerCase().includes('thinkpad') && <li>• Manufacturer → Lenovo</li>}
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  handleWarrantyLookup(true);
                  setShowWarrantyModal(false);
                }}
                className="flex-1 btn btn-primary"
                disabled={warrantyLookupMutation.isPending}
              >
                {warrantyLookupMutation.isPending ? 'Updating...' : 'Update Asset with This Data'}
              </button>
              <button
                onClick={() => setShowWarrantyModal(false)}
                className="flex-1 btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssetDetails;

