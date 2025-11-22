/**
 * Financials Page - Depreciation, Chargeback, COGS
 * 
 * Features:
 * - Depreciation schedules
 * - Chargeback allocations
 * - COGS tracking
 * - ERP export
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiDollarSign,
  FiTrendingDown,
  FiDownload,
  FiRefreshCw,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import DepreciationSchedule from '../../../components/ITAM/DepreciationSchedule';
import ChargebackAllocation from '../../../components/ITAM/ChargebackAllocation';

const FinancialsPage = () => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [activeTab, setActiveTab] = useState('depreciation'); // 'depreciation', 'chargeback', 'cogs'

  // Fetch depreciation schedules
  const { data: depreciationData, isLoading: depLoading } = useQuery({
    queryKey: ['depreciation-schedules'],
    queryFn: () => itamAPI.financials.calculateDepreciation({ method: 'Straight-Line' }),
    enabled: activeTab === 'depreciation',
  });

  // Fetch chargeback allocations
  const { data: chargebackData, isLoading: cbLoading } = useQuery({
    queryKey: ['chargeback-allocations'],
    queryFn: () => itamAPI.financials.getChargebackAllocation('all'),
    enabled: activeTab === 'chargeback',
  });

  // Fetch COGS
  const { data: cogsData, isLoading: cogsLoading } = useQuery({
    queryKey: ['cogs'],
    queryFn: () => itamAPI.financials.getCOGS({ period: 'monthly' }),
    enabled: activeTab === 'cogs',
  });

  const isLoading = depLoading || cbLoading || cogsLoading;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Financials</h1>
          <p className="text-gray-600 mt-2">
            Depreciation, chargeback, and COGS tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => itamAPI.financials.exportToERP({ format: 'csv' })}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiDownload />
            Export to ERP
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('depreciation')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'depreciation'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Depreciation
            </button>
            <button
              onClick={() => setActiveTab('chargeback')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'chargeback'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Chargeback
            </button>
            <button
              onClick={() => setActiveTab('cogs')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'cogs'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              COGS
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'depreciation' && (
        <DepreciationSchedule
          data={depreciationData?.data}
          selectedAsset={selectedAsset}
          onAssetSelect={setSelectedAsset}
        />
      )}

      {activeTab === 'chargeback' && (
        <ChargebackAllocation
          data={chargebackData?.data}
          selectedAsset={selectedAsset}
          onAssetSelect={setSelectedAsset}
        />
      )}

      {activeTab === 'cogs' && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost of Goods Sold</h3>
            <div className="text-gray-600">
              COGS tracking and reporting content...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialsPage;

