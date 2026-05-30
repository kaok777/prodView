import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useConsent } from "../contexts/ConsentContext";
import { X } from "lucide-react";

/**
 * CookiePreferencesModal
 * Allows users to customize cookie preferences
 * Accessible via "Customize" button or footer "Cookie Settings" link
 */
export function CookiePreferencesModal() {
  const {
    preferences,
    isModalOpen,
    closePreferencesModal,
    setPreferences,
    acceptAll,
  } = useConsent();

  // Local state for toggles (synced with preferences)
  const [analytics, setAnalytics] = useState(preferences?.analytics ?? false);
  const [marketing, setMarketing] = useState(preferences?.marketing ?? false);

  // Sync local state when preferences change or modal opens
  useEffect(() => {
    if (isModalOpen) {
      setAnalytics(preferences?.analytics ?? false);
      setMarketing(preferences?.marketing ?? false);
    }
  }, [isModalOpen, preferences]);

  // Close on ESC key
  useEffect(() => {
    if (!isModalOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePreferencesModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, closePreferencesModal]);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const handleSave = () => {
    setPreferences({ analytics, marketing });
  };

  if (!isModalOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closePreferencesModal}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-card border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
          <h2 id="cookie-modal-title" className="text-xl font-semibold">
            Cookie Preferences
          </h2>
          <button
            onClick={closePreferencesModal}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            Manage your cookie preferences below. You can change these settings at any time.
          </p>

          {/* Essential Cookies */}
          <div className="space-y-2">
            <label className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 cursor-not-allowed">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Essential Cookies</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Always Active
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Required for the site to function properly. These cannot be disabled.
                </p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="ml-4 w-5 h-5"
                aria-label="Essential cookies (always active)"
              />
            </label>
          </div>

          {/* Analytics Cookies */}
          <div className="space-y-2">
            <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex-1">
                <h3 className="font-medium">Analytics Cookies</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Help us understand how you use the site so we can improve your experience.
                </p>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="ml-4 w-5 h-5 cursor-pointer"
                aria-label="Analytics cookies"
              />
            </label>
          </div>

          {/* Marketing Cookies */}
          <div className="space-y-2">
            <label className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 cursor-not-allowed opacity-60">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Marketing Cookies</h3>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Used to deliver personalized content and advertising. Not currently in use.
                </p>
              </div>
              <input
                type="checkbox"
                checked={marketing}
                disabled
                onChange={(e) => setMarketing(e.target.checked)}
                className="ml-4 w-5 h-5"
                aria-label="Marketing cookies (coming soon)"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <Link
            to="/cookie-policy"
            onClick={closePreferencesModal}
            className="text-sm text-primary hover:underline"
          >
            Learn More
          </Link>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Save Preferences
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
