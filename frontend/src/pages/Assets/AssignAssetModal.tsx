import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { assetsAPI, usersAPI } from '../../config/api';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const AssignAssetModal = ({ asset, onClose, onSuccess }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch users
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: async () => {
      try {
        const response = await usersAPI.getAll({ status: 'active', limit: 100 });
        // Handle both possible response structures
        return response.data?.data || response.data || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: (data) => assetsAPI.assign(asset._id, data),
    onSuccess: () => {
      toast.success('Asset assigned successfully!');
      onSuccess();
    },
    onError: (error) => {
      console.error('Full assignment error:', error);
      console.error('Response data:', error.response?.data);
      
      // Display detailed validation errors
      const errorData = error.response?.data;
      
      // If there are validation errors, show them
      if (errorData?.errors) {
        const errors = errorData.errors;
        if (Array.isArray(errors)) {
          // Handle array of errors
          errors.forEach((err) => {
            const message = typeof err === 'string' ? err : err.msg || err.message || JSON.stringify(err);
            toast.error(message);
          });
        } else if (typeof errors === 'object') {
          // Handle object with error fields
          Object.keys(errors).forEach(key => {
            const value = errors[key];
            const message = typeof value === 'string' ? value : value.msg || value.message || JSON.stringify(value);
            toast.error(`${key}: ${message}`);
          });
        } else {
          toast.error(String(errors));
        }
      } else {
        // Show the main error message
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to assign asset';
        toast.error(errorMessage);
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }
    
    // Backend expects both assetId and userId
    const payload = {
      assetId: asset._id,
      userId: selectedUserId,
    };
    
    // Only add notes if they exist
    if (notes && notes.trim()) {
      payload.notes = notes.trim();
    }
    
    assignMutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Assign ${asset.name}`}
      footer={
        <>
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={assignMutation.isPending}
            className="btn btn-primary"
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Select User *</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
            className="input"
            disabled={loadingUsers}
          >
            <option value="">-- Select User --</option>
            {loadingUsers ? (
              <option disabled>Loading users...</option>
            ) : usersData && usersData.length > 0 ? (
              usersData.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))
            ) : (
              <option disabled>No active users available</option>
            )}
          </select>
          {!loadingUsers && (!usersData || usersData.length === 0) && (
            <p className="text-sm text-red-600 mt-1">No active users found. Please ensure there are active users in the system.</p>
          )}
        </div>

        <div>
          <label className="label">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="input"
            placeholder="Add any notes about this assignment..."
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Asset Details:</h4>
          <div className="text-sm space-y-1 text-gray-600">
            <p>
              <span className="font-medium">Name:</span> {asset.name}
            </p>
            <p>
              <span className="font-medium">Model:</span> {asset.manufacturer}{' '}
              {asset.model}
            </p>
            {asset.serialNumber && (
              <p>
                <span className="font-medium">Serial:</span> {asset.serialNumber}
              </p>
            )}
            <p>
              <span className="font-medium">Status:</span> {asset.status}
            </p>
            <p>
              <span className="font-medium">Asset ID:</span> <span className="font-mono text-xs">{asset._id}</span>
            </p>
          </div>
        </div>
        
        {selectedUserId && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900 font-semibold mb-1">Debug Info:</p>
            <p className="text-xs text-blue-800 font-mono break-all">
              User ID: {selectedUserId}
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default AssignAssetModal;

