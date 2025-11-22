/**
 * Asset Warranty Card Component
 * 
 * Displays warranty information fetched from serial number lookup.
 */

import React from 'react';
import { FiShield } from 'react-icons/fi';
import { WarrantyData } from '../../services/warrantyService';

interface AssetWarrantyCardProps {
    warrantyData: WarrantyData;
}

const AssetWarrantyCard: React.FC<AssetWarrantyCardProps> = ({ warrantyData }) => {
    return (
        <div className="card bg-blue-50 border-l-4 border-blue-500">
            <div className="card-body">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FiShield className="text-2xl text-blue-600" />
                        <div>
                            <h3 className="font-semibold text-blue-900">Warranty Information</h3>
                            <p className="text-sm text-blue-700">
                                Fetched from {warrantyData.provider}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold text-blue-900">
                            {warrantyData.daysRemaining} days remaining
                        </div>
                        <div className="text-xs text-blue-600">
                            Expires: {new Date(warrantyData.expiryDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetWarrantyCard;
