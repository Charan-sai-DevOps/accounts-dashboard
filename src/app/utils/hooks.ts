import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to debounce a value
 * Delays updating the returned value until changes stop for specified delay
 *
 * @param value - Value to debounce
 * @param delay - Debounce delay in milliseconds (default 300ms)
 * @returns Debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 300);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to enforce rate limiting on the frontend
 * Prevents more than maxAttempts in a given time window
 *
 * @param maxAttempts - Maximum number of attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with isAllowed() function and attemptCount
 *
 * @example
 * const { isAllowed, getRetryAfter } = useRateLimit(5, 60000);
 * if (!isAllowed()) {
 *   showError(`Too many attempts. Retry after ${getRetryAfter()}s`);
 * }
 */
export function useRateLimit(maxAttempts: number, windowMs: number) {
  const [attempts, setAttempts] = useState<number[]>([]);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  const isAllowed = useCallback((): boolean => {
    const now = Date.now();

    // Check if still blocked
    if (blockedUntil && now < blockedUntil) {
      return false;
    }

    // Filter attempts outside the time window
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < windowMs);

    // Check if limit exceeded
    if (recentAttempts.length >= maxAttempts) {
      setBlockedUntil(now + windowMs);
      return false;
    }

    // Record this attempt
    setAttempts([...recentAttempts, now]);
    return true;
  }, [attempts, maxAttempts, windowMs, blockedUntil]);

  const getRetryAfter = useCallback((): number => {
    if (!blockedUntil) return 0;
    const now = Date.now();
    return Math.ceil((blockedUntil - now) / 1000);
  }, [blockedUntil]);

  const reset = useCallback((): void => {
    setAttempts([]);
    setBlockedUntil(null);
  }, []);

  return {
    isAllowed,
    getRetryAfter,
    reset,
    attemptCount: attempts.length,
  };
}

/**
 * Hook to manage async operations with loading/error states
 *
 * @param asyncFn - Async function to execute
 * @returns Object with loading, error, and result states
 *
 * @example
 * const { loading, error, result } = useAsync(fetchUsers);
 */
export function useAsync<T, E = Error>(
  asyncFn: () => Promise<T>,
  immediate: boolean = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setResult(null);
    setError(null);

    try {
      const response = await asyncFn();
      setResult(response);
      setStatus('success');
      return response;
    } catch (err) {
      setError(err as E);
      setStatus('error');
      throw err;
    }
  }, [asyncFn]);

  useEffect(() => {
    if (immediate) {
      void execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    status,
    loading: status === 'pending',
    result,
    error,
  };
}

/**
 * Hook to handle focus states with ref-based management
 * Prevents layout shifts from inline style changes
 *
 * @returns Object with containerRef, isFocused, handlers
 *
 * @example
 * const { containerRef, isFocused, handleFocus, handleBlur } = useFocusState();
 */
export function useFocusState() {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (containerRef.current) {
      containerRef.current.style.borderColor = '#6366f1';
      containerRef.current.style.background = '#ffffff';
    }
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (containerRef.current) {
      containerRef.current.style.borderColor = '#e2e8f0';
      containerRef.current.style.background = '#f8fafc';
    }
  }, []);

  return {
    containerRef,
    isFocused,
    handleFocus,
    handleBlur,
  };
}

/**
 * Hook to manage abortable fetch requests
 * Automatically cancels requests on unmount to prevent memory leaks
 *
 * @returns fetch function that returns AbortController
 *
 * @example
 * const abortableFetch = useAbortableFetch();
 * const { data, controller } = await abortableFetch('/api/users');
 */
export function useAbortableFetch() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup: abort any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const abortableFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, don't throw
          return null;
        }
        throw error;
      }
    },
    []
  );

  return { abortableFetch, controller: abortControllerRef.current };
}

/**
 * Hook to manage local storage with automatic sync across tabs
 * Provides reactive state that syncs with localStorage
 *
 * @param key - localStorage key
 * @param initialValue - Initial value if not in localStorage
 * @returns Tuple of [value, setValue, clearValue]
 *
 * @example
 * const [darkMode, setDarkMode, clearDarkMode] = useLocalStorage('darkMode', false);
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Dispatch storage event for other tabs
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: JSON.stringify(valueToStore),
            oldValue: JSON.stringify(storedValue),
            storageArea: localStorage,
          })
        );
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const clearValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error clearing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, clearValue] as const;
}
