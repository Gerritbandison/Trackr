import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiKey, FiCalendar, FiDollarSign, FiUsers, FiHome, FiMail, FiLink, FiFileText, FiEye, FiEyeOff } from 'react-icons/fi';
import { licensesAPI, departmentsAPI } from '../../config/api';
import toast from 'react-hot-toast';

const LicenseForm = ({ license = null, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'other',
    vendor: '',
    licenseKey: '',
    purchaseDate: '',
    expirationDate: '',
    renewalDate: '',
    cost: '',
    billingCycle: 'annual',
    totalSeats: '',
    status: 'active',
    autoRenew: false,
    department: '',
    purchaseOrderNumber: '',
    contactEmail: '',
    supportUrl: '',
    notes: '',
  });

  // Fetch departments for dropdown
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then((res) => res.data.data || res.data || []),
  });

  // Initialize form data when license prop changes
  useEffect(() => {
    if (license) {
      setFormData({
        name: license.name || '',
        type: license.type || 'other',
        vendor: license.vendor || '',
        licenseKey: license.licenseKey || '',
        purchaseDate: license.purchaseDate ? new Date(license.purchaseDate).toISOString().split('T')[0] : '',
        expirationDate: license.expirationDate ? new Date(license.expirationDate).toISOString().split('T')[0] : '',
        renewalDate: license.renewalDate ? new Date(license.renewalDate).toISOString().split('T')[0] : '',
        cost: license.cost || '',
        billingCycle: license.billingCycle || 'annual',
        totalSeats: license.totalSeats || '',
        status: license.status || 'active',
        autoRenew: license.autoRenew || false,
        department: license.department?._id || license.department || '',
        purchaseOrderNumber: license.purchaseOrderNumber || '',
        contactEmail: license.contactEmail || '',
        supportUrl: license.supportUrl || '',
        notes: license.notes || '',
      });
    }
  }, [license]);

  const mutation = useMutation({
    mutationFn: (data) => {
      // Clean the data - remove empty strings and convert numbers
      const cleanData = { ...data };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === '') {
          delete cleanData[key];
        }
      });
      
      // Convert numbers
      if (cleanData.cost) {
        cleanData.cost = Number(cleanData.cost);
      }
      if (cleanData.totalSeats) {
        cleanData.totalSeats = Number(cleanData.totalSeats);
      }

      if (license) {
        return licensesAPI.update(license._id, cleanData);
      } else {
        return licensesAPI.create(cleanData);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['licenses']);
      queryClient.invalidateQueries(['departments']);
      toast.success(license ? 'License updated successfully!' : 'License created successfully!');
      onSuccess?.(response.data.data);
      onClose();
    },
    onError: (error) => {
      console.error('License form error:', error);
      console.error('Response data:', error.response?.data);
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
      toast.error('License name is required');
      return;
    }
    if (!formData.vendor.trim()) {
      toast.error('Vendor is required');
      return;
    }
    if (!formData.expirationDate) {
      toast.error('Expiration date is required');
      return;
    }
    if (!formData.totalSeats || formData.totalSeats < 1) {
      toast.error('Total seats must be at least 1');
      return;
    }

    console.log('Submitting license data:', formData);
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const licenseTypeOptions = [
    { value: 'microsoft-365', label: 'Microsoft 365', icon: '🔵' },
    { value: 'office', label: 'Microsoft Office', icon: '📄' },
    { value: 'adobe-creative-cloud', label: 'Adobe Creative Cloud', icon: '🎨' },
    { value: 'ringcentral', label: 'RingCentral', icon: '📞' },
    { value: 'zoom', label: 'Zoom', icon: '📹' },
    { value: 'slack', label: 'Slack', icon: '💬' },
    { value: 'jira', label: 'Jira', icon: '🎯' },
    { value: 'confluence', label: 'Confluence', icon: '📚' },
    { value: 'github', label: 'GitHub', icon: '🐙' },
    { value: 'aws', label: 'AWS', icon: '☁️' },
    { value: 'azure', label: 'Azure', icon: '🔷' },
    { value: 'google-workspace', label: 'Google Workspace', icon: '🔍' },
    { value: 'salesforce', label: 'Salesforce', icon: '⚡' },
    { value: 'intune', label: 'Microsoft Intune', icon: '🔒' },
    { value: 'antivirus', label: 'Antivirus', icon: '🛡️' },
    { value: 'vpn', label: 'VPN', icon: '🔐' },
    { value: 'other', label: 'Other', icon: '📦' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-accent-100 rounded-lg flex items-center justify-center">
          <FiKey className="h-5 w-5 text-accent-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {license ? 'Edit License' : 'Add New License'}
          </h2>
          <p className="text-sm text-gray-600">
            {license ? 'Update license information and settings' : 'Create a new software license'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* License Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              License Name *
            </label>
            <div className="relative">
              <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Enter license name"
                required
              />
            </div>
          </div>

          {/* License Type */}
          <div className="space-y-2">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              License Type *
            </label>
            <div className="relative">
              <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input pl-10"
                required
              >
                {licenseTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendor */}
          <div className="space-y-2">
            <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
              Vendor *
            </label>
            <div className="relative">
              <FiHome className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="vendor"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Enter vendor name"
                required
              />
            </div>
          </div>

          {/* License Key */}
          <div className="space-y-2">
            <label htmlFor="licenseKey" className="block text-sm font-medium text-gray-700">
              License Key
            </label>
            <div className="relative">
              <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showLicenseKey ? 'text' : 'password'}
                id="licenseKey"
                name="licenseKey"
                value={formData.licenseKey}
                onChange={handleChange}
                className="input pl-10 pr-10"
                placeholder="Enter license key"
              />
              <button
                type="button"
                onClick={() => setShowLicenseKey(!showLicenseKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showLicenseKey ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">
              Purchase Date
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
              Expiration Date *
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                id="expirationDate"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleChange}
                className="input pl-10"
                required
              />
            </div>
          </div>

          {/* Renewal Date */}
          <div className="space-y-2">
            <label htmlFor="renewalDate" className="block text-sm font-medium text-gray-700">
              Renewal Date
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                id="renewalDate"
                name="renewalDate"
                value={formData.renewalDate}
                onChange={handleChange}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
              Cost
            </label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className="input pl-10"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="space-y-2">
            <label htmlFor="billingCycle" className="block text-sm font-medium text-gray-700">
              Billing Cycle
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="billingCycle"
                name="billingCycle"
                value={formData.billingCycle}
                onChange={handleChange}
                className="input pl-10"
              >
                <option value="monthly">📅 Monthly</option>
                <option value="quarterly">📊 Quarterly</option>
                <option value="annual">📆 Annual</option>
                <option value="one-time">💳 One-time</option>
              </select>
            </div>
          </div>

          {/* Total Seats */}
          <div className="space-y-2">
            <label htmlFor="totalSeats" className="block text-sm font-medium text-gray-700">
              Total Seats *
            </label>
            <div className="relative">
              <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                id="totalSeats"
                name="totalSeats"
                value={formData.totalSeats}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Enter number of seats"
                min="1"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status *
            </label>
            <div className="relative">
              <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input pl-10"
                required
              >
                <option value="active">✅ Active</option>
                <option value="trial">🧪 Trial</option>
                <option value="expired">❌ Expired</option>
                <option value="cancelled">🚫 Cancelled</option>
              </select>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <div className="relative">
              <FiHome className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="input pl-10"
              >
                <option value="">Select department</option>
                {departmentsData?.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Purchase Order Number */}
          <div className="space-y-2">
            <label htmlFor="purchaseOrderNumber" className="block text-sm font-medium text-gray-700">
              Purchase Order Number
            </label>
            <div className="relative">
              <FiFileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="purchaseOrderNumber"
                name="purchaseOrderNumber"
                value={formData.purchaseOrderNumber}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Enter PO number"
              />
            </div>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
              Contact Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Enter contact email"
              />
            </div>
          </div>

          {/* Support URL */}
          <div className="space-y-2">
            <label htmlFor="supportUrl" className="block text-sm font-medium text-gray-700">
              Support URL
            </label>
            <div className="relative">
              <FiLink className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="url"
                id="supportUrl"
                name="supportUrl"
                value={formData.supportUrl}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Enter support URL"
              />
            </div>
          </div>
        </div>

        {/* Auto Renew Checkbox */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoRenew"
            name="autoRenew"
            checked={formData.autoRenew}
            onChange={handleChange}
            className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-gray-300 rounded"
          />
          <label htmlFor="autoRenew" className="text-sm font-medium text-gray-700">
            Auto-renew this license
          </label>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="input"
            placeholder="Enter any additional notes or comments"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {license ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              license ? 'Update License' : 'Create License'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LicenseForm;
