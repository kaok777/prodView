import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StorageService, StorageKeys } from '../services/StorageService';

// Global reference to clearAuth for use outside React components (e.g., API interceptor)
let globalClearAuth: (() => void) | null = null;

/**
 * AdminSession interface matching backend response
 * Stored in localStorage for UI purposes (not for authentication)
 * Actual authentication uses httpOnly cookies managed by backend
 */
export interface AdminSession {
  adminId: string;
  email: string;
  role: string;
}

interface AuthContextType {
  session: AdminSession | null;
  isLoading: boolean;
  setAuth: (session: AdminSession | null) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Centralized authentication state management
 *
 * Fixed: Admin Session Consistency Bug
 * Provides reactive auth state instead of direct localStorage reads
 *
 * This ensures:
 * - All components see consistent auth state
 * - Auth state updates propagate immediately to all components
 * - No stale localStorage reads causing inconsistent admin permissions
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage synchronously to avoid flash
  const [session, setSession] = useState<AdminSession | null>(() => {
    try {
      const stored = StorageService.get<AdminSession>(StorageKeys.ADMIN_SESSION);

      // Validate session structure
      if (stored && stored.adminId && stored.email && stored.role) {
        return stored;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  /**
   * Set authentication session
   * Updates both React state and localStorage
   */
  const setAuth = (newSession: AdminSession | null) => {
    setSession(newSession);

    if (newSession) {
      StorageService.set(StorageKeys.ADMIN_SESSION, newSession);
    } else {
      StorageService.remove(StorageKeys.ADMIN_SESSION);
    }
  };

  /**
   * Clear authentication session
   * Removes from both React state and localStorage
   */
  const clearAuth = () => {
    setSession(null);
    StorageService.remove(StorageKeys.ADMIN_SESSION);
  };

  // Expose clearAuth globally for use outside React (e.g., API interceptor)
  useEffect(() => {
    globalClearAuth = clearAuth;
    return () => {
      globalClearAuth = null;
    };
  }, []);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === StorageKeys.ADMIN_SESSION) {
        if (e.newValue) {
          try {
            const newSession = JSON.parse(e.newValue) as AdminSession;
            setSession(newSession);
          } catch {
            setSession(null);
          }
        } else {
          setSession(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: AuthContextType = {
    session,
    isLoading,
    setAuth,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook - Access authentication state and methods
 *
 * @returns {AuthContextType} Authentication context
 * @throws {Error} If used outside AuthProvider
 *
 * @example
 * const { session, setAuth, clearAuth } = useAuth();
 * if (session) {
 *   console.log(`Logged in as ${session.email}`);
 * }
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * clearAuthGlobally - Clear auth state from outside React components
 *
 * This is for use in non-React code like API interceptors.
 * Prefer using useAuth().clearAuth() in React components.
 *
 * @example
 * // In API interceptor
 * import { clearAuthGlobally } from './contexts/AuthContext';
 * clearAuthGlobally();
 */
export function clearAuthGlobally(): void {
  if (globalClearAuth) {
    globalClearAuth();
  } else {
    // Fallback: clear localStorage directly if context not ready
    StorageService.remove(StorageKeys.ADMIN_SESSION);
  }
}
