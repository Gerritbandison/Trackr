/**
 * Depreciation Schedule Component
 * 
 * Displays depreciation schedules for assets
 */

import React from 'react';
import { FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { format } from 'date-fns';

interface DepreciationScheduleItem {
  assetId: string;
  asset?: {
    model?: string;
  };
  purchasePrice?: number;
  purchaseDate?: string | Date;
  method?: string;
  usefulLife?: number;
  monthlyDepreciation?: number;
  currentBookValue?: number;
}

interface DepreciationScheduleProps {
  data?: DepreciationScheduleItem[];
  selectedAsset?: string;
  onAssetSelect?: (assetId: string) => void;
}

const DepreciationSchedule = ({ data, selectedAsset, onAssetSelect }: DepreciationScheduleProps) => {
  const schedules = data || [];

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Depreciation Schedules</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Asset</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Purchase Price</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Purchase Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Useful Life</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Monthly Depreciation</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Book Value</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No depreciation schedules found
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr
                    key={schedule.assetId}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onAssetSelect?.(schedule.assetId)}
                  >
                    <td className="py-3 px-4">{schedule.asset?.model || schedule.assetId}</td>
                    <td className="py-3 px-4">
                      ${schedule.purchasePrice?.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4">
                      {schedule.purchaseDate
                        ? format(new Date(schedule.purchaseDate), 'MMM dd, yyyy')
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">{schedule.method}</td>
                    <td className="py-3 px-4">{schedule.usefulLife} years</td>
                    <td className="py-3 px-4">
                      ${schedule.monthlyDepreciation?.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      ${schedule.currentBookValue?.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepreciationSchedule;

