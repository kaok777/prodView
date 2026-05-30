import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { ProductImage } from "../components/ProductImage";
import { FilterTag } from "../components/FilterTag";
import { SEOHead } from "../components/SEOHead";
import { useAnalytics, useAffiliateTracking } from "../hooks/useAnalytics";
import { useCarousel } from "../hooks/useCarousel";
import { generateProductStructuredData, generateBreadcrumbStructuredData } from "../utils/seo";
import { ErrorService } from "../services/ErrorService";
import api, { BACKEND_BASE_URL } from "../lib/api";
import type { ProductWithRelations, Product } from "../types";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductWithRelations | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { track } = useAnalytics();
  const { trackClick} = useAffiliateTracking();

  // Use carousel hook for image navigation
  const images = product?.images || [];
  const { currentIndex: currentMediaIndex, next: nextImage, prev: prevImage, goTo: setCurrentMediaIndex } = useCarousel({
    itemCount: images.length,
    loop: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Use Promise.allSettled to handle failures independently
        // This allows showing the product even if related products fail
        const results = await Promise.allSettled([
          api.get(`/products/${id}`),
          api.get('/products/latest', {
            params: { page: 1, pageSize: 5 }
          }),
        ]);

        // Handle product result
        if (results[0].status === 'fulfilled') {
          setProduct(results[0].value.data);
        } else {
          // Product fetch failed - this is critical
          console.error('Failed to fetch product:', results[0].reason);
          ErrorService.handleApiError(
            results[0].reason,
            {
              componentName: 'ProductDetailPage',
              action: 'fetch_product',
              metadata: { productId: id },
            },
            'Failed to load product details. Please try again.'
          );
          setProduct(null);
        }

        // Handle related products result (non-critical)
        if (results[1].status === 'fulfilled') {
          setRelatedProducts(results[1].value.data.products || []);
        } else {
          // Related products failed - log but don't show error to user
          console.warn('Failed to fetch related products:', results[1].reason);
          ErrorService.logError(
            results[1].reason,
            {
              componentName: 'ProductDetailPage',
              action: 'fetch_related_products',
            }
          );
          setRelatedProducts([]);
        }
      } catch (error) {
        // Unexpected error outside of API calls
        console.error('Unexpected error in fetchData:', error);
        ErrorService.handleApiError(
          error,
          {
            componentName: 'ProductDetailPage',
            action: 'fetch_data',
          }
        );
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Track product view only once per product ID (F2.1.1: prevent double-counting on re-renders)
  const trackedProductId = useRef<string | null>(null);

  useEffect(() => {
    if (product && product.id !== trackedProductId.current) {
      track("product_view", product.id);
      trackedProductId.current = product.id;
    }
  }, [product?.id, track]); // Depend on product.id, not entire product object

  const handleAffiliateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product) {
      // Pass fallbackUrl to ensure window opens even if tracking API is slow (F2.1.2)
      trackClick(product.id, product.affiliateUrl);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-video bg-muted rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-10 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <>
        <SEOHead
          title="Product Not Found"
          description="The product you're looking for doesn't exist or has been removed."
        />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/products"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </>
    );
  }

  const imageUrl = product.images && product.images[0]
    ? `${BACKEND_BASE_URL}${product.images[0]}`
    : undefined;

  // Generate complete structured data including product and breadcrumbs
  // Fixed: LOW-F5 - Complete structured data
  const productStructuredData = generateProductStructuredData(product, imageUrl);
  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    { name: product.name, url: `/products/${product.id}` }
  ]);

  return (
    <>
      <SEOHead
        title={`${product.name} - Product Details`}
        description={`${product.description} Affiliate link available. We may earn a commission at no cost to you.`}
        canonicalUrl={window.location.href}
        structuredData={[productStructuredData, breadcrumbStructuredData]}
        image={imageUrl}
        type="product"
      />

      <div className="space-y-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground">Products</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 md:items-center">
          <div className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {images.length > 0 && (
                <>
                  <ProductImage
                    imagePath={images[currentMediaIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((imagePath: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      index === currentMediaIndex ? "border-primary" : "border-transparent"
                    }`}
                    aria-label={`View image ${index + 1}`}
                    aria-pressed={Boolean(index === currentMediaIndex)}
                  >
                    <ProductImage
                      imagePath={imagePath}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              {/* Category and Use Case Tags */}
              {(product.categories?.length > 0 || product.useCases?.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.categories?.map((categoryItem) => {
                    const category = categoryItem.category || categoryItem;
                    return (
                      <FilterTag
                        key={category.id}
                        label={category.name}
                        filterType="category"
                        filterId={category.id}
                      />
                    );
                  })}
                  {product.useCases?.map((useCaseItem) => {
                    const useCase = useCaseItem.useCase || useCaseItem;
                    return (
                      <FilterTag
                        key={useCase.id}
                        label={useCase.name}
                        filterType="useCase"
                        filterId={useCase.id}
                      />
                    );
                  })}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAffiliateClick}
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Visit Product Site <ExternalLink className="w-5 h-5" />
              </button>
              <p className="text-xs text-muted-foreground text-center">
                This is an affiliate link. We may earn a commission at no cost to you.
              </p>
            </div>
          </div>
        </div>

        {relatedProducts && relatedProducts.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts
                .filter(p => p.id !== product.id)
                .slice(0, 4)
                .map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
