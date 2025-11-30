import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 300 });
    
    // Should still be initial value before delay
    expect(result.current).toBe('initial');

    // Fast forward time
    vi.advanceTimersByTime(300);

    // Should now be updated
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'value1', delay: 300 },
      }
    );

    // Rapidly change values
    rerender({ value: 'value2', delay: 300 });
    vi.advanceTimersByTime(100);
    
    rerender({ value: 'value3', delay: 300 });
    vi.advanceTimersByTime(100);
    
    rerender({ value: 'value4', delay: 300 });
    vi.advanceTimersByTime(300);

    // Should only have the last value
    await waitFor(() => {
      expect(result.current).toBe('value4');
    });
  });

  it('should handle custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'test', delay: 500 },
      }
    );

    rerender({ value: 'updated', delay: 500 });
    
    vi.advanceTimersByTime(300);
    expect(result.current).toBe('test');

    vi.advanceTimersByTime(200);
    
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should handle zero delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'test', delay: 0 },
      }
    );

    rerender({ value: 'updated', delay: 0 });
    vi.advanceTimersByTime(0);

    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });
});

