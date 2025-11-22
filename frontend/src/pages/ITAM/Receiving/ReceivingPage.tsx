/**
 * Receiving Page - PO Ingestion and Asset Receiving
 * 
 * Features:
 * - PO ingestion from ERP/email
 * - Barcode scanning for receiving
 * - Auto-print labels
 * - Auto-enrollment hooks for MDM
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiMaximize2 } from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import SearchBar from '../../../components/ui/SearchBar.jsx';
import toast from 'react-hot-toast';
import BarcodeScanner from '../../../components/ITAM/BarcodeScanner.jsx';
import POIngestionForm from '../../../components/ITAM/POIngestionForm.jsx';
import { ReceivingStatsCards, ReceivingQueueTable } from '../../../components/Receiving';

interface ExpectedAsset {
  id: string;
  serialNumber?: string;
  poLineItem?: string;
  poNumber: string;
  vendor: string;
  model: string;
  expectedDate?: string;
  status: 'Pending' | 'Received' | 'Overdue' | 'Cancelled';
  [key: string]: any;
}

interface ExpectedAssetsResponse {
  data: ExpectedAsset[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const ReceivingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showPOModal, setShowPOModal] = useState<boolean>(false);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch expected assets (from POs)
  const { data: expectedAssets, isLoading } = useQuery<ExpectedAssetsResponse>({
    queryKey: ['expected-assets', currentPage, searchTerm],
    queryFn: () => {
      return itamAPI.receiving.getExpected({ page: currentPage, limit, search: searchTerm });
    },
  });

  // Receive asset mutation
  const receiveMutation = useMutation({
    mutationFn: (data: any) => itamAPI.receiving.receiveAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expected-assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset received successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to receive asset');
    },
  });

  const handleReceive = (expectedAsset: ExpectedAsset) => {
    receiveMutation.mutate({
      expectedAssetId: expectedAsset.id,
      serialNumber: expectedAsset.serialNumber,
      autoPrintLabel: true,
      autoEnrollMDM: true,
    });
  };

  const handleBarcodeScan = (barcode: string) => {
    // Find expected asset by serial number or PO line item
    const expected = expectedAssets?.data?.find(
      (ea) => ea.serialNumber === barcode || ea.poLineItem === barcode
    );

    if (expected) {
      handleReceive(expected);
    } else {
      toast.error('No matching expected asset found for this barcode');
    }
  };

  const handlePOIngestion = (_poData: any) => {
    // This would typically create expected assets
    toast.success('PO ingested successfully');
    queryClient.invalidateQueries({ queryKey: ['expected-assets'] });
    setShowPOModal(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const expected = expectedAssets?.data || [];
  const pagination = expectedAssets?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Receiving
          </h1>
          <p className="text-gray-600 mt-2">
            Receive assets from purchase orders and update inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="btn btn-outline flex items-center gap-2 hover:shadow-md transition-shadow"
          >
            <FiMaximize2 />
            Scan Barcode
          </button>
          <button
            onClick={() => setShowPOModal(true)}
            className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <FiPlus />
            Ingest PO
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <ReceivingStatsCards
        expectedAssets={expected}
        totalCount={pagination.total || 0}
      />

      {/* Search */}
      <div className="card border-2 border-slate-200 hover:border-primary-300 transition-colors">
        <div className="card-body">
          <SearchBar
            onSearch={setSearchTerm}
            placeholder="Search by PO number, vendor, or serial number..."
          />
        </div>
      </div>

      {/* Expected Assets Table */}
      <ReceivingQueueTable
        expectedAssets={expected}
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onReceive={handleReceive}
        isReceiving={receiveMutation.isPending}
      />

      {/* PO Ingestion Modal */}
      <Modal isOpen={showPOModal} onClose={() => setShowPOModal(false)} title="Ingest Purchase Order">
        <POIngestionForm onSuccess={handlePOIngestion} onCancel={() => setShowPOModal(false)} />
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        title="Scan Barcode"
      >
        <BarcodeScanner onScan={handleBarcodeScan} />
      </Modal>
    </div>
  );
};

export default ReceivingPage;
