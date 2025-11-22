/**
 * API Documentation
 * 
 * Display API documentation and endpoints
 */

import { FiCode, FiKey, FiDatabase } from 'react-icons/fi';

const APIDocs = ({ onClose }) => {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/assets',
      description: 'List all assets with filtering and pagination',
      category: 'Assets',
    },
    {
      method: 'POST',
      path: '/api/v1/assets',
      description: 'Create a new asset',
      category: 'Assets',
    },
    {
      method: 'GET',
      path: '/api/v1/assets/:id',
      description: 'Get asset details by ID',
      category: 'Assets',
    },
    {
      method: 'PUT',
      path: '/api/v1/assets/:id',
      description: 'Update an asset',
      category: 'Assets',
    },
    {
      method: 'POST',
      path: '/api/v1/bulk/import',
      description: 'Bulk import data (idempotent)',
      category: 'Bulk Operations',
    },
    {
      method: 'GET',
      path: '/api/v1/webhooks',
      description: 'List all webhooks',
      category: 'Webhooks',
    },
    {
      method: 'POST',
      path: '/api/v1/webhooks',
      description: 'Create a webhook',
      category: 'Webhooks',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-700">
          <strong>API Documentation</strong> - RESTful API for programmatic access to ITAM data.
          All endpoints require authentication via Bearer token.
        </div>
      </div>

      {/* Authentication */}
      <div className="card border-2 border-slate-200">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiKey className="text-primary-600" size={20} />
            Authentication
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-700">
              All API requests require authentication using a Bearer token in the Authorization header:
            </div>
            <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm">
              Authorization: Bearer YOUR_API_KEY
            </div>
            <div className="text-sm text-gray-600 mt-2">
              API keys can be generated from the API Keys section in Settings.
            </div>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="card border-2 border-slate-200">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h3>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      endpoint.method === 'GET'
                        ? 'bg-blue-100 text-blue-800'
                        : endpoint.method === 'POST'
                        ? 'bg-green-100 text-green-800'
                        : endpoint.method === 'PUT'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <div className="flex-1">
                    <div className="font-mono text-sm font-medium text-gray-900 mb-1">
                      {endpoint.path}
                    </div>
                    <div className="text-sm text-gray-600">{endpoint.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GraphQL */}
      <div className="card border-2 border-slate-200">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiCode className="text-primary-600" size={20} />
            GraphQL API
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-700">
              GraphQL endpoint available at:
            </div>
            <div className="p-3 bg-gray-100 rounded-lg font-mono text-sm">
              POST /api/v1/graphql
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Use GraphQL for flexible queries and efficient data fetching.
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onClose} className="btn btn-outline">
          Close
        </button>
      </div>
    </div>
  );
};

export default APIDocs;

