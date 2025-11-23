/**
 * Stock & Inventory Page
 * 
 * Features:
 * - Stock management UI
 * - Min/Max & reorder automation
 * - Cycle counting
 * - Kitting
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiPackage,
  FiPlus,
  FiSearch,
  FiAlertCircle,
  FiCheckCircle,
  FiSettings,
  FiRefreshCw,
} from 'react-icons/fi';
import { itamAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Modal from '../../../components/ui/Modal';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import toast from 'react-hot-toast';
import StockItemForm from '../../../components/ITAM/StockItemForm';
import CycleCountForm from '../../../components/ITAM/CycleCountForm';

const StockPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'low-stock', 'out-of-stock', 'overstock'
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCycleCountModal, setShowCycleCountModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch stock items
  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock', currentPage, searchTerm, filter],
    queryFn: () =>
      itamAPI.stock.getAll({
        page: currentPage,
        limit,
        search: searchTerm,
        filter,
      }),
  });

  // Fetch low stock alerts
  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: () => itamAPI.stock.getLowStock(),
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: ({ itemId, data }) => itamAPI.stock.reorder(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stock']);
      toast.success('Reorder request created');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create reorder');
    },
  });

  const handleReorder = (item) => {
    if (window.confirm(`Create reorder for ${item.name}?`)) {
      reorderMutation.mutate({
        itemId: item.id,
        data: {
          quantity: item.maxStock - item.currentStock,
          vendor: item.vendor,
        },
      });
    }
  };

  const getStockStatus = (item) => {
    if (item.currentStock <= 0) return 'Out of Stock';
    if (item.currentStock <= item.minStock) return 'Low Stock';
    if (item.currentStock >= item.maxStock) return 'Overstock';
    return 'In Stock';
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'Out of Stock':
        return 'bg-red-100 text-red-800';
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overstock':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const items = stockData?.data?.data || [];
  const pagination = stockData?.data?.pagination || {};
  const lowStock = lowStockData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Stock & Inventory
          </h1>
          <p className="text-gray-600 mt-2">
            Manage non-serialized inventory and consumables
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lowStock.length > 0 && (
            <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {lowStock.length} low stock items
            </div>
          )}
          <button
            onClick={() => setShowCycleCountModal(true)}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiRefreshCw />
            Cycle Count
          </button>
          <button
            onClick={() => {
              setSelectedItem(null);
              setShowStockModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiPlus />
            Add Item
          </button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="card border-l-4 border-red-500 hover:shadow-xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertCircle className="text-red-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lowStock.slice(0, 6).map((item) => (
                <div key={item.id} className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border-2 border-red-200 hover:border-red-300 hover:shadow-md transition-all">
                  <div className="font-medium text-gray-900 mb-1">{item.name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    Current: <span className="font-semibold text-red-600">{item.currentStock}</span> / Min: {item.minStock}
                  </div>
                  <button
                    onClick={() => handleReorder(item)}
                    className="btn btn-sm btn-primary w-full shadow-md hover:shadow-lg transition-shadow"
                  >
                    Reorder
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card border-2 border-slate-200 hover:border-primary-300 transition-colors">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <SearchBar
              onSearch={setSearchTerm}
              placeholder="Search stock items..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`btn btn-sm transition-all ${filter === 'all' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('low-stock')}
                className={`btn btn-sm transition-all ${filter === 'low-stock' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Low Stock
              </button>
              <button
                onClick={() => setFilter('out-of-stock')}
                className={`btn btn-sm transition-all ${filter === 'out-of-stock' ? 'btn-primary shadow-md' : 'btn-outline'}`}
              >
                Out of Stock
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Stock Items</h2>
            <div className="text-sm text-gray-600">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Stock</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Min/Max</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Reorder Point</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      <FiPackage className="mx-auto mb-3 text-gray-300" size={48} />
                      <div className="text-lg font-medium">No stock items found</div>
                      <div className="text-sm mt-1">Add a new stock item to get started</div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.category}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">{item.sku}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.currentStock}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            Min: {item.minStock} / Max: {item.maxStock}
                          </div>
                        </td>
                        <td className="py-3 px-4">{item.reorderPoint}</td>
                        <td className="py-3 px-4">
                          ${item.unitCost?.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStockStatusColor(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {item.currentStock <= item.reorderPoint && (
                              <button
                                onClick={() => handleReorder(item)}
                                disabled={reorderMutation.isPending}
                                className="btn btn-sm btn-primary shadow-md hover:shadow-lg transition-shadow"
                              >
                                Reorder
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setShowStockModal(true);
                              }}
                              className="btn btn-sm btn-outline hover:shadow-md transition-shadow"
                            >
                              Edit
                            </button>
                          </div>
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

      {/* Stock Item Modal */}
      <Modal
        isOpen={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setSelectedItem(null);
        }}
        title={selectedItem ? 'Edit Stock Item' : 'Add Stock Item'}
      >
        <StockItemForm
          item={selectedItem}
          onSuccess={() => {
            setShowStockModal(false);
            setSelectedItem(null);
            queryClient.invalidateQueries(['stock']);
          }}
          onCancel={() => {
            setShowStockModal(false);
            setSelectedItem(null);
          }}
        />
      </Modal>

      {/* Cycle Count Modal */}
      <Modal
        isOpen={showCycleCountModal}
        onClose={() => setShowCycleCountModal(false)}
        title="Cycle Count"
      >
        <CycleCountForm
          onSuccess={() => {
            setShowCycleCountModal(false);
            queryClient.invalidateQueries(['stock']);
          }}
          onCancel={() => setShowCycleCountModal(false)}
        />
      </Modal>
    </div>
  );
};

export default StockPage;

