import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiDownload, 
  FiPrinter,
  FiFilter,
  FiCheckSquare,
  FiSquare,
  FiGrid,
} from 'react-icons/fi';
import { assetsAPI } from '../../config/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Badge from '../../components/Common/Badge';
import QRCodeGenerator from '../../components/Common/QRCodeGenerator';
import {
  filterAssetsForQR,
  groupForLabelSheets,
  downloadQRCodes,
  LABEL_TEMPLATES,
} from '../../utils/qrCodeGenerator';

const BulkQRGenerator = () => {
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [filterCategory, setFilterCategory] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('AVERY_5160');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'preview'

  // Fetch all assets
  const { data: allAssetsData, isLoading } = useQuery({
    queryKey: ['all-assets-qr'],
    queryFn: () => assetsAPI.getAll({ limit: 10000 }).then((res) => res.data.data),
  });

  // Filter assets
  const filteredAssets = useMemo(() => {
    if (!allAssetsData) return [];
    return filterAssetsForQR(allAssetsData, {
      categories: filterCategory,
      status: filterStatus,
    });
  }, [allAssetsData, filterCategory, filterStatus]);

  // Get unique categories and statuses
  const categories = useMemo(() => {
    if (!allAssetsData) return [];
    return [...new Set(allAssetsData.map(a => a.category))].filter(Boolean);
  }, [allAssetsData]);

  const statuses = useMemo(() => {
    if (!allAssetsData) return [];
    return [...new Set(allAssetsData.map(a => a.status))].filter(Boolean);
  }, [allAssetsData]);

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map(a => a._id));
    }
  };

  // Handle individual selection
  const toggleAssetSelection = (assetId) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Get selected asset objects
  const selectedAssetObjects = useMemo(() => {
    return filteredAssets.filter(a => selectedAssets.includes(a._id));
  }, [filteredAssets, selectedAssets]);

  // Group for label sheets
  const labelSheets = useMemo(() => {
    if (selectedAssetObjects.length === 0) return null;
    return groupForLabelSheets(selectedAssetObjects, selectedTemplate);
  }, [selectedAssetObjects, selectedTemplate]);

  // Handle download
  const handleDownload = () => {
    downloadQRCodes(selectedAssetObjects, 'bulk-qr-codes');
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Bulk QR Code Generator</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Generate QR codes for physical asset labeling
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={selectedAssets.length === 0}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiDownload size={18} />
            Download CSV ({selectedAssets.length})
          </button>
          <button
            disabled={selectedAssets.length === 0}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiPrinter size={18} />
            Print Labels
          </button>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedAssets.length > 0 && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiCheckSquare className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    {selectedAssets.length} Asset{selectedAssets.length !== 1 ? 's' : ''} Selected
                  </h3>
                  <p className="text-sm text-blue-700">
                    {labelSheets?.totalSheets} label sheet{labelSheets?.totalSheets !== 1 ? 's' : ''} required • 
                    Template: {LABEL_TEMPLATES[selectedTemplate].name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAssets([])}
                className="btn btn-sm btn-outline"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Template Selection */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <FiFilter size={20} />
            <h3 className="text-lg font-semibold text-secondary-900">Filters & Options</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                multiple
                value={filterCategory}
                onChange={(e) => setFilterCategory(Array.from(e.target.selectedOptions, option => option.value))}
                className="input h-32"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                multiple
                value={filterStatus}
                onChange={(e) => setFilterStatus(Array.from(e.target.selectedOptions, option => option.value))}
                className="input h-32"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>

            {/* Label Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="input"
              >
                {Object.entries(LABEL_TEMPLATES).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.name}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-gray-600">
                <p>Size: {LABEL_TEMPLATES[selectedTemplate].width}" × {LABEL_TEMPLATES[selectedTemplate].height}"</p>
                <p>{LABEL_TEMPLATES[selectedTemplate].perPage} per sheet</p>
              </div>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  disabled={selectedAssets.length === 0}
                  className={`flex-1 btn btn-sm ${viewMode === 'preview' ? 'btn-primary' : 'btn-outline'}`}
                >
                  <FiGrid size={14} />
                  Preview
                </button>
              </div>
              <button
                onClick={() => {
                  setFilterCategory([]);
                  setFilterStatus([]);
                }}
                className="w-full btn btn-sm btn-outline mt-2"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Asset List or Preview */}
      {viewMode === 'list' ? (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-secondary-900">
                Select Assets ({filteredAssets.length})
              </h3>
              <button
                onClick={handleSelectAll}
                className="btn btn-sm btn-outline flex items-center gap-2"
              >
                {selectedAssets.length === filteredAssets.length ? <FiSquare /> : <FiCheckSquare />}
                {selectedAssets.length === filteredAssets.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="table">
                <thead className="sticky top-0 bg-white z-10">
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th>Asset Tag</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>QR Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr 
                      key={asset._id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedAssets.includes(asset._id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleAssetSelection(asset._id)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset._id)}
                          onChange={() => toggleAssetSelection(asset._id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="font-mono text-sm font-semibold">
                        {asset.assetTag || 'N/A'}
                      </td>
                      <td className="font-medium">{asset.name}</td>
                      <td className="capitalize">{asset.category}</td>
                      <td>
                        <Badge variant="primary" size="sm">{asset.status}</Badge>
                      </td>
                      <td className="text-sm text-gray-600">{asset.location || 'N/A'}</td>
                      <td>
                        <div className="flex justify-center">
                          <QRCodeGenerator 
                            value={`${window.location.origin}/assets/${asset._id}`}
                            size={40}
                            includeText={false}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAssets.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FiGrid className="mx-auto mb-3" size={48} opacity={0.3} />
                  <p>No assets match the selected filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-secondary-900">
              Label Preview - {labelSheets?.totalSheets} Sheet{labelSheets?.totalSheets !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-8">
              {labelSheets?.sheets.map((sheet, sheetIndex) => (
                <div key={sheetIndex} className="border border-gray-300 rounded-lg p-6 bg-white">
                  <div className="text-sm text-gray-600 mb-4 font-medium">
                    Sheet {sheetIndex + 1} of {labelSheets.totalSheets}
                  </div>
                  <div 
                    className={`grid gap-4`}
                    style={{
                      gridTemplateColumns: `repeat(${labelSheets.template.columns}, 1fr)`,
                    }}
                  >
                    {sheet.map((asset) => (
                      <div
                        key={asset._id}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50"
                        style={{
                          aspectRatio: `${labelSheets.template.width} / ${labelSheets.template.height}`,
                        }}
                      >
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                          <QRCodeGenerator 
                            value={`${window.location.origin}/assets/${asset._id}`}
                            size={80}
                            includeText={false}
                          />
                          <div className="text-center">
                            <div className="font-mono text-xs font-bold">
                              {asset.assetTag || asset.serialNumber}
                            </div>
                            <div className="text-[10px] text-gray-600 truncate max-w-full">
                              {asset.name}
                            </div>
                            <div className="text-[9px] text-gray-500 uppercase">
                              {asset.category}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card bg-gray-50">
        <div className="card-body">
          <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const availableAssets = filteredAssets.filter(a => a.status === 'available');
                setSelectedAssets(availableAssets.map(a => a._id));
              }}
              className="btn btn-outline"
            >
              Select All Available Assets
            </button>
            <button
              onClick={() => {
                const newAssets = filteredAssets.filter(a => 
                  !a.qrCode && (new Date() - new Date(a.createdAt)) / (1000 * 60 * 60 * 24) <= 30
                );
                setSelectedAssets(newAssets.map(a => a._id));
              }}
              className="btn btn-outline"
            >
              Select New Assets (Last 30 Days)
            </button>
            <button
              onClick={() => {
                const laptops = filteredAssets.filter(a => a.category === 'laptop');
                setSelectedAssets(laptops.map(a => a._id));
              }}
              className="btn btn-outline"
            >
              Select All Laptops
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkQRGenerator;

