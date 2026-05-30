import { SEOHead } from "../../components/SEOHead";
import { LegalPageTemplate } from "../../components/LegalPageTemplate";

export function ExternalLinksNoticePage() {
  return (
    <>
      <SEOHead
        title="External Links Notice"
        description="Important information about external links on ProdView and how they lead to third-party vendor websites with separate policies."
        canonicalUrl={`${window.location.origin}/external-links`}
      />

      <LegalPageTemplate title="External Links Notice" lastUpdated="2026-05-28">
        <section className="space-y-6">
          <p className="lead">
            ProdView contains links to external websites operated by third parties. This notice explains how
            external links work and what you should know before leaving our site.
          </p>

          <h2>1. What Are External Links?</h2>
          <p>
            External links are hyperlinks that navigate you away from ProdView to websites operated by other
            organizations. On our site, external links primarily lead to:
          </p>
          <ul>
            <li><strong>Product vendor websites:</strong> Where you can purchase products featured on ProdView</li>
            <li><strong>Third-party resources:</strong> Additional information sources or related services</li>
          </ul>
          <p>
            Most external links on ProdView are <strong>affiliate links</strong>. See our{" "}
            <a href="/affiliate-disclosure" className="text-primary hover:underline">Affiliate Disclosure</a> for details.
          </p>

          <h2>2. How to Identify External Links</h2>
          <p>
            When you click certain buttons or links on ProdView, you will leave our website. Common indicators:
          </p>
          <ul>
            <li><strong>"Visit Product Site" buttons:</strong> Navigate to vendor websites</li>
            <li><strong>Product links with external icon:</strong> Open in new tabs</li>
            <li><strong>Resource links:</strong> Open external information sources</li>
          </ul>
          <p>
            External links typically open in a new browser tab/window, allowing you to keep ProdView open.
          </p>

          <h2>3. You Are Leaving ProdView</h2>
          <p>
            <strong>Important:</strong> Once you click an external link and navigate to another website:
          </p>
          <ul>
            <li>You are no longer on ProdView</li>
            <li>You are subject to the external site's terms and policies</li>
            <li>ProdView's policies (Privacy Policy, Terms, etc.) no longer apply</li>
            <li>Your interactions are with the external site, not ProdView</li>
          </ul>

          <h2>4. External Site Privacy Policies</h2>
          <p>
            External websites have their own privacy policies and practices. When you visit an external site:
          </p>
          <ul>
            <li>Their privacy policy governs how they collect and use your data</li>
            <li>They may use different cookies and tracking technologies</li>
            <li>They may have different data protection standards</li>
            <li>They are responsible for protecting your personal information</li>
          </ul>
          <p>
            <strong>We recommend:</strong> Review the privacy policy of any external site before providing personal
            or payment information.
          </p>

          <h2>5. ProdView Is Not Responsible</h2>
          <p>
            ProdView has no control over, and assumes no responsibility for:
          </p>
          <ul>
            <li><strong>Content:</strong> Information, accuracy, or quality on external sites</li>
            <li><strong>Privacy practices:</strong> How external sites collect or use your data</li>
            <li><strong>Security:</strong> Data protection measures of external sites</li>
            <li><strong>Availability:</strong> Whether external links work or sites are accessible</li>
            <li><strong>Products/services:</strong> Quality, safety, or fulfillment by external vendors</li>
            <li><strong>Customer service:</strong> Support provided by external vendors</li>
            <li><strong>Transactions:</strong> Payment processing, shipping, or returns</li>
          </ul>

          <h2>6. No Endorsement</h2>
          <p>
            The inclusion of external links on ProdView does NOT imply:
          </p>
          <ul>
            <li>Endorsement of the external website or organization</li>
            <li>Approval of their content, products, or services</li>
            <li>Verification of their claims or credentials</li>
            <li>Warranty of product quality or vendor reliability</li>
          </ul>
          <p>
            We provide external links for informational and navigational purposes only.
          </p>

          <h2>7. Your Responsibility</h2>
          <p>
            When using external links, you are responsible for:
          </p>
          <ul>
            <li>Reviewing the external site's terms and policies</li>
            <li>Assessing the credibility and trustworthiness of external vendors</li>
            <li>Protecting your personal and financial information</li>
            <li>Reading product details, reviews, and return policies</li>
            <li>Verifying secure connections (HTTPS) before entering sensitive data</li>
            <li>Understanding that you are interacting with a third party, not ProdView</li>
          </ul>

          <h2>8. Security Considerations</h2>
          <p>
            While we strive to link to reputable websites, please exercise caution:
          </p>
          <ul>
            <li><strong>Check the URL:</strong> Ensure you're on the expected vendor website</li>
            <li><strong>Look for HTTPS:</strong> Secure connections encrypt your data</li>
            <li><strong>Beware of phishing:</strong> Be cautious of suspicious links or requests</li>
            <li><strong>Use secure payment methods:</strong> Credit cards often offer fraud protection</li>
            <li><strong>Keep software updated:</strong> Maintain current browser and security software</li>
          </ul>

          <h2>9. Broken or Inappropriate Links</h2>
          <p>
            If you encounter external links that are:
          </p>
          <ul>
            <li>Broken or non-functional</li>
            <li>Lead to inappropriate content</li>
            <li>Appear fraudulent or suspicious</li>
            <li>Violate our policies</li>
          </ul>
          <p>
            Please report them to us at:{" "}
            <a href="mailto:support@prodview.example.com">support@prodview.example.com</a>
          </p>

          <h2>10. Changes to External Links</h2>
          <p>
            External links may change or become unavailable without notice. We may:
          </p>
          <ul>
            <li>Add, modify, or remove external links at any time</li>
            <li>Update vendor partnerships</li>
            <li>Change affiliate relationships</li>
          </ul>
          <p>
            We are not obligated to maintain specific external links or notify you of changes.
          </p>

          <h2>11. Affiliate Relationships</h2>
          <p>
            Many external links on ProdView are <strong>affiliate links</strong>. When you click these links
            and make purchases, we may earn a commission. For full details, see our{" "}
            <a href="/affiliate-disclosure" className="text-primary hover:underline">Affiliate Disclosure</a>.
          </p>

          <h2>12. Questions</h2>
          <p>
            If you have questions about external links, contact us at:{" "}
            <a href="mailto:support@prodview.example.com">support@prodview.example.com</a>
          </p>
        </section>
      </LegalPageTemplate>
    </>
  );
}
