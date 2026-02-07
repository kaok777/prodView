import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { ProductImage } from "../components/ProductImage";
import { SEOHead } from "../components/SEOHead";
import { useAnalytics, useAffiliateTracking } from "../hooks/useAnalytics";
import { generateProductStructuredData } from "../utils/seo";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { track } = useAnalytics();
  const { trackClick } = useAffiliateTracking();
  
  const product = useQuery(api.products.getProductById, { 
    productId: id as any 
  });
  
  const relatedProducts = useQuery(api.products.getLatestProducts, { limit: 4 });
  
  const imageUrl = useQuery(
    api.products.getImageUrl,
    product?.images[0] ? { storageId: product.images[0] } : "skip"
  );

  // Track product view
  useEffect(() => {
    if (product) {
      track("product_view", product._id);
    }
  }, [product, track]);

  const handleAffiliateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product) {
      trackClick(product._id);
    }
  };

  if (product === undefined) {
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

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const structuredData = generateProductStructuredData(product, imageUrl || undefined);

  return (
    <>
      <SEOHead
        title={`${product.name} - Product Details`}
        description={`${product.description} Affiliate link available. We may earn a commission at no cost to you.`}
        canonicalUrl={window.location.href}
        structuredData={structuredData}
        image={imageUrl || undefined}
      />
      
      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground">Products</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              {product.images.length > 0 && (
                <>
                  <ProductImage
                    storageId={product.images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
            
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((imageId, index) => (
                  <button
                    key={imageId}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <ProductImage
                      storageId={imageId}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* CTA Button */}
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

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts
                .filter(p => p._id !== product._id)
                .slice(0, 4)
                .map((relatedProduct) => (
                  <ProductCard key={relatedProduct._id} product={relatedProduct} />
                ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
