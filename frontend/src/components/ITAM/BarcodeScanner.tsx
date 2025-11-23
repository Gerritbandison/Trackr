/**
 * Barcode Scanner Component
 * 
 * Uses device camera or input for barcode scanning
 */

import React, { useState, useRef, useEffect } from 'react';
import { FiCamera, FiX, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [manualInput, setManualInput] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please use manual input.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleManualInput = (e) => {
    const value = e.target.value;
    setManualInput(value);

    // Auto-submit on Enter or when barcode-like pattern detected
    if (value.length >= 8 && /^[A-Z0-9-]+$/.test(value)) {
      handleScan(value);
    }
  };

  const handleScan = (scannedBarcode) => {
    if (scannedBarcode) {
      setBarcode(scannedBarcode);
      onScan?.(scannedBarcode);
      stopScanning();
      toast.success(`Scanned: ${scannedBarcode}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && manualInput) {
      handleScan(manualInput);
      setManualInput('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Camera View */}
      {scanning ? (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 bg-black rounded-lg object-cover"
          />
          <button
            onClick={stopScanning}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
          >
            <FiX />
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black bg-opacity-75 text-white rounded-lg">
            Point camera at barcode
          </div>
        </div>
      ) : (
        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <FiCamera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Camera not active</p>
          </div>
        </div>
      )}

      {/* Manual Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or enter barcode manually
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={handleManualInput}
            onKeyPress={handleKeyPress}
            placeholder="Enter barcode or scan..."
            className="flex-1 input"
            autoFocus
          />
          <button
            onClick={() => handleScan(manualInput)}
            disabled={!manualInput}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiCheckCircle />
            Scan
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between">
        <button
          onClick={scanning ? stopScanning : startScanning}
          className={`btn ${scanning ? 'btn-outline' : 'btn-primary'} flex items-center gap-2`}
        >
          {scanning ? (
            <>
              <FiX />
              Stop Scanning
            </>
          ) : (
            <>
              <FiCamera />
              Start Camera
            </>
          )}
        </button>
        {barcode && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCheckCircle className="text-green-600" />
            Last scanned: <span className="font-mono font-semibold">{barcode}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;

