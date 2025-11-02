import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiDollarSign,
  FiFileText,
  FiCalendar,
  FiDownload,
  FiUpload,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import { contractsAPI, vendorsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import toast from 'react-hot-toast';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { canManage } = useAuth();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Check if creating new contract
  const isNewContract = location.pathname === '/contracts/new';

  // Fetch contract details
  const { data: contract, isLoading: loadingContract } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractsAPI.getById(id).then((res) => res.data.data),
    enabled: !!id && !isNewContract,
  });

  // Fetch vendor details
  const { data: vendor } = useQuery({
    queryKey: ['vendor', contract?.vendorId],
    queryFn: () => vendorsAPI.getById(contract.vendorId).then((res) => res.data.data),
    enabled: !!contract?.vendorId && !isNewContract,
  });

  // Delete contract mutation
  const deleteMutation = useMutation({
    mutationFn: () => contractsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts']);
      toast.success('Contract deleted successfully');
      navigate('/contracts');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete contract');
    },
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: (file) => contractsAPI.uploadDocument(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries(['contract', id]);
      toast.success('Document uploaded successfully');
      setShowDocumentModal(false);
      setSelectedFile(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
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
    if (!expiryDate) return { status: 'unknown', color: 'slate', text: 'No expiry date', urgent: false };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'danger', text: 'Expired', urgent: true };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring-urgent', color: 'danger', text: `${daysUntilExpiry} days left`, urgent: true };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: 'warning', text: `${daysUntilExpiry} days left`, urgent: false };
    } else if (daysUntilExpiry <= 90) {
      return { status: 'expiring-soon', color: 'info', text: `${daysUntilExpiry} days left`, urgent: false };
    } else {
      return { status: 'active', color: 'success', text: `${daysUntilExpiry} days left`, urgent: false };
    }
  };

  if (loadingContract) {
    return <LoadingSpinner fullScreen />;
  }

  if (isNewContract) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/contracts')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Create New Contract</h1>
            <p className="text-secondary-600 mt-2">Add a new contract to the system</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-slate-600">Contract creation form will be implemented here.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Contract not found</p>
        <Link to="/contracts" className="btn btn-primary mt-4">
          Back to Contracts
        </Link>
      </div>
    );
  }

  const expiryStatus = getExpiryStatus(contract.expiryDate);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/contracts')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">{contract.name}</h1>
            <p className="text-secondary-600 mt-2">Contract Details & Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canManage() && (
            <>
              <Link
                to={`/contracts/${id}/edit`}
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

      {/* Alert for expiring contracts */}
      {expiryStatus.urgent && (
        <div className={`card border-2 ${
          expiryStatus.status === 'expired' ? 'border-red-200 bg-red-50' : 'border-warning-200 bg-warning-50'
        }`}>
          <div className="card-body">
            <div className="flex items-center gap-3">
              <FiAlertCircle className={`${
                expiryStatus.status === 'expired' ? 'text-red-600' : 'text-warning-600'
              }`} size={24} />
              <div>
                <h3 className={`font-bold ${
                  expiryStatus.status === 'expired' ? 'text-red-900' : 'text-warning-900'
                }`}>
                  {expiryStatus.status === 'expired' ? 'Contract Expired' : 'Contract Expiring Soon'}
                </h3>
                <p className={`text-sm ${
                  expiryStatus.status === 'expired' ? 'text-red-700' : 'text-warning-700'
                }`}>
                  {expiryStatus.text} - {expiryStatus.status === 'expired' ? 'Please renew or archive this contract' : 'Consider renewing this contract'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Contract Value</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${contract.value ? contract.value.toLocaleString() : '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <FiDollarSign className="text-primary-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Status</p>
                <Badge 
                  variant={getStatusVariant(contract.status)} 
                  text={contract.status || 'Unknown'} 
                />
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <FiCheckCircle className="text-success-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Expiry Status</p>
                <Badge 
                  variant={expiryStatus.color} 
                  text={expiryStatus.text} 
                />
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
                <p className="text-sm font-medium text-slate-600">Documents</p>
                <p className="text-2xl font-bold text-slate-900">{contract.documentCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FiFileText className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-bold text-slate-900">Contract Information</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Contract Name</label>
                  <p className="text-slate-900 font-medium">{contract.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Contract Number</label>
                  <p className="text-slate-900 font-medium">{contract.contractNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Type</label>
                  <Badge variant="info" text={contract.type || 'Unknown'} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <Badge 
                    variant={getStatusVariant(contract.status)} 
                    text={contract.status || 'Unknown'} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Start Date</label>
                  <p className="text-slate-900">
                    {contract.startDate ? format(new Date(contract.startDate), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Expiry Date</label>
                  <p className="text-slate-900">
                    {contract.expiryDate ? format(new Date(contract.expiryDate), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Value</label>
                  <p className="text-slate-900 font-medium">
                    ${contract.value ? contract.value.toLocaleString() : '0'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Auto Renewal</label>
                  <Badge 
                    variant={contract.autoRenewal ? 'success' : 'danger'} 
                    text={contract.autoRenewal ? 'Yes' : 'No'} 
                  />
                </div>
              </div>

              {contract.description && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Description</label>
                  <p className="text-slate-900 mt-1">{contract.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Information */}
          {vendor && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-xl font-bold text-slate-900">Vendor Information</h3>
              </div>
              <div className="card-body">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                    {vendor.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-900">{vendor.name}</h4>
                    <p className="text-slate-600">{vendor.category || 'Unknown Category'}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {vendor.contactEmail && (
                        <div className="flex items-center gap-1">
                          <FiMail size={14} className="text-slate-400" />
                          <a 
                            href={`mailto:${vendor.contactEmail}`}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            {vendor.contactEmail}
                          </a>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-1">
                          <FiPhone size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-600">{vendor.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/vendors/${vendor._id}`}
                    className="btn btn-outline btn-sm"
                  >
                    View Vendor
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Documents</h3>
                {canManage() && (
                  <button
                    onClick={() => setShowDocumentModal(true)}
                    className="btn btn-primary btn-sm flex items-center gap-2"
                  >
                    <FiUpload size={16} />
                    Upload
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {contract.documents && contract.documents.length > 0 ? (
                <div className="space-y-3">
                  {contract.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FiFileText size={20} className="text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{doc.name}</p>
                          <p className="text-sm text-slate-600">
                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Unknown size'} • 
                            {doc.uploadedAt ? format(new Date(doc.uploadedAt), 'MMM dd, yyyy') : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => contractsAPI.downloadDocument(id, doc.id)}
                        className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <FiDownload size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FiFileText size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No documents uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-bold text-slate-900">Contract Timeline</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Contract Created</p>
                    <p className="text-xs text-slate-500">
                      {contract.createdAt ? format(new Date(contract.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
                {contract.startDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Contract Started</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(contract.startDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
                {contract.expiryDate && (
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      expiryStatus.status === 'expired' ? 'bg-red-500' : 
                      expiryStatus.urgent ? 'bg-warning-500' : 'bg-slate-400'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Contract Expires</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(contract.expiryDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
            </div>
            <div className="card-body space-y-3">
              <button className="w-full btn btn-outline flex items-center justify-center gap-2">
                <FiDownload size={16} />
                Download Contract
              </button>
              <button className="w-full btn btn-outline flex items-center justify-center gap-2">
                <FiMail size={16} />
                Email Vendor
              </button>
              {contract.autoRenewal && (
                <button className="w-full btn btn-outline flex items-center justify-center gap-2">
                  <FiCalendar size={16} />
                  Schedule Renewal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Contract"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete <strong>{contract.name}</strong>? 
            This action cannot be undone and will also delete all associated documents.
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
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Contract'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Document Upload Modal */}
      <Modal
        isOpen={showDocumentModal}
        onClose={() => {
          setShowDocumentModal(false);
          setSelectedFile(null);
        }}
        title="Upload Document"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Document
            </label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              accept=".pdf,.doc,.docx,.txt"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDocumentModal(false);
                setSelectedFile(null);
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="btn btn-primary"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ContractDetails;
