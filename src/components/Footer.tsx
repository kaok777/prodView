import { Link } from "react-router-dom";
import { useConsent } from "../contexts/ConsentContext";

/**
 * Footer
 * Site-wide footer with legal navigation and branding
 */
export function Footer() {
  const { openPreferencesModal } = useConsent();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">ProdView</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover amazing products for your needs. Find the perfect match through our curated selection.
            </p>
          </div>

          {/* Column 2: Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/cookie-policy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <button
                  onClick={openPreferencesModal}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/affiliate-disclosure"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Affiliate Disclosure
                </Link>
              </li>
              <li>
                <Link
                  to="/disclaimer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link
                  to="/external-links"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  External Links Notice
                </Link>
              </li>
              <li>
                <Link
                  to="/popia"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  POPIA Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} ProdView. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
