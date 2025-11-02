import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCalendar,
  FiBarChart2,
  FiPackage,
} from 'react-icons/fi';
import { departmentsAPI } from '../../config/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/**
 * Budget Tracking Component
 * Tracks IT budgets per department with spending analysis
 */
const BudgetTracking = () => {
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const queryClient = useQueryClient();

  // Fetch departments
  const { data: departmentsData, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then((res) => res.data.data || res.data || []),
  });

  // Mock budget data (in production, this would come from API)
  const [budgets, setBudgets] = useState(() => {
    // Initialize budgets from localStorage or create default ones
    const saved = localStorage.getItem('department-budgets');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default budgets based on departments
    const defaultBudgets = {};
    if (departmentsData) {
      departmentsData.forEach((dept) => {
        defaultBudgets[dept._id] = {
          departmentId: dept._id,
          departmentName: dept.name,
          fiscalYear: new Date().getFullYear(),
          allocatedBudget: 0,
          spentBudget: 0,
          remainingBudget: 0,
          categories: {
            hardware: 0,
            software: 0,
            services: 0,
            maintenance: 0,
            other: 0,
          },
          lastUpdated: new Date().toISOString(),
        };
      });
    }
    return defaultBudgets;
  });

  // Calculate budget statistics
  const budgetStats = {
    totalAllocated: Object.values(budgets).reduce(
      (sum, budget) => sum + (budget.allocatedBudget || 0),
      0
    ),
    totalSpent: Object.values(budgets).reduce(
      (sum, budget) => sum + (budget.spentBudget || 0),
      0
    ),
    totalRemaining: Object.values(budgets).reduce(
      (sum, budget) => sum + (budget.remainingBudget || 0),
      0
    ),
    totalDepartments: Object.keys(budgets).length,
  };

  budgetStats.utilization = budgetStats.totalAllocated > 0
    ? ((budgetStats.totalSpent / budgetStats.totalAllocated) * 100).toFixed(1)
    : 0;

  const handleSaveBudget = (budgetData) => {
    const updatedBudgets = {
      ...budgets,
      [budgetData.departmentId]: {
        ...budgetData,
        remainingBudget: budgetData.allocatedBudget - budgetData.spentBudget,
        lastUpdated: new Date().toISOString(),
      },
    };
    setBudgets(updatedBudgets);
    localStorage.setItem('department-budgets', JSON.stringify(updatedBudgets));
    setShowBudgetModal(false);
    setEditingBudget(null);
    toast.success('Budget saved successfully');
  };

  const handleDeleteBudget = (departmentId) => {
    const updatedBudgets = { ...budgets };
    delete updatedBudgets[departmentId];
    setBudgets(updatedBudgets);
    localStorage.setItem('department-budgets', JSON.stringify(updatedBudgets));
    toast.success('Budget deleted successfully');
  };

  const getUtilizationStatus = (spent, allocated) => {
    if (allocated === 0) return { status: 'none', color: 'slate', text: 'No budget' };
    const percentage = (spent / allocated) * 100;
    if (percentage >= 100) return { status: 'exceeded', color: 'danger', text: 'Exceeded' };
    if (percentage >= 90) return { status: 'critical', color: 'danger', text: 'Critical' };
    if (percentage >= 75) return { status: 'high', color: 'warning', text: 'High' };
    if (percentage >= 50) return { status: 'medium', color: 'info', text: 'Medium' };
    return { status: 'low', color: 'success', text: 'Low' };
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const departments = departmentsData || [];
  const budgetsArray = Object.values(budgets);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">
            Budget Tracking
          </h1>
          <p className="text-secondary-600 mt-2">
            Track IT budgets per department with spending analysis
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBudget(null);
            setShowBudgetModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus size={20} />
          Set Budget
        </button>
      </div>

      {/* Budget Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Allocated</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${budgetStats.totalAllocated.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <FiDollarSign className="text-primary-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Spent</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${budgetStats.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <FiTrendingDown className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Remaining</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${budgetStats.totalRemaining.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <FiTrendingUp className="text-success-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Utilization</p>
                <p className="text-2xl font-bold text-slate-900">
                  {budgetStats.utilization}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FiBarChart2 className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Budgets Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-secondary-900">
            Department Budgets
          </h3>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Allocated
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Spent
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Remaining
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Utilization
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {budgetsArray.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FiPackage className="mx-auto text-slate-300 mb-3" size={48} />
                      <p className="text-slate-500 font-medium">No budgets set</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Set budgets for departments to start tracking spending
                      </p>
                    </td>
                  </tr>
                ) : (
                  budgetsArray.map((budget) => {
                    const utilizationStatus = getUtilizationStatus(
                      budget.spentBudget,
                      budget.allocatedBudget
                    );
                    const utilizationPercent =
                      budget.allocatedBudget > 0
                        ? ((budget.spentBudget / budget.allocatedBudget) * 100).toFixed(1)
                        : 0;

                    return (
                      <tr key={budget.departmentId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {budget.departmentName}
                          </div>
                          <div className="text-sm text-slate-500">
                            FY {budget.fiscalYear}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">
                            ${budget.allocatedBudget.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">
                            ${budget.spentBudget.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-medium ${
                              budget.remainingBudget < 0
                                ? 'text-red-600'
                                : 'text-slate-900'
                            }`}
                          >
                            ${budget.remainingBudget.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  utilizationStatus.color === 'danger'
                                    ? 'bg-red-500'
                                    : utilizationStatus.color === 'warning'
                                    ? 'bg-amber-500'
                                    : utilizationStatus.color === 'success'
                                    ? 'bg-green-500'
                                    : 'bg-primary-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, utilizationPercent)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-700 w-12 text-right">
                              {utilizationPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={utilizationStatus.color}
                            text={utilizationStatus.text}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingBudget(budget);
                                setShowBudgetModal(true);
                              }}
                              className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Are you sure you want to delete the budget for ${budget.departmentName}?`
                                  )
                                ) {
                                  handleDeleteBudget(budget.departmentId);
                                }
                              }}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Budget Modal */}
      <Modal
        isOpen={showBudgetModal}
        onClose={() => {
          setShowBudgetModal(false);
          setEditingBudget(null);
          setSelectedDepartment(null);
        }}
        title={editingBudget ? 'Edit Budget' : 'Set Department Budget'}
        size="lg"
      >
        <BudgetForm
          departments={departments}
          budget={editingBudget}
          onSave={handleSaveBudget}
          onCancel={() => {
            setShowBudgetModal(false);
            setEditingBudget(null);
            setSelectedDepartment(null);
          }}
        />
      </Modal>
    </div>
  );
};

