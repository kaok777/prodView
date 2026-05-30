import { SEOHead } from "../../components/SEOHead";
import { LegalPageTemplate } from "../../components/LegalPageTemplate";
import { Mail, Phone, MapPin, FileText } from "lucide-react";

export function PopiaContactPage() {
  return (
    <>
      <SEOHead
        title="POPIA Contact & Information Officer"
        description="Contact ProdView's Information Officer for POPIA-related inquiries, data requests, and privacy complaints under South Africa's Protection of Personal Information Act."
        canonicalUrl={`${window.location.origin}/popia`}
      />

      <LegalPageTemplate title="POPIA Contact & Information Officer" lastUpdated="2026-05-28">
        <section className="space-y-6">
          <p className="lead">
            Under the Protection of Personal Information Act (POPIA) of South Africa, we have designated an
            Information Officer to handle privacy-related inquiries and data subject requests.
          </p>

          <h2>1. Information Officer</h2>
          <p>
            Our designated Information Officer is responsible for ensuring compliance with POPIA and handling
            all privacy-related matters.
          </p>
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 my-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Information Officer</p>
                <p className="text-muted-foreground">[Name - PLACEHOLDER]</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Email</p>
                <a href="mailto:privacy@prodview.example.com" className="text-primary hover:underline">
                  privacy@prodview.example.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Phone</p>
                <p className="text-muted-foreground">[Phone Number - PLACEHOLDER]</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Address</p>
                <p className="text-muted-foreground">
                  [Physical Address - PLACEHOLDER]<br />
                  [City, Postal Code]<br />
                  South Africa
                </p>
              </div>
            </div>
          </div>

          <h2>2. Your Rights Under POPIA</h2>
          <p>
            As a data subject under POPIA, you have the following rights:
          </p>
          <ul>
            <li><strong>Right to access:</strong> Request confirmation of whether we hold your personal information</li>
            <li><strong>Right to correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Right to deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Right to object:</strong> Object to the processing of your personal information</li>
            <li><strong>Right to lodge a complaint:</strong> File a complaint with the Information Regulator</li>
          </ul>

          <h2>3. How to Submit a Request</h2>

          <h3>3.1 Data Access Request</h3>
          <p>
            To request a copy of your personal information:
          </p>
          <ol>
            <li>Email our Information Officer at: <a href="mailto:privacy@prodview.example.com" className="text-primary hover:underline">privacy@prodview.example.com</a></li>
            <li>Subject line: "POPIA Data Access Request"</li>
            <li>Include: Your name, email address, and any additional identifying information</li>
            <li>Specify: What information you would like to access</li>
          </ol>

          <h3>3.2 Data Correction Request</h3>
          <p>
            To request correction of your personal information:
          </p>
          <ol>
            <li>Email our Information Officer</li>
            <li>Subject line: "POPIA Data Correction Request"</li>
            <li>Specify: What information needs correction and the correct information</li>
          </ol>

          <h3>3.3 Data Deletion Request</h3>
          <p>
            To request deletion of your personal information:
          </p>
          <ol>
            <li>Email our Information Officer</li>
            <li>Subject line: "POPIA Data Deletion Request"</li>
            <li>Specify: What information you would like deleted</li>
          </ol>

          <h3>3.4 Objection to Processing</h3>
          <p>
            To object to how we process your personal information:
          </p>
          <ol>
            <li>Email our Information Officer</li>
            <li>Subject line: "POPIA Objection to Processing"</li>
            <li>Specify: What processing activities you object to and why</li>
          </ol>

          <h2>4. Response Timeframe</h2>
          <p>
            We will respond to your request within <strong>30 days</strong> of receipt, as required by POPIA.
          </p>
          <p>
            If we need additional time or information, we will notify you and explain the reason for the delay.
          </p>

          <h2>5. Identity Verification</h2>
          <p>
            To protect your privacy and security, we may require verification of your identity before processing
            your request. This may include:
          </p>
          <ul>
            <li>Confirming your email address</li>
            <li>Requesting additional identifying information</li>
            <li>Asking you to provide proof of identity</li>
          </ul>

          <h2>6. Fees</h2>
          <p>
            In most cases, we will process your request <strong>free of charge</strong>.
          </p>
          <p>
            However, POPIA allows us to charge a reasonable fee if:
          </p>
          <ul>
            <li>Your request is manifestly unfounded or excessive</li>
            <li>You request duplicate copies of information</li>
          </ul>
          <p>
            If a fee applies, we will notify you before processing your request.
          </p>

          <h2>7. Complaints</h2>
          <p>
            If you believe we have not handled your personal information properly or have violated POPIA, you can:
          </p>

          <h3>7.1 Contact Our Information Officer</h3>
          <p>
            First, please contact our Information Officer to try to resolve the issue directly:
          </p>
          <p>
            <a href="mailto:privacy@prodview.example.com" className="text-primary hover:underline">
              privacy@prodview.example.com
            </a>
          </p>

          <h3>7.2 Lodge a Complaint with the Information Regulator</h3>
          <p>
            If you are not satisfied with our response, you have the right to lodge a complaint with the
            Information Regulator of South Africa:
          </p>
          <div className="bg-muted/50 rounded-lg p-6 space-y-2 my-4">
            <p className="font-semibold">Information Regulator (South Africa)</p>
            <p>
              <strong>Website:</strong>{" "}
              <a
                href="https://www.justice.gov.za/inforeg/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.justice.gov.za/inforeg
              </a>
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:inforeg@justice.gov.za" className="text-primary hover:underline">
                inforeg@justice.gov.za
              </a>
            </p>
            <p>
              <strong>Phone:</strong> +27 (0) 10 023 5200
            </p>
            <p>
              <strong>Address:</strong><br />
              JD House, 27 Stiemens Street<br />
              Braamfontein, Johannesburg, 2001<br />
              South Africa
            </p>
          </div>

          <h2>8. Additional Privacy Information</h2>
          <p>
            For more details about how we collect, use, and protect your personal information, please see our{" "}
            <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>

          <h2>9. General Inquiries</h2>
          <p>
            For non-POPIA related questions or general support:
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:support@prodview.example.com" className="text-primary hover:underline">
              support@prodview.example.com
            </a>
          </p>
        </section>
      </LegalPageTemplate>
    </>
  );
}
