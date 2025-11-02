import { useEffect, useRef, useCallback } from 'react';

/**
 * Infinite scroll hook for loading more data as user scrolls
 * @param {function} fetchMore - Function to fetch more data
 * @param {boolean} hasMore - Whether there's more data to load
 * @param {boolean} isLoading - Whether data is currently loading
 * @returns {object} - Ref to attach to scrollable element
 */
export const useInfiniteScroll = (fetchMore, hasMore, isLoading) => {
  const observer = useRef();

  const lastElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, fetchMore]
  );

  return { lastElementRef };
};

export default useInfiniteScroll;