/**
 * Budget Form Component
 */
const BudgetForm = ({ departments, budget, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    departmentId: budget?.departmentId || '',
    fiscalYear: budget?.fiscalYear || new Date().getFullYear(),
    allocatedBudget: budget?.allocatedBudget || '',
    spentBudget: budget?.spentBudget || 0,
    categories: {
      hardware: budget?.categories?.hardware || 0,
      software: budget?.categories?.software || 0,
      services: budget?.categories?.services || 0,
      maintenance: budget?.categories?.maintenance || 0,
      other: budget?.categories?.other || 0,
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedDept = departments.find((d) => d._id === formData.departmentId);
    if (!selectedDept) {
      toast.error('Please select a department');
      return;
    }

    onSave({
      ...formData,
      departmentName: selectedDept.name,
      allocatedBudget: parseFloat(formData.allocatedBudget) || 0,
      spentBudget: parseFloat(formData.spentBudget) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Department *
        </label>
        <select
          value={formData.departmentId}
          onChange={(e) =>
            setFormData({ ...formData, departmentId: e.target.value })
          }
          className="input"
          required
          disabled={!!budget}
        >
          <option value="">Select department...</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Fiscal Year *
        </label>
        <input
          type="number"
          value={formData.fiscalYear}
          onChange={(e) =>
            setFormData({ ...formData, fiscalYear: parseInt(e.target.value) })
          }
          className="input"
          required
          min={2020}
          max={2050}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Allocated Budget ($) *
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.allocatedBudget}
          onChange={(e) =>
            setFormData({ ...formData, allocatedBudget: e.target.value })
          }
          className="input"
          required
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Spent Budget ($)
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.spentBudget}
          onChange={(e) =>
            setFormData({ ...formData, spentBudget: e.target.value })
          }
          className="input"
          placeholder="0.00"
        />
        <p className="text-xs text-slate-500 mt-1">
          Current spending amount
        </p>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">
          Budget by Category (Optional)
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Hardware
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.categories.hardware}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categories: {
                    ...formData.categories,
                    hardware: e.target.value,
                  },
                })
              }
              className="input input-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Software
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.categories.software}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categories: {
                    ...formData.categories,
                    software: e.target.value,
                  },
                })
              }
              className="input input-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Services
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.categories.services}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categories: {
                    ...formData.categories,
                    services: e.target.value,
                  },
                })
              }
              className="input input-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Maintenance
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.categories.maintenance}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categories: {
                    ...formData.categories,
                    maintenance: e.target.value,
                  },
                })
              }
              className="input input-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Other
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.categories.other}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categories: {
                    ...formData.categories,
                    other: e.target.value,
                  },
                })
              }
              className="input input-sm"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="btn btn-outline">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Budget
        </button>
      </div>
    </form>
  );
};

export default BudgetTracking;

