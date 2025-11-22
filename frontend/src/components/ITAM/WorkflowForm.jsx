/**
 * Workflow Form
 * 
 * Form for creating/editing workflows
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiGitBranch, FiSettings } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const WorkflowForm = ({ workflow, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    type: workflow?.type || 'automation',
    trigger: workflow?.trigger || 'manual',
    triggerCondition: workflow?.triggerCondition || '',
    steps: workflow?.steps || [],
    enabled: workflow?.enabled ?? true,
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (workflow) {
        return itamAPI.workflows.update(workflow.id, data);
      } else {
        return itamAPI.workflows.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success(workflow ? 'Workflow updated' : 'Workflow created');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save workflow');
    },
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Workflow Information</h3>
        
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
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="input"
              required
            >
              <option value="automation">Automation</option>
              <option value="approval">Approval</option>
              <option value="notification">Notification</option>
              <option value="integration">Integration</option>
            </select>
          </div>

          <div>
            <label className="label">
              Trigger <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.trigger}
              onChange={(e) => handleChange('trigger', e.target.value)}
              className="input"
              required
            >
              <option value="manual">Manual</option>
              <option value="event">Event</option>
              <option value="schedule">Schedule</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="label flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => handleChange('enabled', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Enabled</span>
            </label>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="input"
            rows="3"
            placeholder="Workflow description..."
          />
        </div>

        {formData.trigger !== 'manual' && (
          <div>
            <label className="label">Trigger Condition</label>
            <input
              type="text"
              value={formData.triggerCondition}
              onChange={(e) => handleChange('triggerCondition', e.target.value)}
              className="input"
              placeholder="e.g., asset.state == 'Received'"
            />
          </div>
        )}
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
          {saveMutation.isPending ? 'Saving...' : workflow ? 'Update Workflow' : 'Create Workflow'}
        </button>
      </div>
    </form>
  );
};

export default WorkflowForm;

