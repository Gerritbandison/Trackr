import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiFileText,
  FiDownload,
  FiSave,
  FiPlay,
  FiFilter,
  FiColumns,
  FiLayers,
} from 'react-icons/fi';
import { assetsAPI, licensesAPI } from '../../config/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import {
  REPORT_TEMPLATES,
  AVAILABLE_FIELDS,
  EXPORT_FORMATS,
  buildCustomReport,
  exportToCSV,
  exportToJSON,
  calculateReportStats,
  saveReportConfig,
} from '../../utils/reportBuilder';
import toast from 'react-hot-toast';

const CustomReportBuilder = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [dataSource, setDataSource] = useState('assets');
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState({});
  const [groupBy, setGroupBy] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [reportName, setReportName] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch data sources
  const { data: assetsData, isLoading: loadingAssets } = useQuery({
    queryKey: ['all-assets-reports'],
    queryFn: () => assetsAPI.getAll({ limit: 10000 }).then((res) => res.data.data),
    enabled: dataSource === 'assets',
  });

  const { data: licensesData, isLoading: loadingLicenses } = useQuery({
    queryKey: ['all-licenses-reports'],
    queryFn: () => licensesAPI.getAll({ limit: 1000 }).then((res) => res.data.data),
    enabled: dataSource === 'licenses',
  });

  const isLoading = dataSource === 'assets' ? loadingAssets : loadingLicenses;
  const sourceData = dataSource === 'assets' ? assetsData : licensesData;

  // Load template
  const handleLoadTemplate = (templateId) => {
    const template = REPORT_TEMPLATES[templateId];
    if (!template) return;

    setSelectedTemplate(templateId);
    setDataSource(template.dataSource);
    setSelectedFields(template.defaultFields);
    setReportName(template.name);
    toast.success(`Loaded template: ${template.name}`);
  };

  // Toggle field selection
  const toggleField = (fieldName) => {
    setSelectedFields(prev =>
      prev.includes(fieldName)
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    );
  };

  // Generate report
  const reportData = useMemo(() => {
    if (!sourceData || selectedFields.length === 0) return null;

    return buildCustomReport(sourceData, {
      fields: selectedFields,
      filters,
      groupBy,
      sortBy,
      sortOrder,
    });
  }, [sourceData, selectedFields, filters, groupBy, sortBy, sortOrder]);

  // Calculate stats
  const reportStats = useMemo(() => {
    if (!reportData) return null;
    return calculateReportStats(reportData, dataSource);
  }, [reportData, dataSource]);

  // Handle export
  const handleExport = (format) => {
    if (!reportData || reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const filename = reportName || 'custom-report';

    if (format === 'csv') {
      exportToCSV(reportData, selectedFields, filename);
      toast.success('Report exported to CSV');
    } else if (format === 'json') {
      exportToJSON(reportData, filename);
      toast.success('Report exported to JSON');
    } else if (format === 'excel') {
      toast.info('Excel export coming soon');
    } else if (format === 'pdf') {
      toast.info('PDF export coming soon');
    }
  };

  // Save report configuration
  const handleSaveConfig = () => {
    if (!reportName) {
      toast.error('Please enter a report name');
      return;
    }

    const config = {
      name: reportName,
      dataSource,
      fields: selectedFields,
      filters,
      groupBy,
      sortBy,
      sortOrder,
    };

    saveReportConfig(config);
    toast.success('Report configuration saved');
  };

  const availableFields = AVAILABLE_FIELDS[dataSource] || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900 tracking-tight">Custom Report Builder</h1>
          <p className="text-secondary-600 mt-2 text-lg">
            Create custom reports with flexible data selection
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Report Name */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Report Configuration</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="My Custom Report"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Source
                </label>
                <select
                  value={dataSource}
                  onChange={(e) => {
                    setDataSource(e.target.value);
                    setSelectedFields([]);
                  }}
                  className="input"
                >
                  <option value="assets">Assets</option>
                  <option value="licenses">Licenses</option>
                </select>
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Quick Templates</h3>
            </div>
            <div className="card-body space-y-2">
              {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleLoadTemplate(key)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate === key
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                  <Badge variant="secondary" size="sm" className="mt-2">
                    {template.category}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-body space-y-2">
              <button
                onClick={handleSaveConfig}
                disabled={!reportName || selectedFields.length === 0}
                className="w-full btn btn-outline flex items-center justify-center gap-2"
              >
                <FiSave size={16} />
                Save Configuration
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                disabled={selectedFields.length === 0}
                className="w-full btn btn-primary flex items-center justify-center gap-2"
              >
                <FiPlay size={16} />
                {showPreview ? 'Hide Preview' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Field Selection & Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Field Selection */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <FiColumns size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Fields ({selectedFields.length})
                </h3>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(availableFields).map(([fieldName, field]) => (
                  <label
                    key={fieldName}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedFields.includes(fieldName)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(fieldName)}
                      onChange={() => toggleField(fieldName)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{field.label}</div>
                      <div className="text-xs text-gray-500 capitalize">{field.type}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Report Options */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <FiFilter size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Report Options</h3>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group By
                  </label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="input"
                  >
                    <option value="">No Grouping</option>
                    {selectedFields.map(field => (
                      <option key={field} value={field}>
                        {availableFields[field]?.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input"
                  >
                    <option value="">No Sorting</option>
                    {selectedFields.map(field => (
                      <option key={field} value={field}>
                        {availableFields[field]?.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="input"
                    disabled={!sortBy}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Report Preview */}
          {showPreview && reportData && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Report Preview</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {reportStats?.totalRecords} records
                      {reportStats?.totalValue && ` • Total Value: $${reportStats.totalValue.toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.entries(EXPORT_FORMATS).map(([key, format]) => (
                      <button
                        key={key}
                        onClick={() => handleExport(format.id)}
                        className="btn btn-sm btn-outline flex items-center gap-2"
                        title={`Export as ${format.name}`}
                      >
                        <FiDownload size={14} />
                        {format.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="table">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr>
                        {selectedFields.map(field => (
                          <th key={field}>
                            {availableFields[field]?.label || field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.slice(0, 100).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {selectedFields.map(field => {
                            let value = row[field];
                            const fieldConfig = availableFields[field];
                            
                            // Format based on type
                            if (fieldConfig?.type === 'date' && value) {
                              value = new Date(value).toLocaleDateString();
                            } else if (fieldConfig?.type === 'currency' && value) {
                              value = `$${parseFloat(value).toLocaleString()}`;
                            } else if (fieldConfig?.type === 'percentage' && value) {
                              value = `${value}%`;
                            }
                            
                            return (
                              <td key={field}>
                                {value || 'N/A'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.length > 100 && (
                    <div className="p-4 bg-gray-50 text-center text-sm text-gray-600">
                      Showing first 100 of {reportData.length} records. Export to view all data.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {showPreview && (!reportData || reportData.length === 0) && (
            <div className="card">
              <div className="card-body text-center py-12">
                <FiFileText className="mx-auto mb-3 text-gray-400" size={48} />
                <p className="text-gray-600 font-medium">No data to display</p>
                <p className="text-sm text-gray-500 mt-1">
                  Select fields and configure options to generate a report
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!showPreview && (
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="card-body">
                <h4 className="font-semibold text-gray-900 mb-4">How to Build a Custom Report</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      1
                    </div>
                    <p className="text-gray-700">
                      Choose a <strong>quick template</strong> or select your <strong>data source</strong> (Assets or Licenses)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      2
                    </div>
                    <p className="text-gray-700">
                      <strong>Select the fields</strong> you want to include in your report
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      3
                    </div>
                    <p className="text-gray-700">
                      Configure <strong>grouping and sorting</strong> options (optional)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      4
                    </div>
                    <p className="text-gray-700">
                      Click <strong>"Generate Report"</strong> to preview, then <strong>export</strong> to your preferred format
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomReportBuilder;

