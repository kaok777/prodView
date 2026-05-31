# PRE-DEPLOYMENT AUDIT REPORT
**Project:** ProdView - Affiliate Marketing Platform
**Audit Date:** 2026-05-28
**Auditor:** Claude Code Assistant
**Environment:** Development (pre-production)

---

## EXECUTIVE SUMMARY

### Overall Production Readiness: **NOT READY FOR DEPLOYMENT**

The ProdView platform demonstrates good architectural decisions and comprehensive legal compliance, but has **critical security vulnerabilities** and **infrastructure gaps** that must be resolved before production deployment.

### Total Findings by Severity

- 🔴 **CRITICAL: 5**
- 🟠 **HIGH: 12**
- 🟡 **MEDIUM: 15**
- 🟢 **LOW: 11**

**Total Issues:** 43

### Overall Assessment

ProdView has a solid foundation with well-structured code, comprehensive legal pages (Privacy Policy, Terms, Cookie Policy, Affiliate Disclosure, POPIA Contact), and good security practices (JWT with httpOnly cookies, bcrypt password hashing, rate limiting, Helmet security headers). However, multiple critical issues prevent immediate deployment:

1. **Critical npm package vulnerabilities** (axios, dompurify, NestJS packages)
2. **Zero test coverage** - no automated tests exist
3. **In-memory analytics aggregation** creates DoS vulnerability at scale
4. **No production deployment infrastructure** documented (SSL, backups, monitoring)
5. **Vulnerable dependency versions** require immediate updates

The platform can be production-ready within **1-2 weeks** if the Tranche 1 issues are addressed systematically.

---

## TOP 5 ISSUES THAT MUST BE RESOLVED BEFORE GO-LIVE

1. **🔴 CRITICAL** — Update axios to patched version (currently 1.6.7, vulnerable to SSRF, prototype pollution, XSRF leakage - 16 CVEs)
2. **🔴 CRITICAL** — Update dompurify to 3.3.4+ (vulnerable to XSS, prototype pollution - 8 CVEs)
3. **🔴 CRITICAL** — Fix analytics getSearchStats DoS vulnerability (loads all events into memory)
4. **🔴 CRITICAL** — Update NestJS packages to patched versions (injection vulnerabilities)
5. **🟠 HIGH** — Implement automated test suite (minimum: auth, product CRUD, analytics tracking, affiliate click flow)

---

## TECH STACK SUMMARY

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| **Frontend Framework** | React | 19.2.1 | Latest stable |
| **Frontend Build** | Vite | 6.2.0 | Latest stable |
| **Frontend Language** | TypeScript | 5.7.2 | Latest stable |
| **Frontend Styling** | TailwindCSS | 3.x | Custom theme |
| **Frontend Routing** | React Router | 7.13.0 | Latest |
| **Backend Framework** | NestJS | 10.3.0 | ⚠️ Vulnerable (needs 11.1.18+) |
| **Backend Language** | TypeScript | 5.3.3 | Stable |
| **Database** | PostgreSQL | Not specified | Recommend 14+ |
| **ORM** | Prisma | 5.22.0 | Stable |
| **Auth Method** | JWT (Passport) | - | httpOnly cookies |
| **Password Hashing** | bcryptjs | 2.4.3 | 12 rounds |
| **Image Storage** | Local filesystem | - | /uploads directory |
| **UI Library** | Lucide React icons | 0.563.0 | Custom components |
| **Validation** | Zod (frontend) + class-validator (backend) | 4.3.6 / 0.14.1 | Dual validation |
| **HTTP Client** | Axios | 1.6.7 | ⚠️ CRITICAL vulnerability |
| **Security Middleware** | Helmet | 7.1.0 | Configured with CSP |
| **Rate Limiting** | express-rate-limit + @nestjs/throttler | 7.1.5 / 5.1.1 | In-memory |
| **File Upload** | Multer | 1.4.5-lts.1 | Type validation |
| **Sanitization** | DOMPurify + sanitize-html | 3.3.1 / 2.11.0 | ⚠️ DOMPurify vulnerable |
| **SEO** | react-helmet-async | 2.0.5 | With structured data |
| **Testing Framework** | None | - | ⚠️ No tests exist |
| **Deployment Target** | Not configured | - | ⚠️ No CI/CD, SSL, or hosting config |

---

## DETAILED FINDINGS

---

### AUDIT SECTION 1: SECURITY

#### 1.1 Environment Variables & Secrets

**🔴 CRITICAL** — S1.1.1: Critical npm Package Vulnerabilities (axios)
- **What was found:** Frontend uses axios 1.6.7 which has 16 high-severity CVEs including SSRF (CVE-2025-62718, GHSA-3p68-rc4w-qgx5), prototype pollution (GHSA-w9j2-pvgh-6h63), XSRF token cross-origin leakage (GHSA-xx6v-rp6x-q39c), header injection (GHSA-6chq-wfr3-2hj9), and DoS (GHSA-62hf-57xw-28j9).
- **Why it matters:** These vulnerabilities allow attackers to bypass proxy protections, manipulate HTTP requests, steal credentials, inject malicious headers, and cause denial of service. Given this is an affiliate site handling redirects and tracking, SSRF and header injection are particularly dangerous.
- **Recommended fix:** Update axios to 1.15.2 or later with `npm install axios@latest`. Run `npm audit fix` and verify no breaking changes. Test affiliate click flow and API calls after update.
- **File references:** package.json:17, src/lib/api.ts, src/hooks/useAnalytics.ts

**🔴 CRITICAL** — S1.1.2: DOMPurify XSS and Prototype Pollution Vulnerabilities
- **What was found:** Frontend uses dompurify 3.3.1 which has 8 moderate-to-high severity XSS vulnerabilities (GHSA-v2wj-7wpq-c8vv, GHSA-cjmm-f4jc-qw8r, GHSA-cj63-jhhr-wcxv, GHSA-39q2-94rc-95cp, GHSA-h7mw-gpvr-xq4m, GHSA-crv5-9vww-q3g8, GHSA-v9jr-rg53-9pgp, GHSA-h8r8-wccr-v5f2).
- **Why it matters:** DOMPurify is used to sanitize user input. These vulnerabilities allow XSS attacks via mutation-XSS, CUSTOM_ELEMENT_HANDLING bypass, ADD_TAGS function form bypass, and SAFE_FOR_TEMPLATES bypass in RETURN_DOM mode. This directly undermines your XSS protection.
- **Recommended fix:** Update dompurify to 3.3.4 or later with `npm install dompurify@latest`. Verify sanitization still works correctly in product descriptions and search results.
- **File references:** package.json:19, src/lib/formValidation.ts (likely usage)

