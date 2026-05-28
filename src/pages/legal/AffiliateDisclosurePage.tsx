import { SEOHead } from "../../components/SEOHead";
import { LegalPageTemplate } from "../../components/LegalPageTemplate";

export function AffiliateDisclosurePage() {
  return (
    <>
      <SEOHead
        title="Affiliate Disclosure"
        description="ProdView participates in affiliate marketing programs and may earn commissions from product purchases. Learn about our affiliate relationships and FTC compliance."
        canonicalUrl={`${window.location.origin}/affiliate-disclosure`}
      />

      <LegalPageTemplate title="Affiliate Disclosure" lastUpdated="2026-05-28">
        <section className="space-y-6">
          <p className="lead">
            In compliance with FTC guidelines, we disclose that ProdView participates in affiliate marketing
            programs and may earn commissions from qualifying purchases made through links on our website.
          </p>

          <h2>1. Material Connection</h2>
          <p>
            ProdView has a <strong>material connection</strong> with some of the products and vendors featured
            on this website. This means we may receive compensation when you click on certain links and make
            purchases.
          </p>
          <p>
            We want to be transparent about this relationship so you can make informed decisions.
          </p>

          <h2>2. How Affiliate Marketing Works</h2>
          <p>When you interact with affiliate content on ProdView:</p>
          <ol>
            <li>You click a product link or "Visit Product Site" button</li>
            <li>You are redirected to the vendor's website (an external site)</li>
            <li>If you make a purchase, the vendor may pay us a commission</li>
            <li>You pay the same price - <strong>no additional cost to you</strong></li>
          </ol>
          <p>
            These commissions help us maintain and improve ProdView, providing you with free access to product
            discovery and comparison tools.
          </p>

          <h2>3. No Additional Cost</h2>
          <p>
            <strong>Important:</strong> Affiliate commissions do NOT increase the price you pay for products.
            The price you see on the vendor's website is the same whether you arrive via ProdView or directly.
          </p>
          <p>
            Our compensation comes from the vendor's marketing budget, not your pocket.
          </p>

          <h2>4. Honest and Unbiased Information</h2>
          <p>
            While we earn commissions through affiliate links, we are committed to:
          </p>
          <ul>
            <li><strong>Honest reviews:</strong> We provide accurate product information</li>
            <li><strong>Transparent disclosure:</strong> We clearly mark affiliate relationships</li>
            <li><strong>User-first approach:</strong> Our goal is to help you find the best products</li>
            <li><strong>Editorial independence:</strong> Affiliate relationships do not dictate our content</li>
          </ul>
          <p>
            Our recommendations are based on product quality, features, and value - not just commission rates.
          </p>

          <h2>5. Products Covered</h2>
          <p>
            Unless explicitly stated otherwise, you should assume that <strong>all product links on ProdView
            are affiliate links</strong> and we may earn a commission if you make a purchase.
          </p>
          <p>
            We showcase a variety of products across multiple categories. Our affiliate partnerships may vary
            by vendor and product type.
          </p>

          <h2>6. How to Identify Affiliate Links</h2>
          <p>
            We make it easy to identify affiliate content:
          </p>
          <ul>
            <li><strong>Product detail pages:</strong> Display "This is an affiliate link" notice near purchase buttons</li>
            <li><strong>Homepage:</strong> Includes general affiliate disclosure statement</li>
            <li><strong>Footer:</strong> Link to this Affiliate Disclosure page on every page</li>
          </ul>
          <p>
            When you click a product link or "Visit Product Site" button, you can assume it's an affiliate link.
          </p>

          <h2>7. External Vendor Responsibility</h2>
          <p>
            Once you leave ProdView and land on a vendor's website:
          </p>
          <ul>
            <li>You are subject to that vendor's terms, policies, and practices</li>
            <li>ProdView is not responsible for product quality, shipping, or customer service</li>
            <li>All purchase transactions occur between you and the vendor</li>
            <li>Product availability, pricing, and specifications are controlled by the vendor</li>
          </ul>
          <p>
            Please review the vendor's policies before making a purchase. See our{" "}
            <a href="/external-links" className="text-primary hover:underline">External Links Notice</a> for more details.
          </p>

          <h2>8. No Guarantees</h2>
          <p>
            While we strive to feature quality products, we make no guarantees or warranties about:
          </p>
          <ul>
            <li>Product performance or suitability for your needs</li>
            <li>Vendor reliability or customer service quality</li>
            <li>Product availability or pricing accuracy</li>
            <li>Delivery times or shipping costs</li>
          </ul>
          <p>
            We encourage you to research products, read vendor reviews, and make informed decisions.
          </p>

          <h2>9. Your Purchase Decision</h2>
          <p>
            <strong>You should always exercise your own judgment</strong> when making purchase decisions.
            Our product information is for informational purposes only and should not be considered professional
            advice.
          </p>
          <p>
            Consider your specific needs, budget, and preferences before purchasing any product.
          </p>

          <h2>10. FTC Compliance</h2>
          <p>
            This disclosure complies with the Federal Trade Commission's{" "}
            <a
              href="https://www.ftc.gov/legal-library/browse/rules/guides-concerning-use-endorsements-testimonials-advertising"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              16 CFR Part 255: "Guides Concerning the Use of Endorsements and Testimonials in Advertising"
            </a>.
          </p>

          <h2>11. Changes to Affiliate Relationships</h2>
          <p>
            Our affiliate partnerships may change over time. We may add or remove vendors, adjust commission
            structures, or modify our affiliate strategy. This disclosure will be updated accordingly.
          </p>

          <h2>12. Questions About Affiliate Links</h2>
          <p>
            If you have questions about our affiliate relationships or this disclosure, please contact us at:{" "}
            <a href="mailto:affiliates@prodview.example.com">affiliates@prodview.example.com</a>
          </p>
        </section>
      </LegalPageTemplate>
    </>
  );
}
