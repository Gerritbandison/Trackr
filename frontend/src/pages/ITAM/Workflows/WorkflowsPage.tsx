/**
 * Workflows & Automations Page
 * 
 * Features:
 * - New hire workflow
 * - Offboarding workflow (already done in Security)
 * - SaaS cleanup automation
 * - Approval workflows
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiGitBranch,
  FiPlus,
  FiSearch,
  FiPlay,
  FiPause,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiUsers,
  FiRefreshCw,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import WorkflowForm from '../../../components/ITAM/WorkflowForm';
import NewHireWorkflow from '../../../components/ITAM/NewHireWorkflow';

const WorkflowsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive', 'running'
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showNewHireModal, setShowNewHireModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch workflows
  const { data: workflowsData, isLoading } = useQuery({
    queryKey: ['workflows', currentPage, searchTerm, filter],
    queryFn: () =>
      itamAPI.workflows.getAll({
        page: currentPage,
        limit,
        search: searchTerm,
        filter,
      }),
  });

  // Fetch workflow executions
  const { data: executionsData } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: () => itamAPI.workflows.getExecutions({ limit: 10 }),
  });

  // Toggle workflow mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => itamAPI.workflows.toggle(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success('Workflow toggled');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to toggle workflow');
    },
  });

  // Delete workflow mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => itamAPI.workflows.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success('Workflow deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete workflow');
    },
  });

  // Execute workflow mutation
  const executeMutation = useMutation({
    mutationFn: ({ id, data }) => itamAPI.workflows.execute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflow-executions']);
      toast.success('Workflow executed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to execute workflow');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const workflows = workflowsData?.data?.data || [];
  const pagination = workflowsData?.data?.pagination || {};
  const executions = executionsData?.data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Workflows & Automations
          </h1>
          <p className="text-gray-600 mt-2">
            Manage automated workflows and approval processes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewHireModal(true)}
            className="btn btn-outline flex items-center gap-2 hover:shadow-md transition-shadow"
          >
            <FiUsers />
            New Hire Workflow
          </button>
          <button
            onClick={() => {
              setSelectedWorkflow(null);
              setShowWorkflowModal(true);
            }}
            className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FiPlus />
            New Workflow
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Workflows</div>
                <div className="text-2xl font-bold text-gray-900">
                  {workflows.length}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiGitBranch className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Active</div>
                <div className="text-2xl font-bold text-green-600">
                  {workflows.filter((w) => w.enabled).length}
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiCheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Running</div>
                <div className="text-2xl font-bold text-purple-600">
                  {executions.filter((e) => e.status === 'running').length}
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiRefreshCw className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Executions Today</div>
                <div className="text-2xl font-bold text-orange-600">
                  {executions.filter((e) => {
                    const today = new Date();
                    const execDate = new Date(e.createdAt);
                    return execDate.toDateString() === today.toDateString();
                  }).length}
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <FiPlay className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Executions */}
      {executions.length > 0 && (
        <div className="card border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiRefreshCw className="text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Recent Executions</h3>
            </div>
            <div className="space-y-2">
              {executions.slice(0, 5).map((execution) => (
                <div
                  key={execution.id}
                  className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{execution.workflowName}</div>
                      <div className="text-sm text-gray-600">{execution.description}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          execution.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : execution.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : execution.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {execution.status}
                      </span>
                      <div className="text-sm text-gray-500">
                        {new Date(execution.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card border-2 border-slate-200 hover:border-primary-300 transition-colors">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search workflows..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm transition-all ${filter === 'all' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`btn btn-sm transition-all ${filter === 'active' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`btn btn-sm transition-all ${filter === 'inactive' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Inactive
              </button>
              <button
                onClick={() => setFilter('running')}
                className={`btn btn-sm transition-all ${filter === 'running' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Running
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows Table */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Workflows</h2>
            <div className="text-sm text-gray-600">
              {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Trigger</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Run</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workflows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      <FiGitBranch className="mx-auto mb-3 text-gray-300" size={48} />
                      <div className="text-lg font-medium">No workflows found</div>
                      <div className="text-sm mt-1">Create a workflow to get started</div>
                    </td>
                  </tr>
                ) : (
                  workflows.map((workflow) => (
                    <tr key={workflow.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium">{workflow.name}</div>
                        <div className="text-sm text-gray-500">{workflow.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {workflow.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">{workflow.trigger}</div>
                      </td>
                      <td className="py-3 px-4">
                        {workflow.enabled ? (
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
                          {workflow.lastRun
                            ? new Date(workflow.lastRun).toLocaleString()
                            : 'Never'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              toggleMutation.mutate({
                                id: workflow.id,
                                enabled: !workflow.enabled,
                              });
                            }}
                            className={`btn btn-sm transition-all ${
                              workflow.enabled
                                ? 'btn-outline text-red-600 hover:bg-red-50'
                                : 'btn-primary shadow-md hover:shadow-lg'
                            }`}
                          >
                            {workflow.enabled ? <FiPause /> : <FiPlay />}
                            {workflow.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => {
                              executeMutation.mutate({
                                id: workflow.id,
                                data: {},
                              });
                            }}
                            className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                          >
                            <FiPlay />
                            Run
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWorkflow(workflow);
                              setShowWorkflowModal(true);
                            }}
                            className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                          >
                            <FiEdit />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this workflow?')) {
                                deleteMutation.mutate(workflow.id);
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

      {/* Workflow Modal */}
      <Modal
        isOpen={showWorkflowModal}
        onClose={() => {
          setShowWorkflowModal(false);
          setSelectedWorkflow(null);
        }}
        title={selectedWorkflow ? 'Edit Workflow' : 'New Workflow'}
        size="lg"
      >
        <WorkflowForm
          workflow={selectedWorkflow}
          onSuccess={() => {
            setShowWorkflowModal(false);
            setSelectedWorkflow(null);
            queryClient.invalidateQueries(['workflows']);
          }}
          onCancel={() => {
            setShowWorkflowModal(false);
            setSelectedWorkflow(null);
          }}
        />
      </Modal>

      {/* New Hire Workflow Modal */}
      <Modal
        isOpen={showNewHireModal}
        onClose={() => setShowNewHireModal(false)}
        title="New Hire Workflow"
        size="xl"
      >
        <NewHireWorkflow onClose={() => setShowNewHireModal(false)} />
      </Modal>
    </div>
  );
};

export default WorkflowsPage;

