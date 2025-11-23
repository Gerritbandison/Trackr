import { FiCheckCircle, FiX } from 'react-icons/fi';

/**
 * Bulk operation progress indicator
 */
interface BulkProgressProps {
  total?: number;
  completed?: number;
  failed?: number;
  inProgress?: boolean;
  message?: string;
  onCancel?: () => void;
}

const BulkProgress = ({ 
  total = 0, 
  completed = 0, 
  failed = 0, 
  inProgress = false,
  message = 'Processing...',
  onCancel 
}: BulkProgressProps) => {
  const progress = total > 0 ? Math.min(((completed + failed) / total) * 100, 100) : 0;
  const successRate = (completed + failed) > 0 ? (completed / (completed + failed)) * 100 : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {inProgress && (
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          )}
          <span className="text-sm font-semibold text-slate-900">{message}</span>
        </div>
        {onCancel && inProgress && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Cancel operation"
          >
            <FiX size={16} className="text-slate-600" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <FiCheckCircle className="text-green-600" size={14} />
              <span className="text-slate-700 font-medium">{completed} completed</span>
            </div>
            {failed > 0 && (
              <div className="flex items-center gap-1.5">
                <FiX className="text-red-600" size={14} />
                <span className="text-slate-700 font-medium">{failed} failed</span>
              </div>
            )}
          </div>
          <div className="text-slate-600 font-medium">
            {completed + failed} / {total}
          </div>
        </div>

        {/* Success rate */}
        {(completed + failed) > 0 && (
          <div className="text-xs text-slate-500">
            Success rate: {Math.round(successRate)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkProgress;

