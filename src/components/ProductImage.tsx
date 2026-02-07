import { API_BASE_URL } from "../lib/api";

interface ProductImageProps {
  imagePath: string;
  alt: string;
  className?: string;
}

export function ProductImage({ imagePath, alt, className = "" }: ProductImageProps) {
  if (!imagePath) {
    return <div className={`bg-muted ${className}`} />;
  }

  const imageUrl = `${API_BASE_URL}${imagePath}`;

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
      }}
    />
  );
}
