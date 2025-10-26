import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiX, FiCheck, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { integrationConfigsAPI } from '../../config/api';
import Modal from './Modal';
import toast from 'react-hot-toast';

const IntegrationConfigModal = ({ isOpen, onClose, integration }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    type: 'api-key',
    apiKey: {
      key: '',
      secret: '',
      endpoint: '',
    },
    oauth: {
      clientId: '',
      clientSecret: '',
      tenantId: '',
      redirectUri: '',
      scopes: [],
    },
    syncSettings: {
      autoSync: false,
      syncInterval: 360,
    },
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (integration) {
      setFormData({
        name: integration.id,
        displayName: integration.name,
        type: integration.authType || 'api-key',
        apiKey: {
          key: '',
          secret: '',
          endpoint: integration.endpoint || '',
        },
        oauth: {
          clientId: '',
          clientSecret: '',
          tenantId: '',
          redirectUri: `${window.location.origin}/auth/callback`,
          scopes: integration.scopes || [],
        },
        syncSettings: {
          autoSync: false,
          syncInterval: 360,
        },
      });
    }
  }, [integration]);

  // Save configuration mutation
  const saveMutation = useMutation({
    mutationFn: (data) => integrationConfigsAPI.createOrUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['integration-configs']);
      toast.success(`${formData.displayName} configured successfully`);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save configuration');
    },
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: (name) => integrationConfigsAPI.test(name),
    onSuccess: (response) => {
      setTestResult({
        success: true,
        message: response.data.message,
      });
      toast.success('Connection test successful!');
    },
    onError: (error) => {
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Connection test failed',
      });
      toast.error('Connection test failed');
    },
  });

  const handleSave = async (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleTest = async () => {
    // First save the configuration
    setTesting(true);
    setTestResult(null);
    
    try {
      await saveMutation.mutateAsync(formData);
      // Then test it
      await testMutation.mutateAsync(formData.name);
    } catch (error) {
      // Error already handled by mutations
    } finally {
      setTesting(false);
    }
  };

  const handleOAuthConnect = async () => {
    try {
      // First save the OAuth configuration
      await saveMutation.mutateAsync(formData);
      
      // Get OAuth URL and redirect
      const response = await integrationConfigsAPI.getOAuthUrl(formData.name);
      window.location.href = response.data.data.authUrl;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate OAuth flow');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Configure ${integration?.name}`} size="lg">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Integration Type Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-900">
                <strong>{integration?.name}</strong> uses {formData.type === 'oauth' ? 'OAuth 2.0' : 'API Key'} authentication.
              </p>
              <p className="text-xs text-blue-800 mt-1">{integration?.description}</p>
            </div>
          </div>
        </div>

        {/* Configuration Type Selector */}
        <div>
          <label className="block text-sm font-semibold text-secondary-700 mb-2">
            Authentication Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="api-key">API Key</option>
            <option value="oauth">OAuth 2.0</option>
            <option value="basic-auth">Basic Authentication</option>
          </select>
        </div>

        {/* API Key Configuration */}
        {formData.type === 'api-key' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                API Key *
              </label>
              <input
                type="password"
                value={formData.apiKey.key}
                onChange={(e) => setFormData({
                  ...formData,
                  apiKey: { ...formData.apiKey, key: e.target.value }
                })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your API key"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                API Secret (if required)
              </label>
              <input
                type="password"
                value={formData.apiKey.secret}
                onChange={(e) => setFormData({
                  ...formData,
                  apiKey: { ...formData.apiKey, secret: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter API secret (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                API Endpoint
              </label>
              <input
                type="url"
                value={formData.apiKey.endpoint}
                onChange={(e) => setFormData({
                  ...formData,
                  apiKey: { ...formData.apiKey, endpoint: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={integration?.endpoint || 'https://api.example.com'}
              />
              <p className="text-xs text-gray-600 mt-1">Leave blank to use default endpoint</p>
            </div>
          </div>
        )}

        {/* OAuth Configuration */}
        {formData.type === 'oauth' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Client ID *
              </label>
              <input
                type="text"
                value={formData.oauth.clientId}
                onChange={(e) => setFormData({
                  ...formData,
                  oauth: { ...formData.oauth, clientId: e.target.value }
                })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your OAuth Client ID"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">
                Client Secret *
              </label>
              <input
                type="password"
                value={formData.oauth.clientSecret}
                onChange={(e) => setFormData({
                  ...formData,
                  oauth: { ...formData.oauth, clientSecret: e.target.value }
                })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your OAuth Client Secret"
              />
            </div>

            {(integration?.id === 'entra-id' || integration?.id === 'azure-ad' || integration?.id === 'intune') && (
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Tenant ID *
                </label>
                <input
                  type="text"
                  value={formData.oauth.tenantId}
                  onChange={(e) => setFormData({
                    ...formData,
                    oauth: { ...formData.oauth, tenantId: e.target.value }
                  })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your Azure Tenant ID"
                />
                <p className="text-xs text-gray-600 mt-1">Found in Azure Portal → App registrations</p>
              </div>
            )}

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Redirect URI:</strong> Add this to your OAuth app configuration:
              </p>
              <code className="block mt-2 text-xs bg-white px-2 py-1 rounded border border-yellow-200">
                {formData.oauth.redirectUri}
              </code>
            </div>
          </div>
        )}

        {/* Sync Settings */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-secondary-700 mb-3">Sync Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.syncSettings.autoSync}
                onChange={(e) => setFormData({
                  ...formData,
                  syncSettings: { ...formData.syncSettings, autoSync: e.target.checked }
                })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Enable Auto-Sync</span>
                <p className="text-xs text-gray-600">Automatically sync devices on a schedule</p>
              </div>
            </label>

            {formData.syncSettings.autoSync && (
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Sync Interval (minutes)
                </label>
                <input
                  type="number"
                  min="60"
                  max="1440"
                  value={formData.syncSettings.syncInterval}
                  onChange={(e) => setFormData({
                    ...formData,
                    syncSettings: { ...formData.syncSettings, syncInterval: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Recommended: 360 minutes (6 hours)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`border-l-4 p-4 rounded ${
            testResult.success 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <FiCheck className="text-green-600" size={20} />
              ) : (
                <FiAlertCircle className="text-red-600" size={20} />
              )}
              <p className={`text-sm font-semibold ${
                testResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {testResult.message}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || saveMutation.isPending}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FiRefreshCw className={testing ? 'animate-spin' : ''} />
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>

            {formData.type === 'oauth' ? (
              <button
                type="button"
                onClick={handleOAuthConnect}
                disabled={saveMutation.isPending}
                className="btn btn-primary flex items-center gap-2"
              >
                {saveMutation.isPending ? 'Saving...' : 'Connect with OAuth'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="btn btn-primary flex items-center gap-2"
              >
                <FiCheck />
                {saveMutation.isPending ? 'Saving...' : 'Save & Connect'}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default IntegrationConfigModal;

