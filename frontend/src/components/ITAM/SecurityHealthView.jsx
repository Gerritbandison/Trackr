/**
 * Security Health View
 * 
 * Display detailed security health information for an asset
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiLock,
  FiServer,
  FiActivity,
  FiRefreshCw,
} from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import LoadingSpinner from '../Common/LoadingSpinner';

const SecurityHealthView = ({ asset, onClose }) => {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['asset-security-health', asset.id],
    queryFn: () => itamAPI.security.getHealthStatus(asset.id),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const health = healthData?.data || asset.health || {};

  const getStatusIcon = (status) => {
    if (status === 'healthy' || status === 'enabled' || status === 'compliant') {
      return <FiCheckCircle className="text-green-600" size={20} />;
    } else if (status === 'unhealthy' || status === 'disabled' || status === 'non-compliant') {
      return <FiXCircle className="text-red-600" size={20} />;
    } else {
      return <FiAlertTriangle className="text-yellow-600" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    if (status === 'healthy' || status === 'enabled' || status === 'compliant') {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (status === 'unhealthy' || status === 'disabled' || status === 'non-compliant') {
      return 'bg-red-100 text-red-800 border-red-200';
    } else {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Asset Info */}
      <div className="card border-2 border-slate-200">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Asset Tag</div>
              <div className="font-medium text-gray-900">{asset.assetTag}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Serial Number</div>
              <div className="font-medium text-gray-900">{asset.serialNumber}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Model</div>
              <div className="font-medium text-gray-900">{asset.model || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Assigned To</div>
              <div className="font-medium text-gray-900">{asset.assignedTo?.name || 'Unassigned'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Status */}
      <div className="card border-2 border-slate-200">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Status</h3>
          <div className="space-y-4">
            {/* Overall Compliance */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(health.isCompliant ? 'compliant' : 'non-compliant')}
                  <span className="font-medium text-gray-900">Overall Compliance</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                    health.isCompliant ? 'compliant' : 'non-compliant'
                  )}`}
                >
                  {health.isCompliant ? 'Compliant' : 'Non-Compliant'}
                </span>
              </div>
            </div>

            {/* EDR Status */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FiActivity className="text-blue-600" size={20} />
                  <span className="font-medium text-gray-900">EDR Status</span>
                </div>
                {getStatusIcon(health.edrStatus)}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Status: <span className="font-medium">{health.edrStatus || 'Unknown'}</span>
              </div>
              {health.edrLastCheck && (
                <div className="text-sm text-gray-600 mt-1">
                  Last Check: {new Date(health.edrLastCheck).toLocaleString()}
                </div>
              )}
            </div>

            {/* Patch Ring */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FiServer className="text-purple-600" size={20} />
                  <span className="font-medium text-gray-900">Patch Ring</span>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {health.patchRing || 'N/A'}
                </span>
              </div>
              {health.patchLastUpdate && (
                <div className="text-sm text-gray-600 mt-2">
                  Last Update: {new Date(health.patchLastUpdate).toLocaleString()}
                </div>
              )}
            </div>

            {/* Encryption */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FiLock className="text-indigo-600" size={20} />
                  <span className="font-medium text-gray-900">Encryption</span>
                </div>
                {getStatusIcon(health.encryptionStatus)}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Status: <span className="font-medium">
                  {health.encryptionStatus === 'enabled' ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {health.encryptionType && (
                <div className="text-sm text-gray-600 mt-1">
                  Type: <span className="font-medium">{health.encryptionType}</span>
                </div>
              )}
            </div>

            {/* Last Check */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FiRefreshCw className="text-gray-600" size={20} />
                  <span className="font-medium text-gray-900">Last Security Check</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {health.lastCheck
                  ? new Date(health.lastCheck).toLocaleString()
                  : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onClose} className="btn btn-outline">
          Close
        </button>
      </div>
    </div>
  );
};

export default SecurityHealthView;

