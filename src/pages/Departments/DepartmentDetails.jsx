import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiArrowLeft, FiEdit, FiTrash2, FiUsers, FiPackage, FiKey, 
  FiMapPin, FiDollarSign, FiMail, FiPhone, FiGrid, FiUserPlus 
} from 'react-icons/fi';
import { departmentsAPI, usersAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import toast from 'react-hot-toast';
import { getDepartmentConfig } from '../../utils/departmentIcons';

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManage, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Fetch department details
  const { data: department, isLoading } = useQuery({
    queryKey: ['department', id],
    queryFn: () => departmentsAPI.getById(id).then((res) => res.data.data),
  });

  // Fetch all users for add user modal
  const { data: allUsers } = useQuery({
    queryKey: ['users-for-department'],
    queryFn: () => usersAPI.getAll().then((res) => res.data.data),
    enabled: showAddUserModal,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => departmentsAPI.delete(id),
    onSuccess: () => {
      toast.success('Department deleted successfully');
      navigate('/departments');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    },
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: (userId) => departmentsAPI.addUser(id, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['department', id]);
      queryClient.invalidateQueries(['departments']);
      toast.success('User added to department');
      setShowAddUserModal(false);
      setSelectedUserId('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add user');
    },
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: (userId) => departmentsAPI.removeUser(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['department', id]);
      queryClient.invalidateQueries(['departments']);
      toast.success('User removed from department');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove user');
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${department?.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const handleAddUser = () => {
    if (selectedUserId) {
      addUserMutation.mutate(selectedUserId);
    }
  };

  const handleRemoveUser = (userId, userName) => {
    if (window.confirm(`Remove ${userName} from this department?`)) {
      removeUserMutation.mutate(userId);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!department) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Department Not Found</h1>
        <button onClick={() => navigate('/departments')} className="btn btn-primary">
          Back to Departments
        </button>
      </div>
    );
  }

  // Filter out users already in this department
  const availableUsers = allUsers?.filter(
    user => !department.users?.some(deptUser => deptUser._id === user._id)
  ) || [];

  // Calculate department statistics
  const totalAssets = department.users?.reduce((sum, user) => 
    sum + (user.assignedAssets?.length || 0), 0
  ) || 0;
  
  const totalLicenses = department.users?.reduce((sum, user) => 
    sum + (user.licenses?.length || 0), 0
  ) || 0;

  // Get department configuration with icon and colors
  const deptConfig = getDepartmentConfig(department.name);
  const DeptIcon = deptConfig.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/departments')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${deptConfig.color} flex items-center justify-center shadow-lg`}>
            <DeptIcon className="text-white" size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">{department.name}</h1>
              <Badge variant={department.status === 'active' ? 'success' : 'gray'}>
                {department.status}
              </Badge>
              {department.code && (
                <span className="text-lg font-mono font-semibold text-secondary-500 bg-gray-100 px-3 py-1 rounded-lg">
                  {department.code}
                </span>
              )}
            </div>
            <p className="text-secondary-600 text-lg">{department.description}</p>
          </div>
        </div>
        
        {isAdmin() && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/departments/${id}/edit`)}
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
          </div>
        )}
      </div>

      {/* Department Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <FiUsers className="mx-auto mb-2 text-emerald-600" size={32} />
            <div className="text-3xl font-bold text-emerald-600 mb-1">{department.users?.length || 0}</div>
            <div className="text-sm text-gray-600">Employees</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <FiPackage className="mx-auto mb-2 text-blue-600" size={32} />
            <div className="text-3xl font-bold text-blue-600 mb-1">{totalAssets}</div>
            <div className="text-sm text-gray-600">Assets</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <FiKey className="mx-auto mb-2 text-purple-600" size={32} />
            <div className="text-3xl font-bold text-purple-600 mb-1">{totalLicenses}</div>
            <div className="text-sm text-gray-600">Licenses</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <FiDollarSign className="mx-auto mb-2 text-amber-600" size={32} />
            <div className="text-3xl font-bold text-amber-600 mb-1">
              ${department.budget ? (department.budget / 1000).toFixed(0) + 'K' : '0'}
            </div>
            <div className="text-sm text-gray-600">Annual Budget</div>
          </div>
        </div>
      </div>

      {/* Department Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Contact Information</h2>
          </div>
          <div className="card-body space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <FiMapPin className="text-primary-600" size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Location</p>
                <p className="text-sm font-semibold text-gray-900">{department.location || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FiMail className="text-blue-600" size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Email</p>
                <p className="text-sm font-semibold text-gray-900">{department.contactEmail || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FiPhone className="text-green-600" size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Phone</p>
                <p className="text-sm font-semibold text-gray-900">{department.contactPhone || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Financial Details</h2>
          </div>
          <div className="card-body space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">Cost Center</p>
              <p className="text-sm font-semibold text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-lg">
                {department.costCenter || 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Annual Budget</p>
              <p className="text-2xl font-bold text-primary-600">
                ${department.budget?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Asset Value</p>
              <p className="text-lg font-semibold text-gray-900">
                Calculated based on assigned assets
              </p>
            </div>
          </div>
        </div>

        {/* Manager Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Department Manager</h2>
          </div>
          <div className="card-body">
            {department.manager ? (
              <Link 
                to={`/users/${department.manager._id}`}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                  {department.manager.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{department.manager.name}</p>
                  <p className="text-sm text-gray-600">{department.manager.jobTitle || 'Manager'}</p>
                  <p className="text-xs text-gray-500">{department.manager.email}</p>
                </div>
              </Link>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiUsers size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No manager assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Users */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiUsers className="text-emerald-600" />
            <h2 className="text-xl font-semibold">Team Members ({department.users?.length || 0})</h2>
          </div>
          {canManage() && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <FiUserPlus size={16} />
              Add User
            </button>
          )}
        </div>
        <div className="card-body">
          {!department.users || department.users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiUsers size={48} className="mx-auto mb-4 opacity-30" />
              <p>No team members in this department yet</p>
              {canManage() && (
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="btn btn-primary mt-4"
                >
                  <FiUserPlus className="inline mr-2" />
                  Add First Member
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {department.users.map((user) => (
                <div
                  key={user._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          to={`/users/${user._id}`}
                          className="font-semibold text-gray-900 hover:text-primary-600"
                        >
                          {user.name}
                        </Link>
                        <p className="text-xs text-gray-600">{user.jobTitle}</p>
                      </div>
                    </div>
                    <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'warning' : 'info'}>
                      {user.role}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">{user.email}</p>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                      <span className="text-gray-600">Assets:</span>
                      <span className="font-semibold text-blue-600">{user.assignedAssets?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Licenses:</span>
                      <span className="font-semibold text-purple-600">{user.licenses?.length || 0}</span>
                    </div>
                  </div>

                  {canManage() && (
                    <button
                      onClick={() => handleRemoveUser(user._id, user.name)}
                      className="w-full mt-3 btn btn-sm btn-outline text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      Remove from Department
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title="Add User to Department"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Select a user to add to {department.name}
          </p>
          
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">
              Select User *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Choose a user...</option>
              {availableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddUser}
              disabled={!selectedUserId || addUserMutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              <FiUserPlus size={16} />
              {addUserMutation.isPending ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DepartmentDetails;

