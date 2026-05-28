import { Link } from "react-router-dom";
import { useConsent } from "../contexts/ConsentContext";
import { Cookie } from "lucide-react";

/**
 * CookieBanner
 * Displays consent banner on first visit
 * GDPR/POPIA compliant cookie consent interface
 */
export function CookieBanner() {
  const { hasConsent, acceptAll, rejectAll, openPreferencesModal } = useConsent();

  // Don't show banner if user has already made a decision
  if (hasConsent) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t shadow-lg animate-in slide-in-from-bottom duration-300"
      role="region"
      aria-label="Cookie consent"
    >
      <div className="container mx-auto px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
              <h2 className="text-lg font-semibold">This site uses cookies</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use essential cookies to make our site work. We'd also like to set analytics
              cookies to help us improve your experience. You can customize your preferences at any time.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={openPreferencesModal}
              className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors"
              aria-label="Customize cookie preferences"
            >
              Customize
            </button>
            <button
              onClick={rejectAll}
              className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors"
              aria-label="Reject non-essential cookies"
            >
              Reject Non-Essential
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              aria-label="Accept all cookies"
            >
              Accept All
            </button>
          </div>
        </div>

        {/* Fine print */}
        <p className="mt-4 text-xs text-muted-foreground">
          By continuing to use this site, you accept our{" "}
          <Link to="/privacy-policy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          {" "}and{" "}
          <Link to="/cookie-policy" className="text-primary hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
