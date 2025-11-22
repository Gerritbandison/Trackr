import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children, size = 'md', footer, ariaLabelledBy, ariaDescribedBy }) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = ariaLabelledBy || `modal-title-${Date.now()}`;
  const descriptionId = ariaDescribedBy || `modal-description-${Date.now()}`;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Store the element that had focus before modal opened
      previousFocusRef.current = document.activeElement;
      // Focus the modal container
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
      // Return focus to the element that had it before
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e) => {
      if (!modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
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
      <div
        className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          ref={modalRef}
          className={`bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-2xl border-2 border-slate-200 max-h-[90vh] overflow-y-auto w-full ${sizes[size]} transform transition-all animate-slide-in`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-50 via-slate-100 to-slate-50 px-8 py-6 border-b-2 border-slate-200 flex items-center justify-between rounded-t-3xl">
            <h3 id={titleId} className="text-2xl font-bold text-slate-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-700 transition-all hover:rotate-90 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Close dialog"
            >
              <FiX size={24} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div id={descriptionId} className="p-8 bg-white">
            {children}
          </div>

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

