/**
 * Labels, Barcodes, RFID & QR Page
 * 
 * Features:
 * - Label standards (Code128/QR)
 * - ZPL templates
 * - Auto-print on Received
 * - RFID gate reads (optional)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiPrinter,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiMaximize2,
  FiSettings,
  FiFileText,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import LabelTemplateForm from '../../../components/ITAM/LabelTemplateForm';
import LabelPreview from '../../../components/ITAM/LabelPreview';

const LabelsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch label templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['label-templates', currentPage, searchTerm],
    queryFn: () =>
      itamAPI.labels.getTemplates({
        page: currentPage,
        limit,
        search: searchTerm,
      }),
  });

  // Fetch print jobs
  const { data: printJobsData } = useQuery({
    queryKey: ['print-jobs'],
    queryFn: () => itamAPI.labels.getPrintJobs(),
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => itamAPI.labels.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['label-templates']);
      toast.success('Template deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete template');
    },
  });

  // Print label mutation
  const printMutation = useMutation({
    mutationFn: ({ templateId, assetId }) => itamAPI.labels.printLabel(templateId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries(['print-jobs']);
      toast.success('Label sent to printer');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to print label');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const templates = templatesData?.data?.data || [];
  const pagination = templatesData?.data?.pagination || {};
  const printJobs = printJobsData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Labels & Printing
          </h1>
          <p className="text-gray-600 mt-2">
            Manage label templates, barcodes, and printing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setShowTemplateModal(true);
            }}
            className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FiPlus />
            New Template
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Templates</div>
                <div className="text-2xl font-bold text-gray-900">
                  {templates.length}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiFileText className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Print Jobs Today</div>
                <div className="text-2xl font-bold text-green-600">
                  {printJobs.filter((job) => {
                    const today = new Date();
                    const jobDate = new Date(job.createdAt);
                    return jobDate.toDateString() === today.toDateString();
                  }).length}
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiPrinter className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Active Printers</div>
                <div className="text-2xl font-bold text-purple-600">
                  {printJobs.reduce((acc, job) => {
                    if (!acc.includes(job.printerName)) {
                      acc.push(job.printerName);
                    }
                    return acc;
                  }, []).length}
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiPrinter className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Label Standards</div>
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(templates.map((t) => t.standard)).size}
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <FiMaximize2 className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Print Jobs */}
      {printJobs.length > 0 && (
        <div className="card border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiPrinter className="text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Recent Print Jobs</h3>
            </div>
            <div className="space-y-2">
              {printJobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{job.assetTag}</div>
                      <div className="text-sm text-gray-600">
                        {job.templateName} on {job.printerName}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card border-2 border-slate-200 hover:border-primary-300 transition-colors">
        <div className="card-body">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Search templates..."
          />
        </div>
      </div>

      {/* Templates Table */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Label Templates</h2>
            <div className="text-sm text-gray-600">
              {templates.length} template{templates.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Standard</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Auto-Print</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      <FiPrinter className="mx-auto mb-3 text-gray-300" size={48} />
                      <div className="text-lg font-medium">No templates found</div>
                      <div className="text-sm mt-1">Create a template to get started</div>
                    </td>
                  </tr>
                ) : (
                  templates.map((template) => (
                    <tr key={template.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {template.standard}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {template.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {template.width}" x {template.height}"
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {template.autoPrint ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Enabled
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowPreviewModal(true);
                            }}
                            className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                          >
                            <FiMaximize2 />
                            Preview
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTemplate(template);
                              setShowTemplateModal(true);
                            }}
                            className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                          >
                            <FiEdit />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this template?')) {
                                deleteMutation.mutate(template.id);
                              }
                            }}
                            className="btn btn-sm btn-outline text-red-600 hover:bg-red-50 hover:shadow-md transition-shadow"
                          >
                            <FiTrash2 />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setSelectedTemplate(null);
        }}
        title={selectedTemplate ? 'Edit Template' : 'New Template'}
        size="lg"
      >
        <LabelTemplateForm
          template={selectedTemplate}
          onSuccess={() => {
            setShowTemplateModal(false);
            setSelectedTemplate(null);
            queryClient.invalidateQueries(['label-templates']);
          }}
          onCancel={() => {
            setShowTemplateModal(false);
            setSelectedTemplate(null);
          }}
        />
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedTemplate(null);
        }}
        title="Label Preview"
        size="lg"
      >
        {selectedTemplate && (
          <LabelPreview
            template={selectedTemplate}
            asset={selectedAsset}
            onPrint={() => {
              if (selectedAsset) {
                printMutation.mutate({
                  templateId: selectedTemplate.id,
                  assetId: selectedAsset.id,
                });
              }
            }}
            onClose={() => {
              setShowPreviewModal(false);
              setSelectedTemplate(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default LabelsPage;

