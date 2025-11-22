/**
 * Label Template Form
 * 
 * Form for creating/editing label templates
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiFileText, FiMaximize2 } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const LabelTemplateForm = ({ template, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    standard: template?.standard || 'Code128',
    type: template?.type || 'barcode',
    width: template?.width || 4,
    height: template?.height || 2,
    zplTemplate: template?.zplTemplate || '',
    autoPrint: template?.autoPrint || false,
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (template) {
        return itamAPI.labels.updateTemplate(template.id, data);
      } else {
        return itamAPI.labels.createTemplate(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['label-templates']);
      toast.success(template ? 'Template updated' : 'Template created');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save template');
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
        <h3 className="text-lg font-semibold text-gray-900">Template Information</h3>
        
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
              Standard <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.standard}
              onChange={(e) => handleChange('standard', e.target.value)}
              className="input"
              required
            >
              <option value="Code128">Code128</option>
              <option value="Code39">Code39</option>
              <option value="QR">QR Code</option>
              <option value="DataMatrix">DataMatrix</option>
              <option value="EAN13">EAN-13</option>
            </select>
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
              <option value="barcode">Barcode</option>
              <option value="qr">QR Code</option>
              <option value="rfid">RFID</option>
              <option value="combined">Combined</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="label flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.autoPrint}
                onChange={(e) => handleChange('autoPrint', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Auto-print on Received</span>
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
            placeholder="Template description..."
          />
        </div>
      </div>

      {/* Size */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Label Size</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Width (inches) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="8"
              value={formData.width}
              onChange={(e) => handleChange('width', parseFloat(e.target.value))}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">
              Height (inches) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="8"
              value={formData.height}
              onChange={(e) => handleChange('height', parseFloat(e.target.value))}
              className="input"
              required
            />
          </div>
        </div>
      </div>

      {/* ZPL Template */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">ZPL Template</h3>
        
        <div>
          <label className="label">
            ZPL Code <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.zplTemplate}
            onChange={(e) => handleChange('zplTemplate', e.target.value)}
            className="input font-mono text-sm"
            rows="12"
            placeholder="^XA^FO50,50^BY3^BCN,100,Y,N,N^FD{ASSET_TAG}^FS^XZ"
            required
          />
          <div className="text-sm text-gray-500 mt-2">
            Available variables: {'{ASSET_TAG}'}, {'{SERIAL_NUMBER}'}, {'{MODEL}'}, {'{BARCODE}'}, {'{QR_CODE}'}
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
          {saveMutation.isPending ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </form>
  );
};

export default LabelTemplateForm;

