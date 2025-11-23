/**
 * Asset State Transition Component
 * 
 * Handles state transitions with validation and workflow enforcement
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiRefreshCw, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiArrowRight,
  FiX
} from 'react-icons/fi';
import { assetsAPI } from '../../config/api';
import { AssetState, ITAMAsset } from '../../types/itam';
import { isValidTransition, getValidNextStates, getStateDisplay } from '../../utils/assetStateMachine';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';

interface AssetStateTransitionProps {
  asset: ITAMAsset;
  currentState: AssetState;
  onStateChange?: (newState: AssetState) => void;
}

const AssetStateTransition: React.FC<AssetStateTransitionProps> = ({
  asset,
  currentState,
  onStateChange,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedState, setSelectedState] = useState<AssetState | null>(null);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const validNextStates = getValidNextStates(currentState, asset);
  const currentStateDisplay = getStateDisplay(currentState);

  const stateChangeMutation = useMutation({
    mutationFn: async ({ newState, reason }: { newState: AssetState; reason?: string }) => {
      return assetsAPI.changeState(asset.globalAssetId, newState, { reason });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['asset', asset.globalAssetId]);
      queryClient.invalidateQueries(['assets']);
      toast.success(`Asset state changed to ${selectedState}`);
      setShowModal(false);
      setSelectedState(null);
      setReason('');
      onStateChange?.(selectedState!);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to change state';
      toast.error(message);
    },
  });

  const handleStateClick = (newState: AssetState) => {
    // Validate transition
    const validation = isValidTransition(currentState, newState, asset);
    
    if (!validation.valid) {
      toast.error(validation.reason || 'Invalid state transition');
      return;
    }

    setSelectedState(newState);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (!selectedState) return;

    const validation = isValidTransition(currentState, selectedState, asset);
    if (!validation.valid) {
      toast.error(validation.reason || 'Invalid state transition');
      return;
    }

    stateChangeMutation.mutate({ newState: selectedState, reason });
  };

  const selectedStateDisplay = selectedState ? getStateDisplay(selectedState) : null;

  return (
    <>
      <div className="space-y-4">
        {/* Current State */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${currentStateDisplay.color}-100 text-${currentStateDisplay.color}-800`}>
              {currentStateDisplay.label}
            </div>
            <FiArrowRight className="text-gray-400" />
            <span className="text-sm text-gray-500">Select next state</span>
          </div>
        </div>

        {/* Valid Next States */}
        <div className="flex flex-wrap gap-2">
          {validNextStates.length > 0 ? (
            validNextStates.map((state) => {
              const stateDisplay = getStateDisplay(state);
              return (
                <button
                  key={state}
                  onClick={() => handleStateClick(state)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    bg-${stateDisplay.color}-50 hover:bg-${stateDisplay.color}-100 
                    text-${stateDisplay.color}-700 border border-${stateDisplay.color}-200
                    hover:border-${stateDisplay.color}-300`}
                >
                  {stateDisplay.label}
                </button>
              );
            })
          ) : (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <FiAlertTriangle className="text-yellow-500" />
              No valid transitions available
            </div>
          )}
        </div>

        {/* Transition Info */}
        {validNextStates.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            Click a state to transition. Some transitions may require additional information.
          </div>
        )}
      </div>

      {/* State Transition Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedState(null);
          setReason('');
        }}
        title="Confirm State Transition"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${currentStateDisplay.color}-100 text-${currentStateDisplay.color}-800`}>
              {currentStateDisplay.label}
            </div>
            <FiArrowRight className="text-gray-400" />
            {selectedStateDisplay && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${selectedStateDisplay.color}-100 text-${selectedStateDisplay.color}-800`}>
                {selectedStateDisplay.label}
              </div>
            )}
          </div>

          {/* Warning for critical transitions */}
          {selectedState === 'Disposed' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <FiAlertTriangle className="text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <strong>Warning:</strong> Disposing an asset requires a data wipe certificate.
                This action cannot be easily undone.
              </div>
            </div>
          )}

          {selectedState === 'Lost' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <FiAlertTriangle className="text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Note:</strong> Marking asset as lost will trigger overdue alerts.
                Asset will be automatically converted to Disposed after 30 days if not recovered.
              </div>
            </div>
          )}

          {/* Reason field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for transition (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Enter reason for state change..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedState(null);
                setReason('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={stateChangeMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {stateChangeMutation.isPending ? (
                <>
                  <FiRefreshCw className="animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <FiCheckCircle />
                  Confirm Transition
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AssetStateTransition;

