/**
 * PO Ingestion Form
 * 
 * Form for ingesting purchase orders from ERP or manual entry
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiUpload, FiFileText, FiX } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const POIngestionForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    poNumber: '',
    vendor: '',
    vendorEmail: '',
    ingestionMethod: 'manual', // 'manual', 'email', 'api', 'file'
    date: new Date().toISOString().split('T')[0],
    items: [{ sku: '', model: '', quantity: 1, unitCost: 0 }],
  });
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();

  const ingestionMutation = useMutation({
    mutationFn: (data) => itamAPI.receiving.ingestPO(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expected-assets']);
      toast.success('PO ingested successfully');
      onSuccess?.(formData);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to ingest PO');
    },
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { sku: '', model: '', quantity: 1, unitCost: 0 }],
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      // Auto-parse if CSV/Excel
      if (uploadedFile.name.endsWith('.csv')) {
        // Parse CSV (simplified - would need proper CSV parser)
        toast.info('CSV parsing not yet implemented');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      file: file,
    };

    // Convert to FormData if file upload
    if (file && formData.ingestionMethod === 'file') {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('poNumber', formData.poNumber);
      formDataObj.append('vendor', formData.vendor);
      Object.keys(formData).forEach((key) => {
        if (key !== 'items' && key !== 'file') {
          formDataObj.append(key, formData[key]);
        }
      });
      formDataObj.append('items', JSON.stringify(formData.items));
      ingestionMutation.mutate(formDataObj);
    } else {
      ingestionMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PO Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">PO Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              PO Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.poNumber}
              onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">
              Vendor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Vendor Email</label>
            <input
              type="email"
              value={formData.vendorEmail}
              onChange={(e) => setFormData({ ...formData, vendorEmail: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">PO Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Ingestion Method</label>
            <select
              value={formData.ingestionMethod}
              onChange={(e) => setFormData({ ...formData, ingestionMethod: e.target.value })}
              className="input"
            >
              <option value="manual">Manual Entry</option>
              <option value="email">Email Parser</option>
              <option value="api">API Integration</option>
              <option value="file">File Upload (CSV/Excel)</option>
            </select>
          </div>
        </div>
      </div>

      {/* File Upload */}
      {formData.ingestionMethod === 'file' && (
        <div>
          <label className="label">Upload PO File</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400">
            <div className="space-y-1 text-center">
              <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">CSV, Excel up to 10MB</p>
              {file && (
                <p className="text-sm text-gray-700 mt-2">
                  <FiFileText className="inline mr-1" />
                  {file.name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PO Items */}
      {formData.ingestionMethod !== 'file' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">PO Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="btn btn-sm btn-outline"
            >
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                <div className="col-span-4">
                  <label className="label text-xs">SKU/Model</label>
                  <input
                    type="text"
                    value={item.model}
                    onChange={(e) => handleItemChange(index, 'model', e.target.value)}
                    className="input"
                    placeholder="e.g., Lenovo ThinkPad E14"
                  />
                </div>
                <div className="col-span-2">
                  <label className="label text-xs">SKU</label>
                  <input
                    type="text"
                    value={item.sku}
                    onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                    className="input"
                  />
                </div>
                <div className="col-span-2">
                  <label className="label text-xs">Quantity</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="input"
                    min="1"
                  />
                </div>
                <div className="col-span-3">
                  <label className="label text-xs">Unit Cost</label>
                  <input
                    type="number"
                    value={item.unitCost}
                    onChange={(e) => handleItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                    className="input"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="btn btn-sm btn-outline text-red-600 hover:bg-red-50"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={ingestionMutation.isPending}
          className="btn btn-primary"
        >
          {ingestionMutation.isPending ? 'Ingesting...' : 'Ingest PO'}
        </button>
      </div>
    </form>
  );
};

export default POIngestionForm;

