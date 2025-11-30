import { useEffect } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to callbacks
 * Example: { 'ctrl+k': () => {}, 'cmd+s': () => {} }
 */
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Build the key combination string
      let combination = '';
      if (ctrl) combination += 'ctrl+';
      if (shift) combination += 'shift+';
      if (alt) combination += 'alt+';
      combination += key;

      // Also check for cmd variant
      const cmdCombination = combination.replace('ctrl+', 'cmd+');

      // Check if this combination has a handler
      if (shortcuts[combination]) {
        event.preventDefault();
        shortcuts[combination](event);
      } else if (shortcuts[cmdCombination]) {
        event.preventDefault();
        shortcuts[cmdCombination](event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};

export default useKeyboardShortcuts;

