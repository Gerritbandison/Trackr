import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiCalendar, FiDollarSign, FiFileText, FiTag, FiGlobe, FiCheckCircle } from 'react-icons/fi';
import { contractsAPI, vendorsAPI } from '../../config/api';
import toast from 'react-hot-toast';

const ContractForm = ({ contract = null, vendorId = null, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    contractNumber: '',
    type: 'hardware',
    status: 'pending',
    vendorId: vendorId || '',
    startDate: '',
    expiryDate: '',
    value: '',
    autoRenewal: false,
    description: '',
  });

  // Fetch vendors for dropdown
  const { data: vendorsData } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsAPI.getAll({ limit: 1000 }).then((res) => res.data.data || res.data || []),
  });

  const vendors = vendorsData || [];

  // Initialize form data when contract prop changes
  useEffect(() => {
    if (contract) {
      setFormData({
        name: contract.name || '',
        contractNumber: contract.contractNumber || '',
        type: contract.type || 'hardware',
        status: contract.status || 'pending',
        vendorId: contract.vendorId || contract.vendor?._id || vendorId || '',
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
        expiryDate: contract.expiryDate ? new Date(contract.expiryDate).toISOString().split('T')[0] : '',
        value: contract.value || '',
        autoRenewal: contract.autoRenewal || false,
        description: contract.description || '',
      });
    } else if (vendorId) {
      setFormData(prev => ({
        ...prev,
        vendorId: vendorId,
      }));
    }
  }, [contract, vendorId]);

  const mutation = useMutation({
    mutationFn: (data) => {
      // Clean the data - remove empty strings and convert numbers
      const cleanData = { ...data };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === '' && key !== 'description' && key !== 'contractNumber') {
          delete cleanData[key];
        }
      });
      
      // Convert numbers
      if (cleanData.value) {
        cleanData.value = Number(cleanData.value);
      }

      // Map vendorId to vendor (backend expects 'vendor' field)
      if (cleanData.vendorId) {
        cleanData.vendor = cleanData.vendorId;
        delete cleanData.vendorId;
      }

      if (contract) {
        return contractsAPI.update(contract._id || contract.id, cleanData);
      } else {
        return contractsAPI.create(cleanData);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['contracts']);
      queryClient.invalidateQueries(['vendor-contracts']);
      queryClient.invalidateQueries(['vendor-stats']);
      toast.success(contract ? 'Contract updated successfully!' : 'Contract created successfully!');
      onSuccess?.(response.data.data);
      onClose();
    },
    onError: (error) => {
      console.error('Contract form error:', error);
      const errorData = error.response?.data;
      if (errorData?.errors) {
        const errors = errorData.errors;
        if (Array.isArray(errors)) {
          errors.forEach((err) => {
            const message = typeof err === 'string' ? err : err.msg || err.message || JSON.stringify(err);
            toast.error(message);
          });
        } else if (typeof errors === 'object') {
          Object.keys(errors).forEach(key => {
            const value = errors[key];
            const message = typeof value === 'string' ? value : value.msg || value.message || JSON.stringify(value);
            toast.error(`${key}: ${message}`);
          });
        } else {
          toast.error(String(errors));
        }
      } else {
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Operation failed';
        toast.error(errorMessage);
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Contract name is required');
      return;
    }
    if (!formData.vendorId && !vendorId) {
      toast.error('Vendor is required');
      return;
    }
    if (!formData.startDate) {
      toast.error('Start date is required');
      return;
    }
    if (!formData.expiryDate) {
      toast.error('Expiry date is required');
      return;
    }

    // Validate dates
    const start = new Date(formData.startDate);
    const expiry = new Date(formData.expiryDate);
    if (expiry <= start) {
      toast.error('Expiry date must be after start date');
      return;
    }

    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contract Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiFileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input w-full pl-10"
                placeholder="e.g., Microsoft Office 365 License Agreement"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contract Number
            </label>
            <input
              type="text"
              name="contractNumber"
              value={formData.contractNumber}
              onChange={handleChange}
              className="input w-full"
              placeholder="CON-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Vendor <span className="text-red-500">*</span>
            </label>
            <select
              name="vendorId"
              value={formData.vendorId}
              onChange={handleChange}
              required
              disabled={!!vendorId}
              className="input w-full"
            >
              <option value="">Select a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor._id || vendor.id || `vendor-${vendors.indexOf(vendor)}`} value={vendor._id || vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="input w-full"
            >
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="service">Service</option>
              <option value="support">Support</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input w-full"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="renewed">Renewed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contract Value
            </label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input w-full pl-10"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Dates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="input w-full pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Expiry Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                required
                min={formData.startDate}
                className="input w-full pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Additional Information</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="autoRenewal"
              id="autoRenewal"
              checked={formData.autoRenewal}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="autoRenewal" className="text-sm font-medium text-slate-700">
              Auto Renewal
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input w-full"
              placeholder="Additional details about this contract..."
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-outline"
          disabled={mutation.isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {contract ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            contract ? 'Update Contract' : 'Create Contract'
          )}
        </button>
      </div>
    </form>
  );
};

export default ContractForm;

