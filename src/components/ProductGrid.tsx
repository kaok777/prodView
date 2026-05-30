import { useState, useEffect } from "react";
import { ProductCard } from "./ProductCard";
import { Grid, List, Loader2, ChevronDown } from "lucide-react";
import api from "../lib/api";
import { ProductQueryBuilder } from "../services/ProductQueryBuilder";
import type { Product } from "../types";

interface ProductGridProps {
  categoryId?: string | null;
  useCaseId?: string | null;
  searchQuery?: string;
}

type SortOption = "latest" | "mostViewed";

export function ProductGrid({ categoryId, useCaseId, searchQuery }: ProductGridProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setPage(1);

        // Use ProductQueryBuilder to eliminate duplication
        const query = ProductQueryBuilder.buildQuery({
          searchQuery,
          categoryId,
          useCaseId,
          sortBy,
          page: 1,
          pageSize: 40,
        });

        const response = await api.get(query.endpoint, { params: query.params });

        setProducts(response.data.products || []);
        setTotalPages(response.data.totalPages || 1);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, useCaseId, searchQuery, sortBy]);

  const handleLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;

      // Use ProductQueryBuilder to eliminate duplication
      const query = ProductQueryBuilder.buildQuery({
        searchQuery,
        categoryId,
        useCaseId,
        sortBy,
        page: nextPage,
        pageSize: 40,
      });

      const response = await api.get(query.endpoint, { params: query.params });

      if (response && response.data.products) {
        setProducts(prev => [...prev, ...response.data.products]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
        </div>
        <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" : "space-y-4"}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className={view === "grid" ? "aspect-video bg-muted rounded-lg mb-4" : "h-24 bg-muted rounded-lg mb-2"}></div>
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl font-bold">
          {ProductQueryBuilder.getQueryTitle({ searchQuery, categoryId, useCaseId })}
        </h2>
        <div className="flex items-center gap-2">
          {/* Sort Filter - show for category or use case filter */}
          {ProductQueryBuilder.shouldShowSort({ searchQuery, categoryId, useCaseId }) && (
            <div className="relative">
              <label htmlFor="sort-select" className="sr-only">
                Sort products by
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none px-3 md:px-4 py-2 pr-8 md:pr-10 text-sm rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Sort products by"
              >
                <option value="latest">Latest</option>
                <option value="mostViewed">Most Viewed</option>
              </select>
              <ChevronDown className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          )}
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}
            aria-label="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"}`}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found.</p>
        </div>
      ) : (
        <>
          <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" : "space-y-4"}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} view={view} />
            ))}
          </div>

          {page < totalPages && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
