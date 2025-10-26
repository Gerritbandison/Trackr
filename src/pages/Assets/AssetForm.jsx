import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FiShoppingCart, FiExternalLink } from 'react-icons/fi';
import { assetsAPI } from '../../config/api';
import toast from 'react-hot-toast';
import CDWProductSelector from '../../components/Purchasing/CDWProductSelector';

const AssetForm = ({ asset, onSuccess }) => {
  const [showCDWModal, setShowCDWModal] = useState(false);
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    category: asset?.category || 'laptop',
    manufacturer: asset?.manufacturer || '',
    model: asset?.model || '',
    serialNumber: asset?.serialNumber || '',
    assetTag: asset?.assetTag || '',
    purchaseDate: asset?.purchaseDate?.split('T')[0] || '',
    purchasePrice: asset?.purchasePrice || '',
    warrantyExpiry: asset?.warrantyExpiry?.split('T')[0] || '',
    status: asset?.status || 'available',
    condition: asset?.condition || 'excellent',
    location: asset?.location || '',
    notes: asset?.notes || '',
    vendor: asset?.vendor || '',
    cdwSku: asset?.cdwSku || '',
    cdwUrl: asset?.cdwUrl || '',
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      asset ? assetsAPI.update(asset._id, data) : assetsAPI.create(data),
    onSuccess: () => {
      toast.success(asset ? 'Asset updated!' : 'Asset created!');
      onSuccess();
    },
    onError: (error) => {
      console.error('Asset form error:', error);
      console.error('Response data:', error.response?.data);
      
      const errorData = error.response?.data;
      
      // Handle validation errors
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
        
        // Make duplicate error messages more user-friendly
        if (errorMessage.includes('Duplicate') && errorMessage.includes('assetTag')) {
          toast.error('This Asset Tag is already in use. Please use a different tag or leave it blank to auto-generate one.');
        } else if (errorMessage.includes('Duplicate') && errorMessage.includes('serialNumber')) {
          toast.error('This Serial Number is already in use. Each device must have a unique serial number.');
        } else {
          toast.error(errorMessage);
        }
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clean up the data before sending
    const cleanData = { ...formData };
    
    // Remove empty strings for optional fields
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === '') {
        delete cleanData[key];
      }
    });
    
    // Convert purchasePrice to number if it exists
    if (cleanData.purchasePrice) {
      cleanData.purchasePrice = Number(cleanData.purchasePrice);
    }
    
    console.log('Submitting asset data:', cleanData);
    mutation.mutate(cleanData);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCDWProductSelect = (productData) => {
    setFormData(prev => ({
      ...prev,
      ...productData,
      // Preserve existing values if they exist
      name: productData.name || prev.name,
      manufacturer: productData.manufacturer || prev.manufacturer,
      model: productData.model || prev.model,
      category: productData.category || prev.category,
      purchasePrice: productData.purchasePrice || prev.purchasePrice,
      notes: productData.notes || prev.notes,
      vendor: productData.vendor || prev.vendor,
      cdwSku: productData.cdwSku || prev.cdwSku,
      cdwUrl: productData.cdwUrl || prev.cdwUrl,
    }));
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
      {/* CDW Purchase Button */}
      {!asset && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Purchase from CDW</h3>
              <p className="text-sm text-gray-600 mt-1">
                Browse CDW's catalog and automatically populate asset details
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCDWModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <FiShoppingCart />
              Buy from CDW
            </button>
          </div>
        </div>
      )}

      {/* Vendor Info */}
      {formData.vendor && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-blue-900">Vendor:</span>
            <span className="text-blue-800">{formData.vendor}</span>
            {formData.cdwSku && (
              <>
                <span className="text-blue-600">•</span>
                <span className="text-blue-800">SKU: {formData.cdwSku}</span>
              </>
            )}
            {formData.cdwUrl && (
              <a
                href={formData.cdwUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-auto"
              >
                View on CDW
                <FiExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Asset Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="laptop">Laptop</option>
            <option value="desktop">Desktop</option>
            <option value="monitor">Monitor</option>
            <option value="phone">Phone</option>
            <option value="tablet">Tablet</option>
            <option value="dock">Dock</option>
            <option value="keyboard">Keyboard</option>
            <option value="mouse">Mouse</option>
            <option value="headset">Headset</option>
            <option value="webcam">Webcam</option>
            <option value="accessory">Accessory</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Manufacturer *</label>
          <input
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Model *</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            required
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Serial Number</label>
          <input
            type="text"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            className="input"
            placeholder="e.g., SN123456789"
          />
          <p className="text-xs text-secondary-500 mt-1">Device serial number (optional)</p>
        </div>
        <div>
          <label className="label">Asset Tag</label>
          <input
            type="text"
            name="assetTag"
            value={formData.assetTag}
            onChange={handleChange}
            className="input"
            placeholder="Leave empty to auto-generate"
          />
          <p className="text-xs text-secondary-500 mt-1">Must be unique. Leave blank to auto-generate.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Purchase Date</label>
          <input
            type="date"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label className="label">Purchase Price</label>
          <input
            type="number"
            name="purchasePrice"
            value={formData.purchasePrice}
            onChange={handleChange}
            className="input"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Vendor</label>
          <input
            type="text"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            className="input"
            placeholder="e.g., CDW, Dell, Amazon"
          />
        </div>
        <div>
          <label className="label">CDW SKU</label>
          <input
            type="text"
            name="cdwSku"
            value={formData.cdwSku}
            onChange={handleChange}
            className="input"
            placeholder="CDW product SKU"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Warranty Expiry</label>
          <input
            type="date"
            name="warrantyExpiry"
            value={formData.warrantyExpiry}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label className="label">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input"
          >
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="repair">In Repair</option>
            <option value="retired">Retired</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div>
          <label className="label">Condition</label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="input"
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="input"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn btn-primary"
        >
          {mutation.isPending ? 'Saving...' : asset ? 'Update' : 'Create'}
        </button>
      </div>
    </form>

    {/* CDW Product Selector Modal */}
    <CDWProductSelector
      isOpen={showCDWModal}
      onClose={() => setShowCDWModal(false)}
      onSelectProduct={handleCDWProductSelect}
    />
    </>
  );
};

export default AssetForm;

