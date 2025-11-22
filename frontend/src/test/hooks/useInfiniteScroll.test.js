import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

describe('useInfiniteScroll', () => {
  let mockIntersectionObserver;
  let observeSpy;
  let disconnectSpy;

  beforeEach(() => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();

    mockIntersectionObserver = vi.fn((callback) => {
      return {
        observe: observeSpy,
        disconnect: disconnectSpy,
        unobserve: vi.fn(),
        takeRecords: vi.fn(() => []),
      };
    });

    global.IntersectionObserver = mockIntersectionObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return lastElementRef', () => {
    const fetchMore = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll(fetchMore, true, false)
    );

    expect(result.current).toHaveProperty('lastElementRef');
    expect(typeof result.current.lastElementRef).toBe('function');
  });

  it('should observe element when lastElementRef is called', () => {
    const fetchMore = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll(fetchMore, true, false)
    );

    const mockElement = document.createElement('div');
    result.current.lastElementRef(mockElement);

    expect(mockIntersectionObserver).toHaveBeenCalled();
    expect(observeSpy).toHaveBeenCalledWith(mockElement);
  });

  it('should call fetchMore when element intersects and hasMore is true', () => {
    const fetchMore = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll(fetchMore, true, false)
    );

    const mockElement = document.createElement('div');
    result.current.lastElementRef(mockElement);

    // Get the callback from IntersectionObserver
    const observerCallback = mockIntersectionObserver.mock.calls[0][0];
    
    // Simulate intersection
    observerCallback([{ isIntersecting: true }]);

    expect(fetchMore).toHaveBeenCalled();
  });

  it('should not call fetchMore when hasMore is false', () => {
    const fetchMore = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll(fetchMore, false, false)
    );

    const mockElement = document.createElement('div');
    result.current.lastElementRef(mockElement);

    const observerCallback = mockIntersectionObserver.mock.calls[0][0];
    observerCallback([{ isIntersecting: true }]);

    expect(fetchMore).not.toHaveBeenCalled();
  });

  it('should not call fetchMore when isLoading is true', () => {
    const fetchMore = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll(fetchMore, true, true)
    );

    const mockElement = document.createElement('div');
    result.current.lastElementRef(mockElement);

    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('should disconnect previous observer when element changes', () => {
    const fetchMore = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll(fetchMore, true, false)
    );

    const element1 = document.createElement('div');
    const element2 = document.createElement('div');

    result.current.lastElementRef(element1);
    result.current.lastElementRef(element2);

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('should handle null element', () => {
    const fetchMore = vi.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll(fetchMore, true, false)
    );

    expect(() => result.current.lastElementRef(null)).not.toThrow();
  });
});