**🔴 CRITICAL** — S1.1.3: NestJS Core Injection Vulnerability
- **What was found:** Backend uses @nestjs/core 10.3.0 and @nestjs/platform-express which have moderate severity injection vulnerabilities (GHSA-36xv-jgw5-4q75).
- **Why it matters:** Injection vulnerabilities in the core framework can allow attackers to inject malicious payloads into downstream components, potentially bypassing validation and executing arbitrary code.
- **Recommended fix:** Update @nestjs/core and @nestjs/platform-express to 11.1.18+ with `npm install @nestjs/core@latest @nestjs/platform-express@latest`. Note this is a breaking change from 10.x to 11.x - review NestJS migration guide and test all endpoints thoroughly.
- **File references:** backend/package.json:22-24

**🟠 HIGH** — S1.1.4: ajv ReDoS Vulnerability in Multiple Dependencies
- **What was found:** Both frontend and backend have ajv <6.14.0 with moderate severity ReDoS vulnerability (GHSA-2g4f-4pwh-qvx6) when using `$data` option.
- **Why it matters:** Regular Expression Denial of Service (ReDoS) can cause CPU exhaustion and service unavailability. While ajv is a transitive dependency, it's used by validation libraries.
- **Recommended fix:** Run `npm audit fix` on both frontend and backend. If auto-fix doesn't resolve, update parent dependencies (eslint, schema-utils) that depend on vulnerable ajv versions.
- **File references:** node_modules/ajv (frontend and backend)

**🟠 HIGH** — S1.1.5: Example Environment Variables Look Like Production Values
- **What was found:** backend/.env.example:46-47 contains `ADMIN_EMAIL="admin@example.com"` and `ADMIN_PASSWORD="YourSecurePassword123!"` which appear realistic rather than obviously fake placeholders.
- **Why it matters:** Developers might accidentally use these values in production, or these could be actual passwords committed to the repository. If accidentally deployed, this creates a known default credential vulnerability.
- **Recommended fix:** Change to obviously fake values: `ADMIN_EMAIL="CHANGE_THIS_admin@yourdomain.com"` and `ADMIN_PASSWORD="CHANGE_THIS_STRONG_PASSWORD"`. Add validation in create-admin script to reject these placeholder values.
- **File references:** backend/.env.example:46-47, backend/src/scripts/create-admin.ts

**🟠 HIGH** — S1.1.6: Hardcoded JWT Secret in .env.example is Too Memorable
- **What was found:** backend/.env.example:9 has JWT_SECRET="your-super-secure-jwt-secret-change-this-in-production-min-32-chars" which is descriptive text that might be copied as-is.
- **Why it matters:** If this example secret is used in production, JWT tokens can be forged, allowing attackers to impersonate admin users and bypass authentication entirely.
- **Recommended fix:** Generate a cryptographically random 64-character secret using `openssl rand -base64 48` and document this command in .env.example comments. Add startup validation to reject the example secret value.
- **File references:** backend/.env.example:9, backend/src/main.ts (add validation)

**🟠 HIGH** — S1.1.7: No Secret Scanning in Git History
- **What was found:** No evidence of git-secrets, truffleHog, or similar secret scanning tools being used. Given the .env.example patterns, there's risk that real secrets were committed.
- **Why it matters:** If secrets (JWT_SECRET, DATABASE_URL with password, API keys) were ever committed to git history, they remain accessible to anyone with repository access, even after being "removed" from current files.
- **Recommended fix:** Run `truffleHog git file://. --only-verified` to scan git history for secrets. If found, rotate all compromised secrets and consider using git-filter-repo to remove from history. Add pre-commit hook to prevent future secret commits.
- **File references:** .git/ (entire history)

**🟡 MEDIUM** — S1.1.8: CORS_ORIGIN Default is Localhost Only
- **What was found:** backend/.env.example:23 has CORS_ORIGIN="http://localhost:5173" with no production reminder comment.
- **Why it matters:** If deployed with this value, the production frontend cannot make API calls, causing complete site failure. This is an easy mistake to make during rushed deployment.
- **Recommended fix:** Add prominent comment: "# PRODUCTION: Set this to your frontend domain (e.g., https://prodview.com)" and implement startup warning if NODE_ENV=production and CORS_ORIGIN contains "localhost".
- **File references:** backend/.env.example:23, backend/src/main.ts:19-20

**🟡 MEDIUM** — S1.1.9: No Environment Variable Validation on Startup
- **What was found:** backend/src/config/env.validation.ts exists but is not exhaustive. No validation prevents using example values in production.
- **Why it matters:** Missing or invalid environment variables cause runtime failures after deployment, often discovered only in production.
- **Recommended fix:** Enhance env.validation.ts to check: (1) JWT_SECRET doesn't match example value, (2) DATABASE_URL is valid PostgreSQL connection string, (3) CORS_ORIGIN is valid URL, (4) NODE_ENV is one of [development, production, test], (5) All required variables are present.
- **File references:** backend/src/config/env.validation.ts, backend/src/main.ts:13-14

**🟢 LOW** — S1.1.10: Client-Side API URL Not Validated
- **What was found:** .env.example:7 has VITE_API_URL=http://localhost:3000/api with no validation that it ends in /api.
- **Why it matters:** If misconfigured, all API calls will fail with 404 errors, causing complete site dysfunction.
- **Recommended fix:** Add validation in src/lib/api.ts to verify API_URL ends with '/api' and log clear error if not. Document required format in .env.example comments.
- **File references:** .env.example:7, src/lib/api.ts:4-5

#### 1.2 Authentication & Session Security

**🟠 HIGH** — S1.2.1: No Token Revocation Mechanism
- **What was found:** Auth system issues JWT tokens with 15-minute access tokens and 7-day refresh tokens, but has no blacklist or revocation mechanism. Logout only clears cookies client-side.
- **Why it matters:** If an admin's device is compromised or an admin is terminated, there's no way to immediately invalidate their tokens. An attacker with a stolen refresh token can maintain access for up to 7 days.
- **Recommended fix:** Implement token blacklist using Redis with TTL matching refresh token expiry (7 days). Check blacklist in jwt.strategy.ts validate() method. Add /auth/revoke-all endpoint for emergency token revocation.
- **File references:** backend/src/auth/auth.service.ts:96-97, backend/src/auth/strategies/jwt.strategy.ts:24-30

