/**
 * Status and Condition Section Component
 * 
 * Form section for asset status, condition, location, and notes.
 */

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { FiCheckCircle } from 'react-icons/fi';

interface StatusConditionSectionProps {
    register: UseFormRegister<any>;
    errors: FieldErrors;
}

const StatusConditionSection: React.FC<StatusConditionSectionProps> = ({
    register,
    errors,
}) => {
    return (
        <div className="card">
            <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiCheckCircle className="text-primary-600" />
                    Status & Condition
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Status</label>
                        <select
                            {...register('status')}
                            className={`input ${errors.status ? 'border-red-500' : ''}`}
                        >
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                            <option value="repair">In Repair</option>
                            <option value="retired">Retired</option>
                            <option value="lost">Lost</option>
                            <option value="disposed">Disposed</option>
                        </select>
                    </div>

                    <div>
                        <label className="label">Condition</label>
                        <select
                            {...register('condition')}
                            className={`input ${errors.condition ? 'border-red-500' : ''}`}
                        >
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                            <option value="damaged">Damaged</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="label">Location</label>
                    <input
                        type="text"
                        {...register('location')}
                        className={`input ${errors.location ? 'border-red-500' : ''}`}
                        placeholder="e.g., Office A-101"
                    />
                </div>

                <div className="mt-4">
                    <label className="label">Notes</label>
                    <textarea
                        {...register('notes')}
                        rows={3}
                        className={`input ${errors.notes ? 'border-red-500' : ''}`}
                        placeholder="Additional notes about the asset..."
                    />
                </div>
            </div>
        </div>
    );
};

export default StatusConditionSection;
