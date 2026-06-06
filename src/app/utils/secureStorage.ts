import { z } from 'zod';

/**
 * Secure localStorage wrapper with validation
 * - Validates data on read
 * - Removes invalid/corrupted data
 * - Only stores non-sensitive cache data
 */

/**
 * Safely read from localStorage with validation
 * @param key - Storage key
 * @param schema - Zod schema to validate data
 * @param defaultValue - Default value if not found or invalid
 * @returns Validated data or default value
 */
export function readSecureStorage<T>(
  key: string,
  schema: z.ZodSchema<T>,
  defaultValue: T
): T {
  try {
    const stored = localStorage.getItem(key);

    if (!stored) {
      return defaultValue;
    }

    const parsed = JSON.parse(stored);
    const validated = schema.safeParse(parsed);

    if (!validated.success) {
      console.warn(`[SecureStorage] Invalid data for key "${key}", removing`);
      localStorage.removeItem(key);
      return defaultValue;
    }

    return validated.data;
  } catch (error) {
    console.error(`[SecureStorage] Error reading key "${key}":`, error);
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`[SecureStorage] Error removing corrupted key "${key}"`);
    }
    return defaultValue;
  }
}

/**
 * Safely write to localStorage with validation
 * @param key - Storage key
 * @param value - Value to store
 * @param schema - Zod schema to validate before storing
 * @returns true if successful, false otherwise
 */
export function writeSecureStorage<T>(
  key: string,
  value: T,
  schema: z.ZodSchema<T>
): boolean {
  try {
    // Validate before storing
    const validated = schema.safeParse(value);

    if (!validated.success) {
      console.warn(`[SecureStorage] Validation failed for key "${key}"`);
      return false;
    }

    localStorage.setItem(key, JSON.stringify(validated.data));
    return true;
  } catch (error) {
    console.error(`[SecureStorage] Error writing key "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from localStorage safely
 * @param key - Storage key
 */
export function removeSecureStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[SecureStorage] Error removing key "${key}":`, error);
  }
}

/**
 * Clear all application data from localStorage
 * @param keys - Array of keys to clear (if not provided, clears all)
 */
export function clearSecureStorage(keys?: string[]): void {
  try {
    if (keys) {
      keys.forEach(key => localStorage.removeItem(key));
    } else {
      localStorage.clear();
    }
  } catch (error) {
    console.error('[SecureStorage] Error clearing storage:', error);
  }
}

/**
 * Check if key exists in localStorage
 * @param key - Storage key
 * @returns true if key exists
 */
export function hasSecureStorage(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`[SecureStorage] Error checking key "${key}":`, error);
    return false;
  }
}

/**
 * Get storage size in bytes
 * @returns Approximate storage size
 */
export function getSecureStorageSize(): number {
  let size = 0;
  try {
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
  } catch (error) {
    console.error('[SecureStorage] Error calculating size:', error);
  }
  return size;
}

/**
 * List all keys in localStorage (safe)
 * @returns Array of storage keys
 */
export function listSecureStorageKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.error('[SecureStorage] Error listing keys:', error);
  }
  return keys;
}

/**
 * Create a typed storage accessor
 * @param key - Storage key
 * @param schema - Zod schema
 * @param defaultValue - Default value
 * @returns Object with get/set methods
 */
export function createSecureStorageAccessor<T>(
  key: string,
  schema: z.ZodSchema<T>,
  defaultValue: T
) {
  return {
    get(): T {
      return readSecureStorage(key, schema, defaultValue);
    },
    set(value: T): boolean {
      return writeSecureStorage(key, value, schema);
    },
    remove(): void {
      removeSecureStorage(key);
    },
    clear(): void {
      removeSecureStorage(key);
    },
  };
}

/**
 * Important: NEVER store in localStorage:
 * - Passwords
 * - API keys / tokens (use sessionStorage)
 * - PII (personally identifiable info)
 * - Credit card data
 * - Auth tokens
 *
 * OK to store:
 * - UI preferences (theme, layout)
 * - Cache of non-sensitive data
 * - User-entered search/filters (non-sensitive)
 * - Timestamps and metadata
 */
