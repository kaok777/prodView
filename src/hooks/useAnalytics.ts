import { useCallback } from "react";
import api from "../lib/api";

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(7);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

export function useAnalytics() {
  const track = useCallback(async (
    eventType: string,
    entityId?: string,
    metadata?: Record<string, any>
  ) => {
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
  }, []);

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
