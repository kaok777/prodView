import { useSearchParams } from "react-router-dom";
import { ProductGrid } from "../components/ProductGrid";
import { SEOHead } from "../components/SEOHead";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEffect, useState } from "react";
import api from "../lib/api";
import type { Category, UseCase } from "../types";

export function ProductSelectionPage() {
  const [searchParams] = useSearchParams();
  const { track } = useAnalytics();
  const [category, setCategory] = useState<Category | null>(null);
  const [useCase, setUseCase] = useState<UseCase | null>(null);

  const categoryId = searchParams.get("category");
  const useCaseId = searchParams.get("useCase");
  const searchQuery = searchParams.get("search") || undefined;

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        if (categoryId) {
          const response = await api.get(`/categories/${categoryId}`);
          setCategory(response.data);
        } else {
          setCategory(null);
        }

        if (useCaseId) {
          const response = await api.get(`/use-cases/${useCaseId}`);
          setUseCase(response.data);
        } else {
          setUseCase(null);
        }
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      }
    };

    fetchMetadata();
  }, [categoryId, useCaseId]);

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
