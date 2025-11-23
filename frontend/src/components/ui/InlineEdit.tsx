import { useState } from 'react';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';

/**
 * Inline editable field component
 */
interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  type?: string;
  placeholder?: string;
  className?: string;
}

const InlineEdit = ({ 
  value, 
  onSave, 
  type = 'text',
  placeholder = 'Click to edit',
  className = '' 
}: InlineEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div className={`group flex items-center gap-2 ${className}`}>
        <span className={!value ? 'text-gray-400 italic' : ''}>
          {value || placeholder}
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all"
        >
          <FiEdit2 size={14} className="text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        disabled={isSaving}
        className="flex-1 px-2 py-1 border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="p-1 hover:bg-green-50 text-green-600 rounded transition-colors"
        title="Save (Enter)"
      >
        <FiCheck size={16} />
      </button>
      <button
        onClick={handleCancel}
        disabled={isSaving}
        className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
        title="Cancel (Esc)"
      >
        <FiX size={16} />
      </button>
    </div>
  );
};

export default InlineEdit;

