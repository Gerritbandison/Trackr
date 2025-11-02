import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiSettings,
  FiDollarSign,
  FiPlus,
  FiEdit,
  FiTrash2,
} from 'react-icons/fi';
import {
  getMaintenanceInterval,
  getNextMaintenanceDate,
  getMaintenanceStatus,
  estimateMaintenanceCost,
  getMaintenanceTasks,
} from '../../utils/maintenanceSchedule';
import Badge from './Badge';
import Modal from './Modal';
import toast from 'react-hot-toast';
import { format, isAfter, addDays } from 'date-fns';

/**
 * Maintenance Schedule Component
 * Displays maintenance schedule and history for an asset
 */
const MaintenanceSchedule = ({ asset }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const queryClient = useQueryClient();

  // Calculate maintenance schedule
  const interval = getMaintenanceInterval(asset?.category, asset?.manufacturer);
  const lastMaintenanceDate = asset?.lastMaintenanceDate 
    ? new Date(asset.lastMaintenanceDate) 
    : asset?.purchaseDate 
    ? new Date(asset.purchaseDate)
    : null;
  
  const nextMaintenanceDate = lastMaintenanceDate
    ? getNextMaintenanceDate(lastMaintenanceDate, interval)
    : addDays(new Date(), 90);

  const maintenanceStatus = getMaintenanceStatus(nextMaintenanceDate);
  const estimatedCost = asset?.purchasePrice
    ? estimateMaintenanceCost(asset.category, asset.purchasePrice)
    : 0;
  const maintenanceTasks = getMaintenanceTasks(asset?.category);

  // Mock maintenance history (in production, this would come from API)
  const [maintenanceHistory, setMaintenanceHistory] = useState(
    asset?.maintenanceHistory || []
  );

  const handleAddMaintenance = (maintenanceData) => {
    const newMaintenance = {
      id: Date.now().toString(),
      date: maintenanceData.date,
      type: maintenanceData.type,
      description: maintenanceData.description,
      cost: maintenanceData.cost || 0,
      performedBy: maintenanceData.performedBy || 'IT Staff',
      nextMaintenanceDate: maintenanceData.nextMaintenanceDate,
      ...maintenanceData,
    };

    setMaintenanceHistory([newMaintenance, ...maintenanceHistory]);
    setShowAddModal(false);
    toast.success('Maintenance record added successfully');
    
    // In production, this would call an API
    // await assetsAPI.addMaintenance(asset._id, newMaintenance);
  };

  const handleDeleteMaintenance = (maintenanceId) => {
    setMaintenanceHistory(
      maintenanceHistory.filter((m) => m.id !== maintenanceId)
    );
    toast.success('Maintenance record deleted');
  };

  const getStatusColor = (status) => {
    const colors = {
      overdue: 'red',
      due: 'red',
      upcoming: 'amber',
      scheduled: 'green',
      unknown: 'slate',
    };
    return colors[status] || 'slate';
  };

  return (
    <div className="card">
      <div className="card-header bg-gradient-to-r from-primary-50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiSettings className="text-primary-600" size={20} />
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">
                Maintenance Schedule
              </h3>
              <p className="text-sm text-secondary-600 mt-1">
                Track scheduled maintenance and service history
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingMaintenance(null);
              setShowAddModal(true);
            }}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <FiPlus size={16} />
            Record Maintenance
          </button>
        </div>
      </div>

      <div className="card-body space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Next Maintenance
              </span>
              <FiCalendar className="text-slate-400" size={18} />
            </div>
            <p className="text-lg font-bold text-slate-900">
              {nextMaintenanceDate ? format(nextMaintenanceDate, 'MMM dd, yyyy') : 'Not Scheduled'}
            </p>
            <Badge
              variant={getStatusColor(maintenanceStatus.status)}
              text={maintenanceStatus.label}
              className="mt-2"
            />
          </div>

          <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Maintenance Interval
              </span>
              <FiClock className="text-slate-400" size={18} />
            </div>
            <p className="text-lg font-bold text-slate-900">
              {Math.round(interval / 30)} months
            </p>
            <p className="text-xs text-slate-500 mt-1">
              ({interval} days)
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Estimated Cost
              </span>
              <FiDollarSign className="text-slate-400" size={18} />
            </div>
            <p className="text-lg font-bold text-slate-900">
              ${estimatedCost.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Per service</p>
          </div>
        </div>

        {/* Maintenance Tasks */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            Recommended Maintenance Tasks
          </h4>
          <div className="space-y-2">
            {maintenanceTasks.map((task, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle
                      className={`${
                        task.priority === 'high' || task.priority === 'critical'
                          ? 'text-red-500'
                          : task.priority === 'medium'
                          ? 'text-amber-500'
                          : 'text-slate-400'
                      }`}
                      size={16}
                    />
                    <span className="font-medium text-slate-900">
                      {task.task}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Frequency: {task.frequency}
                  </p>
                </div>
                <Badge
                  variant={
                    task.priority === 'critical'
                      ? 'danger'
                      : task.priority === 'high'
                      ? 'warning'
                      : 'info'
                  }
                  text={task.priority}
                  className="text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700">
              Maintenance History
            </h4>
            <span className="text-xs text-slate-500">
              {maintenanceHistory.length} records
            </span>
          </div>

          {maintenanceHistory.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <FiAlertCircle className="mx-auto text-slate-400" size={32} />
              <p className="text-sm text-slate-600 mt-2">
                No maintenance records yet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Add your first maintenance record to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {maintenanceHistory.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-white rounded-lg border-2 border-slate-200 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FiCheckCircle className="text-green-500" size={18} />
                        <span className="font-semibold text-slate-900">
                          {record.type || 'General Maintenance'}
                        </span>
                        <Badge variant="success" text="Completed" className="text-xs" />
                      </div>
                      {record.description && (
                        <p className="text-sm text-slate-600 mb-2">
                          {record.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>
                          {record.date
                            ? format(new Date(record.date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </span>
                        {record.cost > 0 && (
                          <span className="flex items-center gap-1">
                            <FiDollarSign size={12} />
                            {record.cost.toLocaleString()}
                          </span>
                        )}
                        {record.performedBy && (
                          <span>By: {record.performedBy}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMaintenance(record.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Maintenance Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingMaintenance(null);
        }}
        title="Record Maintenance"
        size="lg"
      >
        <MaintenanceForm
          asset={asset}
          maintenance={editingMaintenance}
          interval={interval}
          onSave={handleAddMaintenance}
          onCancel={() => {
            setShowAddModal(false);
            setEditingMaintenance(null);
          }}
        />
      </Modal>
    </div>
  );
};

/**
 * Maintenance Form Component
 */
const MaintenanceForm = ({ asset, maintenance, interval, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: maintenance?.date || new Date().toISOString().split('T')[0],
    type: maintenance?.type || 'preventive',
    description: maintenance?.description || '',
    cost: maintenance?.cost || '',
    performedBy: maintenance?.performedBy || '',
    nextMaintenanceDate: maintenance?.nextMaintenanceDate || '',
  });

  const maintenanceTypes = [
    { value: 'preventive', label: 'Preventive Maintenance' },
    { value: 'corrective', label: 'Corrective Maintenance' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'upgrade', label: 'Upgrade/Update' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'repair', label: 'Repair' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.nextMaintenanceDate) {
      // Calculate next maintenance date
      const maintenanceDate = new Date(formData.date);
      const nextDate = new Date(
        maintenanceDate.getTime() + interval * 24 * 60 * 60 * 1000
      );
      formData.nextMaintenanceDate = nextDate.toISOString().split('T')[0];
    }

    onSave({
      ...formData,
      cost: formData.cost ? parseFloat(formData.cost) : 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Maintenance Date *
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="input"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Maintenance Type *
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="input"
          required
        >
          {maintenanceTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="input"
          rows={3}
          placeholder="Describe the maintenance work performed..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cost ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) =>
              setFormData({ ...formData, cost: e.target.value })
            }
            className="input"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Performed By
          </label>
          <input
            type="text"
            value={formData.performedBy}
            onChange={(e) =>
              setFormData({ ...formData, performedBy: e.target.value })
            }
            className="input"
            placeholder="IT Staff"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Next Maintenance Date
        </label>
        <input
          type="date"
          value={formData.nextMaintenanceDate}
          onChange={(e) =>
            setFormData({ ...formData, nextMaintenanceDate: e.target.value })
          }
          className="input"
        />
        <p className="text-xs text-slate-500 mt-1">
          Leave blank to auto-calculate based on interval
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="btn btn-outline">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Maintenance Record
        </button>
      </div>
    </form>
  );
};

export default MaintenanceSchedule;

