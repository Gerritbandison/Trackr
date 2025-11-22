/**
 * Duplicate View
 * 
 * Review and merge duplicate records
 */

import { useState } from 'react';
import { FiGitMerge, FiCheckCircle, FiX } from 'react-icons/fi';

const DuplicateView = ({ duplicate, onMerge, onClose }) => {
  const [selectedRecord, setSelectedRecord] = useState('record1');

  const handleMerge = () => {
    onMerge({
      record1Id: duplicate.record1?.id,
      record2Id: duplicate.record2?.id,
      keepRecord: selectedRecord === 'record1' ? duplicate.record1?.id : duplicate.record2?.id,
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-sm text-gray-700">
          <strong>Review Duplicates</strong> - Compare the two records and choose which
          one to keep. The other record's data will be merged into the kept record.
        </div>
      </div>

      {/* Match Score */}
      <div className="card border-2 border-slate-200">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Match Score</div>
              <div className="text-2xl font-bold text-red-600">
                {duplicate.matchScore || 0}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Matching Fields</div>
              <div className="text-sm text-gray-900">
                {duplicate.matchingFields?.join(', ') || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Record Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Record 1 */}
        <div
          className={`card border-2 transition-all ${
            selectedRecord === 'record1'
              ? 'border-primary-500 bg-primary-50'
              : 'border-slate-200'
          }`}
        >
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Record 1</h3>
              <button
                onClick={() => setSelectedRecord('record1')}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  selectedRecord === 'record1'
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                {selectedRecord === 'record1' && (
                  <FiCheckCircle className="text-white" size={14} />
                )}
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Asset Tag</div>
                <div className="font-medium text-gray-900">
                  {duplicate.record1?.assetTag || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Serial Number</div>
                <div className="font-medium text-gray-900">
                  {duplicate.record1?.serialNumber || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Model</div>
                <div className="font-medium text-gray-900">
                  {duplicate.record1?.model || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Manufacturer</div>
                <div className="font-medium text-gray-900">
                  {duplicate.record1?.manufacturer || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Record 2 */}
        <div
          className={`card border-2 transition-all ${
            selectedRecord === 'record2'
              ? 'border-primary-500 bg-primary-50'
              : 'border-slate-200'
          }`}
        >
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Record 2</h3>
              <button
                onClick={() => setSelectedRecord('record2')}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  selectedRecord === 'record2'
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                {selectedRecord === 'record2' && (
                  <FiCheckCircle className="text-white" size={14} />
                )}
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Asset Tag</div>
                <div className="font-medium text-gray-900">
                  {duplicate.record2?.assetTag || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Serial Number</div>
                <div className="font-medium text-gray-900">
                  {duplicate.record2?.serialNumber || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Model</div>
                <div className="font-medium text-gray-900">
                  {duplicate.record2?.model || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Manufacturer</div>
                <div className="font-medium text-gray-900">
                  {duplicate.record2?.manufacturer || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onClose} className="btn btn-outline">
          Cancel
        </button>
        <button
          onClick={handleMerge}
          className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
        >
          <FiGitMerge />
          Merge Records
        </button>
      </div>
    </div>
  );
};

export default DuplicateView;

