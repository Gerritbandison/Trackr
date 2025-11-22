/**
 * APIs, Webhooks & Extensibility Page
 * 
 * Features:
 * - REST/GraphQL northbound APIs
 * - Webhooks southbound
 * - Bulk ops (idempotent imports)
 * - Scheduled sanity checks
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiCode,
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlay,
  FiPause,
  FiKey,
  FiLink,
  FiDatabase,
  FiRefreshCw,
  FiSettings,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import WebhookForm from '../../../components/ITAM/WebhookForm';
import BulkImportDialog from '../../../components/ITAM/BulkImportDialog';
import APIDocs from '../../../components/ITAM/APIDocs';

const APIsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showAPIDocsModal, setShowAPIDocsModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch webhooks
  const { data: webhooksData, isLoading } = useQuery({
    queryKey: ['webhooks', currentPage, searchTerm],
    queryFn: () =>
      itamAPI.webhooks.getAll({
        page: currentPage,
        limit,
        search: searchTerm,
      }),
  });

  // Fetch API keys
  const { data: apiKeysData } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => itamAPI.apis.getKeys(),
  });

  // Fetch bulk operations
  const { data: bulkOpsData } = useQuery({
    queryKey: ['bulk-operations'],
    queryFn: () => itamAPI.apis.getBulkOperations({ limit: 10 }),
  });

  // Toggle webhook mutation
  const toggleWebhookMutation = useMutation({
    mutationFn: ({ id, enabled }) => itamAPI.webhooks.update(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks']);
      toast.success('Webhook toggled');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to toggle webhook');
    },
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: (id) => itamAPI.webhooks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks']);
      toast.success('Webhook deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete webhook');
    },
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: (id) => itamAPI.webhooks.test(id),
    onSuccess: () => {
      toast.success('Webhook test sent');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to test webhook');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const webhooks = webhooksData?.data?.data || [];
  const pagination = webhooksData?.data?.pagination || {};
  const apiKeys = apiKeysData?.data || [];
  const bulkOps = bulkOpsData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            APIs & Extensibility
          </h1>
          <p className="text-gray-600 mt-2">
            Manage APIs, webhooks, and bulk operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAPIDocsModal(true)}
            className="btn btn-outline flex items-center gap-2 hover:shadow-md transition-shadow"
          >
            <FiCode />
            API Docs
          </button>
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="btn btn-outline flex items-center gap-2 hover:shadow-md transition-shadow"
          >
            <FiDatabase />
            Bulk Import
          </button>
          <button
            onClick={() => {
              setSelectedWebhook(null);
              setShowWebhookModal(true);
            }}
            className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FiPlus />
            New Webhook
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Active Webhooks</div>
                <div className="text-2xl font-bold text-gray-900">
                  {webhooks.filter((w) => w.enabled).length}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiLink className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">API Keys</div>
                <div className="text-2xl font-bold text-green-600">
                  {apiKeys.length || 0}
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiKey className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Bulk Operations</div>
                <div className="text-2xl font-bold text-purple-600">
                  {bulkOps.length || 0}
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiDatabase className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">API Calls Today</div>
                <div className="text-2xl font-bold text-orange-600">
                  {bulkOps.reduce((acc, op) => acc + (op.apiCalls || 0), 0)}
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <FiCode className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys */}
      {apiKeys.length > 0 && (
        <div className="card border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiKey className="text-green-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
            </div>
            <div className="space-y-2">
              {apiKeys.slice(0, 3).map((key) => (
                <div
                  key={key.id}
                  className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:border-green-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{key.name}</div>
                      <div className="text-sm text-gray-600">
                        {key.key?.substring(0, 20)}... • {key.scopes?.join(', ')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Bulk Operations */}
      {bulkOps.length > 0 && (
        <div className="card border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiDatabase className="text-purple-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Recent Bulk Operations</h3>
            </div>
            <div className="space-y-2">
              {bulkOps.slice(0, 5).map((op) => (
                <div
                  key={op.id}
                  className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{op.name}</div>
                      <div className="text-sm text-gray-600">
                        {op.recordsProcessed || 0} records • {op.status}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(op.createdAt).toLocaleString()}
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
            placeholder="Search webhooks..."
          />
        </div>
      </div>

      {/* Webhooks Table */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Webhooks</h2>
            <div className="text-sm text-gray-600">
              {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">URL</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Events</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Triggered</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      <FiLink className="mx-auto mb-3 text-gray-300" size={48} />
                      <div className="text-lg font-medium">No webhooks found</div>
                      <div className="text-sm mt-1">Create a webhook to get started</div>
                    </td>
                  </tr>
                ) : (
                  webhooks.map((webhook) => (
                    <tr key={webhook.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium">{webhook.name}</div>
                        <div className="text-sm text-gray-500">{webhook.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600 font-mono">
                          {webhook.url?.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {webhook.events?.slice(0, 2).map((event) => (
                            <span
                              key={event}
                              className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {event}
                            </span>
                          ))}
                          {webhook.events?.length > 2 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{webhook.events.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {webhook.enabled ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {webhook.lastTriggered
                            ? new Date(webhook.lastTriggered).toLocaleString()
                            : 'Never'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              toggleWebhookMutation.mutate({
                                id: webhook.id,
                                enabled: !webhook.enabled,
                              });
                            }}
                            className={`btn btn-sm transition-all ${
                              webhook.enabled
                                ? 'btn-outline text-red-600 hover:bg-red-50'
                                : 'btn-primary shadow-md hover:shadow-lg'
                            }`}
                          >
                            {webhook.enabled ? <FiPause /> : <FiPlay />}
                            {webhook.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => testWebhookMutation.mutate(webhook.id)}
                            className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                          >
                            <FiPlay />
                            Test
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWebhook(webhook);
                              setShowWebhookModal(true);
                            }}
                            className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                          >
                            <FiEdit />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this webhook?')) {
                                deleteWebhookMutation.mutate(webhook.id);
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

      {/* Webhook Modal */}
      <Modal
        isOpen={showWebhookModal}
        onClose={() => {
          setShowWebhookModal(false);
          setSelectedWebhook(null);
        }}
        title={selectedWebhook ? 'Edit Webhook' : 'New Webhook'}
        size="lg"
      >
        <WebhookForm
          webhook={selectedWebhook}
          onSuccess={() => {
            setShowWebhookModal(false);
            setSelectedWebhook(null);
            queryClient.invalidateQueries(['webhooks']);
          }}
          onCancel={() => {
            setShowWebhookModal(false);
            setSelectedWebhook(null);
          }}
        />
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        title="Bulk Import"
        size="lg"
      >
        <BulkImportDialog onClose={() => setShowBulkImportModal(false)} />
      </Modal>

      {/* API Docs Modal */}
      <Modal
        isOpen={showAPIDocsModal}
        onClose={() => setShowAPIDocsModal(false)}
        title="API Documentation"
        size="xl"
      >
        <APIDocs onClose={() => setShowAPIDocsModal(false)} />
      </Modal>
    </div>
  );
};

export default APIsPage;

