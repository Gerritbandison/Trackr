import { useState } from 'react';
import { FiX, FiCommand } from 'react-icons/fi';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

/**
 * Keyboard shortcuts help modal
 */
const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  useKeyboardShortcuts({
    'shift+?': () => setIsOpen(true),
    'escape': () => setIsOpen(false),
  });

  const shortcuts = [
    { keys: ['⌘', 'K'], description: 'Open global search' },
    { keys: ['⌘', 'S'], description: 'Save (on forms)' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
    { keys: ['Esc'], description: 'Close modals/panels' },
    { keys: ['N'], description: 'New item (on list pages)' },
    { keys: ['E'], description: 'Edit item (on detail pages)' },
    { keys: ['D'], description: 'Delete item (with confirmation)' },
    { keys: ['R'], description: 'Refresh data' },
    { keys: ['/', '⌘', 'F'], description: 'Focus search box' },
    { keys: ['←', '→'], description: 'Navigate pagination' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all z-30 group"
        title="Keyboard shortcuts (Shift + ?)"
      >
        <FiCommand size={20} />
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Keyboard shortcuts (?)
        </span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl animate-scale-in">
        <div className="bg-white rounded-2xl shadow-2xl m-4">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-600 mt-1">Boost your productivity</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-700">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-semibold text-gray-800"
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl text-center text-sm text-gray-600">
            Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono text-xs">?</kbd> anytime to view shortcuts
          </div>
        </div>
      </div>
    </>
  );
};

export default KeyboardShortcutsHelp;

