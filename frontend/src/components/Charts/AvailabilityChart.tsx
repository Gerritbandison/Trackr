import { useState, useMemo } from 'react';
import { FiMonitor, FiSmartphone, FiHardDrive, FiPrinter, FiCpu } from 'react-icons/fi';
import { BsLaptop, BsDisplay } from 'react-icons/bs';
import { MdDock } from 'react-icons/md';
import GaugeChart from './GaugeChart';
import Badge from '../ui/Badge';

const DEVICE_TYPES = [
  { id: 'all', label: 'All Devices', icon: FiCpu },
  { id: 'laptop', label: 'Laptops', icon: BsLaptop },
  { id: 'desktop', label: 'Desktops', icon: FiMonitor },
  { id: 'monitor', label: 'Monitors', icon: BsDisplay },
  { id: 'phone', label: 'Phones', icon: FiSmartphone },
  { id: 'tablet', label: 'Tablets', icon: FiSmartphone },
  { id: 'dock', label: 'Docks', icon: MdDock },
  { id: 'server', label: 'Servers', icon: FiHardDrive },
  { id: 'printer', label: 'Printers', icon: FiPrinter },
];

const AvailabilityChart = ({ assets = [], onDeviceTypeChange }) => {
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'individual'

  // Notify parent component when device type changes
  const handleDeviceTypeChange = (typeId) => {
    setSelectedType(typeId);
    if (onDeviceTypeChange) {
      onDeviceTypeChange(typeId);
    }
  };

  // Filter assets by selected device type
  const filteredAssets = useMemo(() => {
    if (selectedType === 'all') return assets;
    return assets.filter(
      (asset) => asset.category?.toLowerCase() === selectedType
    );
  }, [assets, selectedType]);

  // Calculate availability stats
  const availabilityStats = useMemo(() => {
    const available = filteredAssets.filter(
      (asset) => asset.status?.toLowerCase() === 'available'
    ).length;
    const total = filteredAssets.length;
    const percentage = total > 0 ? (available / total) * 100 : 0;

    return { available, total, percentage };
  }, [filteredAssets]);

  // Get availability by device type
  const availabilityByType = useMemo(() => {
    const typeStats = {};

    DEVICE_TYPES.forEach((type) => {
      if (type.id === 'all') return;

      const typeAssets = assets.filter(
        (asset) => asset.category?.toLowerCase() === type.id
      );
      const available = typeAssets.filter(
        (asset) => asset.status?.toLowerCase() === 'available'
      ).length;

      typeStats[type.id] = {
        total: typeAssets.length,
        available,
        percentage: typeAssets.length > 0 ? (available / typeAssets.length) * 100 : 0,
      };
    });

    return typeStats;
  }, [assets]);

  // Get individual assets for selected type
  const individualAssets = useMemo(() => {
    return filteredAssets.map((asset) => ({
      id: asset._id,
      name: asset.assetTag || asset.serialNumber || 'Unknown',
      model: asset.model || 'N/A',
      status: asset.status || 'unknown',
      isAvailable: asset.status?.toLowerCase() === 'available',
      assignedTo: asset.assignedTo?.name || null,
    }));
  }, [filteredAssets]);

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'available':
        return 'success';
      case 'assigned':
        return 'primary';
      case 'maintenance':
      case 'repair':
        return 'warning';
      case 'retired':
        return 'secondary';
      case 'lost':
      case 'stolen':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Type Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {DEVICE_TYPES.map((type) => {
            const Icon = type.icon;
            const typeStats = type.id === 'all'
              ? { total: assets.length }
              : availabilityByType[type.id];

            // Only show types that have assets
            if (typeStats.total === 0 && type.id !== 'all') return null;

            return (
              <button
                key={type.id}
                onClick={() => handleDeviceTypeChange(type.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                  transition-all duration-200 border-2
                  ${selectedType === type.id
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }
                `}
              >
                <Icon size={18} />
                <span>{type.label}</span>
                {typeStats.total > 0 && (
                  <span
                    className={`
                      ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                      ${selectedType === type.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {typeStats.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('summary')}
            className={`
              px-4 py-2 rounded-md font-medium text-sm transition-all
              ${viewMode === 'summary'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Summary View
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`
              px-4 py-2 rounded-md font-medium text-sm transition-all
              ${viewMode === 'individual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Individual Assets
          </button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'summary' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gauge Chart */}
          <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border border-gray-100">
            <GaugeChart
              value={availabilityStats.available}
              max={availabilityStats.total}
              title={`${selectedType === 'all' ? 'Overall' : DEVICE_TYPES.find(t => t.id === selectedType)?.label} Availability`}
              size={280}
            />
          </div>

          {/* Stats Grid */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-emerald-900">Available for Assignment</span>
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-4xl font-bold text-emerald-700">
                {availabilityStats.available}
              </div>
              <div className="text-sm text-emerald-600 mt-1">
                {availabilityStats.percentage.toFixed(1)}% of total
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Total Assets</span>
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              </div>
              <div className="text-4xl font-bold text-blue-700">
                {availabilityStats.total}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                In this category
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-900">In Use / Unavailable</span>
                <div className="w-3 h-3 rounded-full bg-amber-500" />
              </div>
              <div className="text-4xl font-bold text-amber-700">
                {availabilityStats.total - availabilityStats.available}
              </div>
              <div className="text-sm text-amber-600 mt-1">
                {(100 - availabilityStats.percentage).toFixed(1)}% of total
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Individual Assets View */
        <div className="space-y-4">
          {individualAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {individualAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={`
                    p-4 rounded-lg border-2 transition-all hover:shadow-md
                    ${asset.isAvailable
                      ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        {asset.name}
                      </h4>
                      <p className="text-xs text-gray-600">{asset.model}</p>
                    </div>
                    <Badge variant={getStatusColor(asset.status)} size="sm">
                      {asset.status}
                    </Badge>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {asset.isAvailable ? (
                      <div className="flex items-center gap-2 text-emerald-700">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium">Ready to assign</span>
                      </div>
                    ) : asset.assignedTo ? (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Assigned to:</span>{' '}
                        {asset.assignedTo}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        Status: {asset.status}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FiCpu className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-gray-600 font-medium">No assets found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try selecting a different device type
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailabilityChart;

