import { useState } from 'react';
import { FiDownload, FiFileText, FiFile } from 'react-icons/fi';
import toast from 'react-hot-toast';

/**
 * Export menu with multiple format options
 */
const ExportMenu = ({ onExport, formats = ['csv', 'pdf', 'excel'] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatIcons = {
    csv: FiFileText,
    pdf: FiFile,
    excel: FiFile,
  };

  const formatLabels = {
    csv: 'CSV',
    pdf: 'PDF',
    excel: 'Excel',
  };

  const handleExport = async (format) => {
    setIsOpen(false);
    try {
      await onExport(format);
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline flex items-center gap-2"
      >
        <FiDownload size={16} />
        Export
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-1">
            {formats.map((format) => {
              const Icon = formatIcons[format];
              return (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <Icon size={16} className="text-gray-600" />
                  <span className="font-medium text-gray-900">Export as {formatLabels[format]}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ExportMenu;

