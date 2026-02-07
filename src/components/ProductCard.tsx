import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { ProductImage } from "./ProductImage";

interface ProductCardProps {
  product: any;
  view?: "grid" | "list";
}

export function ProductCard({ product, view = "grid" }: ProductCardProps) {
  if (view === "list") {
    return (
      <div className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow">
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
            {product.images && product.images[0] && (
              <ProductImage
                imagePath={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/products/${product.id}`}
              className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
            >
              {product.name}
            </Link>
            <p className="text-muted-foreground mt-1 line-clamp-2">
              {product.description}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Link
                to={`/products/${product.id}`}
                className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
              >
                View Details
              </Link>
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 border border-border rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-1"
              >
                Visit Site <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-muted overflow-hidden">
        {product.images && product.images[0] && (
          <ProductImage
            imagePath={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <Link
          to={`/products/${product.id}`}
          className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2"
        >
          {product.name}
        </Link>
        <p className="text-muted-foreground mt-2 line-clamp-3">
          {product.description}
        </p>
        <div className="flex items-center gap-2 mt-4">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm text-center hover:bg-primary/90 transition-colors"
          >
            View Details
          </Link>
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
