import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiEye, FiMail, FiPhone, FiPlus, FiEdit, FiGrid, FiTrash2, FiUser } from 'react-icons/fi';
import { usersAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import SearchBar from '../../components/Common/SearchBar';
import Pagination from '../../components/Common/Pagination';
import Badge, { getStatusVariant } from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import UserForm from './UserForm';
import EmptyState from '../../components/Common/EmptyState';
import toast from 'react-hot-toast';

const UserList = () => {
  const { canManage } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Fetch users with stats
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter, statusFilter],
    queryFn: () => {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      return usersAPI.getAll(params).then((res) => res.data);
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch all users for role stats (limit to first 500)
  const { data: allUsersData } = useQuery({
    queryKey: ['all-users-stats'],
    queryFn: () => usersAPI.getAll({ limit: 500 }).then((res) => res.data.data),
  });

  // Calculate role stats
  const roleStats = useMemo(() => {
    if (!allUsersData) return [];
    
    const roles = ['admin', 'manager', 'staff'];
    const stats = [];
    
    roles.forEach(role => {
      const roleUsers = allUsersData.filter(u => u.role === role);
      const active = roleUsers.filter(u => u.status === 'active').length;
      const inactive = roleUsers.filter(u => u.status === 'inactive').length;
      
      if (roleUsers.length > 0) {
        stats.push({
          role,
          total: roleUsers.length,
          active,
          inactive,
          icon: role === 'admin' ? '👑' : role === 'manager' ? '🎯' : '👤',
          color: role === 'admin' ? 'from-red-500 to-red-600' : role === 'manager' ? 'from-blue-500 to-blue-600' : 'from-emerald-500 to-emerald-600'
        });
      }
    });
    
    return stats.sort((a, b) => b.total - a.total);
  }, [allUsersData]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => usersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['all-users-stats']);
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleRoleClick = (role) => {
    setRoleFilter(role === roleFilter ? '' : role);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  if (isLoading) return <LoadingSpinner />;

  const { data: users, pagination } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">User Management</h1>
          <p className="text-secondary-600 mt-2">
            Manage user accounts, roles, permissions, and asset assignments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="btn btn-outline flex items-center gap-2"
            title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            <FiGrid size={18} />
          </button>
          {canManage() && (
            <button
              onClick={() => {
                setEditingUser(null);
                setShowUserModal(true);
              }}
              className="btn btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <FiPlus size={20} />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <button
          onClick={clearFilters}
          className={`category-card ${!roleFilter ? 'ring-2 ring-primary-500 bg-primary-50' : 'bg-white hover:bg-gray-50'}`}
        >
          <div className="text-3xl mb-2">👥</div>
          <div className="font-semibold text-sm text-gray-900">All Users</div>
          <div className="text-xs text-gray-500 mt-1">{pagination?.totalResults || 0} total</div>
        </button>
        {roleStats.map((stat) => (
          <button
            key={stat.role}
            onClick={() => handleRoleClick(stat.role)}
            className={`category-card ${roleFilter === stat.role ? 'ring-2 ring-primary-500 bg-primary-50' : 'bg-white hover:bg-gray-50'}`}
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="font-semibold text-sm text-gray-900 capitalize">{stat.role}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.total} users</div>
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span className="text-green-600">✓{stat.active}</span>
              {stat.inactive > 0 && <span className="text-gray-600">•{stat.inactive}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                onSearch={setSearch}
                placeholder="Search users by name, email, department..."
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input bg-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(search || statusFilter || roleFilter) && (
              <button
                onClick={clearFilters}
                className="btn btn-outline whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Grid/List */}
      {!users || users.length === 0 ? (
        <EmptyState
          icon={FiUser}
          title="No users found"
          description="Get started by adding your first user to the system"
          action={canManage() ? () => setShowUserModal(true) : null}
          actionLabel="Add First User"
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users?.map((user) => {
            const roleColors = {
              admin: 'from-red-500 to-red-600',
              manager: 'from-blue-500 to-blue-600',
              staff: 'from-emerald-500 to-emerald-600',
            };
            
            return (
              <div key={user._id} className="asset-card">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${roleColors[user.role] || 'from-primary-500 to-primary-600'} text-white text-2xl shadow-lg`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/users/${user._id}`}
                      className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="View"
                    >
                      <FiEye size={16} />
                    </Link>
                    {canManage() && (
                      <>
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowUserModal(true);
                          }}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {user.email}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Role</span>
                    <Badge variant="primary" className="text-xs">
                      {user.role === 'admin' && '👑 '}
                      {user.role === 'manager' && '🎯 '}
                      {user.role === 'staff' && '👤 '}
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <Badge variant={getStatusVariant(user.status)} className="text-xs">
                      {user.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Department</span>
                    <span className="text-gray-700 font-medium">{user.department?.name || 'N/A'}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Assets</span>
                    <span className="font-bold text-gray-900">{user.assignedAssets?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-500">Licenses</span>
                    <span className="font-bold text-gray-900">{user.licenses?.length || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {users?.map((user) => {
            const roleColors = {
              admin: 'from-red-500 to-red-600',
              manager: 'from-blue-500 to-blue-600',
              staff: 'from-emerald-500 to-emerald-600',
            };
            
            return (
              <div key={user._id} className="asset-card">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${roleColors[user.role] || 'from-primary-500 to-primary-600'} text-white text-2xl shadow-lg`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <FiPhone size={14} />
                        {user.phone}
                      </p>
                    )}
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <Badge variant="primary">
                      {user.role === 'admin' && '👑 '}
                      {user.role === 'manager' && '🎯 '}
                      {user.role === 'staff' && '👤 '}
                      {user.role}
                    </Badge>
                    <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
                  </div>
                  <div className="hidden lg:block text-sm text-gray-700 font-medium">
                    {user.department?.name || 'N/A'}
                  </div>
                  <div className="hidden lg:flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{user.assignedAssets?.length || 0}</div>
                      <div className="text-xs text-gray-500">Assets</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{user.licenses?.length || 0}</div>
                      <div className="text-xs text-gray-500">Licenses</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canManage() && (
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FiEdit size={18} />
                      </button>
                    )}
                    <Link
                      to={`/users/${user._id}`}
                      className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="View"
                    >
                      <FiEye size={18} />
                    </Link>
                    {canManage() && (
                      <button
                        onClick={() => handleDelete(user._id, user.name)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > 1 && (
        <Pagination
          currentPage={pagination.current}
          totalPages={pagination.total}
          onPageChange={setPage}
        />
      )}

      {/* User Form Modal */}
      {showUserModal && (
        <Modal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          title={editingUser ? 'Edit User' : 'Add New User'}
          size="lg"
        >
          <UserForm
            user={editingUser}
            onClose={() => {
              setShowUserModal(false);
              setEditingUser(null);
            }}
            onSuccess={() => {
              setShowUserModal(false);
              setEditingUser(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default UserList;