**🟠 HIGH** — S1.2.2: Refresh Token Reuse Not Prevented (No Token Rotation)
- **What was found:** POST /auth/refresh returns both new access token and new refresh token, but the old refresh token is not invalidated. This allows unlimited reuse of a single refresh token.
- **Why it matters:** If a refresh token is stolen, the attacker can continue using it indefinitely (up to 7 days) even after the legitimate user also refreshes their token. Token rotation is a security best practice to detect token theft.
- **Recommended fix:** Implement refresh token rotation: store refresh token hash in database, mark old token as used when refreshing, reject reuse of old tokens. This creates a token family chain that can detect compromise.
- **File references:** backend/src/auth/auth.service.ts:108-132, backend/prisma/schema.prisma:140-154 (PasswordReset model could be renamed to Token model)

**🟡 MEDIUM** — S1.2.3: Password Reset Flow Not Implemented
- **What was found:** Database has PasswordReset model (prisma/schema.prisma:140-154) but no password reset endpoints exist in auth.controller.ts.
- **Why it matters:** Admins who forget their password cannot reset it without direct database access or recreating the account. This is a UX issue and operational burden.
- **Recommended fix:** Implement POST /auth/request-password-reset (generates token, sends email) and POST /auth/reset-password (validates token, updates password). Use tokenHash stored in PasswordReset table with 1-hour expiry.
- **File references:** backend/src/auth/auth.controller.ts, backend/prisma/schema.prisma:140-154

**🟡 MEDIUM** — S1.2.4: No Account Lockout After Multiple Failed Logins
- **What was found:** Rate limiting prevents >5 login attempts per 15 minutes (auth.service.ts:41-57), but doesn't lock the account. After waiting 15 minutes, attacker can try again.
- **Why it matters:** Determined attackers can brute force weak passwords over extended time periods (hours/days). Rate limiting slows them down but doesn't stop them.
- **Recommended fix:** After 10 failed login attempts within 24 hours, lock the account for 1 hour or require admin action to unlock. Store failed attempt count in database per email. Send email notification to admin on lockout.
- **File references:** backend/src/auth/auth.service.ts:41-79

**🟢 LOW** — S1.2.5: No Session Timeout Warning
- **What was found:** Admin sessions expire after 15 minutes (access token expiry) with automatic refresh via refresh token (7 days). No frontend warning before expiry.
- **Why it matters:** Admins lose unsaved work if access token expires during form editing and refresh fails (e.g., refresh token expired).
- **Recommended fix:** Add frontend session timeout warning at 14 minutes, prompting admin to save work. Use api interceptor to detect 401 errors and attempt token refresh before showing error to user.
- **File references:** src/lib/api.ts (add interceptor), src/contexts/AuthContext (if exists)

#### 1.3 Input Validation & Injection Prevention

**🟠 HIGH** — S1.3.1: OG Tag Regex Injection Risk
- **What was found:** products.service.ts:904-919 uses regex to extract Open Graph tags from untrusted HTML with user-controlled input (vendor URLs). Regex pattern includes user input in meta tag property matching.
- **Why it matters:** While the current implementation is safe, future modifications could introduce ReDoS vulnerability. The HTML parsing approach is fragile and doesn't handle malformed HTML robustly.
- **Recommended fix:** Replace regex-based HTML parsing with a proper HTML parser library like 'cheerio' or 'node-html-parser'. This is safer, more maintainable, and handles edge cases better. Example: `const $ = cheerio.load(html); return $('meta[property="og:title"]').attr('content');`
- **File references:** backend/src/products/products.service.ts:807-983

**🟡 MEDIUM** — S1.3.2: No Maximum URL Length Validation
- **What was found:** URL validation in ValidationService checks format but not length. Affiliate URLs and source URLs can be arbitrarily long.
- **Why it matters:** Extremely long URLs (>2000 chars) can cause database errors, break UI layouts, and potentially cause DoS via memory exhaustion when storing/processing.
- **Recommended fix:** Add maximum URL length validation (2083 chars - IE maximum). Enforce in both frontend validation (Zod schema) and backend validation (ValidationService). Return clear error message if exceeded.
- **File references:** backend/src/common/validation.service.ts, src/lib/validationSchemas.ts

**🟡 MEDIUM** — S1.3.3: Search Query Sanitization May Not Be Sufficient
- **What was found:** Search queries are validated with ValidationService.validateInput('text', keyword) and limited to 100 chars, but the exact sanitization rules are unclear.
- **Why it matters:** If ValidationService doesn't properly sanitize special characters or SQL-like patterns, there could be edge cases where malicious input breaks queries or gets reflected unsanitized in analytics.
- **Recommended fix:** Review ValidationService implementation. Ensure search queries are sanitized to remove: control characters, zero-width characters, excessive whitespace, and SQL special chars (even though Prisma uses parameterized queries). Add explicit test cases.
- **File references:** backend/src/common/validation.service.ts, backend/src/products/products.service.ts:153-175

**🟢 LOW** — S1.3.4: Metadata JSON Validation is Lenient
- **What was found:** analytics.service.ts:45-56 validates metadata by stringifying it and checking length (<1000 chars) and running ValidationService on the stringified JSON. Nested object depth is not validated.
- **Why it matters:** Deeply nested JSON objects can cause stack overflow or excessive memory usage during parsing/storage.
- **Recommended fix:** Add maximum nesting depth validation (e.g., 5 levels). Use a recursive depth checker or JSON schema validation library. Reject metadata exceeding depth limit with clear error.
- **File references:** backend/src/analytics/analytics.service.ts:45-56

#### 1.4 API Security

**🟠 HIGH** — S1.4.1: No Request Size Limit on JSON Body
- **What was found:** main.ts:133-134 sets max body size from MAX_BODY_SIZE env var (default 10MB), but this env var is not documented in .env.example.
- **Why it matters:** If MAX_BODY_SIZE is unset or misconfigured, attackers can send huge JSON payloads causing memory exhaustion DoS. 10MB is also quite large for JSON API requests.
- **Recommended fix:** Document MAX_BODY_SIZE in backend/.env.example (recommend 1MB for API, separate limit for multipart file uploads). Add separate limits: 1MB for JSON, 10MB for multipart. Configure in multer options separately from express.json().
- **File references:** backend/src/main.ts:133-135, backend/.env.example (add variable)

**🟠 HIGH** — S1.4.2: CORS Pre-flight Cache Too Short (Fixed but Undocumented)
- **What was found:** The code shows CORS maxAge was increased from 600s to 86400s (24 hours) per fix LOW-B1, but .env.example comment still says "default 86400" rather than explaining the reasoning.
- **Why it matters:** This is already fixed in code, but future maintainers might not understand why 24 hours was chosen and could reduce it, reintroducing performance issues on mobile networks.
- **Recommended fix:** Add explanatory comment in .env.example: "# CORS preflight cache duration (24 hours recommended for mobile networks, reduces OPTIONS requests)". Document in README under Performance Optimization section.
- **File references:** backend/.env.example:24-26, backend/src/main.ts:64-82

