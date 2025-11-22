/**
 * CDW Integration Section Component
 * 
 * Form section for CDW procurement integration.
 */

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface CDWIntegrationSectionProps {
    register: UseFormRegister<any>;
    errors: FieldErrors;
}

const CDWIntegrationSection: React.FC<CDWIntegrationSectionProps> = ({
    register,
    errors,
}) => {
    const handleBuyFromCDW = () => {
        // CDW product selector would open here
        // For now, direct users to manual entry
        toast.info('Enter CDW SKU and URL below, or contact procurement for assistance');
    };

    return (
        <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
            <div className="card-body">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">Purchase from CDW</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Browse CDW's catalog and automatically populate asset details
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary flex items-center gap-2"
                        onClick={handleBuyFromCDW}
                    >
                        <FiShoppingCart />
                        Buy from CDW
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="label">CDW SKU</label>
                        <input
                            type="text"
                            {...register('cdwSku')}
                            className="input"
                            placeholder="CDW product SKU"
                        />
                    </div>

                    <div>
                        <label className="label">CDW URL</label>
                        <input
                            type="url"
                            {...register('cdwUrl')}
                            className={`input ${errors.cdwUrl ? 'border-red-500' : ''}`}
                            placeholder="https://www.cdw.com/..."
                        />
                        {errors.cdwUrl && (
                            <p className="text-red-500 text-sm mt-1">{errors.cdwUrl.message as string}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CDWIntegrationSection;
