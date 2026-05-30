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
  const trackClick = useCallback(async (productId: string, fallbackUrl?: string) => {
    try {
      // F2.1.2: Race API call against 2-second timeout to prevent lost clicks
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn('[Analytics] Affiliate tracking timeout (>2s) - opening window without waiting');
          resolve(null);
        }, 2000);
      });

      const apiPromise = api.post('/analytics/affiliate-click', {
        productId,
      });

      // Wait for whichever completes first: API response or 2-second timeout
      const response = await Promise.race([apiPromise, timeoutPromise]);

      if (response && response.data?.redirectUrl) {
        // API succeeded within timeout - open URL from response (validated URL from backend)
        window.open(response.data.redirectUrl, '_blank', 'noopener,noreferrer');
      } else if (!response && fallbackUrl) {
        // Timeout occurred - open fallback URL to ensure user can proceed
        console.warn('[Analytics] Opening affiliate link with fallback URL due to timeout');
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      } else if (!response) {
        console.error('[Analytics] Tracking timeout and no fallback URL provided');
      }

      // If timeout won, continue tracking in background (fire-and-forget)
      if (!response) {
        apiPromise.catch(error => {
          console.warn('[Analytics] Background affiliate tracking failed:', error);
        });
      }
    } catch (error) {
      console.warn('[Analytics] Affiliate tracking failed:', error);
      // On error, use fallback URL if available to ensure user can proceed
      if (fallbackUrl) {
        console.warn('[Analytics] Opening affiliate link with fallback URL due to error');
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }, []);

  return { trackClick };
}
