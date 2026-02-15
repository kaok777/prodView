import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

/**
 * NotFoundPage Component
 * 404 page for invalid routes
 * Fixed: MEDIUM-F10 - No 404 Catch-All Route
 */

export function NotFoundPage() {
  return (
    <>
      <SEOHead
        title="Page Not Found - 404"
        description="The page you're looking for doesn't exist or has been moved."
      />

      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* 404 Visual */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary/20 select-none">
              404
            </h1>
          </div>

          {/* Message */}
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Oops! The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              <Search className="w-5 h-5" />
              Browse Products
            </Link>
          </div>

          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to previous page
          </button>
        </div>
      </div>
    </>
  );
}
