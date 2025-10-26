import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiPackage, FiKey, FiCheckSquare } from 'react-icons/fi';
import { onboardingKitsAPI, departmentsAPI, licensesAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const OnboardingKitForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { canManage } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    role: 'staff',
    department: '',
    isActive: true,
    assetTemplates: [],
    licenseTemplates: [],
    tasks: [],
  });

  // Fetch departments and licenses for dropdowns
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then((res) => res.data.data),
  });

  const { data: licenses } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => licensesAPI.getAll().then((res) => res.data.data),
  });

  // Fetch existing kit if editing
  const { data: existingKit, isLoading: isLoadingKit } = useQuery({
    queryKey: ['onboarding-kit', id],
    queryFn: () => onboardingKitsAPI.getById(id).then((res) => res.data.data),
    enabled: isEditing,
  });

  // Update form data when existing kit loads
  useEffect(() => {
    if (existingKit) {
      setFormData({
        name: existingKit.name || '',
        description: existingKit.description || '',
        role: existingKit.role || 'staff',
        department: existingKit.department?._id || '',
        isActive: existingKit.isActive ?? true,
        assetTemplates: existingKit.assetTemplates || [],
        licenseTemplates: existingKit.licenseTemplates || [],
        tasks: existingKit.tasks || [],
      });
    }
  }, [existingKit]);

  // Create/Update mutations
  const createMutation = useMutation({
    mutationFn: (data) => onboardingKitsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-kits']);
      toast.success('Onboarding kit created successfully');
      navigate('/onboarding-kits');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create onboarding kit');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => onboardingKitsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding-kits']);
      queryClient.invalidateQueries(['onboarding-kit', id]);
      toast.success('Onboarding kit updated successfully');
      navigate('/onboarding-kits');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update onboarding kit');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Asset Template Functions
  const addAssetTemplate = () => {
    setFormData(prev => ({
      ...prev,
      assetTemplates: [...prev.assetTemplates, {
        category: '',
        manufacturer: '',
        model: '',
        quantity: 1,
        specifications: {},
        notes: '',
      }]
    }));
  };

  const updateAssetTemplate = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      assetTemplates: prev.assetTemplates.map((template, i) => 
        i === index ? { ...template, [field]: value } : template
      )
    }));
  };

  const removeAssetTemplate = (index) => {
    setFormData(prev => ({
      ...prev,
      assetTemplates: prev.assetTemplates.filter((_, i) => i !== index)
    }));
  };

  // License Template Functions
  const addLicenseTemplate = () => {
    setFormData(prev => ({
      ...prev,
      licenseTemplates: [...prev.licenseTemplates, {
        license: '',
        name: '',
        type: '',
        required: true,
      }]
    }));
  };

  const updateLicenseTemplate = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      licenseTemplates: prev.licenseTemplates.map((template, i) => 
        i === index ? { ...template, [field]: value } : template
      )
    }));
  };

  const removeLicenseTemplate = (index) => {
    setFormData(prev => ({
      ...prev,
      licenseTemplates: prev.licenseTemplates.filter((_, i) => i !== index)
    }));
  };

  // Task Functions
  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        title: '',
        description: '',
        daysToComplete: 7,
        assignedTo: 'it',
      }]
    }));
  };

  const updateTask = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const removeTask = (index) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  if (isLoadingKit) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/onboarding-kits')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">
            {isEditing ? 'Edit Onboarding Kit' : 'Create Onboarding Kit'}
          </h1>
          <p className="text-secondary-600 mt-2 text-lg">
            {isEditing ? 'Update kit configuration and templates' : 'Configure a new onboarding kit for your team'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-secondary-900">Basic Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Kit Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Lenovo E14 Standard Kit"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="developer">Developer</option>
                  <option value="designer">Designer</option>
                  <option value="executive">Executive</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe what this kit includes and who it's for..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  {departments?.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-semibold text-secondary-700">Active</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Templates */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiPackage className="text-blue-600" />
              <h2 className="text-xl font-semibold text-secondary-900">Asset Templates</h2>
            </div>
            <button
              type="button"
              onClick={addAssetTemplate}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <FiPlus size={16} />
              Add Asset
            </button>
          </div>
          <div className="card-body space-y-4">
            {formData.assetTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiPackage className="mx-auto mb-2" size={32} />
                <p>No asset templates added yet</p>
                <p className="text-sm">Click "Add Asset" to get started</p>
              </div>
            ) : (
              formData.assetTemplates.map((template, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Asset Template {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeAssetTemplate(index)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={template.category}
                        onChange={(e) => updateAssetTemplate(index, 'category', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select Category</option>
                        <option value="laptop">Laptop</option>
                        <option value="desktop">Desktop</option>
                        <option value="monitor">Monitor</option>
                        <option value="phone">Phone</option>
                        <option value="tablet">Tablet</option>
                        <option value="dock">Dock</option>
                        <option value="mouse">Mouse</option>
                        <option value="keyboard">Keyboard</option>
                        <option value="headset">Headset</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        value={template.manufacturer}
                        onChange={(e) => updateAssetTemplate(index, 'manufacturer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., Lenovo, Dell, Apple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        Model
                      </label>
                      <input
                        type="text"
                        value={template.model}
                        onChange={(e) => updateAssetTemplate(index, 'model', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., ThinkPad E14 Gen 4"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={template.quantity}
                        onChange={(e) => updateAssetTemplate(index, 'quantity', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={template.notes}
                        onChange={(e) => updateAssetTemplate(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* License Templates */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiKey className="text-purple-600" />
              <h2 className="text-xl font-semibold text-secondary-900">License Templates</h2>
            </div>
            <button
              type="button"
              onClick={addLicenseTemplate}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <FiPlus size={16} />
              Add License
            </button>
          </div>
          <div className="card-body space-y-4">
            {formData.licenseTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiKey className="mx-auto mb-2" size={32} />
                <p>No license templates added yet</p>
                <p className="text-sm">Click "Add License" to get started</p>
              </div>
            ) : (
              formData.licenseTemplates.map((template, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">License Template {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeLicenseTemplate(index)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        License *
                      </label>
                      <select
                        value={template.license}
                        onChange={(e) => updateLicenseTemplate(index, 'license', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select License</option>
                        {licenses?.map((license) => (
                          <option key={license._id} value={license._id}>
                            {license.name} ({license.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        Type
                      </label>
                      <input
                        type="text"
                        value={template.type}
                        onChange={(e) => updateLicenseTemplate(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., microsoft-365, slack"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={template.required}
                        onChange={(e) => updateLicenseTemplate(index, 'required', e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-semibold text-secondary-700">Required</span>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCheckSquare className="text-green-600" />
              <h2 className="text-xl font-semibold text-secondary-900">Onboarding Tasks</h2>
            </div>
            <button
              type="button"
              onClick={addTask}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <FiPlus size={16} />
              Add Task
            </button>
          </div>
          <div className="card-body space-y-4">
            {formData.tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiCheckSquare className="mx-auto mb-2" size={32} />
                <p>No tasks added yet</p>
                <p className="text-sm">Click "Add Task" to get started</p>
              </div>
            ) : (
              formData.tasks.map((task, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Task {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(index, 'title', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., IT Equipment Setup"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-secondary-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={task.description}
                        onChange={(e) => updateTask(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Describe what needs to be done..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">
                          Days to Complete
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={task.daysToComplete}
                          onChange={(e) => updateTask(index, 'daysToComplete', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">
                          Assigned To
                        </label>
                        <select
                          value={task.assignedTo}
                          onChange={(e) => updateTask(index, 'assignedTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="it">IT Team</option>
                          <option value="manager">Manager</option>
                          <option value="hr">HR Team</option>
                          <option value="employee">Employee</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/onboarding-kits')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiSave size={16} />
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update Kit' : 'Create Kit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingKitForm;
