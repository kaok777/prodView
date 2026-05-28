/**
 * Storage Service
 * Provides type-safe wrapper around localStorage with validation
 * Fixed: LOW-F1 - Direct localStorage access without validation
 */

/**
 * StorageService provides a type-safe abstraction over localStorage
 * with proper error handling and validation
 */
export class StorageService {
  /**
   * Get an item from localStorage with type validation
   * @param key - The storage key
   * @returns The parsed value or null if not found/invalid
   */
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);

      if (item === null) {
        return null;
      }

      // Try to parse as JSON
      try {
        return JSON.parse(item) as T;
      } catch {
        // If parsing fails, return as string (cast to T)
        // This handles non-JSON strings like 'true' or simple text
        return item as unknown as T;
      }
    } catch (error) {
      console.error(`[StorageService] Failed to get item "${key}":`, error);
      return null;
    }
  }

  /**
   * Set an item in localStorage with automatic JSON serialization
   * @param key - The storage key
   * @param value - The value to store
   */
  static set<T>(key: string, value: T): void {
    try {
      // Handle null/undefined explicitly
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
        return;
      }

      // Serialize value appropriately
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`[StorageService] Failed to set item "${key}":`, error);

      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[StorageService] localStorage quota exceeded');
        // Could implement cleanup strategy here
      }
    }
  }

  /**
   * Remove an item from localStorage
   * @param key - The storage key
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[StorageService] Failed to remove item "${key}":`, error);
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param key - The storage key
   * @returns true if the key exists
   */
  static has(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`[StorageService] Failed to check item "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all items from localStorage
   * Use with caution!
   */
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('[StorageService] Failed to clear localStorage:', error);
    }
  }

  /**
   * Get an item with a default value if not found
   * @param key - The storage key
   * @param defaultValue - The default value to return
   * @returns The stored value or the default
   */
  static getWithDefault<T>(key: string, defaultValue: T): T {
    const value = this.get<T>(key);
    return value !== null ? value : defaultValue;
  }

  /**
   * Get all keys in localStorage
   * @returns Array of all storage keys
   */
  static keys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('[StorageService] Failed to get keys:', error);
      return [];
    }
  }
}

/**
 * Storage keys used in the application
 * Centralizes all storage key definitions for consistency
 */
export const StorageKeys = {
  ADMIN_SESSION: 'adminSession',
  ACCESS_TOKEN: 'accessToken',
  THEME: 'theme',
  LEFT_SIDEBAR_VISITED: 'left-sidebar-visited',
  RIGHT_SIDEBAR_VISITED: 'right-sidebar-visited',
  CONSENT_PREFERENCES: 'consent_preferences',
} as const;
