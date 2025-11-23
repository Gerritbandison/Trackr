/**
 * License Entitlement View
 * 
 * View and manage license entitlements
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiUsers, FiPackage, FiKey, FiCheckCircle } from 'react-icons/fi';
import { itamAPI } from '../../config/api';
import LoadingSpinner from '../ui/LoadingSpinner';

const LicenseEntitlementView = ({ software, onClose }) => {
  const { data: entitlements, isLoading } = useQuery({
    queryKey: ['software-entitlements', software?.id],
    queryFn: () => itamAPI.software.getEntitlements(software?.id),
    enabled: !!software?.id,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const assignments = entitlements?.data || [];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <FiKey className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">{software?.name}</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total Licenses</div>
            <div className="font-bold text-gray-900">{software?.totalLicenses || 0}</div>
          </div>
          <div>
            <div className="text-gray-600">Assigned</div>
            <div className="font-bold text-blue-600">{software?.assignedCount || 0}</div>
          </div>
          <div>
            <div className="text-gray-600">Available</div>
            <div className="font-bold text-green-600">
              {(software?.totalLicenses || 0) - (software?.assignedCount || 0)}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-4">License Assignments</h4>
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiUsers className="mx-auto mb-3 text-gray-300" size={48} />
            <div>No assignments found</div>
          </div>
        ) : (
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{assignment.user?.name || 'Unassigned'}</div>
                    <div className="text-sm text-gray-600">{assignment.user?.upn || assignment.device?.assetTag}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.device && (
                      <span className="text-sm text-gray-600">{assignment.device.assetTag}</span>
                    )}
                    <FiCheckCircle className="text-green-600" size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenseEntitlementView;

