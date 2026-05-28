import { SEOHead } from "../../components/SEOHead";
import { LegalPageTemplate } from "../../components/LegalPageTemplate";

export function CookiePolicyPage() {
  return (
    <>
      <SEOHead
        title="Cookie Policy"
        description="Understand how ProdView uses cookies and similar technologies. Manage your cookie preferences for our affiliate marketing platform."
        canonicalUrl={`${window.location.origin}/cookie-policy`}
      />

      <LegalPageTemplate title="Cookie Policy" lastUpdated="2026-05-28">
        <section className="space-y-6">
          <p className="lead">
            This Cookie Policy explains how ProdView uses cookies and similar technologies on our website.
          </p>

          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when
            you visit a website. They are widely used to make websites work more efficiently and provide
            information to website owners.
          </p>
          <p>
            We also use browser local storage and session storage, which function similarly to cookies but store
            data directly in your browser.
          </p>

          <h2>2. How We Use Cookies</h2>
          <p>We use cookies and storage technologies for the following purposes:</p>
          <ul>
            <li><strong>Essential Functionality:</strong> To remember your preferences (theme, sidebar state)</li>
            <li><strong>Analytics (with consent):</strong> To understand how visitors use our website</li>
            <li><strong>Consent Management:</strong> To remember your cookie preferences</li>
          </ul>

          <h2>3. Types of Cookies We Use</h2>

          <h3>3.1 Essential Cookies (Always Active)</h3>
          <p>
            These are necessary for the website to function and cannot be switched off. They are usually only set
            in response to actions you take, such as setting privacy preferences or changing theme.
          </p>
          <table className="w-full border-collapse border border-border my-4">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left">Name</th>
                <th className="border border-border p-2 text-left">Purpose</th>
                <th className="border border-border p-2 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">theme (localStorage)</td>
                <td className="border border-border p-2">Stores your light/dark mode preference</td>
                <td className="border border-border p-2">Persistent</td>
              </tr>
              <tr>
                <td className="border border-border p-2">consent_preferences (localStorage)</td>
                <td className="border border-border p-2">Stores your cookie consent choices</td>
                <td className="border border-border p-2">Persistent</td>
              </tr>
              <tr>
                <td className="border border-border p-2">left-sidebar-visited (localStorage)</td>
                <td className="border border-border p-2">Remembers if you've seen the sidebar</td>
                <td className="border border-border p-2">Persistent</td>
              </tr>
              <tr>
                <td className="border border-border p-2">right-sidebar-visited (localStorage)</td>
                <td className="border border-border p-2">Remembers if you've seen the sidebar</td>
                <td className="border border-border p-2">Persistent</td>
              </tr>
            </tbody>
          </table>

          <h3>3.2 Analytics Cookies (Opt-In)</h3>
          <p>
            These help us understand how visitors interact with our website by collecting and reporting
            information anonymously. We only set these if you consent.
          </p>
          <table className="w-full border-collapse border border-border my-4">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left">Name</th>
                <th className="border border-border p-2 text-left">Purpose</th>
                <th className="border border-border p-2 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">analytics_session_id (sessionStorage)</td>
                <td className="border border-border p-2">Tracks your session for analytics</td>
                <td className="border border-border p-2">Session (clears when tab closes)</td>
              </tr>
            </tbody>
          </table>

          <h3>3.3 Marketing Cookies (Future)</h3>
          <p>
            We do not currently use marketing cookies. If we do in the future, we will update this policy and
            request your consent.
          </p>

          <h2>4. Managing Your Cookie Preferences</h2>

          <h3>4.1 Via Our Cookie Settings</h3>
          <p>
            You can manage your cookie preferences at any time by clicking the <strong>"Cookie Settings"</strong>{" "}
            link in our website footer. This allows you to:
          </p>
          <ul>
            <li>Accept all cookies</li>
            <li>Reject non-essential cookies</li>
            <li>Customize which categories you accept</li>
          </ul>

          <h3>4.2 Via Your Browser</h3>
          <p>
            You can also control cookies through your browser settings. Here's how for popular browsers:
          </p>
          <ul>
            <li>
              <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data
            </li>
            <li>
              <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
            </li>
            <li>
              <strong>Safari:</strong> Preferences → Privacy → Cookies and website data
            </li>
            <li>
              <strong>Edge:</strong> Settings → Privacy, search, and services → Cookies
            </li>
          </ul>
          <p>
            Note: Blocking all cookies may affect your experience on our website, as some features require
            essential cookies to function.
          </p>

          <h2>5. Third-Party Cookies</h2>
          <p>
            When you click affiliate links and leave our website, you may receive cookies from third-party
            websites (vendor sites). We do not control these cookies. Please refer to the privacy policies of
            those websites for information about their cookies.
          </p>

          <h2>6. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. When we make significant changes, we will update
            the "Last Updated" date and may re-prompt you for consent.
          </p>

          <h2>7. More Information</h2>
          <p>
            For more information about how we handle your personal data, please see our{" "}
            <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
          <p>
            To learn more about cookies in general, visit{" "}
            <a
              href="https://www.allaboutcookies.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              www.allaboutcookies.org
            </a>.
          </p>
        </section>
      </LegalPageTemplate>
    </>
  );
}
