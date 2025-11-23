/**
 * Bulk Import Dialog
 * 
 * Import data in bulk with idempotent operations
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FiUpload, FiFile, FiDatabase } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const BulkImportDialog = ({ onClose }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [importConfig, setImportConfig] = useState({
    type: 'assets',
    idempotencyKey: '',
    dryRun: false,
    updateExisting: true,
  });

  const importMutation = useMutation({
    mutationFn: (formData) => itamAPI.apis.bulkImport(formData),
    onSuccess: (response) => {
      const result = response.data;
      toast.success(
        `Import completed: ${result.successCount} succeeded, ${result.errorCount} failed`
      );
      onClose?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to import data');
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', importConfig.type);
    formData.append('idempotencyKey', importConfig.idempotencyKey || `import-${Date.now()}`);
    formData.append('dryRun', importConfig.dryRun);
    formData.append('updateExisting', importConfig.updateExisting);

    importMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-700">
          <strong>Bulk Import</strong> - Import data in bulk with idempotent operations.
          Supports CSV, JSON, and Excel formats. Duplicate detection prevents data duplication.
        </div>
      </div>

      {/* Import Configuration */}
      <div className="space-y-4">
        <div>
          <label className="label">
            Import Type <span className="text-red-500">*</span>
          </label>
          <select
            value={importConfig.type}
            onChange={(e) =>
              setImportConfig({ ...importConfig, type: e.target.value })
            }
            className="input"
            required
          >
            <option value="assets">Assets</option>
            <option value="users">Users</option>
            <option value="contracts">Contracts</option>
            <option value="software">Software</option>
          </select>
        </div>

        <div>
          <label className="label">File</label>
          <div className="mt-2">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FiUpload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV, JSON, Excel (MAX. 10MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".csv,.json,.xlsx,.xls"
                onChange={handleFileChange}
              />
            </label>
          </div>
          {fileName && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
              <FiFile className="text-green-600" size={20} />
              <span className="text-sm font-medium text-gray-900">{fileName}</span>
            </div>
          )}
        </div>

        <div>
          <label className="label">Idempotency Key (Optional)</label>
          <input
            type="text"
            value={importConfig.idempotencyKey}
            onChange={(e) =>
              setImportConfig({ ...importConfig, idempotencyKey: e.target.value })
            }
            className="input"
            placeholder="Auto-generated if not provided"
          />
          <div className="text-sm text-gray-500 mt-1">
            Use the same key to retry an import without creating duplicates
          </div>
        </div>

        <div className="space-y-2">
          <label className="label flex items-center gap-2">
            <input
              type="checkbox"
              checked={importConfig.dryRun}
              onChange={(e) =>
                setImportConfig({ ...importConfig, dryRun: e.target.checked })
              }
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Dry Run (Validate without importing)</span>
          </label>

          <label className="label flex items-center gap-2">
            <input
              type="checkbox"
              checked={importConfig.updateExisting}
              onChange={(e) =>
                setImportConfig({ ...importConfig, updateExisting: e.target.checked })
              }
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Update Existing Records</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onClose} className="btn btn-outline">
          Cancel
        </button>
        <button
          type="submit"
          disabled={importMutation.isPending || !file}
          className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
        >
          <FiDatabase />
          {importMutation.isPending ? 'Importing...' : 'Import Data'}
        </button>
      </div>
    </form>
  );
};

export default BulkImportDialog;

