import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-fade-in">
        <div className={`bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-2xl border-2 border-slate-200 max-h-[90vh] overflow-y-auto w-full ${sizes[size]} transform transition-all animate-slide-in`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-50 via-slate-100 to-slate-50 px-8 py-6 border-b-2 border-slate-200 flex items-center justify-between rounded-t-3xl">
            <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-700 transition-all hover:rotate-90 hover:scale-110"
            >
              <FiX size={24} strokeWidth={2.5} />
            </button>
          </div>

          {/* Body */}
          <div className="p-8 bg-white">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 px-8 py-6 bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-200 rounded-b-3xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Modal;

