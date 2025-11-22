/**
 * Report Builder
 * 
 * Build parameterized reports
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FiFilter, FiCalendar, FiDownload } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import toast from 'react-hot-toast';

const ReportBuilder = ({ report, onClose }) => {
  const [filters, setFilters] = useState({
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    assetClass: '',
    location: '',
    status: '',
    format: 'pdf',
  });

  const generateMutation = useMutation({
    mutationFn: (params) => itamAPI.reporting.exportData(params),
    onSuccess: () => {
      toast.success('Report generated successfully');
      onClose?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    },
  });

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFilters({
        ...filters,
        [parent]: {
          ...filters[parent],
          [child]: value,
        },
      });
    } else {
      setFilters({ ...filters, [field]: value });
    }
  };

  const handleGenerate = () => {
    generateMutation.mutate({
      type: report?.type || 'custom',
      filters,
      format: filters.format,
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-700">
          <strong>Report Builder</strong> - Configure parameters to generate custom reports.
          Reports can be exported in PDF, Excel, or CSV formats.
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Report Parameters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={filters.dateRange.startDate}
              onChange={(e) => handleChange('dateRange.startDate', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={filters.dateRange.endDate}
              onChange={(e) => handleChange('dateRange.endDate', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Asset Class</label>
            <select
              value={filters.assetClass}
              onChange={(e) => handleChange('assetClass', e.target.value)}
              className="input"
            >
              <option value="">All Classes</option>
              <option value="laptop">Laptop</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="server">Server</option>
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="In Service">In Service</option>
              <option value="In Staging">In Staging</option>
              <option value="In Repair">In Repair</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>

          <div>
            <label className="label">Export Format</label>
            <select
              value={filters.format}
              onChange={(e) => handleChange('format', e.target.value)}
              className="input"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onClose} className="btn btn-outline">
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
        >
          <FiDownload />
          {generateMutation.isPending ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );
};

export default ReportBuilder;

