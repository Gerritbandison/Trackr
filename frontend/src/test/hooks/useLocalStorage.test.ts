import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  const mockStorage = {};
  const localStorageMock = {
    getItem: vi.fn((key) => mockStorage[key] || null),
    setItem: vi.fn((key, value) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    }),
  };

  beforeEach(() => {
    global.localStorage = localStorageMock;
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    );

    expect(result.current[0]).toBe('initial-value');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should return stored value from localStorage', () => {
    localStorageMock.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    );

    expect(result.current[0]).toBe('stored-value');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial-value')
    );

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify('new-value')
    );
  });

  it('should handle object values', () => {
    const initialObject = { name: 'John', age: 30 };
    const { result } = renderHook(() =>
      useLocalStorage('test-object', initialObject)
    );

    expect(result.current[0]).toEqual(initialObject);

    const newObject = { name: 'Jane', age: 25 };
    act(() => {
      result.current[1](newObject);
    });

    expect(result.current[0]).toEqual(newObject);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-object',
      JSON.stringify(newObject)
    );
  });

  it('should handle array values', () => {
    const initialArray = [1, 2, 3];
    const { result } = renderHook(() =>
      useLocalStorage('test-array', initialArray)
    );

    expect(result.current[0]).toEqual(initialArray);

    const newArray = [4, 5, 6];
    act(() => {
      result.current[1](newArray);
    });

    expect(result.current[0]).toEqual(newArray);
  });

  it('should handle invalid JSON in localStorage', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'fallback-value')
    );

    expect(result.current[0]).toBe('fallback-value');
  });

  it('should handle null value in localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'default-value')
    );

    expect(result.current[0]).toBe('default-value');
  });
});

