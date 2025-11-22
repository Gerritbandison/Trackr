/**
 * Discovery Source Configuration Component
 * 
 * Configures discovery sources (Intune, Jamf, SCCM, Lansweeper, etc.)
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSettings, FiCheckCircle, FiX } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const DiscoverySourceConfig = ({ sources, onSuccess }) => {
  const [configs, setConfigs] = useState(
    sources.map((source) => ({
      name: source.name,
      enabled: source.enabled || false,
      syncInterval: source.syncInterval || 3600, // minutes
      autoMatch: source.autoMatch || true,
      createNewAssets: source.createNewAssets || false,
      config: source.config || {},
    }))
  );

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => itamAPI.discovery.saveSources(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['discovery-sources']);
      toast.success('Discovery sources configured');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save configuration');
    },
  });

  const handleChange = (index, field, value) => {
    const newConfigs = [...configs];
    newConfigs[index][field] = value;
    setConfigs(newConfigs);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ sources: configs });
  };

  const availableSources = [
    { name: 'Intune', type: 'MDM' },
    { name: 'Entra ID', type: 'Identity' },
    { name: 'Jamf', type: 'MDM' },
    { name: 'SCCM', type: 'MDM' },
    { name: 'Lansweeper', type: 'Discovery' },
    { name: 'SNMP', type: 'Discovery' },
    { name: 'VMware', type: 'Virtualization' },
    { name: 'Azure', type: 'Cloud' },
    { name: 'AWS', type: 'Cloud' },
    { name: 'GCP', type: 'Cloud' },
    { name: 'Defender', type: 'EDR' },
    { name: 'CrowdStrike', type: 'EDR' },
    { name: 'SSO', type: 'Identity' },
    { name: 'CASB', type: 'Security' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Configure Discovery Sources</h3>

        {configs.map((config, index) => (
          <div key={config.name} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-gray-900">{config.name}</div>
                <div className="text-sm text-gray-600">
                  {availableSources.find((s) => s.name === config.name)?.type || 'Unknown'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleChange(index, 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {config.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Sync Interval (minutes)</label>
                  <input
                    type="number"
                    value={config.syncInterval}
                    onChange={(e) => handleChange(index, 'syncInterval', parseInt(e.target.value) || 3600)}
                    className="input"
                    min="15"
                    step="15"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.autoMatch}
                    onChange={(e) => handleChange(index, 'autoMatch', e.target.checked)}
                    className="rounded"
                    id={`autoMatch-${index}`}
                  />
                  <label htmlFor={`autoMatch-${index}`} className="text-sm text-gray-700">
                    Auto-match discovered devices to existing assets
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.createNewAssets}
                    onChange={(e) => handleChange(index, 'createNewAssets', e.target.checked)}
                    className="rounded"
                    id={`createNew-${index}`}
                  />
                  <label htmlFor={`createNew-${index}`} className="text-sm text-gray-700">
                    Create new assets for unmatched discoveries
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiCheckCircle />
          {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
};

export default DiscoverySourceConfig;

