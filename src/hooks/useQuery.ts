import { useEffect, useRef } from 'react';

/**
 * useQuery Hook with AbortController
 * Prevents race conditions by canceling in-flight requests
 * Fixed: MEDIUM-F3 - Race Conditions in ProductSelectionPage
 */

/**
 * Custom hook to manage async queries with automatic cleanup
 * Cancels previous requests when a new one starts or component unmounts
 *
 * @example
 * const abortControllerRef = useQuery();
 *
 * useEffect(() => {
 *   const fetchData = async () => {
 *     try {
 *       const response = await api.get('/data', {
 *         signal: abortControllerRef.current?.signal
 *       });
 *       // handle response
 *     } catch (error) {
 *       if (error.name !== 'AbortError') {
 *         // handle non-abort errors
 *       }
 *     }
 *   };
 *   fetchData();
 * }, [dependencies]);
 */
export function useQuery() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Create new AbortController for this effect
    abortControllerRef.current = new AbortController();

    // Cleanup function: abort on unmount or when dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  });

  return abortControllerRef;
}

/**
 * Check if an error is an AbortError (request was canceled)
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
