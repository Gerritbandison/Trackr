/**
 * Asset Identification Section Component
 * 
 * Form section for basic asset identification fields.
 */

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { FiPackage, FiAuto, FiLoader } from 'react-icons/fi';
import { AssetCategory } from '../../services/serialPatternService';

interface AssetIdentificationSectionProps {
    register: UseFormRegister<any>;
    errors: FieldErrors;
    autoDetected: boolean;
    isFetchingWarranty: boolean;
}

const AssetIdentificationSection: React.FC<AssetIdentificationSectionProps> = ({
    register,
    errors,
    autoDetected,
    isFetchingWarranty,
}) => {
    return (
        <div className="card">
            <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiPackage className="text-primary-600" />
                    Asset Identification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">
                            Asset Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...register('name')}
                            className={`input ${errors.name ? 'border-red-500' : ''}`}
                            placeholder="e.g., Dell Latitude 7420"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name.message as string}</p>
                        )}
                    </div>

                    <div>
                        <label className="label">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register('category')}
                            className={`input ${errors.category ? 'border-red-500' : ''}`}
                        >
                            <option value="laptop">Laptop</option>
                            <option value="desktop">Desktop</option>
                            <option value="monitor">Monitor</option>
                            <option value="phone">Phone</option>
                            <option value="tablet">Tablet</option>
                            <option value="dock">Dock</option>
                            <option value="keyboard">Keyboard</option>
                            <option value="mouse">Mouse</option>
                            <option value="headset">Headset</option>
                            <option value="webcam">Webcam</option>
                            <option value="accessory">Accessory</option>
                            <option value="other">Other</option>
                        </select>
                        {autoDetected && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <FiAuto size={12} />
                                Auto-detected from serial number
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="label">
                            Manufacturer <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...register('manufacturer')}
                            className={`input ${errors.manufacturer ? 'border-red-500' : ''}`}
                            placeholder="e.g., Dell, HP, Lenovo"
                        />
                        {errors.manufacturer && (
                            <p className="text-red-500 text-sm mt-1">{errors.manufacturer.message as string}</p>
                        )}
                    </div>

                    <div>
                        <label className="label">
                            Model <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...register('model')}
                            className={`input ${errors.model ? 'border-red-500' : ''}`}
                            placeholder="e.g., Latitude 7420"
                        />
                        {errors.model && (
                            <p className="text-red-500 text-sm mt-1">{errors.model.message as string}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="label">
                            Serial Number
                            {isFetchingWarranty && (
                                <FiLoader className="inline animate-spin ml-2" size={14} />
                            )}
                        </label>
                        <input
                            type="text"
                            {...register('serialNumber')}
                            className={`input ${errors.serialNumber ? 'border-red-500' : ''}`}
                            placeholder="e.g., DLX123456789"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Auto-detects manufacturer and category from serial prefix
                        </p>
                        {errors.serialNumber && (
                            <p className="text-red-500 text-sm mt-1">{errors.serialNumber.message as string}</p>
                        )}
                    </div>

                    <div>
                        <label className="label">Asset Tag</label>
                        <input
                            type="text"
                            {...register('assetTag')}
                            className={`input ${errors.assetTag ? 'border-red-500' : ''}`}
                            placeholder="Leave empty to auto-generate"
                        />
                        {errors.assetTag && (
                            <p className="text-red-500 text-sm mt-1">{errors.assetTag.message as string}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetIdentificationSection;
