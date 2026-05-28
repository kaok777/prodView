import { SEOHead } from "../../components/SEOHead";
import { LegalPageTemplate } from "../../components/LegalPageTemplate";

export function DisclaimerPage() {
  return (
    <>
      <SEOHead
        title="Disclaimer"
        description="Read important disclaimers about ProdView's product information, external vendors, and limitations of liability."
        canonicalUrl={`${window.location.origin}/disclaimer`}
      />

      <LegalPageTemplate title="Disclaimer" lastUpdated="2026-05-28">
        <section className="space-y-6">
          <p className="lead">
            This disclaimer governs your use of ProdView. By using our website, you accept this disclaimer in full.
          </p>

          <h2>1. General Disclaimer</h2>
          <p>
            The information provided on ProdView is for <strong>general informational purposes only</strong>.
            While we strive to provide accurate and up-to-date information, we make no representations or
            warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability,
            or availability of the information, products, services, or related graphics contained on the website.
          </p>

          <h2>2. No Professional Advice</h2>
          <p>
            The content on ProdView does not constitute professional advice. You should not rely on information
            from this website as a substitute for:
          </p>
          <ul>
            <li>Professional consultation or advice</li>
            <li>Expert evaluation of your specific needs</li>
            <li>Technical specifications verification</li>
            <li>Safety or compatibility assessments</li>
          </ul>
          <p>
            Always seek advice from qualified professionals regarding specific products or purchases.
          </p>

          <h2>3. Product Information Accuracy</h2>
          <p>
            Product information on ProdView (descriptions, images, specifications, pricing) is:
          </p>
          <ul>
            <li>Sourced from third-party vendors</li>
            <li>Subject to change without notice</li>
            <li>Not guaranteed to be current or accurate</li>
            <li>Provided "as-is" for informational purposes</li>
          </ul>
          <p>
            <strong>We do not guarantee:</strong>
          </p>
          <ul>
            <li>Product availability</li>
            <li>Pricing accuracy</li>
            <li>Specification correctness</li>
            <li>Image representation of actual products</li>
          </ul>
          <p>
            Always verify product details on the vendor's website before purchasing.
          </p>

          <h2>4. No Product Endorsement</h2>
          <p>
            Featuring a product on ProdView does NOT constitute an endorsement, recommendation, or guarantee
            of its quality, safety, or suitability for your needs.
          </p>
          <p>
            We provide product discovery and comparison tools. The decision to purchase is entirely yours.
          </p>

          <h2>5. External Vendor Disclaimer</h2>
          <p>
            <strong>ProdView is NOT the seller</strong> of products featured on our website. We are an
            affiliate marketing platform that:
          </p>
          <ul>
            <li>Provides information about products sold by external vendors</li>
            <li>Links to external vendor websites</li>
            <li>May earn commissions from purchases (see{" "}
              <a href="/affiliate-disclosure" className="text-primary hover:underline">Affiliate Disclosure</a>)
            </li>
          </ul>
          <p>
            <strong>External vendors are responsible for:</strong>
          </p>
          <ul>
            <li>Product quality and safety</li>
            <li>Shipping and delivery</li>
            <li>Customer service</li>
            <li>Returns and refunds</li>
            <li>Warranties and guarantees</li>
            <li>Payment processing</li>
          </ul>
          <p>
            All purchase transactions occur directly between you and the external vendor.
          </p>

          <h2>6. External Links Disclaimer</h2>
          <p>
            Our website contains links to external websites operated by third parties. We have no control over
            the content, policies, or practices of these external sites.
          </p>
          <p>
            We are NOT responsible for:
          </p>
          <ul>
            <li>The availability of external websites</li>
            <li>The content on external websites</li>
            <li>Privacy practices of external websites</li>
            <li>Security of external websites</li>
          </ul>
          <p>
            Visiting external links is at your own risk. See our{" "}
            <a href="/external-links" className="text-primary hover:underline">External Links Notice</a> for details.
          </p>

          <h2>7. No Warranty</h2>
          <p>
            ProdView is provided on an <strong>"as-is"</strong> and <strong>"as-available"</strong> basis,
            without any warranties of any kind, either express or implied, including but not limited to:
          </p>
          <ul>
            <li>Merchantability</li>
            <li>Fitness for a particular purpose</li>
            <li>Non-infringement</li>
            <li>Title</li>
            <li>Accuracy of information</li>
          </ul>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, ProdView and its owners, employees, and affiliates shall
            NOT be liable for any damages whatsoever arising from:
          </p>
          <ul>
            <li>Use or inability to use our website</li>
            <li>Reliance on information provided on our website</li>
            <li>Purchases made through external vendor links</li>
            <li>Product quality, safety, or suitability issues</li>
            <li>Loss of data, profits, or business opportunities</li>
            <li>External vendor conduct or practices</li>
          </ul>
          <p>
            This limitation applies even if we have been advised of the possibility of such damages.
          </p>

          <h2>9. Your Responsibility</h2>
          <p>
            You are responsible for:
          </p>
          <ul>
            <li>Conducting your own research before making purchases</li>
            <li>Verifying product information with vendors</li>
            <li>Reading vendor terms, policies, and reviews</li>
            <li>Assessing product suitability for your needs</li>
            <li>Ensuring safe and legal use of products</li>
            <li>Protecting your personal and payment information</li>
          </ul>

          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless ProdView from any claims, damages, or expenses arising from:
          </p>
          <ul>
            <li>Your use of our website</li>
            <li>Your purchases from external vendors</li>
            <li>Your reliance on information from our website</li>
            <li>Your violation of any laws or third-party rights</li>
          </ul>

          <h2>11. Changes to Information</h2>
          <p>
            Information on ProdView may be changed, removed, or updated at any time without notice. We make no
            commitment to update information or maintain specific content.
          </p>

          <h2>12. Jurisdictional Issues</h2>
          <p>
            Products featured on ProdView may not be available in all jurisdictions. Availability, pricing, and
            legal requirements vary by location. It is your responsibility to ensure compliance with local laws.
          </p>

          <h2>13. Contact</h2>
          <p>
            If you have questions about this disclaimer, contact us at:{" "}
            <a href="mailto:legal@prodview.example.com">legal@prodview.example.com</a>
          </p>
        </section>
      </LegalPageTemplate>
    </>
  );
}
