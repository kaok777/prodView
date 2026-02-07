import { useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProductGrid } from "../components/ProductGrid";
import { SEOHead } from "../components/SEOHead";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

export function ProductSelectionPage() {
  const [searchParams] = useSearchParams();
  const { track } = useAnalytics();
  
  const categoryId = searchParams.get("category") as Id<"categories"> | undefined;
  const useCaseId = searchParams.get("useCase") as Id<"useCases"> | undefined;
  const searchQuery = searchParams.get("search") || undefined;

  const category = useQuery(
    api.categories.getCategoryById,
    categoryId ? { categoryId } : "skip"
  );
  
  const useCase = useQuery(
    api.useCases.getUseCaseById,
    useCaseId ? { useCaseId } : "skip"
  );

  // Track page views and interactions
  useEffect(() => {
    if (categoryId) {
      track("category_click", categoryId);
    }
    if (useCaseId) {
      track("use_case_click", useCaseId);
    }
    if (searchQuery) {
      track("search", undefined, { query: searchQuery });
    }
  }, [categoryId, useCaseId, searchQuery, track]);

  // Generate SEO metadata
  const getTitle = () => {
    if (searchQuery) return `Search results for "${searchQuery}"`;
    if (category) return `${category.name} Products`;
    if (useCase) return `${useCase.name} Products`;
    return "All Products";
  };

  const getDescription = () => {
    if (searchQuery) {
      return `Find products matching "${searchQuery}". Browse our curated selection with affiliate links. We may earn commissions from purchases.`;
    }
    if (category) {
      return `Discover the best ${category.name.toLowerCase()} products. Curated selection with affiliate links. We may earn commissions from purchases.`;
    }
    if (useCase) {
      return `Find products perfect for ${useCase.name.toLowerCase()}. Curated selection with affiliate links. We may earn commissions from purchases.`;
    }
    return "Browse our complete product catalog. Curated selection with affiliate links. We may earn commissions from purchases.";
  };

  return (
    <>
      <SEOHead
        title={getTitle()}
        description={getDescription()}
        canonicalUrl={window.location.href}
      />
      
      <div>
        <ProductGrid 
          categoryId={categoryId}
          useCaseId={useCaseId}
          searchQuery={searchQuery}
        />
      </div>
    </>
  );
}
