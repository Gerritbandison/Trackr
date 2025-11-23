/**
 * Loaners Page - Check-in/Check-out & Loaner Management
 * 
 * Features:
 * - Checkout/checkin assets
 * - Loaner policy configuration
 * - Overdue alerts
 * - Mobile scanning flow
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiPackage,
  FiUser,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiSettings,
  FiMaximize2,
} from 'react-icons/fi';
import { assetsAPI, itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import { format, addDays, isAfter, differenceInDays } from 'date-fns';
import CheckoutForm from '../../../components/ITAM/CheckoutForm';
import LoanerPolicyConfig from '../../../components/ITAM/LoanerPolicyConfig';
import BarcodeScanner from '../../../components/ITAM/BarcodeScanner';

const LoanersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'checked-out', 'overdue', 'available'
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch loaner records
  const { data: loanersData, isLoading } = useQuery({
    queryKey: ['loaners', currentPage, searchTerm, filter],
    queryFn: () =>
      itamAPI.loaners.getAll({
        page: currentPage,
        limit,
        search: searchTerm,
        filter,
      }),
  });

  // Fetch loaner policy
  const { data: policy } = useQuery({
    queryKey: ['loaner-policy'],
    queryFn: () => itamAPI.loaners.getPolicy(),
  });

  // Checkin mutation
  const checkinMutation = useMutation({
    mutationFn: ({ loanerId, data }) => itamAPI.loaners.checkin(loanerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['loaners']);
      queryClient.invalidateQueries(['assets']);
      toast.success('Asset checked in successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to check in asset');
    },
  });

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: (data) => itamAPI.loaners.checkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['loaners']);
      queryClient.invalidateQueries(['assets']);
      toast.success('Asset checked out successfully');
      setShowCheckoutModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to check out asset');
    },
  });

  const handleCheckout = (asset) => {
    setSelectedAsset(asset);
    setShowCheckoutModal(true);
  };

  const handleCheckin = (loaner) => {
    if (window.confirm(`Check in ${loaner.asset?.model} from ${loaner.custodian?.upn}?`)) {
      checkinMutation.mutate({
        loanerId: loaner.id,
        data: {
          condition: 'Good',
          notes: '',
        },
      });
    }
  };

  const handleBarcodeScan = (barcode) => {
    // Find asset by barcode
    assetsAPI.getAll({ search: barcode }).then((res) => {
      const assets = res.data?.data || [];
      if (assets.length > 0) {
        const asset = assets[0];
        if (asset.state === 'In Service' && !asset.owner) {
          handleCheckout(asset);
        } else {
          toast.error('Asset is not available for checkout');
        }
      } else {
        toast.error('Asset not found');
      }
    });
  };

  const isOverdue = (dueDate) => {
    return isAfter(new Date(), new Date(dueDate));
  };

  const getDaysUntilDue = (dueDate) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const loaners = loanersData?.data?.data || [];
  const pagination = loanersData?.data?.pagination || {};
  const loanerPolicy = policy?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Loaners</h1>
          <p className="text-gray-600 mt-2">
            Manage asset check-in and check-out for loaners
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPolicyModal(true)}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiSettings />
            Policy
          </button>
          <button
            onClick={() => setShowScanner(true)}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiMaximize2 />
            Scan
          </button>
          <button
            onClick={() => setShowCheckoutModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiPackage />
            Check Out
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search by asset, user, or barcode..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('checked-out')}
                className={`btn btn-sm ${filter === 'checked-out' ? 'btn-primary' : 'btn-outline'}`}
              >
                Checked Out
              </button>
              <button
                onClick={() => setFilter('overdue')}
                className={`btn btn-sm ${filter === 'overdue' ? 'btn-primary' : 'btn-outline'}`}
              >
                Overdue
              </button>
              <button
                onClick={() => setFilter('available')}
                className={`btn btn-sm ${filter === 'available' ? 'btn-primary' : 'btn-outline'}`}
              >
                Available
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loaner Records */}
      <div className="card">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Asset</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Custodian</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Checked Out</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loaners.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No loaner records found
                    </td>
                  </tr>
                ) : (
                  loaners.map((loaner) => {
                    const overdue = loaner.dueDate && isOverdue(loaner.dueDate);
                    const daysUntilDue = loaner.dueDate ? getDaysUntilDue(loaner.dueDate) : null;

                    return (
                      <tr
                        key={loaner.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          overdue ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{loaner.asset?.model}</div>
                            <div className="text-sm text-gray-500">{loaner.asset?.assetTag}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{loaner.custodian?.displayName}</div>
                            <div className="text-sm text-gray-500">{loaner.custodian?.upn}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {loaner.checkedOutAt
                            ? format(new Date(loaner.checkedOutAt), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {loaner.dueDate ? (
                            <div>
                              <div
                                className={`font-medium ${
                                  overdue ? 'text-red-600' : daysUntilDue <= 2 ? 'text-yellow-600' : ''
                                }`}
                              >
                                {format(new Date(loaner.dueDate), 'MMM dd, yyyy')}
                              </div>
                              {daysUntilDue !== null && (
                                <div className="text-xs text-gray-500">
                                  {overdue
                                    ? `${Math.abs(daysUntilDue)} days overdue`
                                    : `${daysUntilDue} days remaining`}
                                </div>
                              )}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {loaner.checkedInAt ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Checked In
                            </span>
                          ) : overdue ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
                              <FiAlertCircle />
                              Overdue
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Checked Out
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {!loaner.checkedInAt && (
                            <button
                              onClick={() => handleCheckin(loaner)}
                              disabled={checkinMutation.isPending}
                              className="btn btn-sm btn-primary flex items-center gap-1"
                            >
                              <FiCheckCircle />
                              Check In
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={showCheckoutModal}
        onClose={() => {
          setShowCheckoutModal(false);
          setSelectedAsset(null);
        }}
        title="Check Out Asset"
      >
        <CheckoutForm
          asset={selectedAsset}
          policy={loanerPolicy}
          onSuccess={(data) => {
            checkoutMutation.mutate(data);
          }}
          onCancel={() => {
            setShowCheckoutModal(false);
            setSelectedAsset(null);
          }}
        />
      </Modal>

      {/* Policy Config Modal */}
      <Modal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title="Loaner Policy Configuration"
      >
        <LoanerPolicyConfig
          policy={loanerPolicy}
          onSuccess={() => setShowPolicyModal(false)}
        />
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

export default LoanersPage;

