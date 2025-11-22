/**
 * Location Form
 * 
 * Form for creating/editing locations
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiMapPin, FiHome, FiBox } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const LocationForm = ({ location, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    code: location?.code || '',
    type: location?.type || 'office',
    parentId: location?.parentId || '',
    address: location?.address || '',
    city: location?.city || '',
    state: location?.state || '',
    zipCode: location?.zipCode || '',
    country: location?.country || 'US',
    contactName: location?.contactName || '',
    contactEmail: location?.contactEmail || '',
    contactPhone: location?.contactPhone || '',
  });

  const queryClient = useQueryClient();

  // Fetch parent locations
  const { data: parentsData } = useQuery({
    queryKey: ['locations-parents', formData.type],
    queryFn: () => itamAPI.locations.getParents({ type: formData.type }),
  });

  const parents = parentsData?.data || [];

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (location) {
        return itamAPI.locations.update(location.id, data);
      } else {
        return itamAPI.locations.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['locations']);
      queryClient.invalidateQueries(['locations-tree']);
      toast.success(location ? 'Location updated' : 'Location created');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save location');
    },
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Update parent options when type changes
  useEffect(() => {
    queryClient.invalidateQueries(['locations-parents', formData.type]);
  }, [formData.type, queryClient]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              className="input"
              required
              placeholder="e.g., NYC-001"
            />
          </div>

          <div>
            <label className="label">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="input"
              required
            >
              <option value="region">Region</option>
              <option value="office">Office</option>
              <option value="room">Room</option>
              <option value="rack">Rack</option>
              <option value="bin">Bin</option>
            </select>
          </div>

          {formData.type !== 'region' && (
            <div>
              <label className="label">Parent Location</label>
              <select
                value={formData.parentId}
                onChange={(e) => handleChange('parentId', e.target.value)}
                className="input"
              >
                <option value="">None (Root)</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name} ({parent.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Address</h3>
        
        <div>
          <label className="label">Street Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="input"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">State</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">ZIP Code</label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => handleChange('zipCode', e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => handleChange('country', e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Contact Name</label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Contact Email</label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Contact Phone</label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow"
        >
          {saveMutation.isPending ? 'Saving...' : location ? 'Update Location' : 'Create Location'}
        </button>
      </div>
    </form>
  );
};

export default LocationForm;

