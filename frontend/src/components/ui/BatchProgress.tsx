import { FiCheck, FiX, FiLoader } from 'react-icons/fi';
import ProgressBar from './ProgressBar';
import { ReactNode } from 'react';

interface BatchItem {
  id?: string | number;
  name: string;
  status?: 'completed' | 'error' | 'processing' | 'pending';
  message?: string;
}

interface ErrorItem {
  message?: string;
  [key: string]: unknown;
}

interface BatchProgressProps {
  isOpen: boolean;
  operation?: string;
  items?: BatchItem[];
  current?: number;
  total?: number;
  errors?: (ErrorItem | string)[];
}

/**
 * Batch operation progress dialog
 */
const BatchProgress = ({
  isOpen,
  operation = 'Processing',
  items = [],
  current = 0,
  total = 0,
  errors = []
}: BatchProgressProps) => {
  if (!isOpen) return null;

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = current === total;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl m-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{operation}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isComplete ? 'Completed' : 'In progress...'}
          </p>
        </div>

        {/* Progress */}
        <div className="p-6">
          <ProgressBar
            current={current}
            total={total}
            label={`Processing ${operation.toLowerCase()}`}
            color={errors.length > 0 ? 'warning' : 'primary'}
          />

          {errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-2">
                {errors.length} error{errors.length !== 1 ? 's' : ''} occurred
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {errors.slice(0, 5).map((error, index) => (
                  <p key={index} className="text-xs text-red-700">
                    • {typeof error === 'string' ? error : error.message || 'Unknown error'}
                  </p>
                ))}
                {errors.length > 5 && (
                  <p className="text-xs text-red-700">
                    ... and {errors.length - 5} more errors
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  item.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : item.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : item.status === 'processing'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div>
                  {item.status === 'completed' && (
                    <FiCheck className="text-green-600" size={18} />
                  )}
                  {item.status === 'error' && (
                    <FiX className="text-red-600" size={18} />
                  )}
                  {item.status === 'processing' && (
                    <FiLoader className="text-blue-600 animate-spin" size={18} />
                  )}
                  {!item.status && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  {item.message && (
                    <p className="text-xs text-gray-600 mt-0.5">{item.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {isComplete && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                {current - errors.length} of {total} completed successfully
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchProgress;
