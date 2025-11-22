/**
 * Performance optimization utilities
 */

// Debounce function for limiting function calls
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for rate limiting
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy load images
export const lazyLoadImage = (imageRef) => {
  if (imageRef.current) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    imageObserver.observe(imageRef.current);
  }
};

// Memoize expensive calculations
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Optimize re-renders with should update
export const shouldUpdate = (prevProps, nextProps, keys) => {
  return keys.some(key => prevProps[key] !== nextProps[key]);
};

// Preload critical resources
export const preloadResource = (href, as) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

// Batch DOM updates
export const batchDOMUpdates = (updates) => {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

// Optimize lists with virtualization
export const getVisibleItems = (items, itemHeight, containerHeight, scrollTop) => {
  const start = Math.floor(scrollTop / itemHeight);
  const end = Math.min(start + Math.ceil(containerHeight / itemHeight), items.length);
  return {
    visibleItems: items.slice(start, end),
    startIndex: start,
    endIndex: end,
  };
};

export default {
  debounce,
  throttle,
  lazyLoadImage,
  memoize,
  shouldUpdate,
  preloadResource,
  batchDOMUpdates,
  getVisibleItems,
};

