/**
 * Webhook Form
 * 
 * Form for creating/editing webhooks
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// Icons removed as they were unused
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const WebhookForm = ({ webhook, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: webhook?.name || '',
    description: webhook?.description || '',
    url: webhook?.url || '',
    events: webhook?.events || [],
    secret: webhook?.secret || '',
    enabled: webhook?.enabled ?? true,
  });

  const queryClient = useQueryClient();

  const availableEvents = [
    'asset.created',
    'asset.updated',
    'asset.deleted',
    'asset.state_changed',
    'user.created',
    'user.updated',
    'contract.renewal_due',
    'warranty.expiring',
    'loaner.overdue',
  ];

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (webhook) {
        return itamAPI.webhooks.update(webhook.id, data);
      } else {
        return itamAPI.webhooks.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks']);
      toast.success(webhook ? 'Webhook updated' : 'Webhook created');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save webhook');
    },
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleEvent = (event) => {
    const events = formData.events.includes(event)
      ? formData.events.filter((e) => e !== event)
      : [...formData.events, event];
    setFormData({ ...formData, events });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Webhook Information</h3>
        
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
            rows="2"
            placeholder="Webhook description..."
          />
        </div>

        <div>
          <label className="label">
            URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => handleChange('url', e.target.value)}
            className="input"
            placeholder="https://example.com/webhook"
            required
          />
        </div>

        <div>
          <label className="label">Secret (Optional)</label>
          <input
            type="password"
            value={formData.secret}
            onChange={(e) => handleChange('secret', e.target.value)}
            className="input"
            placeholder="Webhook secret for signing"
          />
        </div>
      </div>

      {/* Events */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Subscribed Events</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableEvents.map((event) => (
            <label
              key={event}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.events.includes(event)}
                onChange={() => toggleEvent(event)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-900">{event}</span>
            </label>
          ))}
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
          {saveMutation.isPending ? 'Saving...' : webhook ? 'Update Webhook' : 'Create Webhook'}
        </button>
      </div>
    </form>
  );
};

export default WebhookForm;

