import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ProductImage } from "./ProductImage";
import api from "../lib/api";
import { useSidebarVisibility } from "../hooks/useSidebarVisibility";
import { SidebarToggle } from "./SidebarToggle";
import { ErrorService } from "../services/ErrorService";
import type { Product } from "../types";

export function RightSidebar() {
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { isCollapsed, setIsCollapsed, isFirstVisit } = useSidebarVisibility({
    breakpoint: 1280,
    storageKey: "right-sidebar-visited",
  });

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products/latest', {
          params: { page: 1, pageSize: 10 }
        });
        setLatestProducts(response.data.products || []);
      } catch (error) {
        console.error('Failed to fetch latest products:', error);
        ErrorService.handleApiError(
          error,
          {
            componentName: 'RightSidebar',
            action: 'fetch_latest_products',
          },
          'Failed to load latest products. Please refresh the page.'
        );
        setLatestProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  return (
    <aside
      className={`hidden xl:block sticky top-16 bg-card border-l h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out ${
        isCollapsed ? 'xl:w-0' : 'w-80'
      }`}
      aria-label="Latest products sidebar"
    >
      <SidebarToggle
        isCollapsed={isCollapsed}
        onClick={() => setIsCollapsed(!isCollapsed)}
        position="right"
        label={isCollapsed ? "Expand latest products" : "Collapse latest products"}
        showFirstVisitPulse={isFirstVisit && isCollapsed}
      />

      <div
        className={`h-full overflow-y-auto custom-scrollbar p-4 space-y-4 ${
          isCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'
        } transition-opacity duration-300`}
      >
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
