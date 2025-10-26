import { FiX, FiExternalLink, FiEdit } from 'react-icons/fi';
import { Link } from 'react-router-dom';

/**
 * Quick view modal for previewing items without full navigation
 */
const QuickViewModal = ({ isOpen, onClose, title, data, detailUrl, onEdit, children }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">Quick preview</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit"
              >
                <FiEdit size={20} />
              </button>
            )}
            {detailUrl && (
              <Link
                to={detailUrl}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Open full view"
              >
                <FiExternalLink size={20} />
              </Link>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
          {detailUrl && (
            <Link to={detailUrl} className="btn btn-primary">
              View Full Details
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default QuickViewModal;

