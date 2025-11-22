import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiUser,
  FiUserPlus,
  FiUserMinus,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import { licensesAPI, usersAPI } from '../../config/api';
import Badge from '../Common/Badge';
import Modal from '../Common/Modal';
import SearchBar from '../Common/SearchBar';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/**
 * License Assignment Modal Component
 * Handles assigning and unassigning licenses to/from users
 */
const LicenseAssignmentModal = ({ license, isOpen, onClose, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const queryClient = useQueryClient();

  // Debounce search term for better performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Update debounced search when searchTerm changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch all users
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users', debouncedSearchTerm],
    queryFn: () => {
      const params = { limit: 100 };
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      return usersAPI.getAll(params).then((res) => res.data);
    },
    enabled: isOpen,
  });

  // Assign license mutation
  const assignMutation = useMutation({
    mutationFn: (data) => licensesAPI.assign(license._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['license', license._id]);
      queryClient.invalidateQueries(['licenses']);
      toast.success('License assigned successfully');
      setSelectedUser(null);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to assign license'
      );
    },
  });

  // Unassign license mutation
  const unassignMutation = useMutation({
    mutationFn: (data) => licensesAPI.unassign(license._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['license', license._id]);
      queryClient.invalidateQueries(['licenses']);
      toast.success('License unassigned successfully');
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to unassign license'
      );
    },
  });

  const users = usersData?.data || [];
  const assignedUserIds = license.assignedUsers?.map((u) => u._id || u) || [];
  const usedSeats = assignedUserIds.length;
  const availableSeats = (license.totalSeats || 0) - usedSeats;
  const isOverLimit = usedSeats >= (license.totalSeats || 0);

  const handleAssign = (user) => {
    if (isOverLimit) {
      toast.error('License limit reached. Cannot assign more users.');
      return;
    }

    if (assignedUserIds.includes(user._id)) {
      toast.error('User already has this license assigned');
      return;
    }

    assignMutation.mutate({ userId: user._id });
  };

  const handleUnassign = (user) => {
    if (
      window.confirm(
        `Are you sure you want to unassign this license from ${user.name}?`
      )
    ) {
      unassignMutation.mutate({ userId: user._id });
    }
  };

  const assignedUsers = users.filter((user) =>
    assignedUserIds.includes(user._id)
  );
  const availableUsers = users.filter(
    (user) => !assignedUserIds.includes(user._id)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="License Assignment" size="lg">
      <div className="space-y-6">
        {/* License Info */}
        <div className="bg-primary-50 rounded-lg p-4 border-2 border-primary-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-primary-900">{license.name}</h3>
            <Badge
              variant={isOverLimit ? 'danger' : 'success'}
              text={isOverLimit ? 'Full' : 'Available'}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-xs text-primary-600 font-medium">Total Seats</p>
              <p className="text-lg font-bold text-primary-900">
                {license.totalSeats || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-primary-600 font-medium">Used</p>
              <p className="text-lg font-bold text-primary-900">{usedSeats}</p>
            </div>
            <div>
              <p className="text-xs text-primary-600 font-medium">Available</p>
              <p className="text-lg font-bold text-primary-900">
                {availableSeats}
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Users */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900">Assigned Users</h4>
            <Badge variant="info" text={`${assignedUsers.length} assigned`} />
          </div>

          {assignedUsers.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <FiUser className="mx-auto text-slate-400 mb-3" size={32} />
              <p className="text-sm text-slate-600">No users assigned</p>
              <p className="text-xs text-slate-500 mt-1">
                Assign users from the available list below
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {assignedUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-slate-200 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {user.email}
                      </p>
                    </div>
                    <Badge variant="success" text="Assigned" className="text-xs" />
                  </div>
                  <button
                    onClick={() => handleUnassign(user)}
                    disabled={unassignMutation.isPending}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-3"
                    title="Unassign"
                  >
                    <FiUserMinus size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Users */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900">Available Users</h4>
            <div className="w-64">
              <SearchBar
                onSearch={setSearchTerm}
                placeholder="Search users..."
                className="w-full"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-600">Loading users...</p>
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <FiCheckCircle className="mx-auto text-slate-400 mb-3" size={32} />
              <p className="text-sm text-slate-600">
                {searchTerm
                  ? 'No users found matching your search'
                  : 'All users already assigned'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-slate-200 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssign(user)}
                    disabled={
                      assignMutation.isPending ||
                      isOverLimit ||
                      assignedUserIds.includes(user._id)
                    }
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Assign"
                  >
                    <FiUserPlus size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isOverLimit && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    License Limit Reached
                  </p>
                  <p className="text-xs text-red-800 mt-1">
                    You cannot assign more users. Please unassign existing users
                    or increase the license seat count.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LicenseAssignmentModal;

