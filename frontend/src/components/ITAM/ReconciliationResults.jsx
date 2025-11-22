/**
 * Reconciliation Results Component
 * 
 * Displays reconciliation results
 */

import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiX, FiRefreshCw } from 'react-icons/fi';

const ReconciliationResults = ({ result, onClose }) => {
  if (!result) {
    return (
      <div className="text-center py-8 text-gray-500">
        No reconciliation results available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-gray-600 mb-1">Matched</div>
          <div className="text-2xl font-bold text-green-600">{result.matched || 0}</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-sm text-gray-600 mb-1">Unmatched</div>
          <div className="text-2xl font-bold text-yellow-600">{result.unmatched || 0}</div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-gray-600 mb-1">Conflicts</div>
          <div className="text-2xl font-bold text-red-600">{result.conflicts?.length || 0}</div>
        </div>
      </div>

      {/* New Assets */}
      {result.newAssets && result.newAssets.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">New Assets Discovered</h4>
          <div className="space-y-2">
            {result.newAssets.slice(0, 10).map((asset, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg text-sm">
                <div className="font-medium">{asset.deviceId}</div>
                <div className="text-gray-600">{asset.serialNumber || 'N/A'}</div>
              </div>
            ))}
            {result.newAssets.length > 10 && (
              <div className="text-sm text-gray-600">
                ...and {result.newAssets.length - 10} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {result.conflicts && result.conflicts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FiAlertCircle className="text-red-600" />
            Conflicts Requiring Resolution
          </h4>
          <div className="space-y-2">
            {result.conflicts.map((conflict, index) => (
              <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="font-medium text-gray-900">{conflict.globalAssetId}</div>
                <div className="text-sm text-gray-600">{conflict.conflict}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onClose} className="btn btn-primary">
          Close
        </button>
      </div>
    </div>
  );
};

export default ReconciliationResults;

