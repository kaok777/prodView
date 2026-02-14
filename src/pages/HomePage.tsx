import { Link } from "react-router-dom";
import { SEOHead } from "../components/SEOHead";
import { HeroCarousel } from "../components/HeroCarousel";
import { ArrowRight } from "lucide-react";

export function HomePage() {

  return (
    <>
      <SEOHead
        title="ProdView - Discover Amazing Products"
        description="Find the perfect products for your needs. Browse by category, use case, or search for something specific. Affiliate disclosure: We may earn commissions from purchases."
        canonicalUrl={window.location.origin}
      />

      <div className="space-y-0">
        {/* Hero Carousel */}
        <section>
          <HeroCarousel />
        </section>

        {/* Hero Section */}
        <section className="text-center py-6">
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover the perfect products for your needs. Browse by category, use case, or search for something specific.
          </p>
          <Link
            to="/products"
            className="font-semibold inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-lg hover:bg-primary/90 transition-colors"
          >
            Browse Products <ArrowRight className="w-5 h-5" />
          </Link>
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
