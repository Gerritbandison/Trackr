import { useLocalStorage } from './useLocalStorage';

/**
 * Custom hook for managing favorites/bookmarks
 * @param {string} key - Storage key (e.g., 'favorite-assets')
 */
export const useFavorites = (key = 'favorites') => {
  const [favorites, setFavorites] = useLocalStorage(key, []);

  const isFavorite = (id) => {
    return favorites.some((fav) => fav.id === id);
  };

  const toggleFavorite = (item) => {
    setFavorites((prev) => {
      if (prev.some((fav) => fav.id === item.id)) {
        // Remove from favorites
        return prev.filter((fav) => fav.id !== item.id);
      } else {
        // Add to favorites
        return [...prev, { ...item, favoritedAt: new Date().toISOString() }];
      }
    });
  };

  const removeFavorite = (id) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
  };
};

export default useFavorites;

