/**
 * Label Preview
 * 
 * Preview label before printing
 */

import React from 'react';
import { FiPrinter, FiMaximize2 } from 'react-icons/fi';

const LabelPreview = ({ template, asset, onPrint, onClose }) => {
  // Mock preview - in real implementation, this would render the actual label
  const previewData = {
    assetTag: asset?.assetTag || 'ASSET-001',
    serialNumber: asset?.serialNumber || 'SN123456',
    model: asset?.model || 'MacBook Pro',
    barcode: asset?.assetTag || 'ASSET-001',
    qrCode: asset?.assetTag || 'ASSET-001',
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-700">
          <strong>Label Preview</strong> - This is a visual representation of how the label will appear when printed.
        </div>
      </div>

      {/* Label Preview */}
      <div className="flex items-center justify-center">
        <div
          className="bg-white border-4 border-gray-300 shadow-2xl"
          style={{
            width: `${template.width * 50}px`,
            height: `${template.height * 50}px`,
            minWidth: '200px',
            minHeight: '100px',
          }}
        >
          <div className="p-4 h-full flex flex-col items-center justify-center">
            <div className="text-center mb-4">
              <div className="font-bold text-lg mb-2">{previewData.assetTag}</div>
              <div className="text-sm text-gray-600">{previewData.model}</div>
              <div className="text-xs text-gray-500 mt-1">{previewData.serialNumber}</div>
            </div>
            {template.type === 'qr' || template.type === 'combined' ? (
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center mb-2">
                <FiMaximize2 className="text-gray-400" size={48} />
                <span className="text-xs text-gray-500 ml-2">QR Code</span>
              </div>
            ) : null}
            {template.type === 'barcode' || template.type === 'combined' ? (
              <div className="w-full h-16 bg-gray-200 flex items-center justify-center">
                <div className="text-xs text-gray-500">Barcode: {previewData.barcode}</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="card border-2 border-slate-200">
        <div className="card-body">
          <h3 className="font-semibold text-gray-900 mb-4">Template Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Standard</div>
              <div className="font-medium text-gray-900">{template.standard}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Size</div>
              <div className="font-medium text-gray-900">
                {template.width}" x {template.height}"
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Type</div>
              <div className="font-medium text-gray-900">{template.type}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Auto-Print</div>
              <div className="font-medium text-gray-900">
                {template.autoPrint ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onClose && (
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
        )}
        {onPrint && asset && (
          <button
            onClick={onPrint}
            className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
          >
            <FiPrinter />
            Print Label
          </button>
        )}
      </div>
    </div>
  );
};

export default LabelPreview;

