import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import { generateAssetQRData } from '../../../utils/qrCodeGenerator';
import { ITAMAsset } from '../../../types/itam';

interface QRCodeGeneratorProps {
  asset: ITAMAsset | null;
  size?: number;
  title?: string;
  showAssetInfo?: boolean;
}

/**
 * QR Code generator component with print functionality
 */
const QRCodeGenerator = ({ asset, size = 200, title, showAssetInfo = true }: QRCodeGeneratorProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    if (asset) {
      const data = generateAssetQRData(asset);
      setQrData(data);
    }
  }, [asset]);

  const handleDownload = () => {
    if (!printRef.current) return;
    
    const svg = printRef.current.querySelector('svg');
    if (!svg) return;

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Download as PNG
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `asset-qr-${asset?.assetTag || asset?.globalAssetId || 'unknown'}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  if (!asset) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col items-center gap-4 p-6 bg-white border border-gray-200 rounded-lg print-container">
        <h3 className="font-semibold text-gray-900">{title || `${asset.name || 'Asset'} - QR Code`}</h3>
        
        {/* QR Code */}
        <div ref={printRef} className="flex flex-col items-center gap-3">
          <div className="border-4 border-gray-300 rounded-lg p-4 bg-white">
            <QRCodeSVG
              value={qrData}
              size={size}
              level="H"
              includeMargin={true}
            />
          </div>

          {showAssetInfo && (
            <div className="text-center space-y-1">
              <div className="text-xs text-gray-600 font-mono">
                {asset.assetTag || asset.serialNumber || 'N/A'}
              </div>
              <div className="text-xs text-gray-500 font-semibold">
                {asset.name || 'Unnamed Asset'}
              </div>
              {asset.model && (
                <div className="text-xs text-gray-400">
                  {asset.model}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 print-hidden">
          <button
            onClick={handleDownload}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <FiDownload size={14} />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <FiPrinter size={14} />
            Print
          </button>
        </div>
      </div>

    </>
  );
};

export default QRCodeGenerator;

