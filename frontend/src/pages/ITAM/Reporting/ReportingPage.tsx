/**
 * Reporting & BI Page
 * 
 * Features:
 * - Parameterized dashboards
 * - Export to S3/Blob
 * - Power BI semantic model (star schema)
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  FiBarChart2,
  FiDownload,
  FiFileText,
  FiFilter,
  FiCalendar,
  FiDatabase,
  FiTrendingUp,
  FiSettings,
  FiRefreshCw,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import toast from 'react-hot-toast';
import ReportBuilder from '../../../components/ITAM/ReportBuilder';
import ExportDialog from '../../../components/ITAM/ExportDialog';

const ReportingPage = () => {
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => itamAPI.reporting.getDashboard({}),
  });

  // Fetch scheduled exports
  const { data: scheduledExportsData } = useQuery({
    queryKey: ['scheduled-exports'],
    queryFn: () => itamAPI.reporting.getScheduledExports(),
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (params) => itamAPI.reporting.exportData(params),
    onSuccess: () => {
      toast.success('Export started');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start export');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const dashboard = dashboardData?.data || {};
  const scheduledExports = scheduledExportsData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Reporting & BI
          </h1>
          <p className="text-gray-600 mt-2">
            Generate reports, dashboards, and export data for analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportDialog(true)}
            className="btn btn-outline flex items-center gap-2 hover:shadow-md transition-shadow"
          >
            <FiDownload />
            Export Data
          </button>
          <button
            onClick={() => {
              setSelectedReport(null);
              setShowReportBuilder(true);
            }}
            className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FiBarChart2 />
            New Report
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Assets</div>
                <div className="text-2xl font-bold text-gray-900">
                  {dashboard.totalAssets || 0}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiDatabase className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Value</div>
                <div className="text-2xl font-bold text-green-600">
                  ${dashboard.totalValue?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiTrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Active Reports</div>
                <div className="text-2xl font-bold text-purple-600">
                  {dashboard.activeReports || 0}
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiBarChart2 className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Scheduled Exports</div>
                <div className="text-2xl font-bold text-orange-600">
                  {scheduledExports.length || 0}
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <FiCalendar className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Exports */}
      {scheduledExports.length > 0 && (
        <div className="card border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiCalendar className="text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Scheduled Exports</h3>
            </div>
            <div className="space-y-2">
              {scheduledExports.slice(0, 5).map((export_) => (
                <div
                  key={export_.id}
                  className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{export_.name}</div>
                      <div className="text-sm text-gray-600">
                        {export_.format} • {export_.destination}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Next: {new Date(export_.nextRun).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Reports */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Quick Reports</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Asset Inventory', icon: FiDatabase, type: 'inventory' },
              { name: 'Financial Summary', icon: FiTrendingUp, type: 'financial' },
              { name: 'Compliance Report', icon: FiBarChart2, type: 'compliance' },
              { name: 'Software Licenses', icon: FiFileText, type: 'software' },
              { name: 'Warranty Status', icon: FiBarChart2, type: 'warranty' },
              { name: 'Asset Lifecycle', icon: FiRefreshCw, type: 'lifecycle' },
            ].map((report) => (
              <button
                key={report.type}
                onClick={() => {
                  setSelectedReport(report);
                  setShowReportBuilder(true);
                }}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <report.icon className="text-primary-600" size={20} />
                  </div>
                  <div className="font-medium text-gray-900">{report.name}</div>
                </div>
                <div className="text-sm text-gray-500">Generate report</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Power BI Integration */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Power BI Integration</h2>
              <p className="text-sm text-gray-600 mt-1">
                Connect to Power BI for advanced analytics and visualizations
              </p>
            </div>
            <button
              onClick={() => {
                itamAPI.reporting.getPowerBISchema().then((response) => {
                  toast.success('Power BI schema downloaded');
                  // In real implementation, this would download the schema file
                });
              }}
              className="btn btn-outline flex items-center gap-2 hover:shadow-md transition-shadow"
            >
              <FiDownload />
              Download Schema
            </button>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-gray-700">
              <strong>Star Schema Model:</strong> The Power BI semantic model uses a star schema
              design with fact tables (Assets, Transactions, Events) and dimension tables
              (Users, Locations, Contracts, Software). This enables efficient querying and
              visualization of ITAM data.
            </div>
          </div>
        </div>
      </div>

      {/* Report Builder Modal */}
      <Modal
        isOpen={showReportBuilder}
        onClose={() => {
          setShowReportBuilder(false);
          setSelectedReport(null);
        }}
        title={selectedReport ? `Generate ${selectedReport.name}` : 'Build Report'}
        size="xl"
      >
        <ReportBuilder
          report={selectedReport}
          onClose={() => {
            setShowReportBuilder(false);
            setSelectedReport(null);
          }}
        />
      </Modal>

      {/* Export Dialog Modal */}
      <Modal
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        title="Export Data"
        size="lg"
      >
        <ExportDialog onClose={() => setShowExportDialog(false)} />
      </Modal>
    </div>
  );
};

export default ReportingPage;

