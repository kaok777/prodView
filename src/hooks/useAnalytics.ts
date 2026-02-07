import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCallback } from "react";
import { getClientInfo } from "../utils/security";

export function useAnalytics() {
  const trackEvent = useMutation(api.analytics.trackEvent);

  const track = useCallback(async (
    eventType: string,
    entityId?: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const clientInfo = getClientInfo();
      
      await trackEvent({
        eventType,
        entityId,
        metadata,
        timestamp: Date.now(),
        ip: clientInfo.ip
      });
    } catch (error) {
      // Silently fail analytics to not break user experience
      console.warn("Analytics tracking failed:", error);
    }
  }, [trackEvent]);

  return { track };
}

export function useAffiliateTracking() {
  const trackAffiliateClick = useMutation(api.analytics.trackAffiliateClick);

  const trackClick = useCallback(async (productId: string) => {
    try {
      const clientInfo = getClientInfo();
      
      const result = await trackAffiliateClick({
        productId: productId as any,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent
      });
      
      if (result?.redirectUrl) {
        window.open(result.redirectUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.warn("Affiliate tracking failed:", error);
      // Still allow the click to proceed
    }
  }, [trackAffiliateClick]);

  return { trackClick };
}
