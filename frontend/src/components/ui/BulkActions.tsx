import { useState } from 'react';
import { FiCheck, FiTrash2, FiDownload, FiEdit, FiX } from 'react-icons/fi';
import { IconType } from 'react-icons';

/**
 * Bulk actions toolbar
 */
interface BulkAction {
  key: string;
  label: string;
  icon: IconType;
  variant?: 'primary' | 'danger' | 'outline';
}

interface BulkActionsProps {
  selectedCount: number;
  onAction: (actionKey: string) => void;
  actions?: BulkAction[];
}

const BulkActions = ({ selectedCount, onAction, actions = [] }: BulkActionsProps) => {
  if (selectedCount === 0) return null;

  const defaultActions: BulkAction[] = [
    { key: 'export', label: 'Export', icon: FiDownload, variant: 'primary' },
    { key: 'delete', label: 'Delete', icon: FiTrash2, variant: 'danger' },
  ];

  const allActions = actions.length > 0 ? actions : defaultActions;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg">
          <FiCheck className="text-primary-600" size={18} />
          <span className="font-semibold text-primary-900">
            {selectedCount} selected
          </span>
        </div>

        <div className="h-8 w-px bg-gray-300"></div>

        <div className="flex items-center gap-2">
          {allActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => onAction(action.key)}
                className={`btn btn-sm flex items-center gap-2 ${
                  action.variant === 'danger'
                    ? 'btn-danger'
                    : action.variant === 'primary'
                    ? 'btn-primary'
                    : 'btn-outline'
                }`}
              >
                <ActionIcon size={16} />
                {action.label}
              </button>
            );
          })}
        </div>

        <div className="h-8 w-px bg-gray-300"></div>

        <button
          onClick={() => onAction('clear')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Clear selection"
        >
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default BulkActions;
