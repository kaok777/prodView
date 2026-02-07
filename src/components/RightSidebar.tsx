import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ProductImage } from "./ProductImage";
import api from "../lib/api";

export function RightSidebar() {
  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products/latest', {
          params: { limit: 10 }
        });
        setLatestProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch latest products:', error);
        setLatestProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  return (
    <aside className="w-80 bg-card border-l min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Latest Products</h3>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {latestProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="block group"
              >
                <div className="bg-background rounded-lg p-3 border hover:shadow-md transition-shadow">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                      {product.images && product.images[0] && (
                        <ProductImage
                          imagePath={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
