import { useEffect, useRef, useCallback } from 'react';

/**
 * Infinite scroll hook for loading more data as user scrolls
 */
export const useInfiniteScroll = (
  fetchMore: () => void,
  hasMore: boolean,
  isLoading: boolean
): { lastElementRef: (node: HTMLElement | null) => void } => {
  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          fetchMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, fetchMore]
  );

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return { lastElementRef };
};

export default useInfiniteScroll;


