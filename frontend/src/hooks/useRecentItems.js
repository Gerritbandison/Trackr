import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for tracking recently viewed items
 * @param {string} key - Storage key (e.g., 'recent-assets')
 * @param {number} maxItems - Maximum number of recent items to store
 */
export const useRecentItems = (key = 'recent-items', maxItems = 10) => {
  const [recentItems, setRecentItems] = useLocalStorage(key, []);

  const addRecentItem = (item) => {
    setRecentItems((prev) => {
      // Remove if already exists
      const filtered = prev.filter((i) => i.id !== item.id);
      // Add to front
      const updated = [item, ...filtered];
      // Keep only maxItems
      return updated.slice(0, maxItems);
    });
  };

  const clearRecentItems = () => {
    setRecentItems([]);
  };

  return { recentItems, addRecentItem, clearRecentItems };
};

export default useRecentItems;

