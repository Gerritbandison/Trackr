/**
 * Audit Pack View
 * 
 * Generate and view audit packs
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiDownload, FiFileText, FiCalendar, FiShield } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import toast from 'react-hot-toast';

const AuditPackView = ({ onClose }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-pack', dateRange],
    queryFn: () =>
      itamAPI.compliance.getAuditPack({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
  });

  const handleExport = () => {
    toast.success('Exporting audit pack...');
    // Export logic would go here
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const auditPack = auditData?.data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Audit Pack</h3>
          <p className="text-sm text-gray-600 mt-1">
            Generate comprehensive audit documentation
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <FiDownload />
          Export Audit Pack
        </button>
      </div>

      {/* Date Range */}
      <div className="card border-2 border-slate-200">
        <div className="card-body">
          <h4 className="font-semibold text-gray-900 mb-4">Date Range</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="text-sm text-gray-600 mb-1">Total Assets</div>
            <div className="text-2xl font-bold text-gray-900">
              {auditPack.totalAssets || 0}
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="text-sm text-gray-600 mb-1">Attestations</div>
            <div className="text-2xl font-bold text-green-600">
              {auditPack.attestations || 0}
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="text-sm text-gray-600 mb-1">Disposals</div>
            <div className="text-2xl font-bold text-blue-600">
              {auditPack.disposals || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Sections */}
      <div className="card border-2 border-slate-200">
        <div className="card-body">
          <h4 className="font-semibold text-gray-900 mb-4">Audit Sections</h4>
          <div className="space-y-3">
            {[
              { name: 'Asset Inventory', count: auditPack.assets || 0 },
              { name: 'Attestations', count: auditPack.attestations || 0 },
              { name: 'Disposal Records', count: auditPack.disposals || 0 },
              { name: 'Wipe Certificates', count: auditPack.wipeCerts || 0 },
              { name: 'Change History', count: auditPack.changes || 0 },
            ].map((section) => (
              <div
                key={section.name}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiFileText className="text-gray-600" size={20} />
                    <span className="font-medium text-gray-900">{section.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{section.count} records</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onClose} className="btn btn-outline">
          Close
        </button>
      </div>
    </div>
  );
};

export default AuditPackView;


