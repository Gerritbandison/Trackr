/**
 * Export Dialog
 * 
 * Export data to S3/Blob storage
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FiDownload, FiDatabase, FiCalendar } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const ExportDialog = ({ onClose }) => {
  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    destination: 's3',
    schedule: 'once',
    scheduleFrequency: 'daily',
    scheduleTime: '00:00',
    includeHistory: false,
    compression: false,
  });

  const exportMutation = useMutation({
    mutationFn: (config) => {
      if (config.schedule === 'once') {
        return itamAPI.reporting.exportData(config);
      } else {
        return itamAPI.reporting.scheduleExport(config);
      }
    },
    onSuccess: () => {
      toast.success(
        exportConfig.schedule === 'once'
          ? 'Export started'
          : 'Scheduled export created'
      );
      onClose?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to export data');
    },
  });

  const handleChange = (field, value) => {
    setExportConfig({ ...exportConfig, [field]: value });
  };

  const handleExport = () => {
    exportMutation.mutate(exportConfig);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-700">
          <strong>Data Export</strong> - Export ITAM data to cloud storage (S3/Blob) for
          backup, analytics, or integration with external systems.
        </div>
      </div>

      {/* Export Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Export Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Format <span className="text-red-500">*</span>
            </label>
            <select
              value={exportConfig.format}
              onChange={(e) => handleChange('format', e.target.value)}
              className="input"
              required
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="parquet">Parquet</option>
              <option value="sql">SQL Dump</option>
            </select>
          </div>

          <div>
            <label className="label">
              Destination <span className="text-red-500">*</span>
            </label>
            <select
              value={exportConfig.destination}
              onChange={(e) => handleChange('destination', e.target.value)}
              className="input"
              required
            >
              <option value="s3">AWS S3</option>
              <option value="blob">Azure Blob</option>
              <option value="gcs">Google Cloud Storage</option>
            </select>
          </div>

          <div>
            <label className="label">
              Schedule <span className="text-red-500">*</span>
            </label>
            <select
              value={exportConfig.schedule}
              onChange={(e) => handleChange('schedule', e.target.value)}
              className="input"
              required
            >
              <option value="once">Once</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>

          {exportConfig.schedule === 'recurring' && (
            <>
              <div>
                <label className="label">Frequency</label>
                <select
                  value={exportConfig.scheduleFrequency}
                  onChange={(e) => handleChange('scheduleFrequency', e.target.value)}
                  className="input"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="label">Time</label>
                <input
                  type="time"
                  value={exportConfig.scheduleTime}
                  onChange={(e) => handleChange('scheduleTime', e.target.value)}
                  className="input"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <label className="label flex items-center gap-2">
              <input
                type="checkbox"
                checked={exportConfig.includeHistory}
                onChange={(e) => handleChange('includeHistory', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Include Historical Data</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label className="label flex items-center gap-2">
              <input
                type="checkbox"
                checked={exportConfig.compression}
                onChange={(e) => handleChange('compression', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Enable Compression</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onClose} className="btn btn-outline">
          Cancel
        </button>
        <button
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
        >
          <FiDownload />
          {exportMutation.isPending
            ? 'Exporting...'
            : exportConfig.schedule === 'once'
            ? 'Export Now'
            : 'Schedule Export'}
        </button>
      </div>
    </div>
  );
};

export default ExportDialog;

