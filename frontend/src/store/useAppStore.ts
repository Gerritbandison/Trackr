/**
 * Zustand Store for Client-Side State Management
 * 
 * This store manages client-side UI state that doesn't need to be
 * synced with the server. For server state, use React Query.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * App Store - Client-side state management
 */
export const useAppStore = create(
  persist(
    (set, get) => ({
      // UI State
      sidebarOpen: true,
      darkMode: false,
      
      // View preferences
      viewMode: 'grid', // 'grid' | 'list' | 'table'
      
      // Table settings
      tableSettings: {
        pageSize: 25,
        sortBy: null,
        sortOrder: 'asc',
        visibleColumns: [],
      },
      
      // Filters
      savedFilters: {},
      
      // Favorites
      favorites: [],
      
      // Recent items
      recentItems: {
        assets: [],
        licenses: [],
        users: [],
      },
      
      // Notification preferences
      notificationSettings: {
        enabled: true,
        sound: true,
        desktop: false,
      },
      
      // Keyboard shortcuts enabled
      keyboardShortcutsEnabled: true,
      
      // Global search history
      searchHistory: [],
      
      // Modals state
      modals: {
        // Modal IDs and their open state
      },
      
      // Actions
      
      /**
       * Toggle sidebar
       */
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      /**
       * Set sidebar open state
       */
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      /**
       * Toggle dark mode
       */
      toggleDarkMode: () => {
        const currentDarkMode = get().darkMode;
        const newDarkMode = !currentDarkMode;
        
        // Update document class
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        set({ darkMode: newDarkMode });
      },
      
      /**
       * Set dark mode
       */
      setDarkMode: (enabled) => {
        if (enabled) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ darkMode: enabled });
      },
      
      /**
       * Set view mode
       */
      setViewMode: (mode) => set({ viewMode: mode }),
      
      /**
       * Update table settings
       */
      updateTableSettings: (settings) =>
        set((state) => ({
          tableSettings: { ...state.tableSettings, ...settings },
        })),
      
      /**
       * Save filter
       */
      saveFilter: (key, filter) =>
        set((state) => ({
          savedFilters: { ...state.savedFilters, [key]: filter },
        })),
      
      /**
       * Remove saved filter
       */
      removeSavedFilter: (key) =>
        set((state) => {
          const { [key]: removed, ...rest } = state.savedFilters;
          return { savedFilters: rest };
        }),
      
      /**
       * Add favorite
       */
      addFavorite: (type, id) =>
        set((state) => {
          const favorite = { type, id, addedAt: new Date().toISOString() };
          const exists = state.favorites.some(
            (f) => f.type === type && f.id === id
          );
          
          if (exists) return state;
          
          return {
            favorites: [...state.favorites, favorite],
          };
        }),
      
      /**
       * Remove favorite
       */
      removeFavorite: (type, id) =>
        set((state) => ({
          favorites: state.favorites.filter(
            (f) => !(f.type === type && f.id === id)
          ),
        })),
      
      /**
       * Check if item is favorited
       */
      isFavorite: (type, id) => {
        return get().favorites.some((f) => f.type === type && f.id === id);
      },
      
      /**
       * Add recent item
       */
      addRecentItem: (type, id, name) => {
        const maxRecentItems = 10;
        
        set((state) => {
          const recent = state.recentItems[type] || [];
          
          // Remove if already exists
          const filtered = recent.filter((item) => item.id !== id);
          
          // Add new item at the beginning
          const updated = [
            { id, name, viewedAt: new Date().toISOString() },
            ...filtered,
          ].slice(0, maxRecentItems);
          
          return {
            recentItems: {
              ...state.recentItems,
              [type]: updated,
            },
          };
        });
      },
      
      /**
       * Get recent items for a type
       */
      getRecentItems: (type) => {
        return get().recentItems[type] || [];
      },
      
      /**
       * Update notification settings
       */
      updateNotificationSettings: (settings) =>
        set((state) => ({
          notificationSettings: {
            ...state.notificationSettings,
            ...settings,
          },
        })),
      
      /**
       * Toggle keyboard shortcuts
       */
      toggleKeyboardShortcuts: () =>
        set((state) => ({
          keyboardShortcutsEnabled: !state.keyboardShortcutsEnabled,
        })),
      
      /**
       * Add to search history
       */
      addSearchHistory: (query) => {
        const maxHistory = 10;
        
        set((state) => {
          const history = state.searchHistory.filter((q) => q !== query);
          return {
            searchHistory: [query, ...history].slice(0, maxHistory),
          };
        });
      },
      
      /**
       * Clear search history
       */
      clearSearchHistory: () => set({ searchHistory: [] }),
      
      /**
       * Open modal
       */
      openModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: true },
        })),
      
      /**
       * Close modal
       */
      closeModal: (modalId) =>
        set((state) => {
          const { [modalId]: removed, ...rest } = state.modals;
          return { modals: rest };
        }),
      
      /**
       * Check if modal is open
       */
      isModalOpen: (modalId) => {
        return get().modals[modalId] || false;
      },
      
      /**
       * Reset store to initial state
       */
      reset: () =>
        set({
          sidebarOpen: true,
          viewMode: 'grid',
          tableSettings: {
            pageSize: 25,
            sortBy: null,
            sortOrder: 'asc',
            visibleColumns: [],
          },
          savedFilters: {},
          favorites: [],
          recentItems: {
            assets: [],
            licenses: [],
            users: [],
          },
          notificationSettings: {
            enabled: true,
            sound: true,
            desktop: false,
          },
          keyboardShortcutsEnabled: true,
          searchHistory: [],
          modals: {},
        }),
    }),
    {
      name: 'app-store', // localStorage key
      // Only persist certain fields (exclude modals)
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        darkMode: state.darkMode,
        viewMode: state.viewMode,
        tableSettings: state.tableSettings,
        savedFilters: state.savedFilters,
        favorites: state.favorites,
        recentItems: state.recentItems,
        notificationSettings: state.notificationSettings,
        keyboardShortcutsEnabled: state.keyboardShortcutsEnabled,
        searchHistory: state.searchHistory,
      }),
    }
  )
);

/**
 * Selectors for optimized re-renders
 */
export const useSidebar = () => useAppStore((state) => ({
  isOpen: state.sidebarOpen,
  toggle: state.toggleSidebar,
  setOpen: state.setSidebarOpen,
}));

export const useDarkMode = () => useAppStore((state) => ({
  enabled: state.darkMode,
  toggle: state.toggleDarkMode,
  setEnabled: state.setDarkMode,
}));

export const useViewMode = () => useAppStore((state) => ({
  mode: state.viewMode,
  setMode: state.setViewMode,
}));

export const useFavorites = () => useAppStore((state) => ({
  favorites: state.favorites,
  addFavorite: state.addFavorite,
  removeFavorite: state.removeFavorite,
  isFavorite: state.isFavorite,
}));

export const useRecentItems = () => useAppStore((state) => ({
  recentItems: state.recentItems,
  addRecentItem: state.addRecentItem,
  getRecentItems: state.getRecentItems,
}));

export const useModals = () => useAppStore((state) => ({
  openModal: state.openModal,
  closeModal: state.closeModal,
  isModalOpen: state.isModalOpen,
}));

