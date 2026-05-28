import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { StorageService, StorageKeys } from "../services/StorageService";

/**
 * Consent policy version - increment when policies change
 * to re-prompt users for updated consent
 */
const CONSENT_VERSION = "1.0";

/**
 * Consent preference categories
 */
export interface ConsentPreferences {
  essential: true; // Always true (never changes)
  analytics: boolean; // User choice
  marketing: boolean; // User choice (future)
  timestamp: string; // ISO 8601 timestamp
  version: string; // Policy version
}

/**
 * Consent context value
 */
interface ConsentContextType {
  preferences: ConsentPreferences | null;
  hasConsent: boolean; // Has user made a decision?
  acceptAll: () => void;
  rejectAll: () => void;
  setPreferences: (prefs: Partial<Omit<ConsentPreferences, 'essential' | 'version'>>) => void;
  openPreferencesModal: () => void;
  closePreferencesModal: () => void;
  isModalOpen: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

/**
 * Default consent state (no decision made)
 */
const DEFAULT_PREFERENCES: ConsentPreferences = {
  essential: true,
  analytics: false, // Default DENY until consent given (GDPR/POPIA compliant)
  marketing: false,
  timestamp: new Date().toISOString(),
  version: CONSENT_VERSION,
};

/**
 * Validates consent preferences from storage
 */
function validateConsentPreferences(stored: unknown): ConsentPreferences | null {
  if (!stored || typeof stored !== 'object') {
    return null;
  }

  const prefs = stored as Record<string, unknown>;

  // Check required fields
  if (
    typeof prefs.essential !== 'boolean' ||
    typeof prefs.analytics !== 'boolean' ||
    typeof prefs.marketing !== 'boolean' ||
    typeof prefs.timestamp !== 'string' ||
    typeof prefs.version !== 'string'
  ) {
    return null;
  }

  // Check version - if old version, invalidate to re-prompt
  if (prefs.version !== CONSENT_VERSION) {
    return null;
  }

  return prefs as ConsentPreferences;
}

/**
 * ConsentProvider
 * Manages user consent preferences for cookies and tracking
 */
export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferencesState] = useState<ConsentPreferences | null>(() => {
    const stored = StorageService.get<ConsentPreferences>(StorageKeys.CONSENT_PREFERENCES);
    return validateConsentPreferences(stored);
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Has user made a consent decision?
  const hasConsent = useMemo(() => preferences !== null, [preferences]);

  // Listen for cross-tab storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === StorageKeys.CONSENT_PREFERENCES) {
        const newValue = e.newValue ? JSON.parse(e.newValue) : null;
        const validated = validateConsentPreferences(newValue);
        setPreferencesState(validated);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    const newPrefs: ConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    StorageService.set(StorageKeys.CONSENT_PREFERENCES, newPrefs);
    setPreferencesState(newPrefs);
    setIsModalOpen(false);
  }, []);

  // Reject non-essential cookies
  const rejectAll = useCallback(() => {
    const newPrefs: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    StorageService.set(StorageKeys.CONSENT_PREFERENCES, newPrefs);
    setPreferencesState(newPrefs);
    setIsModalOpen(false);
  }, []);

  // Set custom preferences
  const setPreferences = useCallback((prefs: Partial<Omit<ConsentPreferences, 'essential' | 'version'>>) => {
    const newPrefs: ConsentPreferences = {
      essential: true,
      analytics: prefs.analytics ?? preferences?.analytics ?? false,
      marketing: prefs.marketing ?? preferences?.marketing ?? false,
      timestamp: prefs.timestamp ?? new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    StorageService.set(StorageKeys.CONSENT_PREFERENCES, newPrefs);
    setPreferencesState(newPrefs);
    setIsModalOpen(false);
  }, [preferences]);

  // Modal controls
  const openPreferencesModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closePreferencesModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    preferences,
    hasConsent,
    acceptAll,
    rejectAll,
    setPreferences,
    openPreferencesModal,
    closePreferencesModal,
    isModalOpen,
  }), [preferences, hasConsent, acceptAll, rejectAll, setPreferences, openPreferencesModal, closePreferencesModal, isModalOpen]);

  return (
    <ConsentContext.Provider value={contextValue}>
      {children}
    </ConsentContext.Provider>
  );
}

/**
 * useConsent hook
 * Access consent preferences and controls
 */
export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within ConsentProvider");
  }
  return context;
}
