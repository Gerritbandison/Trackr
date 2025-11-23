/**
 * True-Up Report
 * 
 * Generate true-up reports for software licensing
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiDownload, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Discrepancy {
  id: string;
  name: string;
  installedCount: number;
  licensedCount: number;
}

interface TrueUpReportData {
  totalSoftware?: number;
  compliant?: number;
  discrepancies?: Discrepancy[];
}

interface TrueUpReportProps {
  onClose?: () => void;
}

const TrueUpReport: React.FC<TrueUpReportProps> = ({ onClose }) => {
  const [reportType, setReportType] = useState('all');

  const { data: reportData, isLoading } = useQuery<{ data: TrueUpReportData }>({
    queryKey: ['true-up-report', reportType],
    queryFn: () => itamAPI.software.getTrueUpReport({ type: reportType }),
  });

  const handleExport = () => {
    toast.success('Exporting true-up report...');
    // Export logic would go here
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const report = reportData?.data || {};
  const discrepancies = report.discrepancies || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">True-Up Report</h3>
          <p className="text-sm text-gray-600 mt-1">
            Compare installed software with licensed quantities
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <FiDownload />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="text-sm text-gray-600 mb-1">Total Software</div>
            <div className="text-2xl font-bold text-gray-900">{report.totalSoftware || 0}</div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="text-sm text-gray-600 mb-1">Compliant</div>
            <div className="text-2xl font-bold text-green-600">{report.compliant || 0}</div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="text-sm text-gray-600 mb-1">Discrepancies</div>
            <div className="text-2xl font-bold text-red-600">{discrepancies.length || 0}</div>
          </div>
        </div>
      </div>

      {discrepancies.length > 0 && (
        <div className="card border-l-4 border-red-500">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertCircle className="text-red-600" size={24} />
              <h4 className="text-lg font-semibold text-gray-900">License Discrepancies</h4>
            </div>
            <div className="space-y-3">
              {discrepancies.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Installed: {item.installedCount} | Licensed: {item.licensedCount}
                      </div>
                    </div>
                    <div className="text-red-600 font-semibold">
                      {item.installedCount > item.licensedCount ? '+' : '-'}
                      {Math.abs(item.installedCount - item.licensedCount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {onClose && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default TrueUpReport;
