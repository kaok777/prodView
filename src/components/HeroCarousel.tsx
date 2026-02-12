import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "./ProductImage";
import api from "../lib/api";

export function HeroCarousel() {
  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    const fetchHeroProducts = async () => {
      try {
        setLoading(true);
        const [categoriesRes, productsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products/latest', {
            params: { page: 1, pageSize: 50 }
          }),
        ]);

        const categories = categoriesRes.data;
        const allProducts = productsRes.data.products || [];

        // Select one product per category, up to 7
        const heroProducts: any[] = [];
        const usedCategories = new Set<string>();

        for (const product of allProducts) {
          if (heroProducts.length >= 7) break;

          // Get first category of this product
          const productCategory = product.categories?.[0]?.category || product.categories?.[0];
          if (!productCategory) continue;

          const categoryId = productCategory.id;

          // Only add if we haven't used this category yet and product has at least one image
          if (!usedCategories.has(categoryId) && product.images && product.images.length > 0) {
            heroProducts.push(product);
            usedCategories.add(categoryId);
          }
        }

        // If we have fewer than 7 products, fill with remaining products
        if (heroProducts.length < 7) {
          for (const product of allProducts) {
            if (heroProducts.length >= 7) break;
            if (!heroProducts.find(p => p.id === product.id) && product.images && product.images.length > 0) {
              heroProducts.push(product);
            }
          }
        }

        setProducts(heroProducts);
      } catch (error) {
        console.error('Failed to fetch hero products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroProducts();
  }, []);

  useEffect(() => {
    if (!autoPlay || products.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
    }, 7000);

    return () => clearInterval(interval);
  }, [autoPlay, products.length]);

  const nextProduct = () => {
    setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 15000); // Resume auto-play after 15s
  };

  const prevProduct = () => {
    setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 15000);
  };

  if (loading) {
    return (
      <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  const currentProduct = products[currentIndex];

  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg overflow-hidden group">
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentProduct.images && currentProduct.images[0] && (
          <ProductImage
            imagePath={currentProduct.images[0]}
            alt={currentProduct.name}
            className="w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-8">
          <div className="max-w-2xl">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm font-semibold rounded-full">
                Featured Product
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 line-clamp-2">
              {currentProduct.name}
            </h2>
            <p className="text-lg text-muted-foreground mb-6 line-clamp-3">
              {currentProduct.description}
            </p>
            <Link
              to={`/products/${currentProduct.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              View Product
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {products.length > 1 && (
        <>
          <button
            onClick={prevProduct}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 z-20"
            aria-label="Previous product"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextProduct}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 z-20"
            aria-label="Next product"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {products.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setAutoPlay(false);
                setTimeout(() => setAutoPlay(true), 15000);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-primary"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to product ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
