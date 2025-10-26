import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiTrash2, FiArrowLeft, FiPackage, FiKey, FiCheckSquare, FiUsers, FiPlay } from 'react-icons/fi';
import { onboardingKitsAPI, usersAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import toast from 'react-hot-toast';

const OnboardingKitDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const queryClient = useQueryClient();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');

  // Fetch kit details
  const { data: kit, isLoading } = useQuery({
    queryKey: ['onboarding-kit', id],
    queryFn: () => onboardingKitsAPI.getById(id).then((res) => res.data.data),
  });

  // Fetch users for apply modal
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll().then((res) => res.data.data),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => onboardingKitsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-kits']);
      toast.success('Onboarding kit deleted successfully');
      navigate('/onboarding-kits');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete onboarding kit');
    },
  });

  // Apply kit mutation
  const applyMutation = useMutation({
    mutationFn: (userId) => onboardingKitsAPI.applyToUser(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-kit', id]);
      toast.success('Onboarding kit applied successfully');
      setShowApplyModal(false);
      setSelectedUser('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to apply onboarding kit');
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${kit?.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const handleApply = () => {
    if (selectedUser) {
      applyMutation.mutate(selectedUser);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!kit) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Onboarding Kit Not Found</h1>
        <p className="text-gray-600 mb-6">The requested onboarding kit could not be found.</p>
        <button
          onClick={() => navigate('/onboarding-kits')}
          className="btn btn-primary"
        >
          Back to Onboarding Kits
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/onboarding-kits')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">{kit.name}</h1>
            <p className="text-secondary-600 mt-2 text-lg">{kit.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canManage() && (
            <>
              <button
                onClick={() => setShowApplyModal(true)}
                className="btn btn-primary flex items-center gap-2"
                disabled={!kit.isActive}
              >
                <FiPlay size={16} />
                Apply Kit
              </button>
              <button
                onClick={() => navigate(`/onboarding-kits/${id}/edit`)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <FiEdit size={16} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger flex items-center gap-2"
              >
                <FiTrash2 size={16} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Kit Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">{kit.role}</div>
            <div className="text-sm text-gray-600">Role</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{kit.assetTemplates?.length || 0}</div>
            <div className="text-sm text-gray-600">Assets</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{kit.licenseTemplates?.length || 0}</div>
            <div className="text-sm text-gray-600">Licenses</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{kit.tasks?.length || 0}</div>
            <div className="text-sm text-gray-600">Tasks</div>
          </div>
        </div>
      </div>

      {/* Status and Department */}
      <div className="flex items-center gap-4">
        <Badge variant={kit.isActive ? 'success' : 'default'}>
          {kit.isActive ? 'Active' : 'Inactive'}
        </Badge>
        {kit.department && (
          <Badge variant="info">
            {kit.department.name}
          </Badge>
        )}
        <span className="text-sm text-gray-600">
          Created by {kit.createdBy?.name}
        </span>
      </div>

      {/* Asset Templates */}
      {kit.assetTemplates && kit.assetTemplates.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <FiPackage className="text-blue-600" />
            <h2 className="text-xl font-semibold text-secondary-900">Asset Templates</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kit.assetTemplates.map((template, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 capitalize">{template.category}</h3>
                    <span className="text-sm text-gray-600">Qty: {template.quantity}</span>
                  </div>
                  {template.manufacturer && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Manufacturer:</span> {template.manufacturer}
                    </p>
                  )}
                  {template.model && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Model:</span> {template.model}
                    </p>
                  )}
                  {template.notes && (
                    <p className="text-sm text-gray-500 mt-2 italic">{template.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* License Templates */}
      {kit.licenseTemplates && kit.licenseTemplates.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <FiKey className="text-purple-600" />
            <h2 className="text-xl font-semibold text-secondary-900">License Templates</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kit.licenseTemplates.map((template, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{template.name || 'Unnamed License'}</h3>
                    <div className="flex items-center gap-2">
                      {template.required && (
                        <Badge variant="warning">Required</Badge>
                      )}
                      {template.type && (
                        <Badge variant="info">{template.type}</Badge>
                      )}
                    </div>
                  </div>
                  {template.license && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">License:</span> {template.license.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tasks */}
      {kit.tasks && kit.tasks.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <FiCheckSquare className="text-green-600" />
            <h2 className="text-xl font-semibold text-secondary-900">Onboarding Tasks</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {kit.tasks.map((task, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{task.assignedTo}</Badge>
                      <span className="text-sm text-gray-600">{task.daysToComplete} days</span>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Apply Kit Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply Onboarding Kit"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Select a user to apply the "{kit.name}" onboarding kit to. This will allocate assets, assign licenses, and create tasks.
          </p>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">
              Select User *
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Choose a user...</option>
              {users?.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={() => setShowApplyModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedUser || applyMutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              <FiPlay size={16} />
              {applyMutation.isPending ? 'Applying...' : 'Apply Kit'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OnboardingKitDetails;