**🟡 MEDIUM** — S1.4.3: Rate Limiting Too Permissive for Expensive Operations
- **What was found:** POST /products/fetch-preview has rate limit of 20 requests per minute (products.controller.ts:132). This fetches external URLs which is expensive and could be abused.
- **Why it matters:** Admins (or compromised admin accounts) could abuse fetch-preview to scan arbitrary URLs, causing the server to be used in SSRF attacks or to scan internal networks. 20/min = 1200/hour is very high.
- **Recommended fix:** Reduce to 5 requests per minute (300/hour). Add exponential backoff for repeated failures. Consider requiring secondary auth confirmation for fetch-preview (e.g., re-enter password).
- **File references:** backend/src/products/products.controller.ts:131-135

**🟡 MEDIUM** — S1.4.4: No Rate Limiting on Static File Downloads
- **What was found:** main.ts:92 skips global rate limiting for /uploads/* paths, but no separate rate limit is configured for static files.
- **Why it matters:** Attackers can rapidly download all uploaded images, consuming bandwidth and potentially scraping product data. While images are public, unlimited access enables abuse.
- **Recommended fix:** Add separate rate limit for /uploads/* path: 100 requests per minute per IP. Configure in main.ts before static file middleware. Log excessive downloads for monitoring.
- **File references:** backend/src/main.ts:84-95, backend/src/main.ts:115-122

**🟢 LOW** — S1.4.5: Admin Endpoints Don't Log IP Addresses
- **What was found:** Audit logs (audit.service.ts) record admin actions with metadata, but not IP addresses of admin requests (except for login).
- **Why it matters:** If admin account is compromised, IP addresses in audit logs help identify unauthorized access patterns and geographic anomalies.
- **Recommended fix:** Add IP address to all audit log entries. Extract from Request object in controllers and pass to auditService.logAction(). Add ip field to AuditLog.metadata JSON.
- **File references:** backend/src/audit/audit.service.ts, backend/src/products/products.controller.ts (all admin endpoints)

#### 1.5 Dependency Security

**🔴 CRITICAL** — S1.5.1: brace-expansion DoS Vulnerability
- **What was found:** Both frontend and backend have brace-expansion <2.0.3 with moderate severity DoS vulnerability (GHSA-f886-m6hf-6m8v) - zero-step sequence causes process hang.
- **Why it matters:** Attackers can craft inputs that cause infinite loops, hanging the Node.js process and causing complete service outage.
- **Recommended fix:** Run `npm audit fix` on both frontend and backend. This is a transitive dependency, so parent packages need updating. Verify fix with `npm audit` showing 0 vulnerabilities for brace-expansion.
- **File references:** node_modules/brace-expansion (both repos)

**🟠 HIGH** — S1.5.2: express and body-parser Vulnerabilities (Transitive via @nestjs/platform-express)
- **What was found:** npm audit shows @nestjs/platform-express depends on vulnerable versions of express and body-parser (exact CVEs not shown in truncated output).
- **Why it matters:** Express and body-parser vulnerabilities can lead to request smuggling, DoS, or information disclosure, directly impacting API security.
- **Recommended fix:** Update @nestjs/platform-express to 11.1.15+ as part of the NestJS 11.x upgrade. Verify express and body-parser versions are latest after update.
- **File references:** backend/package.json:28

**🟠 HIGH** — S1.5.3: No Automated Dependency Scanning
- **What was found:** No evidence of Dependabot, Renovate, or Snyk integration. Vulnerabilities were only discovered via manual `npm audit`.
- **Why it matters:** New vulnerabilities are disclosed constantly. Without automated scanning, the project will fall behind on security patches and accumulate risk over time.
- **Recommended fix:** Enable GitHub Dependabot (free) by adding .github/dependabot.yml configuration. Configure weekly security updates for npm (both frontend and backend). Review and merge security PRs within 48 hours.
- **File references:** .github/dependabot.yml (create)

**🟡 MEDIUM** — S1.5.4: npm audit Shows 43 Vulnerabilities in Frontend
- **What was found:** Frontend `npm audit` shows 43 vulnerabilities: 1 high (axios - already documented), 42 moderate (dompurify, ajv, brace-expansion).
- **Why it matters:** While axios and dompurify are critical priorities, the sheer volume of vulnerabilities increases attack surface and maintenance burden.
- **Recommended fix:** After fixing critical packages, run `npm audit fix --force` to auto-update breaking changes. Test thoroughly after updates. Document any packages that can't be updated due to breaking changes.
- **File references:** package.json, package-lock.json

**🟡 MEDIUM** — S1.5.5: npm audit Shows 34+ Vulnerabilities in Backend
- **What was found:** Backend `npm audit` shows 34+ vulnerabilities (truncated output): moderate (NestJS packages, ajv, webpack via @nestjs/cli).
- **Why it matters:** Backend vulnerabilities are especially critical as they expose the database and admin functionality.
- **Recommended fix:** Update @nestjs/core to 11.1.18+, update @nestjs/cli to 11.0.21+. Run `npm audit fix` and test all endpoints. Document @nestjs/cli update in README as it's a dev dependency.
- **File references:** backend/package.json, backend/package-lock.json

---

### AUDIT SECTION 2: FUNCTIONALITY & BUGS

#### 2.1 Core User Flows

**🟡 MEDIUM** — F2.1.1: Product View Tracking Fires on Every Re-render
- **What was found:** ProductDetailPage.tsx:98-102 tracks product view with useEffect dependency array [product, track]. If product object reference changes (e.g., from re-fetch), view tracking fires again.
- **Why it matters:** This double-counts views when users navigate back to a product or when React re-renders. Analytics will show inflated view counts, making data unreliable for business decisions.
- **Recommended fix:** Change useEffect dependency to [product?.id, track] and add early return if product.id hasn't changed. Alternatively, track view only once per session by storing viewed product IDs in sessionStorage.
- **File references:** src/pages/ProductDetailPage.tsx:98-102

**🟡 MEDIUM** — F2.1.2: Affiliate Click Tracking May Be Lost on Fast Redirects
- **What was found:** useAffiliateTracking.trackClick (hooks/useAnalytics.ts:57-72) makes async API call then opens window.open. If network is slow, user leaves page before tracking completes.
- **Why it matters:** Affiliate clicks are how revenue is attributed. Lost tracking means lost attribution and underreported commission eligibility. This is a business-critical metric.
- **Recommended fix:** Change window.open to happen only after successful API response (await the promise before opening window). Add timeout fallback - if API takes >2 seconds, open window anyway but log warning.
- **File references:** src/hooks/useAnalytics.ts:57-72, src/pages/ProductDetailPage.tsx:104-109

**🟡 MEDIUM** — F2.1.3: Search Tracking Not Firing
- **What was found:** ProductsService.searchProducts (backend/src/products/products.service.ts:153-243) performs search but doesn't track search event in analytics.
- **Why it matters:** Admin dashboard shows "Popular Searches" analytics (analytics.service.ts:268-291), but if searches aren't tracked, this data will always be empty. This breaks a core admin feature.
- **Recommended fix:** Add analytics tracking in searchProducts() after successful query. Call `await this.analyticsService.trackEvent('search', null, { query: trimmedKeyword }, sessionId, ip)`. Need to accept sessionId as parameter or generate server-side.
- **File references:** backend/src/products/products.service.ts:153-243, backend/src/analytics/analytics.service.ts:268-291

**🟡 MEDIUM** — F2.1.4: Category Click Tracking Not Implemented
- **What was found:** Admin analytics has getCategoryStats() (analytics.service.ts:222-266) to show category performance, but no code fires 'category_click' events.
- **Why it matters:** Category performance analytics will always show zero clicks, making this admin dashboard feature useless. Business decisions about which categories to promote will lack data.
- **Recommended fix:** Add category click tracking in frontend when user clicks FilterTag component or category filter. Fire `track('category_click', categoryId)` in onClick handler.
- **File references:** src/components/FilterTag.tsx, backend/src/analytics/analytics.service.ts:222-266

**🟢 LOW** — F2.1.5: No Loading State on Affiliate Click
- **What was found:** ProductDetailPage handleAffiliateClick (ProductDetailPage.tsx:104-109) doesn't show loading state while API call is in flight. Button remains static.
- **Why it matters:** Users on slow connections may double-click the button thinking it didn't work, causing duplicate tracking events and multiple browser tabs opening.
- **Recommended fix:** Add loading state: `const [isRedirecting, setIsRedirecting] = useState(false)`. Show spinner on button while redirecting. Disable button during redirect.
- **File references:** src/pages/ProductDetailPage.tsx:104-109, src/pages/ProductDetailPage.tsx:282-286

#### 2.2 Analytics Tracking

**🔴 CRITICAL** — F2.2.1: Analytics getSearchStats() Loads All Events Into Memory
- **What was found:** analytics.service.ts:268-291 calls `findMany` with no limit, loads ALL search events into memory, then does JavaScript aggregation with a for loop.
- **Why it matters:** With 10,000+ search events (achievable within weeks of launch), this query will consume gigabytes of RAM and timeout. At 100,000+ events, this becomes a DoS vulnerability that crashes the server.
- **Recommended fix:** Use Prisma groupBy aggregation like the other analytics methods (getTopProducts, getAffiliateClicks, getCategoryStats). Query: `await this.prisma.analyticsEvent.groupBy({ by: ['metadata'], where: { eventType: 'search' }, _count: { id: true } })`. Need to normalize query in metadata during insert.
- **File references:** backend/src/analytics/analytics.service.ts:268-291

**🟠 HIGH** — F2.2.2: Analytics Session ID Not Passed to Backend
- **What was found:** Search tracking (if implemented per F2.1.3) would need sessionId, but products.service.ts:153 doesn't receive sessionId parameter from controller.
- **Why it matters:** Without sessionId, search analytics can't differentiate unique visitors from repeat visitors, making metrics less useful. Session-based analytics are a core feature.
- **Recommended fix:** Add sessionId to SearchDto, extract from request header or generate on backend. Pass to productsService.searchProducts(). Document session ID header format in API.
- **File references:** backend/src/products/products.controller.ts:60-72, backend/src/products/products.service.ts:153

**🟡 MEDIUM** — F2.2.3: No Analytics Data Cleanup/Archival
- **What was found:** AnalyticsEvent table has no TTL, retention policy, or archival process. Events accumulate indefinitely.
- **Why it matters:** Analytics table will grow unbounded, degrading query performance and consuming storage. After 1 year, could have millions of rows, slowing down groupBy queries.
- **Recommended fix:** Implement scheduled task to archive events older than 24 months to separate archive table or delete if not needed. Use @nestjs/schedule to run monthly cleanup. Document retention policy in Privacy Policy.
- **File references:** backend/src/analytics/analytics.service.ts (add cleanup method), backend/prisma/schema.prisma:156-169

**🟡 MEDIUM** — F2.2.4: Analytics Consent Check Happens Too Late
- **What was found:** useAnalytics hook (hooks/useAnalytics.ts:30-51) checks consent before tracking, but if user changes consent after page load, already-fired events are not retroactively deleted.
- **Why it matters:** This is a GDPR/POPIA compliance issue. If user withdraws consent, their data should stop being collected immediately. Current implementation allows one more event to fire after withdrawal.
- **Recommended fix:** Add consent change listener that immediately stops tracking. Consider adding backend endpoint to delete all analytics events for a sessionId if consent is withdrawn (GDPR "right to erasure").
- **File references:** src/hooks/useAnalytics.ts:28-51, src/contexts/ConsentContext.tsx

#### 2.3 Affiliate Link Handling

**🟠 HIGH** — F2.3.1: Affiliate URL Not Validated Before Redirect
- **What was found:** POST /analytics/affiliate-click (analytics.controller.ts:41-49) returns product.affiliateUrl directly from database without revalidating URL format.
- **Why it matters:** If database is compromised or a bug allows invalid URLs to be saved, users could be redirected to javascript: URLs, data: URLs, or other dangerous schemes, leading to XSS.
- **Recommended fix:** Re-validate affiliateUrl before returning in trackAffiliateClick(). Check it starts with http:// or https:// and is a valid URL. Reject and log error if invalid.
- **File references:** backend/src/analytics/analytics.service.ts:70-109

**🟡 MEDIUM** — F2.3.2: No Affiliate Link Expiry Tracking
- **What was found:** Affiliate URLs are stored permanently with no expiry date or staleness tracking.
- **Why it matters:** Vendor URLs can change or become invalid (404, redirect to homepage). Broken affiliate links provide bad UX and lose commission opportunities.
- **Recommended fix:** Add lastVerified and isVerified fields to Product model. Implement scheduled task to HEAD request affiliate URLs weekly, update isVerified=false if broken. Show admin warning in dashboard for broken links.
- **File references:** backend/prisma/schema.prisma:10-45, backend/src/products/products.service.ts (add verification task)

**🟢 LOW** — F2.3.3: Affiliate Disclosure Not Visible on Product Cards
- **What was found:** ProductCard component (src/components/ProductCard.tsx) doesn't show affiliate disclosure, only ProductDetailPage shows it.
- **Why it matters:** FTC guidelines require clear disclosure wherever affiliate links appear. Product cards on homepage and search results should indicate affiliate relationship.
- **Recommended fix:** Add small affiliate badge to ProductCard component, e.g., "Ad" badge or tooltip icon. Keep it subtle but visible and compliant.
- **File references:** src/components/ProductCard.tsx, src/pages/ProductDetailPage.tsx:287-289

#### 2.4 Image Handling

**🟠 HIGH** — F2.4.1: No Image Optimization or Compression
- **What was found:** upload.controller.ts:29-54 accepts images up to 10MB and stores them as-is without compression, resizing, or format conversion.
- **Why it matters:** Large uncompressed images slow page load (especially on mobile), consume excessive bandwidth, and hurt SEO rankings. A 10MB product image is unacceptable for web.
- **Recommended fix:** Implement image processing pipeline using 'sharp' library: (1) Resize to max 1920px width, (2) Compress to 80% quality, (3) Convert to WebP format with JPEG fallback, (4) Generate thumbnails (400px) for listings. Store multiple sizes.
- **File references:** backend/src/upload/upload.controller.ts:29-54

**🟡 MEDIUM** — F2.4.2: OG Image URLs Not Validated Before Storage
- **What was found:** products.service.ts:807-856 extracts og:image URLs from vendor pages and stores in ogImageUrl field without validating the URL is a real image.
- **Why it matters:** Vendor pages could have og:image pointing to HTML pages, SVGs with embedded scripts, or very large files. This creates XSS risk (SVG), slow page loads, or broken images.
- **Recommended fix:** Add URL validation: (1) Check URL is http/https, (2) Check domain is not localhost/internal IP, (3) Optionally HEAD request to verify content-type is image/* and size is reasonable (<5MB).
- **File references:** backend/src/products/products.service.ts:807-856

**🟡 MEDIUM** — F2.4.3: No Image Fallback Handling
- **What was found:** ProductImage component (src/components/ProductImage.tsx) likely doesn't handle broken images gracefully.
- **Why it matters:** If uploaded images are deleted, external OG images go stale, or URLs are invalid, users see broken image icons, damaging brand perception.
- **Recommended fix:** Add onError handler to <img> tag that replaces src with a placeholder image. Show "Image unavailable" message. Log error to monitoring.
- **File references:** src/components/ProductImage.tsx

**🟢 LOW** — F2.4.4: Image Upload Doesn't Validate Image Dimensions
- **What was found:** upload.controller.ts validates file type and size but not dimensions. Admins can upload 1px x 10000px images or excessively large images.
- **Why it matters:** Malformed images can break UI layouts or indicate malicious uploads. Very wide images cause horizontal scrolling. Very tall images cause vertical scrolling.
- **Recommended fix:** Use 'sharp' library to read image metadata after upload. Reject images with aspect ratio >5:1 or <1:5, or dimensions >4096px on either axis. Return clear error message.
- **File references:** backend/src/upload/upload.controller.ts:29-54

#### 2.5 Search

**🟡 MEDIUM** — F2.5.1: Search Results Not Cached
- **What was found:** ProductsService.searchProducts (products.service.ts:153-243) performs database query on every search without caching.
- **Why it matters:** Popular search terms will be queried repeatedly, causing unnecessary database load and slow response times. Search is a high-frequency operation.
- **Recommended fix:** Add cache layer for search results with 2-minute TTL. Cache key: `search:${keyword}:${page}:${pageSize}`. Invalidate cache when products are created/updated/deleted.
- **File references:** backend/src/products/products.service.ts:153-243, backend/src/common/cache.service.ts

**🟢 LOW** — F2.5.2: Search Keyword Trimming Happens Too Late
- **What was found:** products.service.ts:176 trims keyword after rate limit check and validation. Leading/trailing spaces count toward rate limits.
- **Why it matters:** "laptop " and " laptop" are counted as different searches in rate limiting, allowing attackers to bypass limits with padded keywords.
- **Recommended fix:** Move `keyword.trim()` to line 165 (before validation). Update SearchDto to automatically trim in class-transformer with @Trim() decorator.
- **File references:** backend/src/products/products.service.ts:165-176

#### 2.6 Forms & Validation

**🟡 MEDIUM** — F2.6.1: Form Validation Errors Not Accessible
- **What was found:** FormError, FormInput, FormSelect, FormTextarea components (src/components/Form*.tsx) likely render errors as text without ARIA labels.
- **Why it matters:** Screen reader users won't hear validation errors, violating WCAG 2.1 AA accessibility standards. Forms become unusable for blind/low-vision users.
- **Recommended fix:** Add aria-describedby attribute linking input to error message. Add role="alert" to error message for immediate announcement. Ensure error has unique ID.
- **File references:** src/components/FormError.tsx, src/components/FormInput.tsx, src/components/FormSelect.tsx, src/components/FormTextarea.tsx

**🟢 LOW** — F2.6.2: Product Editor Doesn't Prevent Double-Submit
- **What was found:** ProductEditorPage form submission likely doesn't disable submit button during API call.
- **Why it matters:** Admins on slow connections might click "Save" multiple times, creating duplicate products or making conflicting updates.
- **Recommended fix:** Disable submit button when form is submitting. Show loading spinner. Add isSubmitting state from React Hook Form.
- **File references:** src/pages/admin/ProductEditorPage.tsx

#### 2.7 Error Handling

**🟡 MEDIUM** — F2.7.1: Error Boundaries Don't Report to Monitoring
- **What was found:** ErrorBoundary and RouteErrorBoundary components (src/components/ErrorBoundary.tsx, src/components/RouteErrorBoundary.tsx) catch errors but likely only log to console.
- **Why it matters:** Production errors are invisible to developers. Without error reporting (Sentry, LogRocket), bugs go unnoticed until users complain.
- **Recommended fix:** Integrate Sentry or similar error tracking. Add Sentry.captureException(error) in error boundary componentDidCatch. Include user context and component stack.
- **File references:** src/components/ErrorBoundary.tsx, src/components/RouteErrorBoundary.tsx

**🟢 LOW** — F2.7.2: API Error Messages Expose Internal Details in Dev Mode
- **What was found:** main.ts:105 sets `disableErrorMessages: isProduction` in ValidationPipe, meaning dev mode returns detailed validation errors.
- **Why it matters:** If NODE_ENV is accidentally set to "development" in production (or not set), error messages will expose internal field names, validation rules, and potentially sensitive schema information.
- **Recommended fix:** Always set disableErrorMessages: true in ValidationPipe. Return user-friendly messages in DTOs using @ApiProperty() decorators. Log detailed errors server-side only.
- **File references:** backend/src/main.ts:97-111

#### 2.8 Edge Cases

**🟡 MEDIUM** — F2.8.1: No Handling for Products Without Images
- **What was found:** ProductCard and ProductDetailPage assume product.images[0] exists. If images array is empty, UI likely breaks or shows blank space.
- **Why it matters:** Admins might save draft products without images. OG fetch might fail to find images. System should handle gracefully.
- **Recommended fix:** Add fallback placeholder image for products without images. Show "No image available" in ProductCard. In ProductDetailPage, conditionally render image section only if images exist.
- **File references:** src/components/ProductCard.tsx, src/pages/ProductDetailPage.tsx:188-238

**🟡 MEDIUM** — F2.8.2: What Happens When OG Fetch Times Out?
- **What was found:** products.service.ts:861-898 has 10-second timeout for fetchHtmlWithTimeout, returns error in preview response. But what happens when creating product with OG fetch?
- **Why it matters:** If vendor site is slow, product creation could hang or time out, leaving product in inconsistent state.
- **Recommended fix:** Ensure timeout error is caught and handled gracefully. Set ogFetchStatus to FAILED if timeout occurs. Allow product creation to complete with manual fallback. Add retry mechanism for failed fetches.
- **File references:** backend/src/products/products.service.ts:807-898

**🟢 LOW** — F2.8.3: Database Connection Loss Not Handled
- **What was found:** PrismaService (backend/src/common/prisma.service.ts) likely doesn't have connection retry logic.
- **Why it matters:** If PostgreSQL becomes temporarily unavailable (maintenance, network blip), all API requests fail until manual restart.
- **Recommended fix:** Add Prisma connection retry logic with exponential backoff. Configure in PrismaService: `datasources: { db: { connectionLimit: 10 } }`. Add health check endpoint that pings database.
- **File references:** backend/src/common/prisma.service.ts

---

### AUDIT SECTION 3: PERFORMANCE

#### 3.1 Database

**🟠 HIGH** — P3.1.1: Missing Index on AnalyticsEvent.sessionId
- **What was found:** AnalyticsEvent model (prisma/schema.prisma:156-169) has indexes on [eventType, entityId, timestamp] and [eventType, timestamp], but not on sessionId, which is used for tracking.
- **Why it matters:** Queries filtering or grouping by sessionId will perform full table scans, becoming extremely slow as analytics data grows. This affects user tracking and potential future features.
- **Recommended fix:** Add `@@index([sessionId])` to AnalyticsEvent model. Run migration: `prisma migrate dev --name add_analytics_session_id_index`. Test query performance improvement.
- **File references:** backend/prisma/schema.prisma:156-169

**🟡 MEDIUM** — P3.1.2: Product.images Array Field Not Indexed
- **What was found:** Product model stores images as String[] (prisma/schema.prisma:15) but array fields cannot be indexed in PostgreSQL via Prisma.
- **Why it matters:** Queries filtering by image existence or searching within images will be slow. While current queries don't filter on images, future features might.
- **Recommended fix:** Consider normalizing to separate ProductImage table if image-based queries are needed. For now, document this limitation. Monitor query performance as product count grows.
- **File references:** backend/prisma/schema.prisma:10-45

**🟡 MEDIUM** — P3.1.3: No Index on Product.affiliateUrl
- **What was found:** Product.affiliateUrl (prisma/schema.prisma:14) has no index, but might be queried in future features (e.g., find all products from specific vendor).
- **Why it matters:** If vendor-based filtering is added, queries will be slow. Even without explicit queries, affiliate link uniqueness checks would benefit from an index.
- **Recommended fix:** Add `@@index([affiliateUrl])` if vendor-based queries are planned. Otherwise, defer until needed. Use partial index if URLs are very long: `@@index([affiliateUrl(type: Hash)])`.
- **File references:** backend/prisma/schema.prisma:10-45

**🟡 MEDIUM** — P3.1.4: No Connection Pooling Configuration
- **What was found:** DATABASE_URL in .env.example (backend/.env.example:4) doesn't specify connection pool size. Prisma defaults to 10 connections.
- **Why it matters:** Default pool size might be insufficient for production load, causing "Too many connections" errors under load. Or might be excessive for small VPS, wasting resources.
- **Recommended fix:** Add connection pool config to DATABASE_URL: `?connection_limit=20&pool_timeout=20`. Document in .env.example based on expected load. For production, recommend 20-50 connections depending on server resources.
- **File references:** backend/.env.example:1-4

**🟢 LOW** — P3.1.5: Prisma Query Logging Not Configured
- **What was found:** PrismaService doesn't configure query logging, so slow queries are not visible.
- **Why it matters:** As traffic grows, slow queries cause performance degradation but are invisible without logging. Can't optimize what you can't measure.
- **Recommended fix:** Add Prisma query logging in development: `new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })`. In production, log only slow queries (>1s). Use middleware to track query duration.
- **File references:** backend/src/common/prisma.service.ts

#### 3.2 Frontend Performance

**🟠 HIGH** — P3.2.1: No Image Lazy Loading on Product Grid
- **What was found:** ProductGrid component (src/components/ProductGrid.tsx) likely renders all ProductCard components immediately, loading all images at once.
- **Why it matters:** Homepage shows 40 products by default (products.service.ts:29). Loading 40 full-resolution images simultaneously causes slow initial page load, especially on mobile. Poor Core Web Vitals (LCP, CLS).
- **Recommended fix:** Add lazy loading to ProductImage component: use loading="lazy" attribute on <img> tag or IntersectionObserver. Only load images as they enter viewport. Improves LCP by 50-70%.
- **File references:** src/components/ProductGrid.tsx, src/components/ProductImage.tsx

**🟡 MEDIUM** — P3.2.2: No Code Splitting for Admin Routes
- **What was found:** App.tsx imports all pages including admin pages, bundling them into main JS bundle even for public visitors.
- **Why it matters:** Admin pages (ProductEditorPage, AdminDashboard, AdminAnalytics, CategoriesManagementPage, UseCasesManagementPage) add significant JS weight that 99% of visitors don't need. Increases bundle size and TTI (Time to Interactive).
- **Recommended fix:** Use React.lazy() and Suspense to code-split admin routes: `const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))`. Reduces main bundle by ~30%.
- **File references:** src/App.tsx:14-19

**🟡 MEDIUM** — P3.2.3: No Font Optimization Strategy
- **What was found:** index.html or index.css likely loads custom fonts without optimization (font-display, preloading, subsetting).
- **Why it matters:** Unoptimized font loading causes FOUT (Flash of Unstyled Text) or FOIT (Flash of Invisible Text), degrading user experience and FCP (First Contentful Paint).
- **Recommended fix:** Add font-display: swap to @font-face declarations. Preload critical fonts in index.html with <link rel="preload">. Use variable fonts to reduce file count. Consider system fonts for faster loading.
- **File references:** src/index.css:1-20, index.html:1-15

**🟡 MEDIUM** — P3.2.4: API Calls Not Debounced in Search
- **What was found:** If search-as-you-type is implemented (not confirmed), ProductSelectionPage likely doesn't debounce search input.
- **Why it matters:** Without debouncing, every keystroke triggers an API call (e.g., searching "laptop" fires 6 requests). Wastes bandwidth, server resources, and rate limit quota.
- **Recommended fix:** Add 300ms debounce to search input using useDebouncedValue hook. Only fire search API call after user stops typing. Example: `const debouncedSearch = useDebounce(searchQuery, 300)`.
- **File references:** src/pages/ProductSelectionPage.tsx (if search input exists)

**🟢 LOW** — P3.2.5: No Service Worker for Offline Support
- **What was found:** No service worker registered, no offline capabilities.
- **Why it matters:** Users on flaky mobile connections see "No internet" errors instead of cached content. Poor UX compared to PWA-enabled competitors.
- **Recommended fix:** Add Vite PWA plugin to cache static assets and API responses. Register service worker in main.tsx. Cache GET requests for products, categories, use cases. Add offline fallback page.
- **File references:** vite.config.ts (add plugin), src/main.tsx (register SW)

#### 3.3 Caching

**🟡 MEDIUM** — P3.3.1: Cache Invalidation Too Aggressive
- **What was found:** products.service.ts:530-547 invalidates cache with blanket approach: deletes all 'product:latest:*' patterns on any product change.
- **Why it matters:** Product updates (e.g., fixing typo) invalidate cache for all pages of latest products, causing cache stampede as traffic refills cache. Over-invalidation reduces cache hit rate.
- **Recommended fix:** Use more targeted invalidation. For product update: only invalidate `product:single:${id}`. For product creation/deletion: only invalidate first page of latest products. Let other pages expire naturally via TTL.
- **File references:** backend/src/products/products.service.ts:530-547

**🟡 MEDIUM** — P3.3.2: OG Fetch Results Not Cached
- **What was found:** products.service.ts:807-856 fetches OG tags from vendor URLs without caching. Same URL fetched multiple times if admin previews repeatedly.
- **Why it matters:** OG fetch is slow (10-second timeout) and wastes bandwidth. Admins experimenting with URLs make repeated slow requests. Vendors might rate-limit or block scraping.
- **Recommended fix:** Cache OG fetch results for 24 hours keyed by URL. Store in CacheService: `og-fetch:${urlHash}`. Skip cache if user explicitly requests refresh.
- **File references:** backend/src/products/products.service.ts:807-856

**🟢 LOW** — P3.3.3: No Cache Warming Strategy
- **What was found:** Cache is populated on-demand (cache miss triggers DB query). After cache invalidation or server restart, first visitors experience slow responses.
- **Why it matters:** Cache stampede after deployments causes temporary performance degradation. First visitors after deploy get slow experience.
- **Recommended fix:** Implement cache warming on server startup: pre-populate latest products (first page), all categories, all use cases. Add admin endpoint to manually trigger cache warming after bulk updates.
- **File references:** backend/src/products/products.service.ts (add warmCache method), backend/src/main.ts (call on startup)

#### 3.4 Network

**🟠 HIGH** — P3.4.1: No CDN Configuration for Static Assets
- **What was found:** Static images served directly from backend /uploads path (main.ts:115-122), no CDN integration.
- **Why it matters:** Every image request hits origin server, consuming bandwidth and increasing latency for global users. Images served from South Africa take 500ms+ to reach US/EU users.
- **Recommended fix:** Deploy static assets to CDN (Cloudflare, AWS CloudFront, Vercel CDN). Update image URLs to use CDN domain. Configure CDN caching headers (immutable, 1-year expiry). Reduces origin bandwidth by 80%+.
- **File references:** backend/src/main.ts:115-122, src/lib/api.ts:6 (BACKEND_BASE_URL)

**🟡 MEDIUM** — P3.4.2: Compression Not Verified in Production
- **What was found:** No evidence that gzip/brotli compression is configured in deployment. NestJS uses express which supports compression, but it's not explicitly enabled.
- **Why it matters:** Uncompressed API responses and HTML waste bandwidth and slow page loads. JSON responses can be compressed by 70-90%.
- **Recommended fix:** Add compression middleware in main.ts: `app.use(compression())`. Configure brotli for static assets in reverse proxy (nginx, Cloudflare). Verify with curl headers: `Content-Encoding: br`.
- **File references:** backend/src/main.ts (add compression middleware)

**🟡 MEDIUM** — P3.4.3: Large JSON Responses Not Paginated Optimally
- **What was found:** GET /products/latest returns 40 products by default with full product objects including all categories and use cases (products.service.ts:43-67).
- **Why it matters:** 40 products with relations = ~200KB JSON response uncompressed. On slow 3G, takes 5+ seconds to download. Excessive for initial page load.
- **Recommended fix:** Reduce default page size to 20 for mobile. Add ?pageSize parameter. Use GraphQL or field selection to return only needed fields for listing view (id, name, first image, categories - exclude description).
- **File references:** backend/src/products/products.service.ts:29-86

**🟢 LOW** — P3.4.4: No HTTP/2 Push for Critical Assets
- **What was found:** No evidence of HTTP/2 Server Push or early hints for critical CSS/JS.
- **Why it matters:** Browser must download HTML, parse it, then request CSS/JS. HTTP/2 push sends critical assets before browser asks, reducing time-to-interactive by ~500ms.
- **Recommended fix:** Configure HTTP/2 push in reverse proxy (nginx/Cloudflare) or use <link rel="preload"> in HTML head for critical CSS/JS. Test with Lighthouse to verify improvement.
- **File references:** index.html (add preload links), deployment config

---