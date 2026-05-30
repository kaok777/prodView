import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { ProductImage } from "./ProductImage";
import type { Product, ProductWithRelations } from "../types";

interface ProductCardProps {
  product: Product | ProductWithRelations;
  view?: "grid" | "list";
}

export function ProductCard({ product, view = "grid" }: ProductCardProps) {
  if (view === "list") {
    return (
      <div className="bg-card rounded-lg border p-3 md:p-4 hover:shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="w-full sm:w-24 sm:h-24 aspect-video sm:aspect-square bg-muted rounded-lg flex-shrink-0 overflow-hidden">
            {product.images && product.images[0] && (
              <ProductImage
                imagePath={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                imageSource={product.imageSource}
                ogImageUrl={product.ogImageUrl}
              />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <Link
              to={`/products/${product.id}`}
              className="text-base md:text-lg font-semibold hover:text-primary transition-all duration-150 ease-out line-clamp-2"
            >
              {product.name}
            </Link>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">
              {product.description}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Link
                to={`/products/${product.id}`}
                className="px-3 py-1.5 md:py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 hover:shadow-sm transition-all duration-150 ease-out"
              >
                View Details
              </Link>
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 md:py-2 border border-border rounded-md text-sm hover:bg-accent hover:shadow-sm transition-all duration-150 ease-out flex items-center gap-1"
              >
                <span className="hidden sm:inline">Visit Site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden hover:shadow-md transition-all duration-200 ease-in-out hover:-translate-y-1 flex flex-col h-full">
      <div className="aspect-video bg-muted overflow-hidden flex-shrink-0">
        {product.images && product.images[0] && (
          <ProductImage
            imagePath={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            imageSource={product.imageSource}
            ogImageUrl={product.ogImageUrl}
          />
        )}
      </div>
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <Link
          to={`/products/${product.id}`}
          className="text-base md:text-lg font-semibold hover:text-primary transition-all duration-150 ease-out line-clamp-2 min-h-[2.5rem] md:min-h-[3rem]"
        >
          {product.name}
        </Link>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">
          {product.description}
        </p>
        <div className="flex items-center gap-2 mt-4 pt-2">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm text-center font-medium hover:bg-primary/90 hover:shadow-sm transition-all duration-150 ease-out min-h-[40px] flex items-center justify-center"
          >
            View Details
          </Link>
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 border border-border rounded-md text-sm hover:bg-accent hover:shadow-sm transition-all duration-150 ease-out min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Visit product site"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
