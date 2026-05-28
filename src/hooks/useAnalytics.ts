import { useCallback } from "react";
import api from "../lib/api";
import { useConsent } from "../contexts/ConsentContext";

/**
 * Generates a cryptographically secure session ID
 * Fixed: LOW-F2 - Weak analytics session ID generation (replaced Math.random())
 */
function generateSecureSessionId(): string {
  // Use crypto.getRandomValues for cryptographically secure random values
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);

  // Convert to hex string
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateSecureSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

export function useAnalytics() {
  const { preferences } = useConsent();

  const track = useCallback(async (
    eventType: string,
    entityId?: string,
    metadata?: Record<string, any>
  ) => {
    // GDPR/POPIA Compliance: Check consent before tracking
    if (!preferences?.analytics) {
      console.log('[Analytics] Tracking skipped - no user consent:', eventType);
      return;
    }

    try {
      await api.post('/analytics/track', {
        eventType,
        entityId,
        metadata,
        sessionId: getSessionId(),
      });
    } catch (error) {
      console.warn("Analytics tracking failed:", error);
    }
  }, [preferences]);

  return { track };
}

export function useAffiliateTracking() {
  const trackClick = useCallback(async (productId: string) => {
    try {
      const response = await api.post('/analytics/affiliate-click', {
        productId,
      });

      if (response.data?.redirectUrl) {
        window.open(response.data.redirectUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.warn("Affiliate tracking failed:", error);
    }
  }, []);

  return { trackClick };
}
