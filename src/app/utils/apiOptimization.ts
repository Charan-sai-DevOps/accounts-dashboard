/**
 * API optimization utilities for reducing network waterfalls and batching requests
 * Addresses issues: 17, 18, 19
 */

/**
 * Batch multiple API calls and execute them in parallel
 * Prevents network waterfall where requests wait for previous responses
 *
 * @example
 * const [users, settings, subscriptions] = await batchApis([
 *   () => fetch('/api/users'),
 *   () => fetch('/api/settings'),
 *   () => fetch('/api/subscriptions'),
 * ]);
 */
export async function batchApis<T extends (...args: any[]) => Promise<any>>(
  apiFunctions: T[]
): Promise<Awaited<ReturnType<T>>[]> {
  return Promise.all(apiFunctions.map(fn => fn()));
}

/**
 * Load data in parallel with fallback
 * If one API fails, others still complete
 *
 * @example
 * const results = await batchApisWithFallback([
 *   { fn: () => fetch('/api/users'), fallback: [] },
 *   { fn: () => fetch('/api/settings'), fallback: {} },
 * ]);
 */
export async function batchApisWithFallback<T>(
  requests: Array<{
    fn: () => Promise<T>;
    fallback: T;
  }>
): Promise<T[]> {
  return Promise.all(
    requests.map(async ({ fn, fallback }) => {
      try {
        return await fn();
      } catch (error) {
        console.error('[API] Request failed, using fallback:', error);
        return fallback;
      }
    })
  );
}

/**
 * Efficiently filter and map arrays in single pass
 * Prevents multiple iterations over large arrays
 *
 * @example
 * const filtered = filterMap(users, u => u.active ? u.name : null);
 * // Instead of: users.filter(u => u.active).map(u => u.name)
 */
export function filterMap<T, U>(
  array: T[],
  callback: (item: T, index: number) => U | null | undefined
): U[] {
  const result: U[] = [];
  for (let i = 0; i < array.length; i++) {
    const mapped = callback(array[i], i);
    if (mapped !== null && mapped !== undefined) {
      result.push(mapped);
    }
  }
  return result;
}

/**
 * Flatten nested array in single operation
 * More efficient than nested loops or flat()
 *
 * @example
 * const flat = flattenOnce([[1,2], [3,4]]); // [1,2,3,4]
 */
export function flattenOnce<T>(arrays: T[][]): T[] {
  const result: T[] = [];
  for (const array of arrays) {
    for (const item of array) {
      result.push(item);
    }
  }
  return result;
}

/**
 * Deduplicate array while preserving order
 * O(n) instead of O(n²) with nested loops
 *
 * @example
 * const unique = deduplicate([1, 2, 2, 3, 1]); // [1, 2, 3]
 */
export function deduplicate<T>(array: T[], key?: (item: T) => any): T[] {
  if (!key) {
    const seen = new Set<T>();
    return array.filter(item => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
  }

  const seen = new Set<any>();
  return array.filter(item => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Group array items by key
 * Efficient single-pass grouping
 *
 * @example
 * const grouped = groupBy(users, u => u.role);
 * // { 'Admin': [...], 'Member': [...] }
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of array) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

/**
 * Memoize expensive array operations
 * Cache results based on array identity
 *
 * @example
 * const memoizedSort = memoizeArrayOp(
 *   arr => arr.sort((a, b) => a.name.localeCompare(b.name))
 * );
 */
export function memoizeArrayOp<T, R>(
  operation: (array: T[]) => R
): (array: T[]) => R {
  let lastArray: T[] | null = null;
  let lastResult: R;

  return (array: T[]): R => {
    // Check if array reference changed
    if (lastArray !== array) {
      lastArray = array;
      lastResult = operation(array);
    }
    return lastResult;
  };
}

/**
 * Efficiently search array (case-insensitive string search)
 * Better than .includes() + .toLowerCase() for large arrays
 *
 * @example
 * const found = searchArray(users, 'john', u => u.name);
 */
export function searchArray<T>(
  array: T[],
  query: string,
  extractString: (item: T) => string
): T[] {
  if (!query) return array;

  const lower = query.toLowerCase();
  return array.filter(item =>
    extractString(item).toLowerCase().includes(lower)
  );
}

/**
 * Paginate array results
 * Prevent rendering massive lists at once
 *
 * @example
 * const page1 = paginate(items, 0, 10); // First 10 items
 * const page2 = paginate(items, 10, 10); // Next 10 items
 */
export function paginate<T>(
  array: T[],
  offset: number,
  limit: number
): T[] {
  return array.slice(offset, offset + limit);
}

/**
 * Check array has any matching item
 * Stops at first match (unlike .filter().length > 0)
 *
 * @example
 * if (hasAny(users, u => u.admin)) { ... }
 */
export function hasAny<T>(
  array: T[],
  predicate: (item: T) => boolean
): boolean {
  for (const item of array) {
    if (predicate(item)) return true;
  }
  return false;
}

/**
 * Partition array into two groups
 * Single pass instead of two filters
 *
 * @example
 * const [admins, others] = partition(users, u => u.role === 'Admin');
 */
export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const yes: T[] = [];
  const no: T[] = [];

  for (const item of array) {
    if (predicate(item)) {
      yes.push(item);
    } else {
      no.push(item);
    }
  }

  return [yes, no];
}
