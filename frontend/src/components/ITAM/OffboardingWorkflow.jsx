/**
 * Offboarding Workflow
 * 
 * Configure and execute offboarding workflows
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiUser, FiCheckCircle, FiXCircle, FiSettings, FiPlay } from 'react-icons/fi';
import { itamAPI, usersAPI } from '../../config/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

const OffboardingWorkflow = ({ onClose }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [workflowSteps, setWorkflowSteps] = useState([
    { id: 'revoke-access', name: 'Revoke Access', enabled: true },
    { id: 'disable-accounts', name: 'Disable Accounts', enabled: true },
    { id: 'reclaim-assets', name: 'Reclaim Assets', enabled: true },
    { id: 'wipe-devices', name: 'Wipe Devices', enabled: false },
    { id: 'transfer-licenses', name: 'Transfer Licenses', enabled: true },
    { id: 'archive-data', name: 'Archive Data', enabled: false },
  ]);

  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => usersAPI.getAll({ limit: 100 }),
  });

  const users = usersData?.data?.data || [];

  // Execute workflow mutation
  const executeMutation = useMutation({
    mutationFn: (data) => itamAPI.security.executeOffboarding(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Offboarding workflow executed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to execute workflow');
    },
  });

  const toggleStep = (stepId) => {
    setWorkflowSteps((steps) =>
      steps.map((step) =>
        step.id === stepId ? { ...step, enabled: !step.enabled } : step
      )
    );
  };

  const handleExecute = () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    const enabledSteps = workflowSteps.filter((step) => step.enabled).map((step) => step.id);
    
    executeMutation.mutate({
      userId: selectedUser,
      steps: enabledSteps,
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-700">
          <strong>Offboarding Workflow</strong> automates the process of revoking access,
          reclaiming assets, and transferring licenses when a user leaves the organization.
        </div>
      </div>

      {/* User Selection */}
      <div>
        <label className="label">
          Select User <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="input"
          required
        >
          <option value="">Select user to offboard...</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.upn})
            </option>
          ))}
        </select>
      </div>

      {/* Workflow Steps */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Steps</h3>
        <div className="space-y-3">
          {workflowSteps.map((step) => (
            <div
              key={step.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleStep(step.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      step.enabled
                        ? 'bg-primary-600 border-primary-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {step.enabled && <FiCheckCircle className="text-white" size={14} />}
                  </button>
                  <span className="font-medium text-gray-900">{step.name}</span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    step.enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {step.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onClose} className="btn btn-outline">
          Cancel
        </button>
        <button
          onClick={handleExecute}
          disabled={executeMutation.isPending || !selectedUser}
          className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
        >
          <FiPlay />
          {executeMutation.isPending ? 'Executing...' : 'Execute Workflow'}
        </button>
      </div>
    </div>
  );
};

export default OffboardingWorkflow;

