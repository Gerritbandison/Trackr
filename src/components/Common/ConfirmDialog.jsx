import { FiAlertTriangle, FiX } from 'react-icons/fi';

/**
 * Confirmation dialog component
 */
const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // danger, warning, info
}) => {
  if (!isOpen) return null;

  const variantColors = {
    danger: 'bg-red-50 text-red-900 border-red-500',
    warning: 'bg-orange-50 text-orange-900 border-orange-500',
    info: 'bg-blue-50 text-blue-900 border-blue-500',
  };

  const buttonColors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-orange-600 hover:bg-orange-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-scale-in">
        <div className="bg-white rounded-2xl shadow-2xl m-4">
          {/* Header */}
          <div className={`p-6 border-l-4 ${variantColors[variant]} rounded-t-2xl`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                variant === 'danger' ? 'bg-red-100' :
                variant === 'warning' ? 'bg-orange-100' : 'bg-blue-100'
              }`}>
                <FiAlertTriangle className={
                  variant === 'danger' ? 'text-red-600' :
                  variant === 'warning' ? 'text-orange-600' : 'text-blue-600'
                } size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-sm opacity-90">{message}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="btn btn-outline"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`btn text-white ${buttonColors[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;

