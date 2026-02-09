import { BACKEND_BASE_URL } from "../lib/api";

interface ProductImageProps {
  imagePath: string;
  alt: string;
  className?: string;
}

/**
 * ProductImage Component
 *
 * Renders product images with proper URL construction and fallback handling.
 *
 * Contract:
 * - imagePath: Expected to start with "/" (e.g., "/uploads/uuid.png")
 * - Full URL: BACKEND_BASE_URL + imagePath (e.g., "http://localhost:3000/uploads/uuid.png")
 * - Fallback: Renders a muted div if imagePath is empty/null
 * - Error handling: Shows SVG placeholder on load error
 */
export function ProductImage({ imagePath, alt, className = "" }: ProductImageProps) {
  if (!imagePath) {
    return (
      <div
        className={`bg-muted flex items-center justify-center ${className}`}
        aria-label="No image available"
      >
        <svg
          className="w-12 h-12 text-muted-foreground opacity-20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const imageUrl = `${BACKEND_BASE_URL}${imagePath}`;

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite loop
        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="12"%3EImage Error%3C/text%3E%3C/svg%3E';
      }}
    />
  );
}
