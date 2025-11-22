/**
 * Purchase Information Section Component
 * 
 * Form section for purchase details and warranty information.
 */

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { FiDollarSign } from 'react-icons/fi';
import { WarrantyData } from '../../services/warrantyService';

interface PurchaseInformationSectionProps {
    register: UseFormRegister<any>;
    errors: FieldErrors;
    warrantyData: WarrantyData | null;
}

const PurchaseInformationSection: React.FC<PurchaseInformationSectionProps> = ({
    register,
    errors,
    warrantyData,
}) => {
    return (
        <div className="card">
            <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiDollarSign className="text-primary-600" />
                    Purchase Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Purchase Date</label>
                        <input
                            type="date"
                            {...register('purchaseDate')}
                            className={`input ${errors.purchaseDate ? 'border-red-500' : ''}`}
                        />
                        {errors.purchaseDate && (
                            <p className="text-red-500 text-sm mt-1">{errors.purchaseDate.message as string}</p>
                        )}
                    </div>

                    <div>
                        <label className="label">Purchase Price</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('purchasePrice')}
                            className={`input ${errors.purchasePrice ? 'border-red-500' : ''}`}
                            placeholder="0.00"
                        />
                        {errors.purchasePrice && (
                            <p className="text-red-500 text-sm mt-1">{errors.purchasePrice.message as string}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="label">Vendor</label>
                        <input
                            type="text"
                            {...register('vendor')}
                            className={`input ${errors.vendor ? 'border-red-500' : ''}`}
                            placeholder="e.g., CDW, Dell, Amazon"
                        />
                    </div>

                    <div>
                        <label className="label">Supplier</label>
                        <input
                            type="text"
                            {...register('supplier')}
                            className={`input ${errors.supplier ? 'border-red-500' : ''}`}
                            placeholder="e.g., CDW, Dell Direct"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="label">Warranty Expiry</label>
                        <input
                            type="date"
                            {...register('warrantyExpiry')}
                            className={`input ${errors.warrantyExpiry ? 'border-red-500' : ''}`}
                        />
                        <p className="text-xs text-blue-600 mt-1">
                            {warrantyData ? 'Auto-filled from warranty lookup' : 'Auto-fills when serial number is entered'}
                        </p>
                    </div>

                    <div>
                        <label className="label">Warranty Provider</label>
                        <input
                            type="text"
                            {...register('warrantyProvider')}
                            className={`input ${errors.warrantyProvider ? 'border-red-500' : ''}`}
                            placeholder="e.g., Dell Support, HP Care Pack"
                        />
                        {warrantyData && (
                            <p className="text-xs text-blue-600 mt-1">
                                Auto-filled from warranty lookup
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseInformationSection;
