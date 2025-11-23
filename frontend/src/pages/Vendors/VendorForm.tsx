import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiMail, FiPhone, FiGlobe, FiMapPin, FiUser, FiDollarSign, FiTag, FiStar } from 'react-icons/fi';
import { vendorsAPI } from '../../config/api';
import toast from 'react-hot-toast';

const VendorForm = ({ vendor = null, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    category: 'hardware',
    status: 'active',
    rating: 3,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
    },
    contactPerson: {
      name: '',
      title: '',
      email: '',
      phone: '',
    },
    paymentTerms: 'Net 30',
    customPaymentTerms: '',
    preferredContactMethod: 'email',
    taxId: '',
    notes: '',
  });

  // Initialize form data when vendor prop changes
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        email: vendor.email || vendor.contactEmail || '',
        phone: vendor.phone || '',
        website: vendor.website || '',
        category: vendor.category || 'hardware',
        status: vendor.status || 'active',
        rating: vendor.rating || 3,
        address: {
          street: vendor.address?.street || (typeof vendor.address === 'string' ? vendor.address : ''),
          city: vendor.address?.city || '',
          state: vendor.address?.state || '',
          zipCode: vendor.address?.zipCode || '',
          country: vendor.address?.country || 'United States',
        },
        contactPerson: {
          name: vendor.contactPerson?.name || '',
          title: vendor.contactPerson?.title || '',
          email: vendor.contactPerson?.email || '',
          phone: vendor.contactPerson?.phone || '',
        },
        paymentTerms: vendor.paymentTerms || 'Net 30',
        customPaymentTerms: vendor.customPaymentTerms || '',
        preferredContactMethod: vendor.preferredContactMethod || 'email',
        taxId: vendor.taxId || '',
        notes: vendor.notes || '',
      });
    }
  }, [vendor]);

  const mutation = useMutation({
    mutationFn: (data) => {
      // Clean the data - remove empty strings and prepare nested objects
      const cleanData = { ...data };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === '' && key !== 'customPaymentTerms' && key !== 'taxId' && key !== 'notes') {
          delete cleanData[key];
        }
      });
      
      // Clean address object
      if (cleanData.address) {
        Object.keys(cleanData.address).forEach(key => {
          if (cleanData.address[key] === '') {
            delete cleanData.address[key];
          }
        });
        if (Object.keys(cleanData.address).length === 0) {
          delete cleanData.address;
        }
      }

      // Clean contactPerson object
      if (cleanData.contactPerson) {
        Object.keys(cleanData.contactPerson).forEach(key => {
          if (cleanData.contactPerson[key] === '') {
            delete cleanData.contactPerson[key];
          }
        });
        if (Object.keys(cleanData.contactPerson).length === 0) {
          delete cleanData.contactPerson;
        }
      }

      // Convert rating to number
      if (cleanData.rating) {
        cleanData.rating = Number(cleanData.rating);
      }

      // Remove customPaymentTerms if paymentTerms is not 'Custom'
      if (cleanData.paymentTerms !== 'Custom') {
        delete cleanData.customPaymentTerms;
      }

      if (vendor) {
        return vendorsAPI.update(vendor._id, cleanData);
      } else {
        // For new vendor, ensure createdBy is set (will be set by backend middleware)
        return vendorsAPI.create(cleanData);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['vendors']);
      toast.success(vendor ? 'Vendor updated successfully!' : 'Vendor created successfully!');
      onSuccess?.(response.data.data);
      onClose();
    },
    onError: (error) => {
      console.error('Vendor form error:', error);
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
        if (errorMessage.includes('Duplicate') && errorMessage.includes('email')) {
          toast.error('This email address is already in use. Please use a different email.');
        } else {
          toast.error(errorMessage);
        }
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedChange = (parentKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [field]: value
      }
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
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input w-full"
              placeholder="e.g., Lenovo, CDW, Microsoft"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input w-full"
            >
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="services">Services</option>
              <option value="support">Support</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input w-full pl-10"
                placeholder="contact@vendor.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="input w-full pl-10"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Website
            </label>
            <div className="relative">
              <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="input w-full pl-10"
                placeholder="https://www.vendor.com"
              />
            </div>
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rating (1-5)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                name="rating"
                min="1"
                max="5"
                step="0.5"
                value={formData.rating}
                onChange={handleChange}
                className="flex-1"
              />
              <div className="flex items-center gap-1">
                <FiStar className="text-yellow-400" size={18} />
                <span className="font-semibold w-8">{formData.rating}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Address Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Street Address
          </label>
          <div className="relative">
            <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={formData.address.street}
              onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
              className="input w-full pl-10"
              placeholder="123 Main Street"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
              className="input w-full"
              placeholder="City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
            <input
              type="text"
              value={formData.address.state}
              onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
              className="input w-full"
              placeholder="State"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ZIP Code</label>
            <input
              type="text"
              value={formData.address.zipCode}
              onChange={(e) => handleNestedChange('address', 'zipCode', e.target.value)}
              className="input w-full"
              placeholder="12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
            <input
              type="text"
              value={formData.address.country}
              onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
              className="input w-full"
              placeholder="United States"
            />
          </div>
        </div>
      </div>

      {/* Contact Person */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Contact Person</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={formData.contactPerson.name}
                onChange={(e) => handleNestedChange('contactPerson', 'name', e.target.value)}
                className="input w-full pl-10"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.contactPerson.title}
              onChange={(e) => handleNestedChange('contactPerson', 'title', e.target.value)}
              className="input w-full"
              placeholder="Account Manager"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.contactPerson.email}
              onChange={(e) => handleNestedChange('contactPerson', 'email', e.target.value)}
              className="input w-full"
              placeholder="john.doe@vendor.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.contactPerson.phone}
              onChange={(e) => handleNestedChange('contactPerson', 'phone', e.target.value)}
              className="input w-full"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Payment & Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Payment & Additional Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Payment Terms</label>
            <select
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              className="input w-full"
            >
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {formData.paymentTerms === 'Custom' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Custom Payment Terms</label>
              <input
                type="text"
                name="customPaymentTerms"
                value={formData.customPaymentTerms}
                onChange={handleChange}
                className="input w-full"
                placeholder="Enter custom terms"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Contact Method</label>
            <select
              name="preferredContactMethod"
              value={formData.preferredContactMethod}
              onChange={handleChange}
              className="input w-full"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="mail">Mail</option>
              <option value="fax">Fax</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tax ID</label>
            <input
              type="text"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              className="input w-full"
              placeholder="12-3456789"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="input w-full"
            placeholder="Additional notes about this vendor..."
          />
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
              {vendor ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            vendor ? 'Update Vendor' : 'Create Vendor'
          )}
        </button>
      </div>
    </form>
  );
};

export default VendorForm;

