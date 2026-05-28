import { SEOHead } from "../../components/SEOHead";
import { LegalPageTemplate } from "../../components/LegalPageTemplate";

export function PrivacyPolicyPage() {
  return (
    <>
      <SEOHead
        title="Privacy Policy"
        description="Learn about how ProdView collects, uses, and protects your personal information. GDPR and POPIA compliant privacy practices for our global affiliate marketing platform."
        canonicalUrl={`${window.location.origin}/privacy-policy`}
      />

      <LegalPageTemplate title="Privacy Policy" lastUpdated="2026-05-28">
        <section className="space-y-6">
          <p className="lead">
            At ProdView, we take your privacy seriously. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you visit our website.
          </p>

          <h2>1. Information Controller</h2>
          <p>
            <strong>Data Controller:</strong> ProdView<br />
            <strong>Location:</strong> South Africa<br />
            <strong>Contact:</strong> <a href="mailto:privacy@prodview.example.com">privacy@prodview.example.com</a>
          </p>
          <p>
            Under the Protection of Personal Information Act (POPIA), our designated Information Officer
            can be contacted via the <a href="/popia" className="text-primary hover:underline">POPIA Contact page</a>.
          </p>

          <h2>2. Information We Collect</h2>

          <h3>2.1 Automatically Collected Information</h3>
          <p>When you visit ProdView, we may automatically collect:</p>
          <ul>
            <li><strong>Analytics Session ID:</strong> A randomly generated identifier stored in your browser's session storage to track your visit</li>
            <li><strong>IP Address:</strong> Used for rate limiting and security purposes</li>
            <li><strong>Browser Information:</strong> User-agent string to understand browser compatibility</li>
            <li><strong>Viewing Behavior:</strong> Products viewed, categories browsed, search queries</li>
            <li><strong>Affiliate Click Data:</strong> Which product links you click (for commission tracking)</li>
          </ul>

          <h3>2.2 Cookies and Local Storage</h3>
          <p>We use the following browser storage mechanisms:</p>
          <ul>
            <li><strong>Essential Storage:</strong> Theme preferences, sidebar visibility state, consent preferences</li>
            <li><strong>Analytics Storage (if consented):</strong> Session tracking for usage analytics</li>
          </ul>
          <p>
            For detailed information about our cookies, please see our{" "}
            <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li><strong>Site Functionality:</strong> To provide core website features (theme, layout preferences)</li>
            <li><strong>Analytics (with consent):</strong> To understand user behavior and improve the website experience</li>
            <li><strong>Affiliate Tracking:</strong> To attribute product purchases to our referrals (commission tracking)</li>
            <li><strong>Security:</strong> To prevent abuse, spam, and unauthorized access</li>
            <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
          </ul>

          <h2>4. Legal Basis for Processing (GDPR)</h2>
          <p>Under GDPR, we process your information based on:</p>
          <ul>
            <li><strong>Consent:</strong> Analytics tracking (you can withdraw consent anytime)</li>
            <li><strong>Legitimate Interest:</strong> Site functionality, security, and fraud prevention</li>
            <li><strong>Legal Obligation:</strong> Compliance with applicable laws</li>
          </ul>

          <h2>5. Data Sharing and Third Parties</h2>
          <p>
            We <strong>do not sell</strong> your personal information. We may share data with:
          </p>
          <ul>
            <li><strong>Affiliate Partners:</strong> When you click affiliate links, you leave our site and are subject to their privacy policies</li>
            <li><strong>Service Providers:</strong> Hosting providers, analytics services (if applicable)</li>
            <li><strong>Legal Authorities:</strong> If required by law or to protect our rights</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>We retain your information for the following periods:</p>
          <ul>
            <li><strong>Analytics Data:</strong> 24 months (aggregate data may be kept longer)</li>
            <li><strong>Session Data:</strong> Until browser session ends</li>
            <li><strong>Consent Preferences:</strong> Until you clear browser storage or change preferences</li>
          </ul>

          <h2>7. Your Rights</h2>

          <h3>7.1 GDPR Rights (EU Residents)</h3>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
            <li><strong>Restriction:</strong> Limit how we use your data</li>
            <li><strong>Portability:</strong> Receive your data in a structured format</li>
            <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Withdraw Consent:</strong> Withdraw analytics consent at any time (via Cookie Settings in footer)</li>
          </ul>

          <h3>7.2 POPIA Rights (South African Residents)</h3>
          <p>Under POPIA, you have the right to:</p>
          <ul>
            <li>Request confirmation of whether we hold your personal information</li>
            <li>Request access to your personal information</li>
            <li>Request correction or deletion of your personal information</li>
            <li>Object to processing of your personal information</li>
            <li>Lodge a complaint with the Information Regulator</li>
          </ul>
          <p>
            To exercise these rights, contact our Information Officer via the{" "}
            <a href="/popia" className="text-primary hover:underline">POPIA Contact page</a>.
          </p>

          <h2>8. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your information:
          </p>
          <ul>
            <li>HTTPS encryption for data in transit</li>
            <li>Access controls and authentication</li>
            <li>Regular security assessments</li>
            <li>Secure data storage practices</li>
          </ul>
          <p>
            However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
          </p>

          <h2>9. International Data Transfers</h2>
          <p>
            Our website is operated from South Africa. If you access our site from outside South Africa, your
            information may be transferred to, stored, and processed in South Africa or other countries where our
            service providers operate.
          </p>

          <h2>10. Children's Privacy</h2>
          <p>
            Our website is not directed to individuals under the age of 16. We do not knowingly collect personal
            information from children. If we become aware that a child has provided us with personal information,
            we will take steps to delete such information.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by:
          </p>
          <ul>
            <li>Updating the "Last Updated" date at the top of this page</li>
            <li>Re-prompting for consent if required by law</li>
          </ul>
          <p>We encourage you to review this policy periodically.</p>

          <h2>12. Contact Us</h2>
          <p>
            For privacy-related questions or to exercise your rights:
          </p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:privacy@prodview.example.com">privacy@prodview.example.com</a></li>
            <li><strong>POPIA Information Officer:</strong> <a href="/popia" className="text-primary hover:underline">Contact Form</a></li>
          </ul>

          <h2>13. Supervisory Authorities</h2>
          <p>
            If you believe we have not addressed your concerns, you have the right to lodge a complaint with:
          </p>
          <ul>
            <li>
              <strong>South Africa (POPIA):</strong> Information Regulator (South Africa)<br />
              Website: <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.justice.gov.za/inforeg</a>
            </li>
            <li>
              <strong>EU (GDPR):</strong> Your local data protection authority<br />
              List: <a href="https://edpb.europa.eu/about-edpb/board/members_en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">EDPB Members</a>
            </li>
          </ul>
        </section>
      </LegalPageTemplate>
    </>
  );
}
