import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ProductImageProps {
  storageId: Id<"_storage">;
  alt: string;
  className?: string;
}

export function ProductImage({ storageId, alt, className = "" }: ProductImageProps) {
  const imageUrl = useQuery(api.products.getImageUrl, { storageId });

  if (!imageUrl) {
    return <div className={`bg-muted animate-pulse ${className}`} />;
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
