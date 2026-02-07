import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ProductCard } from "../components/ProductCard";
import { SEOHead } from "../components/SEOHead";
import { ArrowRight } from "lucide-react";
import api from "../lib/api";

export function HomePage() {
  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [useCases, setUseCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, useCasesRes] = await Promise.all([
          api.get('/products/latest?limit=6'),
          api.get('/categories'),
          api.get('/use-cases'),
        ]);

        setLatestProducts(productsRes.data);
        setCategories(categoriesRes.data);
        setUseCases(useCasesRes.data);
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <SEOHead
        title="ProdView - Discover Amazing Products"
        description="Find the perfect products for your needs. Browse by category, use case, or search for something specific. Affiliate disclosure: We may earn commissions from purchases."
        canonicalUrl={window.location.origin}
      />

      <div className="space-y-12">
        {/* Hero Section */}
        <section className="text-center py-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Discover Amazing Products
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find the perfect products for your needs. Browse by category, use case, or search for something specific.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-lg hover:bg-primary/90 transition-colors"
          >
            Browse Products <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* Featured Categories */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories?.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="p-4 bg-card rounded-lg border hover:shadow-md transition-shadow text-center"
              >
                <h3 className="font-semibold">{category.name}</h3>
              </Link>
            ))}
          </div>
          {categories && categories.length > 8 && (
            <div className="text-center mt-6">
              <Link
                to="/products"
                className="text-primary hover:underline"
              >
                View all categories →
              </Link>
            </div>
          )}
        </section>

        {/* Featured Use Cases */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Popular Use Cases</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {useCases?.slice(0, 8).map((useCase) => (
              <Link
                key={useCase.id}
                to={`/products?useCase=${useCase.id}`}
                className="p-4 bg-card rounded-lg border hover:shadow-md transition-shadow text-center"
              >
                <h3 className="font-semibold">{useCase.name}</h3>
              </Link>
            ))}
          </div>
          {useCases && useCases.length > 8 && (
            <div className="text-center mt-6">
              <Link
                to="/products"
                className="text-primary hover:underline"
              >
                View all use cases →
              </Link>
            </div>
          )}
        </section>

        {/* Latest Products */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Latest Products</h2>
            <Link
              to="/products"
              className="text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Affiliate Disclosure */}
        <section className="bg-muted/50 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Affiliate Disclosure:</strong> Some links on this site are affiliate links.
            We may earn a commission if you make a purchase through these links, at no additional cost to you.
          </p>
        </section>
      </div>
    </>
  );
}
