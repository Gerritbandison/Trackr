/**
 * Receiving Queue Table Component
 * 
 * Displays the table of expected assets with receive actions.
 */

import React from 'react';
import { FiPackage, FiCheckCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import Pagination from '../ui/Pagination.jsx';

interface ReceivingQueueTableProps {
    expectedAssets: any[];
    pagination: any;
    currentPage: number;
    onPageChange: (page: number) => void;
    onReceive: (asset: any) => void;
    isReceiving: boolean;
}

const ReceivingQueueTable: React.FC<ReceivingQueueTableProps> = ({
    expectedAssets,
    pagination,
    currentPage,
    onPageChange,
    onReceive,
    isReceiving,
}) => {
    return (
        <div className="card border-2 border-slate-200 hover:shadow-lg transition-shadow">
            <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Expected Assets</h2>
                    <div className="text-sm text-gray-600">
                        {expectedAssets.length} item{expectedAssets.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">PO Number</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendor</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Model</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Serial Number</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Expected Date</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expectedAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-500">
                                        <FiPackage className="mx-auto mb-3 text-gray-300" size={48} />
                                        <div className="text-lg font-medium">No expected assets found</div>
                                        <div className="text-sm mt-1">Start by ingesting a purchase order</div>
                                    </td>
                                </tr>
                            ) : (
                                expectedAssets.map((asset) => (
                                    <tr
                                        key={asset.id}
                                        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors"
                                    >
                                        <td className="py-3 px-4 font-medium">{asset.poNumber}</td>
                                        <td className="py-3 px-4">{asset.vendor}</td>
                                        <td className="py-3 px-4">{asset.model}</td>
                                        <td className="py-3 px-4 font-mono text-sm">
                                            {asset.serialNumber || 'Pending'}
                                        </td>
                                        <td className="py-3 px-4">
                                            {asset.expectedDate
                                                ? format(new Date(asset.expectedDate), 'MMM dd, yyyy')
                                                : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${asset.status === 'Received'
                                                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                                                    : asset.status === 'Overdue'
                                                        ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                                                        : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200'
                                                    }`}
                                            >
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {asset.status !== 'Received' && (
                                                <button
                                                    onClick={() => onReceive(asset)}
                                                    disabled={isReceiving}
                                                    className="btn btn-sm btn-primary flex items-center gap-1 shadow-md hover:shadow-lg transition-shadow"
                                                >
                                                    <FiCheckCircle />
                                                    Receive
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={onPageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceivingQueueTable;
