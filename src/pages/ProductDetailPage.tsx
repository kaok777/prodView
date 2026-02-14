import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { ProductImage } from "../components/ProductImage";
import { FilterTag } from "../components/FilterTag";
import { SEOHead } from "../components/SEOHead";
import { useAnalytics, useAffiliateTracking } from "../hooks/useAnalytics";
import { generateProductStructuredData } from "../utils/seo";
import api, { BACKEND_BASE_URL } from "../lib/api";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { track } = useAnalytics();
  const { trackClick} = useAffiliateTracking();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const [productRes, relatedRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/products/latest', {
            params: { page: 1, pageSize: 5 }
          }),
        ]);

        setProduct(productRes.data);
        setRelatedProducts(relatedRes.data.products || []);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (product) {
      track("product_view", product.id);
    }
  }, [product, track]);

  const handleAffiliateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product) {
      trackClick(product.id);
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

  const images = product?.images || [];

  const nextImage = () => {
    setCurrentMediaIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentMediaIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const imageUrl = product.images && product.images[0]
    ? `${BACKEND_BASE_URL}${product.images[0]}`
    : undefined;

  const structuredData = generateProductStructuredData(product, imageUrl);

  return (
    <>
      <SEOHead
        title={`${product.name} - Product Details`}
        description={`${product.description} Affiliate link available. We may earn a commission at no cost to you.`}
        canonicalUrl={window.location.href}
        structuredData={structuredData}
        image={imageUrl}
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
                  {product.categories?.map((categoryItem: any) => {
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
                  {product.useCases?.map((useCaseItem: any) => {
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
