import { useState, useEffect } from "react";
import { ProductCard } from "./ProductCard";
import { Grid, List, Loader2 } from "lucide-react";
import api from "../lib/api";

interface ProductGridProps {
  categoryId?: string | null;
  useCaseId?: string | null;
  searchQuery?: string;
}

export function ProductGrid({ categoryId, useCaseId, searchQuery }: ProductGridProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setPage(1);
        let response;

        if (searchQuery) {
          response = await api.get('/products/search', {
            params: { keyword: searchQuery, page: 1, pageSize: 40 }
          });
        } else if (categoryId) {
          response = await api.get(`/products/category/${categoryId}`, {
            params: { page: 1, pageSize: 40 }
          });
        } else if (useCaseId) {
          response = await api.get(`/products/use-case/${useCaseId}`, {
            params: { page: 1, pageSize: 40 }
          });
        } else {
          response = await api.get('/products/latest', {
            params: { limit: 40 }
          });
        }

        if (Array.isArray(response.data)) {
          setProducts(response.data);
          setTotalPages(1);
        } else {
          setProducts(response.data.products || []);
          setTotalPages(response.data.totalPages || 1);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, useCaseId, searchQuery]);

  const handleLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      let response;

      if (searchQuery) {
        response = await api.get('/products/search', {
          params: { keyword: searchQuery, page: nextPage, pageSize: 40 }
        });
      } else if (categoryId) {
        response = await api.get(`/products/category/${categoryId}`, {
          params: { page: nextPage, pageSize: 40 }
        });
      } else if (useCaseId) {
        response = await api.get(`/products/use-case/${useCaseId}`, {
          params: { page: nextPage, pageSize: 40 }
        });
      }

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
