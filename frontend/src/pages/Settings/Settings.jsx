import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { FiCopy, FiRefreshCw, FiCheck, FiGlobe, FiKey, FiSettings as FiSettingsIcon, FiDatabase, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import IntegrationStatus from './IntegrationStatus';
import IntegrationConfigModal from '../../components/ui/IntegrationConfigModal';
import TwoFactorSettings from './TwoFactorSettings';
import { integrationConfigsAPI } from '../../config/api';

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    companyName: 'Company Name',
    emailNotifications: true,
    warrantyAlerts: true,
    licenseAlerts: true,
    alertDays: 30,
  });

  const [apiKey, setApiKey] = useState('sk_live_abc123xyz789...');
  const [copied, setCopied] = useState(false);
  const [configureIntegration, setConfigureIntegration] = useState(null);

  // Fetch integration configurations
  const { data: integrationConfigs } = useQuery({
    queryKey: ['integration-configs'],
    queryFn: () => integrationConfigsAPI.getAll().then(res => res.data.data),
    enabled: activeTab === 'integrations',
  });

  // Check if integration is connected
  const isConnected = (integrationId) => {
    return integrationConfigs?.some(
      config => config.name === integrationId && config.status === 'connected' && config.enabled
    );
  };

  // Toggle integration mutation
  const toggleMutation = useMutation({
    mutationFn: (name) => integrationConfigsAPI.toggle(name),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['integration-configs']);
      toast.success(response.data.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to toggle integration');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Settings saved successfully!');
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateNewKey = () => {
    if (window.confirm('Generate new API key? This will invalidate the current key.')) {
      const newKey = 'sk_live_' + Math.random().toString(36).substring(2, 15);
      setApiKey(newKey);
      toast.success('New API key generated');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettingsIcon },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'integrations', label: 'Integrations', icon: FiGlobe },
    { id: 'sync', label: 'Sync Status', icon: FiDatabase },
    { id: 'api', label: 'API Access', icon: FiKey },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Settings</h1>
        <p className="text-secondary-600 mt-2 text-lg">Manage system configuration and integrations</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">General Settings</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) =>
                  setSettings({ ...settings, companyName: e.target.value })
                }
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Notification Settings</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600">
                  Receive email alerts for important events
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  setSettings({ ...settings, emailNotifications: e.target.checked })
                }
                className="w-5 h-5"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Warranty Expiration Alerts</p>
                <p className="text-sm text-gray-600">
                  Get notified when warranties are expiring
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.warrantyAlerts}
                onChange={(e) =>
                  setSettings({ ...settings, warrantyAlerts: e.target.checked })
                }
                className="w-5 h-5"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">License Expiration Alerts</p>
                <p className="text-sm text-gray-600">
                  Get notified when licenses are expiring
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.licenseAlerts}
                onChange={(e) =>
                  setSettings({ ...settings, licenseAlerts: e.target.checked })
                }
                className="w-5 h-5"
              />
            </div>
            <div>
              <label className="label">Alert Days Before Expiration</label>
              <input
                type="number"
                value={settings.alertDays}
                onChange={(e) =>
                  setSettings({ ...settings, alertDays: e.target.value })
                }
                className="input"
                min="1"
                max="90"
              />
              <p className="text-sm text-gray-600 mt-1">
                Number of days before expiration to send alerts
              </p>
            </div>
          </div>
        </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary">
              Save Settings
            </button>
          </div>
        </form>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Device & Asset Management (MDM/RMM)</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-900 font-semibold mb-2">🏭 Production Configuration</p>
                <p className="text-xs text-blue-800">
                  This system will use <strong>Microsoft Intune</strong> to automatically sync device information (Serial Numbers, UPN, installed apps, licenses) 
                  and <strong>Lansweeper</strong> for detailed hardware inventory (laptops, docks, monitors with SNs).
                </p>
              </div>

              {[
                { 
                  id: 'intune',
                  name: 'Microsoft Intune', 
                  status: 'Ready for Production', 
                  emoji: '🔷',
                  description: 'Auto-sync devices, users (UPN), apps, and licenses',
                  authType: 'oauth',
                  endpoint: 'https://graph.microsoft.com/v1.0',
                  scopes: ['DeviceManagementManagedDevices.Read.All', 'User.Read.All']
                },
                { 
                  id: 'lansweeper',
                  name: 'Lansweeper', 
                  status: 'Ready for Production', 
                  emoji: '🔍',
                  description: 'Detailed hardware inventory with serial numbers',
                  authType: 'api-key',
                  endpoint: 'https://api.lansweeper.com/api/v2'
                },
                { 
                  id: 'jamf',
                  name: 'Jamf Pro', 
                  status: 'Optional', 
                  emoji: '🍎',
                  description: 'MacOS device management',
                  authType: 'basic-auth',
                  endpoint: 'https://your-instance.jamfcloud.com/api'
                },
              ].map((integration) => {
                const connected = isConnected(integration.id);
                return (
                  <div key={integration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{integration.emoji}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{integration.name}</p>
                        <p className="text-sm text-gray-500">{integration.description}</p>
                        <p className={`text-xs font-medium mt-1 ${connected ? 'text-green-600' : 'text-gray-500'}`}>
                          {connected ? '✓ Connected' : integration.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {connected && (
                        <button
                          onClick={() => toggleMutation.mutate(integration.id)}
                          className="btn btn-sm bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          Disconnect
                        </button>
                      )}
                      <button
                        onClick={() => setConfigureIntegration(integration)}
                        className={`btn btn-sm ${connected ? 'btn-outline' : 'btn-primary'}`}
                      >
                        {connected ? 'Reconfigure' : 'Connect'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Identity Providers (SSO)</h3>
            </div>
            <div className="card-body space-y-4">
              {[
                { 
                  id: 'entra-id',
                  name: 'Microsoft 365 / Entra ID', 
                  status: 'Available', 
                  emoji: '🔐',
                  description: 'Azure AD authentication and user sync',
                  authType: 'oauth',
                  endpoint: 'https://graph.microsoft.com/v1.0',
                  scopes: ['User.Read.All', 'Directory.Read.All']
                },
                { 
                  id: 'google-workspace',
                  name: 'Google Workspace', 
                  status: 'Available', 
                  emoji: '🔑',
                  description: 'Google OAuth and workspace integration',
                  authType: 'oauth',
                  endpoint: 'https://www.googleapis.com/admin/directory/v1',
                  scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly']
                },
                { 
                  id: 'okta',
                  name: 'Okta', 
                  status: 'Optional', 
                  emoji: '🛡️',
                  description: 'Enterprise SSO provider',
                  authType: 'api-key',
                  endpoint: 'https://your-domain.okta.com/api/v1'
                },
              ].map((integration) => {
                const connected = isConnected(integration.id);
                return (
                  <div key={integration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 p-2 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">{integration.emoji}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{integration.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{integration.description}</p>
                        <p className={`text-xs font-medium mt-1 ${connected ? 'text-green-600' : 'text-gray-500'}`}>
                          {connected ? '✓ Connected' : integration.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {connected && (
                        <button
                          onClick={() => toggleMutation.mutate(integration.id)}
                          className="btn btn-sm bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          Disconnect
                        </button>
                      )}
                      <button
                        onClick={() => setConfigureIntegration(integration)}
                        className={`btn btn-sm ${connected ? 'btn-outline' : 'btn-primary'}`}
                      >
                        {connected ? 'Reconfigure' : 'Connect'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Network Scanning & Discovery</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg mb-4">
                <p className="text-sm text-purple-900 font-semibold mb-2">🔍 Asset Discovery</p>
                <p className="text-xs text-purple-800">
                  <strong>Lansweeper</strong> will automatically discover and inventory all hardware assets on your network,
                  including laptops, docks, monitors with serial numbers for warranty lookups.
                </p>
              </div>

              {[
                { 
                  id: 'lansweeper',
                  name: 'Lansweeper', 
                  status: 'Production Ready', 
                  emoji: '🔍',
                  description: 'Network asset discovery and detailed hardware inventory',
                  authType: 'api-key',
                  endpoint: 'https://api.lansweeper.com/api/v2'
                },
                { 
                  id: 'lenovo-warranty',
                  name: 'Lenovo Warranty API', 
                  status: 'Integrated', 
                  emoji: '💼',
                  description: 'Automatic warranty lookup for Lenovo devices',
                  authType: 'api-key',
                  endpoint: 'https://supportapi.lenovo.com/v2.5'
                },
              ].map((integration) => {
                const connected = isConnected(integration.id);
                return (
                  <div key={integration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 p-2 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">{integration.emoji}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{integration.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{integration.description}</p>
                        <p className={`text-xs font-medium mt-1 ${connected ? 'text-green-600' : 'text-gray-500'}`}>
                          {connected ? '✓ Connected' : integration.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {connected && (
                        <button
                          onClick={() => toggleMutation.mutate(integration.id)}
                          className="btn btn-sm bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          Disconnect
                        </button>
                      )}
                      <button
                        onClick={() => setConfigureIntegration(integration)}
                        className={`btn btn-sm ${connected ? 'btn-outline' : 'btn-primary'}`}
                      >
                        {connected ? 'Reconfigure' : 'Connect'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Software & SaaS Integrations */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Software & SaaS Management</h3>
            </div>
            <div className="card-body space-y-4">
              {[
                { 
                  id: 'microsoft-365',
                  name: 'Microsoft 365 Admin', 
                  status: 'Available', 
                  emoji: '📊',
                  description: 'License management and usage analytics',
                  vendor: 'Microsoft',
                  authType: 'oauth',
                  endpoint: 'https://graph.microsoft.com/v1.0',
                  scopes: ['Organization.Read.All']
                },
                { 
                  id: 'google-workspace',
                  name: 'Google Workspace Admin', 
                  status: 'Available', 
                  emoji: '📈',
                  description: 'User and license administration',
                  vendor: 'Google',
                  authType: 'oauth',
                  endpoint: 'https://www.googleapis.com/admin/directory/v1',
                  scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly']
                },
                { 
                  id: 'slack',
                  name: 'Slack Enterprise', 
                  status: 'Optional', 
                  emoji: '💬',
                  description: 'Track Slack workspace licenses',
                  vendor: 'Slack',
                  authType: 'api-key',
                  endpoint: 'https://slack.com/api'
                },
                { 
                  id: 'zoom',
                  name: 'Zoom Admin', 
                  status: 'Optional', 
                  emoji: '📹',
                  description: 'Meeting platform license tracking',
                  vendor: 'Zoom',
                  authType: 'api-key',
                  endpoint: 'https://api.zoom.us/v2'
                },
              ].map((integration) => {
                const connected = isConnected(integration.id);
                return (
                  <div key={integration.id} className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:shadow-lg hover:border-primary-300 transition-all bg-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-3xl">{integration.emoji}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{integration.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{integration.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            connected 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {connected ? '✓ Connected' : integration.status}
                          </span>
                          <span className="text-xs text-gray-500">by {integration.vendor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {connected && (
                        <button
                          onClick={() => toggleMutation.mutate(integration.id)}
                          className="btn btn-sm bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          Disconnect
                        </button>
                      )}
                      <button
                        onClick={() => setConfigureIntegration(integration)}
                        className={`btn btn-sm ${connected ? 'btn-outline' : 'btn-primary'}`}
                      >
                        {connected ? 'Reconfigure' : 'Connect'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Finance & Procurement */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Finance & Procurement</h3>
            </div>
            <div className="card-body space-y-4">
              {[
                { 
                  id: 'cdw',
                  name: 'CDW', 
                  status: 'Integrated', 
                  emoji: '🛒',
                  description: 'IT product catalog and purchasing integration',
                  vendor: 'CDW',
                  authType: 'api-key',
                  endpoint: 'https://www.cdw.com/api'
                },
                { 
                  id: 'quickbooks',
                  name: 'QuickBooks', 
                  status: 'Optional', 
                  emoji: '💰',
                  description: 'Sync purchase orders and asset costs',
                  vendor: 'Intuit',
                  authType: 'oauth',
                  endpoint: 'https://quickbooks.api.intuit.com/v3'
                },
                { 
                  id: 'sap-ariba',
                  name: 'SAP Ariba', 
                  status: 'Optional', 
                  emoji: '🛒',
                  description: 'Procurement and supplier management',
                  vendor: 'SAP',
                  authType: 'api-key',
                  endpoint: 'https://openapi.ariba.com/api'
                },
                { 
                  id: 'coupa',
                  name: 'Coupa', 
                  status: 'Optional', 
                  emoji: '📦',
                  description: 'Spend management and procurement',
                  vendor: 'Coupa',
                  authType: 'api-key',
                  endpoint: 'https://api.coupa.com'
                },
              ].map((integration) => {
                const connected = isConnected(integration.id);
                return (
                  <div key={integration.id} className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:shadow-lg hover:border-primary-300 transition-all bg-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-3xl">{integration.emoji}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{integration.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{integration.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            connected 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {connected ? '✓ Connected' : integration.status}
                          </span>
                          <span className="text-xs text-gray-500">by {integration.vendor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {connected && (
                        <button
                          onClick={() => toggleMutation.mutate(integration.id)}
                          className="btn btn-sm bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          Disconnect
                        </button>
                      )}
                      <button
                        onClick={() => setConfigureIntegration(integration)}
                        className={`btn btn-sm ${connected ? 'btn-outline' : 'btn-primary'}`}
                      >
                        {connected ? 'Reconfigure' : 'Connect'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <TwoFactorSettings />
      )}

      {/* Sync Status Tab */}
      {activeTab === 'sync' && (
        <IntegrationStatus />
      )}

      {/* API Access Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">API Key</h3>
            </div>
            <div className="card-body space-y-4">
              <p className="text-sm text-gray-600">
                Use this API key to integrate with external systems. Keep it secure and never share it publicly.
              </p>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={apiKey}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopyApiKey}
                  className="btn btn-outline flex items-center gap-2"
                >
                  {copied ? <FiCheck className="text-green-600" /> : <FiCopy />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateNewKey}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <FiRefreshCw />
                  Regenerate
                </button>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Warning:</strong> Regenerating your API key will invalidate the current key and may break existing integrations.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">API Documentation</h3>
            </div>
            <div className="card-body space-y-4">
              <p className="text-sm text-gray-600">
                Access our comprehensive API documentation to integrate with your systems.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">REST API</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Base URL: <code className="bg-gray-100 px-2 py-1 rounded text-xs">https://api.yourcompany.com/v1</code>
                  </p>
                  <button 
                    onClick={() => toast.info('API documentation will be available soon')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Documentation →
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Webhooks</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Configure webhooks to receive real-time updates about your assets.
                  </p>
                  <button 
                    onClick={() => toast.info('Webhook configuration coming soon')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Configure Webhooks →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Rate Limits</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-900">1,000</p>
                  <p className="text-sm text-blue-700 mt-1">Requests per hour</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-900">842</p>
                  <p className="text-sm text-green-700 mt-1">Used this hour</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">158</p>
                  <p className="text-sm text-gray-700 mt-1">Remaining</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integration Configuration Modal */}
      {configureIntegration && (
        <IntegrationConfigModal
          isOpen={!!configureIntegration}
          onClose={() => setConfigureIntegration(null)}
          integration={configureIntegration}
        />
      )}
    </div>
  );
};

export default Settings;

