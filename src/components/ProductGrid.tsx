import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProductCard } from "./ProductCard";
import { Grid, List, Loader2 } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { getClientInfo } from "../utils/security";

interface ProductGridProps {
  categoryId?: Id<"categories">;
  useCaseId?: Id<"useCases">;
  searchQuery?: string;
}

export function ProductGrid({ categoryId, useCaseId, searchQuery }: ProductGridProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [cursor, setCursor] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const clientInfo = getClientInfo();

  // Determine which query to use
  const searchResults = useQuery(
    api.products.searchProducts,
    searchQuery ? {
      keyword: searchQuery,
      paginationOpts: { numItems: 40, cursor },
      ip: clientInfo.ip
    } : "skip"
  );

  const categoryResults = useQuery(
    api.products.getProductsByCategory,
    categoryId && !searchQuery ? {
      categoryId,
      paginationOpts: { numItems: 40, cursor }
    } : "skip"
  );

  const useCaseResults = useQuery(
    api.products.getProductsByUseCase,
    useCaseId && !searchQuery ? {
      useCaseId,
      paginationOpts: { numItems: 40, cursor }
    } : "skip"
  );

  const latestResults = useQuery(
    api.products.getLatestProducts,
    !categoryId && !useCaseId && !searchQuery ? { limit: 40 } : "skip"
  );

  // Determine current results
  const results = searchResults || categoryResults || useCaseResults;
  const products = results?.page || latestResults || [];
  const hasMore = results?.isDone === false;
  const isLoading = results === undefined && latestResults === undefined;

  const handleLoadMore = () => {
    if (results?.continueCursor) {
      setCursor(results.continueCursor);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
        </div>
        <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {searchQuery ? `Search results for "${searchQuery}"` : 
           categoryId ? "Category Products" :
           useCaseId ? "Use Case Products" :
           "Latest Products"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg ${view === "grid" ? "bg-primary text-primary-foreground" : "bg-accent"}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-lg ${view === "list" ? "bg-primary text-primary-foreground" : "bg-accent"}`}
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
          <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {products.map((product: any) => (
              <ProductCard key={product._id} product={product} view={view} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
