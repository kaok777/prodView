import { SEOHead } from "../../components/SEOHead";
import { LegalPageTemplate } from "../../components/LegalPageTemplate";

export function TermsPage() {
  return (
    <>
      <SEOHead
        title="Terms & Conditions"
        description="Review the terms and conditions for using ProdView, including acceptable use, affiliate relationships, and legal disclaimers."
        canonicalUrl={`${window.location.origin}/terms`}
      />

      <LegalPageTemplate title="Terms & Conditions" lastUpdated="2026-05-28">
        <section className="space-y-6">
          <p className="lead">
            Welcome to ProdView. By accessing and using this website, you accept and agree to be bound by the
            terms and conditions outlined below.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing, browsing, or using ProdView, you acknowledge that you have read, understood, and agree
            to be bound by these Terms & Conditions and our{" "}
            <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
          <p>
            If you do not agree with any part of these terms, you must not use our website.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 16 years old to use this website. By using ProdView, you represent and warrant
            that you meet this age requirement and have the legal capacity to enter into these terms.
          </p>

          <h2>3. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms & Conditions at any time. Changes will be effective
            immediately upon posting to this page. Your continued use of the website after changes are posted
            constitutes acceptance of the modified terms.
          </p>
          <p>
            We recommend reviewing this page periodically for updates.
          </p>

          <h2>4. Description of Service</h2>
          <p>
            ProdView is an affiliate marketing platform that:
          </p>
          <ul>
            <li>Showcases products from third-party vendors</li>
            <li>Provides product information and descriptions</li>
            <li>Offers categorization and search functionality</li>
            <li>Contains affiliate links to external vendor websites</li>
          </ul>
          <p>
            <strong>Important:</strong> We do not sell products directly. All purchases occur on external vendor
            websites. See our <a href="/affiliate-disclosure" className="text-primary hover:underline">Affiliate Disclosure</a> for details.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>You agree to use ProdView only for lawful purposes. You must not:</p>
          <ul>
            <li>Use the website in any way that violates applicable laws or regulations</li>
            <li>Attempt to gain unauthorized access to our systems or networks</li>
            <li>Transmit malicious code, viruses, or harmful software</li>
            <li>Scrape, crawl, or automatically extract data without permission</li>
            <li>Interfere with or disrupt the website or servers</li>
            <li>Impersonate ProdView, our employees, or other users</li>
            <li>Use the website for fraudulent or deceptive purposes</li>
          </ul>

          <h2>6. Intellectual Property</h2>

          <h3>6.1 Our Content</h3>
          <p>
            The content on ProdView, including but not limited to text, graphics, logos, layout, and software,
            is owned by ProdView or licensed to us and is protected by copyright, trademark, and other
            intellectual property laws.
          </p>

          <h3>6.2 Product Images and Descriptions</h3>
          <p>
            Product images and descriptions are provided by or sourced from third-party vendors. These remain
            the property of their respective owners. We display them for informational purposes under fair use
            or with permission.
          </p>

          <h3>6.3 Limited License</h3>
          <p>
            We grant you a limited, non-exclusive, non-transferable license to access and use ProdView for
            personal, non-commercial purposes. You may not reproduce, distribute, modify, or create derivative
            works from our content without prior written permission.
          </p>

          <h2>7. Affiliate Relationships</h2>
          <p>
            ProdView participates in affiliate marketing programs. We earn commissions when you click affiliate
            links and make purchases on external websites. For full details, see our{" "}
            <a href="/affiliate-disclosure" className="text-primary hover:underline">Affiliate Disclosure</a>.
          </p>
          <p>
            <strong>Key Points:</strong>
          </p>
          <ul>
            <li>Affiliate links lead to external vendor websites</li>
            <li>We may earn a commission at no additional cost to you</li>
            <li>We strive for honest, unbiased product information</li>
            <li>Our affiliate relationships do not influence our recommendations</li>
          </ul>

          <h2>8. External Links and Third-Party Content</h2>
          <p>
            ProdView contains links to external websites operated by third parties. We have no control over the
            content, privacy policies, or practices of these external sites. See our{" "}
            <a href="/external-links" className="text-primary hover:underline">External Links Notice</a> for details.
          </p>
          <p>
            <strong>You acknowledge that:</strong>
          </p>
          <ul>
            <li>External sites have their own terms and privacy policies</li>
            <li>We are not responsible for the content, safety, or practices of external sites</li>
            <li>We do not endorse or guarantee external vendors or their products</li>
            <li>Your interactions with external vendors are solely between you and them</li>
          </ul>

          <h2>9. Disclaimer of Warranties</h2>
          <p>
            ProdView is provided on an <strong>"as-is"</strong> and <strong>"as-available"</strong> basis.
            To the fullest extent permitted by law:
          </p>
          <ul>
            <li>We make no warranties, express or implied, about the website or its content</li>
            <li>We do not guarantee accuracy, completeness, or timeliness of information</li>
            <li>We do not warrant that the website will be uninterrupted, secure, or error-free</li>
            <li>We do not guarantee any specific results from using our website</li>
          </ul>
          <p>
            For additional disclaimers, see our <a href="/disclaimer" className="text-primary hover:underline">Disclaimer page</a>.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, ProdView, its owners, employees, and affiliates shall not
            be liable for:
          </p>
          <ul>
            <li>Any indirect, incidental, consequential, or punitive damages</li>
            <li>Loss of profits, revenue, data, or business opportunities</li>
            <li>Damages arising from your use or inability to use the website</li>
            <li>Damages resulting from external vendor interactions or purchases</li>
            <li>Damages from unauthorized access or alteration of your data</li>
          </ul>
          <p>
            Some jurisdictions do not allow limitations on implied warranties or liability, so the above may not
            fully apply to you.
          </p>

          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless ProdView and its affiliates from any claims,
            damages, losses, liabilities, and expenses (including legal fees) arising from:
          </p>
          <ul>
            <li>Your use of the website</li>
            <li>Your violation of these Terms & Conditions</li>
            <li>Your violation of any rights of another party</li>
            <li>Your conduct in connection with the website</li>
          </ul>

          <h2>12. Governing Law and Jurisdiction</h2>
          <p>
            These Terms & Conditions are governed by the laws of <strong>South Africa</strong>, without regard
            to conflict of law principles.
          </p>
          <p>
            Any disputes arising from these terms or your use of ProdView shall be subject to the exclusive
            jurisdiction of the courts of South Africa.
          </p>

          <h2>13. Severability</h2>
          <p>
            If any provision of these Terms & Conditions is found to be invalid or unenforceable, the remaining
            provisions shall continue in full force and effect.
          </p>

          <h2>14. Entire Agreement</h2>
          <p>
            These Terms & Conditions, together with our Privacy Policy and other legal notices, constitute the
            entire agreement between you and ProdView regarding your use of the website.
          </p>

          <h2>15. Contact Information</h2>
          <p>
            If you have questions about these Terms & Conditions, please contact us at:{" "}
            <a href="mailto:legal@prodview.example.com">legal@prodview.example.com</a>
          </p>
        </section>
      </LegalPageTemplate>
    </>
  );
}
