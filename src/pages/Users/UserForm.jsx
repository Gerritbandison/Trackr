import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiShield, FiEye, FiEyeOff } from 'react-icons/fi';
import { usersAPI, departmentsAPI } from '../../config/api';
import toast from 'react-hot-toast';

const UserForm = ({ user = null, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    department: '',
    jobTitle: '',
    phone: '',
    location: '',
    status: 'active',
  });

  // Fetch departments for dropdown
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then((res) => res.data.data || res.data || []),
  });

  // Initialize form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Don't pre-fill password
        role: user.role || 'staff',
        department: user.department?._id || user.department || '',
        jobTitle: user.jobTitle || '',
        phone: user.phone || '',
        location: user.location || '',
        status: user.status || 'active',
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data) => {
      // Clean the data - remove empty strings and don't send password if empty
      const cleanData = { ...data };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === '') {
          delete cleanData[key];
        }
      });
      
      // Ensure status is always set to a valid value
      if (!cleanData.status) {
        cleanData.status = 'active';
      }
      
      // Don't send password if it's empty (for updates)
      if (!cleanData.password) {
        delete cleanData.password;
      }

      console.log('Cleaned data being sent to API:', cleanData);
      console.log('Status in cleaned data:', cleanData.status);

      if (user) {
        return usersAPI.update(user._id, cleanData);
      } else {
        return usersAPI.create(cleanData);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['departments']);
      toast.success(user ? 'User updated successfully!' : 'User created successfully!');
      onSuccess?.(response.data.data);
      onClose();
    },
    onError: (error) => {
      console.error('User form error:', error);
      console.error('Response data:', error.response?.data);
      const errorData = error.response?.data;
      if (errorData?.errors) {
        const errors = errorData.errors;
        if (Array.isArray(errors)) {
          errors.forEach((err) => {
            const message = typeof err === 'string' ? err : err.msg || err.message || JSON.stringify(err);
            toast.error(message);
          });
        } else if (typeof errors === 'object') {
          Object.keys(errors).forEach(key => {
            const value = errors[key];
            const message = typeof value === 'string' ? value : value.msg || value.message || JSON.stringify(value);
            toast.error(`${key}: ${message}`);
          });
        } else {
          toast.error(String(errors));
        }
      } else {
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Operation failed';
        // Make duplicate error messages more user-friendly
        if (errorMessage.includes('Duplicate') && errorMessage.includes('email')) {
          toast.error('This email address is already in use. Please use a different email.');
        } else {
          toast.error(errorMessage);
        }
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!user && !formData.password.trim()) {
      toast.error('Password is required for new users');
      return;
    }

      console.log('Submitting user data:', formData);
      console.log('Form data status value:', formData.status);
      mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
          <FiUser className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <p className="text-sm text-gray-600">
            {user ? 'Update user information and permissions' : 'Create a new user account'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password {!user && '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input pr-10"
                placeholder={user ? 'Leave blank to keep current password' : 'Enter password'}
                required={!user}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
            {user && (
              <p className="text-xs text-gray-500">Leave blank to keep current password</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role *
            </label>
            <div className="relative">
              <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input pl-10"
                required
              >
                <option value="staff">👤 Staff</option>
                <option value="manager">🎯 Manager</option>
                <option value="admin">👑 Admin</option>
              </select>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <div className="relative">
              <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="input pl-10"
              >
                <option value="">Select department</option>
                {departmentsData?.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <div className="relative">
              <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Enter job title"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input pl-10"
                placeholder="Enter location"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status *
            </label>
            <div className="relative">
              <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input pl-10"
                required
              >
                <option value="active">✅ Active</option>
                <option value="inactive">⏸️ Inactive</option>
                <option value="terminated">❌ Terminated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {user ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              user ? 'Update User' : 'Create User'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
