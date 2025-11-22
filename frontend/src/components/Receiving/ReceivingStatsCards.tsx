/**
 * Receiving Stats Cards Component
 * 
 * Displays statistics for the receiving queue (expected, pending, received, overdue).
 */

import React from 'react';
import { FiPackage, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface ReceivingStatsCardsProps {
    expectedAssets: any[];
    totalCount: number;
}

const ReceivingStatsCards: React.FC<ReceivingStatsCardsProps> = ({
    expectedAssets,
    totalCount,
}) => {
    const pendingCount = expectedAssets?.filter((a) => a.status === 'Pending').length || 0;
    const receivedCount = expectedAssets?.filter((a) => a.status === 'Received').length || 0;
    const overdueCount = expectedAssets?.filter((a) => a.status === 'Overdue').length || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Expected Assets */}
            <div className="card hover:shadow-lg transition-shadow">
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Expected Assets</div>
                            <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <FiPackage className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending */}
            <div className="card hover:shadow-lg transition-shadow">
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Pending</div>
                            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <FiClock className="text-yellow-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Received */}
            <div className="card hover:shadow-lg transition-shadow">
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Received</div>
                            <div className="text-2xl font-bold text-green-600">{receivedCount}</div>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <FiCheckCircle className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Overdue */}
            <div className="card hover:shadow-lg transition-shadow">
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Overdue</div>
                            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
                        </div>
                        <div className="p-3 bg-red-100 rounded-xl">
                            <FiAlertCircle className="text-red-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceivingStatsCards;
