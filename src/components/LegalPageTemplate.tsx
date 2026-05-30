import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface LegalPageTemplateProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
  showPlaceholderWarning?: boolean;
}

/**
 * LegalPageTemplate
 * Reusable template for all legal pages
 * Provides consistent structure, placeholder warning, and styling
 */
export function LegalPageTemplate({
  title,
  lastUpdated,
  children,
  showPlaceholderWarning = true,
}: LegalPageTemplateProps) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Last Updated: {lastUpdated}
        </p>
      </header>

      {/* Placeholder Warning */}
      {showPlaceholderWarning && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Important Legal Notice
              </h2>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                <p>
                  This document contains <strong>PLACEHOLDER CONTENT</strong> for legal compliance purposes.
                </p>
                <p>
                  This is a <strong>TEMPLATE</strong> that must be reviewed and customized by a qualified attorney
                  before being considered legally binding or accurate for your specific situation.
                </p>
                <p className="font-semibold">
                  DO NOT rely on this content without proper legal review.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        {children}
      </div>

      {/* Contact Footer */}
      <footer className="mt-12 pt-8 border-t">
        <h3 className="font-semibold mb-2 text-foreground">Questions?</h3>
        <p className="text-muted-foreground text-sm">
          Contact us at:{" "}
          <a
            href="mailto:privacy@prodview.example.com"
            className="text-primary hover:underline"
          >
            privacy@prodview.example.com
          </a>
        </p>
      </footer>
    </div>
  );
}
