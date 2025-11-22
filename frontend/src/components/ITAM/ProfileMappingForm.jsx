/**
 * Profile Mapping Form
 * 
 * Maps Asset Class + Company + Role → Intune/ABM/Jamf profile
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiX, FiSave } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const ProfileMappingForm = ({ onSuccess }) => {
  const [mappings, setMappings] = useState([
    {
      assetClass: '',
      company: '',
      role: '',
      mdmProvider: 'Intune',
      profileId: '',
      enabled: true,
    },
  ]);

  const queryClient = useQueryClient();

  const { data: existingMappings } = useQuery({
    queryKey: ['profile-mappings'],
    queryFn: () => itamAPI.staging.getProfileMappings(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => itamAPI.staging.saveProfileMappings(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile-mappings']);
      toast.success('Profile mappings saved');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save mappings');
    },
  });

  const handleAddMapping = () => {
    setMappings([
      ...mappings,
      {
        assetClass: '',
        company: '',
        role: '',
        mdmProvider: 'Intune',
        profileId: '',
        enabled: true,
      },
    ]);
  };

  const handleRemoveMapping = (index) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const handleMappingChange = (index, field, value) => {
    const newMappings = [...mappings];
    newMappings[index][field] = value;
    setMappings(newMappings);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ mappings });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Profile Mappings</h3>
          <button
            type="button"
            onClick={handleAddMapping}
            className="btn btn-sm btn-outline flex items-center gap-2"
          >
            <FiPlus />
            Add Mapping
          </button>
        </div>

        <div className="space-y-3">
          {mappings.map((mapping, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 items-end p-4 bg-gray-50 rounded-lg"
            >
              <div className="col-span-3">
                <label className="label text-xs">Asset Class</label>
                <select
                  value={mapping.assetClass}
                  onChange={(e) => handleMappingChange(index, 'assetClass', e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Select...</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Phone">Phone</option>
                  <option value="Tablet">Tablet</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label text-xs">Company</label>
                <input
                  type="text"
                  value={mapping.company}
                  onChange={(e) => handleMappingChange(index, 'company', e.target.value)}
                  className="input"
                  placeholder="e.g., Signers"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="label text-xs">Role</label>
                <input
                  type="text"
                  value={mapping.role}
                  onChange={(e) => handleMappingChange(index, 'role', e.target.value)}
                  className="input"
                  placeholder="e.g., Engineer"
                />
              </div>
              <div className="col-span-2">
                <label className="label text-xs">MDM Provider</label>
                <select
                  value={mapping.mdmProvider}
                  onChange={(e) => handleMappingChange(index, 'mdmProvider', e.target.value)}
                  className="input"
                >
                  <option value="Intune">Intune</option>
                  <option value="Jamf">Jamf</option>
                  <option value="ABM">ABM</option>
                  <option value="SCCM">SCCM</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label text-xs">Profile ID</label>
                <input
                  type="text"
                  value={mapping.profileId}
                  onChange={(e) => handleMappingChange(index, 'profileId', e.target.value)}
                  className="input"
                  placeholder="e.g., PROD-ENG-LAPTOP"
                  required
                />
              </div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => handleRemoveMapping(index)}
                  className="btn btn-sm btn-outline text-red-600 hover:bg-red-50"
                >
                  <FiX />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Existing Mappings */}
      {existingMappings?.data?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Existing Mappings</h4>
          <div className="space-y-2">
            {existingMappings.data.map((mapping, index) => (
              <div
                key={index}
                className="p-3 bg-white border border-gray-200 rounded-lg text-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{mapping.assetClass}</span> +{' '}
                    <span className="font-medium">{mapping.company}</span> +{' '}
                    <span className="font-medium">{mapping.role || 'Any'}</span> →{' '}
                    <span className="text-primary-600">{mapping.mdmProvider}</span>:{' '}
                    <span className="font-mono">{mapping.profileId}</span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      mapping.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {mapping.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiSave />
          {saveMutation.isPending ? 'Saving...' : 'Save Mappings'}
        </button>
      </div>
    </form>
  );
};

export default ProfileMappingForm;

