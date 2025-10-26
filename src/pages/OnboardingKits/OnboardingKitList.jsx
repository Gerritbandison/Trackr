import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiGift, FiPackage, FiKey, FiCheckSquare } from 'react-icons/fi';
import { onboardingKitsAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge from '../../components/Common/Badge';
import toast from 'react-hot-toast';

const OnboardingKitList = () => {
  const { canManage } = useAuth();
  const queryClient = useQueryClient();

  // Fetch onboarding kits
  const { data: kits, isLoading } = useQuery({
    queryKey: ['onboarding-kits'],
    queryFn: () => onboardingKitsAPI.getAll().then((res) => res.data.data),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => onboardingKitsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-kits']);
      toast.success('Onboarding kit deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete onboarding kit');
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Onboarding Kits</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Pre-configured templates for role-based onboarding
          </p>
        </div>
        {canManage() && (
          <Link
            to="/onboarding-kits/new"
            className="btn btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <FiPlus size={20} />
            Create Onboarding Kit
          </Link>
        )}
      </div>

      {/* Kits List */}
      <div className="card">
        <div className="card-body">
          {!kits || kits.length === 0 ? (
            <div className="text-center py-12">
              <FiGift className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-4">No onboarding kits created yet</p>
              {canManage() && (
                <Link to="/onboarding-kits/new" className="btn btn-primary inline-flex items-center gap-2">
                  <FiPlus />
                  Create Your First Onboarding Kit
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {kits.map((kit) => (
                <div
                  key={kit._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:border-primary-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                        <FiGift className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{kit.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={kit.isActive ? 'success' : 'default'}>
                            {kit.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="info">{kit.role}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {kit.description && (
                    <p className="text-sm text-gray-600 mb-4">{kit.description}</p>
                  )}

                  {kit.department && (
                    <p className="text-xs text-gray-500 mb-4">
                      <span className="font-semibold">Department:</span> {kit.department.name}
                    </p>
                  )}

                  {/* Kit Contents */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FiPackage className="text-blue-600" />
                      <span className="font-semibold">{kit.assetTemplates?.length || 0}</span> Asset Templates
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FiKey className="text-purple-600" />
                      <span className="font-semibold">{kit.licenseTemplates?.length || 0}</span> License Templates
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FiCheckSquare className="text-green-600" />
                      <span className="font-semibold">{kit.tasks?.length || 0}</span> Onboarding Tasks
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <Link
                      to={`/onboarding-kits/${kit._id}`}
                      className="flex-1 btn btn-primary text-sm flex items-center justify-center gap-2"
                    >
                      View Details
                    </Link>
                    {canManage() && (
                      <>
                        <Link
                          to={`/onboarding-kits/${kit._id}/edit`}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <FiEdit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(kit._id, kit.name)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingKitList;

