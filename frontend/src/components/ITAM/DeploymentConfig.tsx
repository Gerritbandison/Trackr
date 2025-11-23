/**
 * Deployment Configuration Component
 * 
 * Configures deployment automation rules
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiSave, FiCheckCircle } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const DeploymentConfig = ({ onSuccess }) => {
  const [config, setConfig] = useState({
    autoEnrollMDM: true,
    autoPrintLabel: true,
    autoCreateHandoff: true,
    autoAssignAutopilotTag: true,
    handoffRequiresSignature: true,
    createShippingLabel: false,
    notifyUserOnDeployment: true,
  });

  const queryClient = useQueryClient();

  const { data: existingConfig } = useQuery({
    queryKey: ['deployment-config'],
    queryFn: () => itamAPI.staging.getDeploymentConfig(),
    onSuccess: (data) => {
      if (data?.data) {
        setConfig(data.data);
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data) => itamAPI.staging.saveDeploymentConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['deployment-config']);
      toast.success('Deployment configuration saved');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save configuration');
    },
  });

  const handleChange = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Automation Rules</h3>

        <div className="space-y-4">
          {/* Auto-enroll MDM */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto-enroll in MDM</div>
              <div className="text-sm text-gray-600">
                Automatically enroll device in MDM when moved to staging
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoEnrollMDM}
                onChange={(e) => handleChange('autoEnrollMDM', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Auto-print label */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto-print label</div>
              <div className="text-sm text-gray-600">
                Automatically print asset label when received
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoPrintLabel}
                onChange={(e) => handleChange('autoPrintLabel', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Auto-create handoff */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto-create handoff document</div>
              <div className="text-sm text-gray-600">
                Automatically create handoff document for user signature
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoCreateHandoff}
                onChange={(e) => handleChange('autoCreateHandoff', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Handoff requires signature */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Handoff requires signature</div>
              <div className="text-sm text-gray-600">
                Require user signature before marking asset as in service
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.handoffRequiresSignature}
                onChange={(e) => handleChange('handoffRequiresSignature', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Auto-assign Autopilot tag */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto-assign Autopilot tag</div>
              <div className="text-sm text-gray-600">
                Automatically assign Autopilot group tag based on profile mapping
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoAssignAutopilotTag}
                onChange={(e) => handleChange('autoAssignAutopilotTag', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Create shipping label */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Create shipping label</div>
              <div className="text-sm text-gray-600">
                Automatically create shipping label for remote users
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.createShippingLabel}
                onChange={(e) => handleChange('createShippingLabel', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Notify user */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Notify user on deployment</div>
              <div className="text-sm text-gray-600">
                Send email notification to user when asset is deployed
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifyUserOnDeployment}
                onChange={(e) => handleChange('notifyUserOnDeployment', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiSave />
          {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
};

export default DeploymentConfig;

