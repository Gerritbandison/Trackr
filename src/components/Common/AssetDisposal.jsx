import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiTrash2,
  FiShield,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiSave,
  FiLock,
} from 'react-icons/fi';
import { assetsAPI } from '../../config/api';
import Badge from './Badge';
import Modal from './Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/**
 * Asset Disposal Component
 * Handles secure asset disposal workflow with data wiping verification
 */
const AssetDisposal = ({ asset, onDisposeComplete }) => {
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [disposalStep, setDisposalStep] = useState(1);
  const [disposalData, setDisposalData] = useState({
    disposalDate: new Date().toISOString().split('T')[0],
    disposalReason: '',
    disposalMethod: '',
    dataWipeStatus: 'pending',
    dataWipeMethod: '',
    dataWipeVerified: false,
    disposalCertificate: null,
    disposedBy: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  // Dispose asset mutation
  const disposeMutation = useMutation({
    mutationFn: (data) => {
      // In production, this would call assetsAPI.dispose(asset._id, data)
      // For now, we'll update the asset status
      return assetsAPI.update(asset._id, {
        ...asset,
        status: 'disposed',
        disposalDate: data.disposalDate,
        disposalReason: data.disposalReason,
        disposalMethod: data.disposalMethod,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['asset', asset._id]);
      queryClient.invalidateQueries(['assets']);
      toast.success('Asset disposed successfully');
      setShowDisposalModal(false);
      setDisposalStep(1);
      if (onDisposeComplete) {
        onDisposeComplete();
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to dispose asset');
    },
  });

  const handleStartDisposal = () => {
    setDisposalStep(1);
    setDisposalData({
      disposalDate: new Date().toISOString().split('T')[0],
      disposalReason: '',
      disposalMethod: '',
      dataWipeStatus: 'pending',
      dataWipeMethod: '',
      dataWipeVerified: false,
      disposalCertificate: null,
      disposedBy: '',
      notes: '',
    });
    setShowDisposalModal(true);
  };

  const handleNextStep = () => {
    if (disposalStep < 4) {
      setDisposalStep(disposalStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (disposalStep > 1) {
      setDisposalStep(disposalStep - 1);
    }
  };

  const handleCompleteDisposal = () => {
    if (!disposalData.disposalReason || !disposalData.disposalMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!disposalData.dataWipeVerified) {
      toast.error('Please verify data wiping before completing disposal');
      return;
    }

    disposeMutation.mutate(disposalData);
  };

  const disposalMethods = [
    { value: 'recycle', label: 'Recycle' },
    { value: 'donate', label: 'Donate' },
    { value: 'sell', label: 'Sell' },
    { value: 'destroy', label: 'Destroy' },
    { value: 'return', label: 'Return to Vendor' },
    { value: 'other', label: 'Other' },
  ];

  const disposalReasons = [
    { value: 'eol', label: 'End of Life' },
    { value: 'broken', label: 'Broken/Beyond Repair' },
    { value: 'obsolete', label: 'Obsolete Technology' },
    { value: 'upgrade', label: 'Replaced with Upgrade' },
    { value: 'cost', label: 'Cost Optimization' },
    { value: 'security', label: 'Security Requirement' },
    { value: 'other', label: 'Other' },
  ];

  const dataWipeMethods = [
    { value: 'dd', label: 'dd (Linux)' },
    { value: 'blancco', label: 'Blancco' },
    { value: 'killdisk', label: 'KillDisk' },
    { value: 'darik', label: 'DBAN (Darik\'s Boot and Nuke)' },
    { value: 'wipe', label: 'Wipe' },
    { value: 'physical', label: 'Physical Destruction' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="card">
      <div className="card-header bg-gradient-to-r from-red-50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiTrash2 className="text-red-600" size={20} />
            <div>
              <h3 className="text-xl font-semibold text-secondary-900">
                Asset Disposal
              </h3>
              <p className="text-sm text-secondary-600 mt-1">
                Secure disposal workflow with data wiping verification
              </p>
            </div>
          </div>
          <button
            onClick={handleStartDisposal}
            className="btn btn-danger flex items-center gap-2"
          >
            <FiTrash2 size={16} />
            Start Disposal
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-amber-900 mb-1">
                Important: Asset Disposal Process
              </p>
              <p className="text-sm text-amber-800 mb-2">
                Before disposing this asset, ensure:
              </p>
              <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
                <li>All data has been securely wiped</li>
                <li>All licenses/software have been uninstalled</li>
                <li>Asset has been removed from all management systems</li>
                <li>Disposal certificate has been generated (if required)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <FiShield className="text-slate-600" size={18} />
                <span className="text-sm font-medium text-slate-700">
                  Data Wipe Required
                </span>
              </div>
              <p className="text-sm text-slate-600">
                Ensure all sensitive data is wiped before disposal
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <FiFileText className="text-slate-600" size={18} />
                <span className="text-sm font-medium text-slate-700">
                  Documentation
                </span>
              </div>
              <p className="text-sm text-slate-600">
                Record disposal details for audit compliance
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <FiCheckCircle className="text-slate-600" size={18} />
                <span className="text-sm font-medium text-slate-700">
                  Compliance
                </span>
              </div>
              <p className="text-sm text-slate-600">
                Meet regulatory requirements for asset disposal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disposal Modal */}
      <Modal
        isOpen={showDisposalModal}
        onClose={() => {
          setShowDisposalModal(false);
          setDisposalStep(1);
        }}
        title="Asset Disposal Workflow"
        size="lg"
      >
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    step <= disposalStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {step < disposalStep ? <FiCheckCircle size={20} /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < disposalStep ? 'bg-primary-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Disposal Information */}
          {disposalStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Step 1: Disposal Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Disposal Date *
                </label>
                <input
                  type="date"
                  value={disposalData.disposalDate}
                  onChange={(e) =>
                    setDisposalData({ ...disposalData, disposalDate: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Disposal Reason *
                </label>
                <select
                  value={disposalData.disposalReason}
                  onChange={(e) =>
                    setDisposalData({ ...disposalData, disposalReason: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="">Select reason...</option>
                  {disposalReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Disposal Method *
                </label>
                <select
                  value={disposalData.disposalMethod}
                  onChange={(e) =>
                    setDisposalData({ ...disposalData, disposalMethod: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="">Select method...</option>
                  {disposalMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Disposed By
                </label>
                <input
                  type="text"
                  value={disposalData.disposedBy}
                  onChange={(e) =>
                    setDisposalData({ ...disposalData, disposedBy: e.target.value })
                  }
                  className="input"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={disposalData.notes}
                  onChange={(e) =>
                    setDisposalData({ ...disposalData, notes: e.target.value })
                  }
                  className="input"
                  rows={3}
                  placeholder="Additional notes about the disposal..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Data Wiping */}
          {disposalStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Step 2: Data Wiping Verification
              </h3>

              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-red-900 mb-2">
                      Critical: Data Wiping Required
                    </p>
                    <p className="text-sm text-red-800">
                      All sensitive data must be securely wiped before disposal. 
                      This includes user data, configuration files, and any stored credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data Wipe Method *
                </label>
                <select
                  value={disposalData.dataWipeMethod}
                  onChange={(e) =>
                    setDisposalData({ ...disposalData, dataWipeMethod: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="">Select method...</option>
                  {dataWipeMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disposalData.dataWipeVerified}
                    onChange={(e) =>
                      setDisposalData({
                        ...disposalData,
                        dataWipeVerified: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    I verify that all data has been securely wiped *
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Wipe Status
                </label>
                <select
                  value={disposalData.dataWipeStatus}
                  onChange={(e) =>
                    setDisposalData({ ...disposalData, dataWipeStatus: e.target.value })
                  }
                  className="input"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {disposalStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Step 3: Review Disposal Details
              </h3>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-600">Asset:</span>
                  <span className="text-sm font-semibold text-slate-900">{asset?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-600">Serial Number:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {asset?.serialNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-600">Disposal Date:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {disposalData.disposalDate
                      ? format(new Date(disposalData.disposalDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-600">Disposal Reason:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {disposalReasons.find((r) => r.value === disposalData.disposalReason)
                      ?.label || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-600">Disposal Method:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {disposalMethods.find((m) => m.value === disposalData.disposalMethod)
                      ?.label || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-600">Data Wipe Verified:</span>
                  <Badge
                    variant={disposalData.dataWipeVerified ? 'success' : 'danger'}
                    text={disposalData.dataWipeVerified ? 'Yes' : 'No'}
                  />
                </div>
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiLock className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold text-amber-900 mb-1">
                      Final Warning
                    </p>
                    <p className="text-sm text-amber-800">
                      This action will mark the asset as disposed and cannot be undone. 
                      Ensure all data has been wiped and all requirements are met.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {disposalStep === 4 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="text-red-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Ready to Dispose Asset
              </h3>
              <p className="text-sm text-slate-600">
                Click the button below to complete the disposal process.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={disposalStep === 1}
              className="btn btn-outline"
            >
              Previous
            </button>
            {disposalStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={
                  (disposalStep === 1 &&
                    (!disposalData.disposalDate ||
                      !disposalData.disposalReason ||
                      !disposalData.disposalMethod)) ||
                  (disposalStep === 2 && !disposalData.dataWipeVerified)
                }
                className="btn btn-primary"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteDisposal}
                disabled={disposeMutation.isPending}
                className="btn btn-danger flex items-center gap-2"
              >
                <FiSave size={16} />
                {disposeMutation.isPending ? 'Disposing...' : 'Complete Disposal'}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssetDisposal;

