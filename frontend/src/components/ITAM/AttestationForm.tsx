/**
 * Attestation Form
 * 
 * Form for creating/completing attestations
 */

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiCalendar, FiUser, FiShield, FiFileText } from 'react-icons/fi';
import { itamAPI, usersAPI } from '../../config/api';
import toast from 'react-hot-toast';

const AttestationForm = ({ attestation, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: attestation?.name || '',
    type: attestation?.type || 'quarterly',
    description: attestation?.description || '',
    assignedTo: attestation?.assignedTo?.id || '',
    dueDate: attestation?.dueDate || '',
    completedDate: attestation?.completedDate || '',
    notes: attestation?.notes || '',
    confirmed: attestation?.confirmed || false,
  });

  const queryClient = useQueryClient();

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => usersAPI.getAll({ limit: 100 }),
  });

  const users = usersData?.data?.data || [];

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (attestation) {
        // Complete attestation
        return itamAPI.compliance.completeAttestation(attestation.id, data);
      } else {
        // Create attestation
        return itamAPI.compliance.createAttestation(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['attestations']);
      queryClient.invalidateQueries(['compliance-stats']);
      toast.success(attestation ? 'Attestation completed' : 'Attestation created');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save attestation');
    },
  });

  useEffect(() => {
    if (attestation && !attestation.completedDate) {
      // Set default completion date to today
      setFormData((prev) => ({
        ...prev,
        completedDate: new Date().toISOString().split('T')[0],
      }));
    }
  }, [attestation]);

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
              disabled={!!attestation}
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
              disabled={!!attestation}
            >
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="disposal">Disposal</option>
              <option value="compliance">Compliance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">
              Assigned To <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => handleChange('assignedTo', e.target.value)}
              className="input"
              required
              disabled={!!attestation}
            >
              <option value="">Select user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.upn})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="input"
              required
              disabled={!!attestation}
            />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="input"
            rows="3"
            placeholder="Attestation description..."
            disabled={!!attestation}
          />
        </div>
      </div>

      {/* Completion Info (if completing) */}
      {attestation && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Completion Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Completed Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.completedDate}
                onChange={(e) => handleChange('completedDate', e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.confirmed}
                  onChange={(e) => handleChange('confirmed', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>I confirm this attestation is accurate</span>
              </label>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="input"
              rows="4"
              placeholder="Additional notes or comments..."
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saveMutation.isPending || (attestation && !formData.confirmed)}
          className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow"
        >
          {saveMutation.isPending
            ? 'Saving...'
            : attestation
            ? 'Complete Attestation'
            : 'Create Attestation'}
        </button>
      </div>
    </form>
  );
};

export default AttestationForm;

