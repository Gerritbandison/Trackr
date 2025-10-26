import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiEye, FiMail, FiPhone, FiPlus, FiEdit } from 'react-icons/fi';
import { usersAPI } from '../../config/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import SearchBar from '../../components/Common/SearchBar';
import Pagination from '../../components/Common/Pagination';
import Badge, { getStatusVariant } from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import UserForm from './UserForm';
import { useAuth } from '../../contexts/AuthContext';

const UserList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { canManage } = useAuth();

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

  if (isLoading) return <LoadingSpinner />;

  const { data: users, pagination } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">User Management</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Manage user accounts, roles, permissions, and asset assignments
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditingUser(null);
              setShowUserModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiPlus className="h-4 w-4" />
            Add New User
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-secondary-900">Filter & Search</h3>
            <span className="ml-auto text-sm text-secondary-500">
              {pagination?.totalResults || 0} users found
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <SearchBar
                onSearch={setSearch}
                placeholder="Search by name, email, department..."
              />
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input bg-white"
              >
                <option value="">👥 All Roles</option>
                <option value="admin">👑 Admin</option>
                <option value="manager">🎯 Manager</option>
                <option value="staff">👤 Staff</option>
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input bg-white"
              >
                <option value="">📊 All Status</option>
                <option value="active">✅ Active</option>
                <option value="inactive">⏸️ Inactive</option>
              </select>
            </div>
          </div>
          {(search || roleFilter || statusFilter) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-secondary-600">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                  Search: {search}
                  <button onClick={() => setSearch('')} className="hover:text-emerald-900">×</button>
                </span>
              )}
              {roleFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                  Role: {roleFilter}
                  <button onClick={() => setRoleFilter('')} className="hover:text-emerald-900">×</button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('')} className="hover:text-emerald-900">×</button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-transparent">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary-900">User Directory</h3>
          <div className="text-sm text-secondary-600">
            Showing {users?.length || 0} of {pagination?.totalResults || 0} users
          </div>
        </div>
        <div className="space-y-0">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="pb-3 px-4">User Details</th>
                <th className="pb-3 px-4">Role</th>
                <th className="pb-3 px-4">Department</th>
                <th className="pb-3 px-4">Assets</th>
                <th className="pb-3 px-4">Licenses</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user, index) => {
                const roleColors = {
                  admin: 'from-red-500 to-red-600',
                  manager: 'from-blue-500 to-blue-600',
                  staff: 'from-emerald-500 to-emerald-600',
                };
                
                return (
                  <tr key={user._id} className="table-row-bubble animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${roleColors[user.role] || roleColors.staff} flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-secondary-900">{user.name}</div>
                          <div className="text-sm text-secondary-500 flex items-center gap-1.5">
                            <FiMail size={13} />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-secondary-500 flex items-center gap-1.5">
                              <FiPhone size={13} />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant="primary">
                        {user.role === 'admin' && '👑 '}
                        {user.role === 'manager' && '🎯 '}
                        {user.role === 'staff' && '👤 '}
                        {user.role}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-secondary-700">{user.department?.name || 'N/A'}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-secondary-900">
                          {user.assignedAssets?.length || 0}
                        </span>
                        <span className="text-xs text-secondary-500">assets</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-secondary-900">
                          {user.licenses?.length || 0}
                        </span>
                        <span className="text-xs text-secondary-500">licenses</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {canManage && (
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowUserModal(true);
                            }}
                            className="p-2 text-secondary-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <FiEdit size={18} />
                          </button>
                        )}
                        <Link
                          to={`/users/${user._id}`}
                          className="p-2 text-secondary-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total > 1 && (
          <Pagination
            currentPage={pagination.current}
            totalPages={pagination.total}
            onPageChange={setPage}
          />
        )}
      </div>

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

