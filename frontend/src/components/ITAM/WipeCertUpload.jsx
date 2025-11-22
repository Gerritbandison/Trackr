/**
 * Wipe Certificate Upload
 * 
 * Upload wipe certificates for disposed assets
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiUpload, FiFile, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const WipeCertUpload = ({ attestation, onSuccess, onCancel }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      // Find asset ID from attestation
      const assetId = attestation?.assetId || attestation?.asset?.id;
      if (!assetId) {
        throw new Error('Asset ID not found');
      }
      return itamAPI.compliance.uploadWipeCert(assetId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['attestations']);
      queryClient.invalidateQueries(['compliance-stats']);
      toast.success('Wipe certificate uploaded successfully');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload wipe certificate');
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
    uploadMutation.mutate(file);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="text-blue-600 mt-1" size={20} />
          <div>
            <div className="font-medium text-gray-900 mb-1">
              Wipe Certificate Required
            </div>
            <div className="text-sm text-gray-600">
              Disposed assets require a wipe certificate to verify data has been securely
              erased. Upload a PDF or image file as proof.
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="label">
          Wipe Certificate File <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FiUpload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 10MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
          </label>
        </div>
        {fileName && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
            <FiFile className="text-green-600" size={20} />
            <span className="text-sm font-medium text-gray-900">{fileName}</span>
            <FiCheckCircle className="text-green-600 ml-auto" size={20} />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={uploadMutation.isPending || !file}
          className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow"
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Certificate'}
        </button>
      </div>
    </form>
  );
};

export default WipeCertUpload;


