/**
 * Staging Page - Asset Staging and Deployment
 * 
 * Features:
 * - Profile mapping (Asset Class + Company + Role → Intune/ABM/Jamf)
 * - Automation on state changes
 * - Handoff document management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiPackage,
  FiSettings,
  FiFileText,
  FiCheckCircle,
  FiRefreshCw,
  FiDownload,
  FiUpload,
} from 'react-icons/fi';
import { assetsAPI, itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ProfileMappingForm from '../../../components/ITAM/ProfileMappingForm';
import DeploymentConfig from '../../../components/ITAM/DeploymentConfig';

const StagingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch assets in staging
  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets', 'staging', currentPage, searchTerm],
    queryFn: () =>
      assetsAPI.getAll({
        page: currentPage,
        limit,
        search: searchTerm,
        state: 'In Staging',
      }),
  });

  // Deploy asset mutation
  const deployMutation = useMutation({
    mutationFn: ({ assetId, profileId }) => itamAPI.staging.deploy({ assetId, profileId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      toast.success('Asset deployed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to deploy asset');
    },
  });

  // Get valid next states
  const { data: validStates } = useQuery({
    queryKey: ['asset', selectedAsset?.id, 'valid-next-states'],
    queryFn: () => assetsAPI.getValidNextStates(selectedAsset?.id),
    enabled: !!selectedAsset?.id,
  });

  const handleDeploy = (asset) => {
    if (window.confirm(`Deploy ${asset.model} to ${asset.owner?.upn || 'user'}?`)) {
      deployMutation.mutate({
        assetId: asset.id,
        profileId: asset.profileId,
      });
    }
  };

  const handleMoveToService = (asset) => {
    assetsAPI.changeState(asset.id, 'In Service', {
      reason: 'Deployment complete',
    }).then(() => {
      queryClient.invalidateQueries(['assets']);
      toast.success('Asset moved to service');
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const assets = assetsData?.data?.data || [];
  const pagination = assetsData?.data?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Staging</h1>
          <p className="text-gray-600 mt-2">
            Configure and deploy assets to users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiSettings />
            Deployment Config
          </button>
          <button
            onClick={() => setShowMappingModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiSettings />
            Profile Mapping
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Search assets in staging..."
          />
        </div>
      </div>

      {/* Assets in Staging */}
      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Asset Tag</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Model</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Serial Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Profile</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned To</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No assets in staging
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{asset.assetTag || asset.globalAssetId}</td>
                      <td className="py-3 px-4">{asset.model}</td>
                      <td className="py-3 px-4">{asset.serialNumber || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {asset.profileId ? (
                          <span className="text-sm text-gray-700">{asset.profileId}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Not mapped</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {asset.owner?.upn || asset.owner?.displayName || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          In Staging
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              handleDeploy(asset);
                            }}
                            disabled={deployMutation.isPending}
                            className="btn btn-sm btn-primary flex items-center gap-1"
                          >
                            <FiCheckCircle />
                            Deploy
                          </button>
                          {asset.handoffDoc && (
                            <button
                              onClick={() => window.open(asset.handoffDoc.url, '_blank')}
                              className="btn btn-sm btn-outline flex items-center gap-1"
                            >
                              <FiFileText />
                              Handoff
                            </button>
                          )}
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

      {/* Profile Mapping Modal */}
      <Modal
        isOpen={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        title="Profile Mapping Configuration"
      >
        <ProfileMappingForm onSuccess={() => setShowMappingModal(false)} />
      </Modal>

      {/* Deployment Config Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Deployment Configuration"
      >
        <DeploymentConfig onSuccess={() => setShowConfigModal(false)} />
      </Modal>
    </div>
  );
};

export default StagingPage;

