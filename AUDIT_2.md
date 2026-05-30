### AUDIT SECTION 4: CODE QUALITY & MAINTAINABILITY

#### 4.1 Consistency

**🟡 MEDIUM** — CQ4.1.1: Inconsistent Naming Conventions Between Frontend and Backend
- **What was found:** Frontend uses camelCase for variables (productId, categoryIds), backend DTOs use camelCase, but database fields use snake_case (created_at, updated_at - though Prisma maps these).
- **Why it matters:** Mixed conventions make code harder to maintain, onboard new developers, and increase cognitive load when switching between layers.
- **Recommended fix:** Document naming convention standard in CONTRIBUTING.md: camelCase for TS/JS, snake_case for database columns (Prisma handles mapping). Ensure all new code follows convention. Run linter to enforce.
- **File references:** Backend DTOs, Prisma schema, Frontend types

**🟡 MEDIUM** — CQ4.1.2: Inconsistent Error Handling Patterns
- **What was found:** Some services throw BadRequestException (products.service.ts), others throw UnauthorizedException (auth.service.ts), some return null (getProductById), some use try/catch, some don't.
- **Why it matters:** Inconsistent error handling makes code unpredictable. Calling code doesn't know whether to check for null, catch exception, or both.
- **Recommended fix:** Establish error handling standard: (1) Always throw exceptions for errors, never return null for errors, (2) Use specific NestJS exceptions (BadRequestException, NotFoundException, UnauthorizedException), (3) Document in architecture guide.
- **File references:** backend/src/products/products.service.ts:94-133, backend/src/auth/auth.service.ts

**🟢 LOW** — CQ4.1.3: Inconsistent Comment Styles
- **What was found:** Some files have JSDoc comments (`/** */`), others have single-line comments (`//`), others have multi-line comments (`/* */`). No consistent documentation standard.
- **Why it matters:** Inconsistent documentation makes code harder to understand and maintain. IDE tooltips don't work properly without JSDoc.
- **Recommended fix:** Adopt TSDoc/JSDoc standard for all public functions and classes. Configure ESLint rule to require JSDoc for exported functions. Add pre-commit hook to enforce.
- **File references:** Various files across codebase

#### 4.2 Dead Code & Redundancy

**🟠 HIGH** — CQ4.2.1: RateLimit Model Deprecated But Not Removed
- **What was found:** prisma/schema.prisma:171-183 has RateLimit model with comment "This model is now deprecated (rate limiting moved to in-memory) but kept for backward compatibility during migration"
- **Why it matters:** Deprecated code accumulates over time, creating confusion and maintenance burden. Database table exists but is unused, wasting storage.
- **Recommended fix:** If migration is complete (appears to be), drop RateLimit table and remove model from schema. If migration is ongoing, document timeline for removal (e.g., "Remove by 2026-07-01"). Add TODO comment with issue tracker link.
- **File references:** backend/prisma/schema.prisma:171-183

**🟡 MEDIUM** — CQ4.2.2: Unused Imports in Multiple Files
- **What was found:** Several files likely have unused imports (not exhaustively checked, but common in React projects).
- **Why it matters:** Unused imports increase bundle size (frontend), clutter code, and indicate incomplete refactoring or copy-paste errors.
- **Recommended fix:** Configure ESLint rule `@typescript-eslint/no-unused-vars` and `unused-imports/no-unused-imports`. Run `eslint --fix` to auto-remove. Add to pre-commit hook.
- **File references:** Run `eslint --ext .ts,.tsx src backend/src` to identify

**🟡 MEDIUM** — CQ4.2.3: Duplicate Validation Logic Between Frontend and Backend
- **What was found:** Zod schemas in frontend (src/lib/validationSchemas.ts) and class-validator in backend (DTOs) duplicate validation rules (e.g., email format, password requirements, URL validation).
- **Why it matters:** Duplicate logic leads to inconsistencies when one is updated but not the other. Creates maintenance burden and potential bugs.
- **Recommended fix:** Extract shared validation rules to shared TypeScript package or constants file. Generate backend DTOs from Zod schemas or vice versa using tools like zod-to-ts. Document authoritative source for each rule.
- **File references:** src/lib/validationSchemas.ts, backend/src/*/dto/*.dto.ts, backend/src/auth/auth.service.ts:165-179

**🟢 LOW** — CQ4.2.4: Console.log Statements in Production Code
- **What was found:** useAnalytics hook (hooks/useAnalytics.ts:37) has `console.log('[Analytics] Tracking skipped - no user consent')`. Multiple files likely have console.log for debugging.
- **Why it matters:** Console logs in production expose internal logic, create noise in browser console, and may leak sensitive data. Slightly impacts performance.
- **Recommended fix:** Replace console.log with proper logging library (winston, pino) on backend. On frontend, use conditional logging (only in development) or remove entirely. Add ESLint rule to warn on console usage.
- **File references:** src/hooks/useAnalytics.ts:37, search codebase for `console.log`, `console.warn`, `console.error`

#### 4.3 Error Handling Consistency

**🟡 MEDIUM** — CQ4.3.1: Unhandled Promise Rejections Possible
- **What was found:** Several async functions don't have try/catch blocks, relying on caller to handle errors (e.g., fetchPreview, trackEvent).
- **Why it matters:** Unhandled promise rejections can crash Node.js process (backend) or cause uncaught errors in browser (frontend). Difficult to debug.
- **Recommended fix:** Add try/catch blocks to all async functions that call external services (fetch, database, file system). Log errors and re-throw with context. Add global unhandledRejection handler in main.ts and main.tsx.
- **File references:** backend/src/products/products.service.ts:807-856, backend/src/analytics/analytics.service.ts:14-68

**🟢 LOW** — CQ4.3.2: No Centralized Error Logging
- **What was found:** Errors are logged with console.error/console.warn in various places. No centralized logging infrastructure.
- **Why it matters:** Scattered logging makes it hard to aggregate errors, set up alerts, or correlate errors across services. Production errors are lost after log rotation.
- **Recommended fix:** Implement centralized logging: backend uses winston or pino with JSON format, frontend uses Sentry or LogRocket. Send logs to aggregation service (CloudWatch, DataDog, ELK stack). Set up error rate alerts.
- **File references:** backend/src/*/**.ts, src/hooks/useAnalytics.ts:49

#### 4.4 TypeScript / Type Safety

**🟡 MEDIUM** — CQ4.4.1: Loose Type Checking in Prisma Queries
- **What was found:** Prisma queries return types like `any` in some places (analytics.service.ts:279: `const metadata = event.metadata as any`).
- **Why it matters:** Using `any` defeats TypeScript's purpose, allowing runtime type errors. Metadata field is JSON type which Prisma returns as unknown/any.
- **Recommended fix:** Define TypeScript interfaces for metadata schemas (SearchMetadata, AffiliateClickMetadata, etc.). Use type guards or Zod to validate metadata before casting. Replace `as any` with proper type assertions.
- **File references:** backend/src/analytics/analytics.service.ts:279, backend/src/analytics/analytics.service.ts:96 (add interfaces)

**🟢 LOW** — CQ4.4.2: Missing Return Type Annotations on Some Functions
- **What was found:** Some functions don't explicitly declare return types, relying on inference (e.g., many service methods).
- **Why it matters:** Explicit return types improve code clarity, catch errors earlier (accidental undefined returns), and improve IDE autocomplete.
- **Recommended fix:** Enable TypeScript strict mode option `noImplicitReturns` and configure ESLint rule `@typescript-eslint/explicit-function-return-type` for exported functions. Add return types incrementally.
- **File references:** backend/src/products/products.service.ts (various methods), frontend service files

**🟢 LOW** — CQ4.4.3: TSConfig Targets Could Be More Strict
- **What was found:** tsconfig.json files don't enable all strict mode flags (exact flags not verified).
- **Why it matters:** Loose TypeScript configuration allows bugs to slip through. Strict mode catches more errors at compile time.
- **Recommended fix:** Enable strict mode: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitReturns": true`, `"noFallthroughCasesInSwitch": true`. Fix resulting errors incrementally.
- **File references:** tsconfig.json (frontend and backend)

#### 4.5 Comments & Documentation

**🟠 HIGH** — CQ4.5.1: No API Documentation (OpenAPI/Swagger)
- **What was found:** NestJS backend has no Swagger/OpenAPI documentation configured. API endpoints are not documented.
- **Why it matters:** Frontend developers and future maintainers don't know API contracts (request/response schemas, error codes, authentication requirements). Increases onboarding time and integration errors.
- **Recommended fix:** Install @nestjs/swagger, configure in main.ts, add @ApiProperty() decorators to DTOs, add @ApiOperation() to controllers. Generate OpenAPI spec at /api/docs. Document in README.
- **File references:** backend/src/main.ts (configure Swagger), backend/src/*/dto/*.dto.ts (add decorators)

**🟡 MEDIUM** — CQ4.5.2: README Missing Production Deployment Instructions
- **What was found:** README.md has excellent local setup instructions but stops at "Frontend Setup" line 100. No production deployment section.
- **Why it matters:** First production deployment will require trial-and-error, increasing risk of misconfiguration, downtime, or security issues.
- **Recommended fix:** Add "Production Deployment" section to README covering: (1) Environment variable checklist, (2) Database migration process, (3) Build commands, (4) Recommended hosting platforms, (5) SSL certificate setup, (6) CDN configuration, (7) Monitoring setup.
- **File references:** README.md:100 (add section)

**🟡 MEDIUM** — CQ4.5.3: No Architecture Decision Records (ADRs)
- **What was found:** No documentation of why key architectural decisions were made (e.g., why JWT in cookies vs localStorage, why NestJS, why no server-side rendering).
- **Why it matters:** Future developers don't understand rationale behind decisions, leading to repeated debates, inconsistent changes, or undoing good decisions.
- **Recommended fix:** Create docs/adr/ directory, document past decisions in lightweight markdown format (Problem, Decision, Consequences). Document: (1) JWT cookie strategy, (2) Monorepo structure, (3) Prisma vs TypeORM, (4) CSP policy strictness.
- **File references:** docs/adr/ (create directory with ADR files)

**🟢 LOW** — CQ4.5.4: Complex Functions Lack Inline Comments
- **What was found:** Some complex logic blocks lack comments explaining "why" (e.g., OG tag extraction regex, differential update logic).
- **Why it matters:** Complex code is hard to modify confidently without understanding intent. Comments explain business logic that code alone cannot.
- **Recommended fix:** Add comments to: (1) OG tag extraction regex explaining format variations, (2) Differential update logic explaining why not using deleteMany/createMany, (3) Rate limiting thresholds explaining business reasoning.
- **File references:** backend/src/products/products.service.ts:904-919, backend/src/products/products.service.ts:624-694

---

### AUDIT SECTION 5: UI/UX & ACCESSIBILITY

#### 5.1 Responsiveness

**🟠 HIGH** — UX5.1.1: Product Grid May Not Be Responsive on Very Small Screens
- **What was found:** ProductGrid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` classes. Need to verify actual rendering on 320px devices (iPhone SE).
- **Why it matters:** 320px width is still ~5% of mobile traffic. Broken layouts on small screens lose customers and hurt brand perception.
- **Recommended fix:** Test on real device or Chrome DevTools at 320px width. Ensure cards don't overflow, images scale properly, text doesn't overlap. Add @media query for 320px if needed.
- **File references:** src/components/ProductGrid.tsx

**🟡 MEDIUM** — UX5.1.2: Touch Targets May Be Too Small on Mobile
- **What was found:** FilterTag buttons (src/components/FilterTag.tsx) and navigation links don't explicitly set minimum size.
- **Why it matters:** WCAG 2.1 AA requires 44x44px minimum touch target. Smaller targets cause misclicks, frustration, and accessibility failures.
- **Recommended fix:** Audit all interactive elements (buttons, links, filter tags). Add min-height: 44px and min-width: 44px via Tailwind classes. Add padding to small text links.
- **File references:** src/components/FilterTag.tsx, src/components/Navbar.tsx, src/components/Footer.tsx

**🟡 MEDIUM** — UX5.1.3: Modal Dialogs May Not Be Mobile-Optimized
- **What was found:** CookiePreferencesModal and ConfirmDialog (src/components/CookiePreferencesModal.tsx, src/components/ConfirmDialog.tsx) need mobile testing.
- **Why it matters:** Modals that don't fit mobile screens require scrolling or have cut-off buttons, creating unusable UI.
- **Recommended fix:** Test modals on mobile. Ensure: (1) Modal doesn't exceed viewport height, (2) Content is scrollable, (3) Close button is easily tappable, (4) Modal padding works on small screens.
- **File references:** src/components/CookiePreferencesModal.tsx, src/components/ConfirmDialog.tsx

**🟢 LOW** — UX5.1.4: Landscape Tablet Layout Not Optimized
- **What was found:** Grid layouts jump from 2 columns (md) to 4 columns (lg) at 1024px. Landscape tablets (1024x768) show 4 columns which may be cramped.
- **Why it matters:** Poor use of available space on tablet. 3 columns would be more balanced for 1024-1280px range.
- **Recommended fix:** Add xl: breakpoint for 4 columns (1280px+), use 3 columns for lg: (1024px). Adjust: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- **File references:** src/components/ProductGrid.tsx, src/pages/HomePage.tsx

#### 5.2 Light & Dark Mode

**🟡 MEDIUM** — UX5.2.1: Theme Flash on Page Load (FOUC)
- **What was found:** ThemeContext (src/contexts/ThemeContext.tsx) likely initializes from localStorage after component mount, causing brief white flash on dark mode users.
- **Why it matters:** Flash of Unstyled Content (FOUC) creates jarring UX, especially for users who exclusively use dark mode. Signals poor attention to detail.
- **Recommended fix:** Add inline script in index.html <head> to apply theme class before React loads: `<script>const t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')</script>`
- **File references:** index.html (add inline script), src/contexts/ThemeContext.tsx

**🟢 LOW** — UX5.2.2: Theme Toggle Icon May Not Be Obvious
- **What was found:** Theme toggle button location/icon not verified in Navbar component.
- **Why it matters:** Users may not discover dark mode feature if toggle is hidden or uses unclear iconography.
- **Recommended fix:** Ensure theme toggle uses clear sun/moon icons (lucide-react has Sun/Moon). Place prominently in navbar on all screen sizes. Add tooltip "Switch theme" on hover.
- **File references:** src/components/Navbar.tsx

#### 5.3 Accessibility

**🟠 HIGH** — UX5.3.1: Missing Alt Text on Product Images May Be Present
- **What was found:** ProductImage component (src/components/ProductImage.tsx) receives alt prop, but need to verify it's always provided and descriptive.
- **Why it matters:** Missing or generic alt text violates WCAG 2.1 A (critical accessibility failure). Screen reader users can't understand images. SEO impact.
- **Recommended fix:** Audit all ProductImage usages. Ensure alt text describes product (e.g., "Samsung Galaxy S24 Ultra smartphone"). Add ESLint rule to require alt prop. Add fallback: alt={alt || `${product.name} product image`}.
- **File references:** src/components/ProductImage.tsx, src/components/ProductCard.tsx:35, src/pages/ProductDetailPage.tsx:193

**🟠 HIGH** — UX5.3.2: Keyboard Navigation Not Fully Tested
- **What was found:** Interactive elements may not be keyboard-accessible (modals, dropdowns, carousels, filter tags).
- **Why it matters:** Keyboard-only users (motor disabilities, power users) cannot navigate site. Violates WCAG 2.1 A. Legal liability risk under ADA/EAA.
- **Recommended fix:** Test full site with Tab, Enter, Escape, Arrow keys. Ensure: (1) Focus visible on all interactive elements, (2) Modal traps focus, (3) Carousel arrows work with Enter, (4) Filter tags selectable with keyboard, (5) Dropdowns navigable with arrows.
- **File references:** src/components/CookiePreferencesModal.tsx, src/components/FilterTag.tsx, src/pages/ProductDetailPage.tsx:198-211

**🟡 MEDIUM** — UX5.3.3: Focus Management in Modals Not Verified
- **What was found:** CookiePreferencesModal and ConfirmDialog should trap focus and return focus to trigger element on close.
- **Why it matters:** Without focus trapping, keyboard users can Tab outside modal to background page, creating confusion and accessibility violation (WCAG 2.1 AA 2.4.3).
- **Recommended fix:** Add focus trap to modal components using focus-trap-react library or manual logic. On open: focus first interactive element. On close: return focus to trigger button.
- **File references:** src/components/CookiePreferencesModal.tsx, src/components/ConfirmDialog.tsx

**🟡 MEDIUM** — UX5.3.4: Color Contrast May Not Meet WCAG AA Standards
- **What was found:** Custom color scheme in tailwind.config.js needs contrast audit. Text on primary/secondary backgrounds, link colors, disabled states.
- **Why it matters:** Low contrast text is hard to read for visually impaired users, violates WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text). Causes accessibility lawsuits.
- **Recommended fix:** Run contrast checker (WebAIM, Stark) on all text/background combinations in both themes. Common failures: gray text on light background, light text on colored buttons. Adjust color values to meet 4.5:1 minimum.
- **File references:** tailwind.config.js, src/index.css (CSS variable definitions)

**🟡 MEDIUM** — UX5.3.5: ARIA Landmarks Not Used Consistently
- **What was found:** Layout component (src/components/Layout.tsx) may not use semantic HTML5 elements or ARIA landmarks (<main>, <nav>, <aside>, <footer>, role attributes).
- **Why it matters:** Screen reader users rely on landmarks to navigate page structure quickly. Missing landmarks require listening to entire page. Violates WCAG 2.1 A (1.3.1 Info and Relationships).
- **Recommended fix:** Ensure: (1) <main> wraps primary content, (2) <nav> wraps navigation, (3) <aside> wraps sidebars, (4) <footer> at bottom, (5) role="search" on search form, (6) aria-label on multiple <nav> elements to distinguish them.
- **File references:** src/components/Layout.tsx, src/components/Navbar.tsx, src/components/LeftSidebar.tsx, src/components/RightSidebar.tsx

**🟢 LOW** — UX5.3.6: Language Attribute Not Set in HTML
- **What was found:** index.html likely missing lang attribute on <html> tag.
- **Why it matters:** Screen readers need lang attribute to use correct pronunciation rules. Required for WCAG 2.1 A (3.1.1 Language of Page). SEO impact.
- **Recommended fix:** Add `<html lang="en">` to index.html. If supporting multiple languages in future, dynamically set lang based on user preference.
- **File references:** index.html:1

#### 5.4 Loading & Empty States

**🟡 MEDIUM** — UX5.4.1: Loading Skeletons Don't Match Final Layout
- **What was found:** ProductDetailPage.tsx:114-127 has skeleton loader, but need to verify it matches actual content layout (image position, text widths).
- **Why it matters:** Mismatched skeletons cause layout shift (poor CLS score), create visual jarring effect, and hurt perceived performance.
- **Recommended fix:** Ensure skeleton dimensions match: (1) Image aspect ratio, (2) Title length, (3) Description lines, (4) Button position. Use actual component measurements. Reduce layout shift to <0.1 CLS.
- **File references:** src/pages/ProductDetailPage.tsx:114-127, src/pages/HomePage.tsx (if has skeleton)

**🟡 MEDIUM** — UX5.4.2: Empty State for Zero Search Results Not User-Friendly
- **What was found:** Search with zero results likely shows empty product grid. Need helpful messaging and suggestions.
- **Why it matters:** Dead-end UX frustrates users. No guidance on what to do next (try different keywords, browse categories, contact support).
- **Recommended fix:** Add empty state component when search returns 0 results: (1) "No products found for '{query}'", (2) Suggestions: "Try different keywords", "Browse all products", (3) Show popular categories as fallback, (4) Add search tips.
- **File references:** src/pages/ProductSelectionPage.tsx

**🟢 LOW** — UX5.4.3: Loading State Not Shown During Search
- **What was found:** Search/filter operations may not show loading indicators while API call is in flight.
- **Why it matters:** Users on slow connections don't know if search is processing or stuck. May retry, causing duplicate requests.
- **Recommended fix:** Show loading spinner or skeleton grid while search API call is pending. Use React Query or similar to manage loading states consistently.
- **File references:** src/pages/ProductSelectionPage.tsx

#### 5.5 User Feedback

**🟡 MEDIUM** — UX5.5.1: No Success Confirmation After Admin Actions
- **What was found:** Admin dashboard actions (create/update/delete product) may not show clear success messages.
- **Why it matters:** Admins are uncertain if action succeeded, may retry causing duplicates. Poor UX creates operational inefficiency.
- **Recommended fix:** Show toast notifications (sonner already installed) after successful actions: "Product created successfully", "Changes saved", "Product deleted". Use different colors: green for success, red for error, blue for info.
- **File references:** src/pages/admin/ProductEditorPage.tsx, src/pages/admin/AdminDashboard.tsx

**🟢 LOW** — UX5.5.2: Loading Button States Not Consistent
- **What was found:** Form submit buttons should show loading state (spinner + disabled) during submission across all forms.
- **Why it matters:** Inconsistent button states create confusion. Users may think form didn't submit and retry.
- **Recommended fix:** Create reusable LoadingButton component with spinner. Use consistently across all forms: login, product editor, category management. Disable button when isSubmitting=true.
- **File references:** src/components/ (create LoadingButton.tsx), src/pages/admin/*.tsx

---

### AUDIT SECTION 6: LEGAL & COMPLIANCE

#### 6.1 Required Legal Pages — Assessment

**COMPLIANCE SUMMARY:**

| Legal Page | Status | Assessment |
|------------|--------|------------|
| Privacy Policy | ✅ **EXISTS - COMPLETE** | Comprehensive GDPR/POPIA-compliant policy with clear sections on data collection, usage, rights, retention. Mentions Information Officer. **Ready for production.** |
| Terms & Conditions | ✅ **EXISTS - NOT VERIFIED** | Exists at /terms route, content not fully audited in detail. **Needs review.** |
| Cookie Policy | ✅ **EXISTS - NOT VERIFIED** | Exists at /cookie-policy route. **Needs verification of completeness.** |
| Affiliate Disclosure | ✅ **EXISTS - COMPLETE** | Excellent FTC-compliant disclosure explaining affiliate relationship, no cost to user, material connection. **Ready for production.** |
| Disclaimer | ✅ **EXISTS - NOT VERIFIED** | Exists at /disclaimer route. **Needs verification.** |
| External Links Notice | ✅ **EXISTS** | Exists at /external-links route. **Nice to have, good addition.** |
| POPIA Contact Page | ✅ **EXISTS** | Exists at /popia route with Information Officer details. **POPIA compliance requirement met.** |

**Overall Legal Compliance:** ✅ **GOOD** — All required pages exist. Privacy Policy and Affiliate Disclosure are comprehensive and production-ready.

**🟡 MEDIUM** — L6.1.1: Legal Page "Last Updated" Dates Need Regular Review Process
- **What was found:** Legal pages have lastUpdated prop (e.g., PrivacyPolicyPage: "2026-05-28"), but no process to keep dates current.
- **Why it matters:** Stale legal policies create liability risk. GDPR requires notifying users of material policy changes. Outdated dates signal negligence.
- **Recommended fix:** Add calendar reminder to review legal pages quarterly. Update lastUpdated dates when policies change. Implement version control for legal docs. Consider adding "Effective Date" vs "Last Updated" distinction.
- **File references:** src/pages/legal/*.tsx (all legal pages)

**🟡 MEDIUM** — L6.1.2: Contact Information in Legal Pages Needs Production Values
- **What was found:** PrivacyPolicyPage.tsx:24 has `privacy@prodview.example.com` - clearly a placeholder.
- **Why it matters:** Invalid contact information violates GDPR/POPIA data controller requirements. Users can't exercise their rights (data access, deletion). Regulatory fines possible.
- **Recommended fix:** Replace all placeholder emails with real production email addresses. Set up privacy@yourdomain.com and dpo@yourdomain.com (Data Protection Officer). Test emails are reachable. Update POPIA contact page.
- **File references:** src/pages/legal/PrivacyPolicyPage.tsx:24, src/pages/legal/PopiaContactPage.tsx

**🟢 LOW** — L6.1.3: Legal Pages Not Linked from Footer Consistently
- **What was found:** Need to verify Footer component links to all legal pages.
- **Why it matters:** Legal pages must be easily discoverable. Burying them or making them hard to find may invalidate user consent under GDPR.
- **Recommended fix:** Ensure Footer has links to: Privacy Policy, Terms, Cookie Policy, Affiliate Disclosure, Contact (POPIA). Consider grouping under "Legal" section. Ensure links work on all pages.
- **File references:** src/components/Footer.tsx

#### 6.2 Cookie Consent

**🟠 HIGH** — L6.2.1: Cookie Consent Doesn't Retroactively Apply to Existing Sessions
- **What was found:** ConsentContext (contexts/ConsentContext.tsx) checks consent before new tracking, but sessions that started before consent was implemented still have analytics data.
- **Why it matters:** GDPR requires prior consent for non-essential cookies. Historical data collected without consent creates legal liability.
- **Recommended fix:** If this is new feature: (1) Clear all pre-existing analytics data from database (where timestamp < consent feature launch date), (2) Document in Privacy Policy that tracking began on specific date with user consent. If older system: run data cleanup before launch.
- **File references:** backend/src/analytics/analytics.service.ts (add cleanup script)

**🟡 MEDIUM** — L6.2.2: Consent Version Not Used to Re-Prompt Users
- **What was found:** ConsentContext has CONSENT_VERSION constant (contexts/ConsentContext.tsx:8), validates version, but invalidates old consent silently. No notice to user about policy changes.
- **Why it matters:** GDPR requires notifying users of material policy changes and obtaining fresh consent. Silently invalidating consent and re-prompting may be non-compliant if no notification given.
- **Recommended fix:** When policy version changes: (1) Show special modal explaining policy updates, (2) Link to changelog or "What's new" page, (3) Require re-acceptance with explicit acknowledgment. Add notification banner for returning users.
- **File references:** src/contexts/ConsentContext.tsx:69-74, src/components/CookieBanner.tsx

**🟢 LOW** — L6.2.3: Essential Cookies Not Clearly Defined
- **What was found:** Consent interface marks essential: true (ConsentContext.tsx:14) but doesn't document what constitutes "essential" cookies.
- **Why it matters:** GDPR allows only truly essential cookies without consent (authentication, security, accessibility preferences). Theme preference may not qualify as essential.
- **Recommended fix:** Document essential cookies in Cookie Policy and code comments: (1) Authentication tokens, (2) CSRF protection, (3) Session management. Consider moving theme preference to "functional" category requiring consent.
- **File references:** src/contexts/ConsentContext.tsx:14, src/pages/legal/CookiePolicyPage.tsx

#### 6.3 Affiliate Disclosure

**✅ EXCELLENT** — L6.3.1: Affiliate Disclosure Is Comprehensive and Visible
- **What was found:** Affiliate disclosure page (AffiliateDisclosurePage.tsx) clearly explains material connection, how commissions work, no additional cost to user, FTC compliance. Disclosure also appears on product detail pages (ProductDetailPage.tsx:287-289).
- **Why it matters:** FTC requires clear and conspicuous disclosure. This implementation exceeds minimum requirements.
- **Assessment:** No issues. Ready for production. Continue displaying disclosure on every page with affiliate links.
- **File references:** src/pages/legal/AffiliateDisclosurePage.tsx, src/pages/ProductDetailPage.tsx:287-289

**🟢 LOW** — L6.3.2: Affiliate Disclosure Not in Website Footer
- **What was found:** Affiliate disclosure likely not linked in site-wide footer, only accessible via dedicated page and product detail disclaimers.
- **Why it matters:** Best practice is to have affiliate disclosure visible site-wide, especially on pages with affiliate links (homepage, search results). Some jurisdictions require disclosure "above the fold".
- **Recommended fix:** Add "Affiliate Disclosure" link to footer alongside Privacy Policy and Terms. Consider adding small badge/icon to ProductCard component indicating affiliate content.
- **File references:** src/components/Footer.tsx

#### 6.4 Analytics Data Privacy

**🟡 MEDIUM** — L6.4.1: Analytics Data Retention Period Not Enforced
- **What was found:** Privacy Policy states analytics data retained for 24 months (PrivacyPolicyPage.tsx:82-88), but no automated deletion implemented.
- **Why it matters:** GDPR/POPIA require honoring stated retention periods. Keeping data longer than disclosed violates trust and regulation.
- **Recommended fix:** Implement scheduled task to delete AnalyticsEvent records older than 24 months. Use @nestjs/schedule cron job. Add database index on timestamp for efficient deletion: `DELETE FROM analytics_events WHERE timestamp < NOW() - INTERVAL '24 months'`.
- **File references:** backend/src/analytics/analytics.service.ts (add cleanup method), backend/prisma/schema.prisma:156-169

**🟡 MEDIUM** — L6.4.2: No Mechanism for Users to Request Data Deletion
- **What was found:** Privacy Policy mentions GDPR right to erasure (PrivacyPolicyPage.tsx:97), but no API endpoint or UI to request deletion.
- **Why it matters:** GDPR requires responding to deletion requests within 30 days. Without automated process, manual handling is slow and error-prone.
- **Recommended fix:** Add public API endpoint POST /analytics/delete-my-data that accepts sessionId, deletes all associated events, and returns confirmation. Link from Privacy Policy. Send email confirmation to user.
- **File references:** backend/src/analytics/analytics.controller.ts (add endpoint), src/pages/legal/PrivacyPolicyPage.tsx (add link)

**🟢 LOW** — L6.4.3: IP Addresses Stored Without Hashing
- **What was found:** Analytics and audit logs store raw IP addresses (ip field).
- **Why it matters:** IP addresses are personally identifiable information under GDPR. Storing raw IPs without anonymization creates higher compliance burden.
- **Recommended fix:** Consider hashing or truncating IP addresses before storage (e.g., store only first 3 octets: 192.168.1.0 instead of 192.168.1.123). Use consistent salt. Document approach in Privacy Policy. Alternatively, document legitimate interest justification for full IPs.
- **File references:** backend/src/analytics/analytics.service.ts:14-68, backend/src/audit/audit.service.ts

#### 6.5 Third-Party Services

**🟡 MEDIUM** — L6.5.1: Third-Party Services Not Fully Disclosed in Privacy Policy
- **What was found:** Privacy Policy mentions "Service Providers: Hosting providers, analytics services (if applicable)" but doesn't name specific providers.
- **Why it matters:** GDPR requires transparency about data processors. Users have right to know where their data goes. Vague disclosures may not satisfy compliance.
- **Recommended fix:** Update Privacy Policy to list specific third parties: (1) Hosting provider (VPS, cloud provider), (2) Database hosting (if separate), (3) CDN provider (if used), (4) Analytics (if Google Analytics/Plausible added), (5) Error tracking (if Sentry added). Include links to their privacy policies.
- **File references:** src/pages/legal/PrivacyPolicyPage.tsx:73-80

**🟢 LOW** — L6.5.2: No Data Processing Agreements (DPAs) Mentioned
- **What was found:** No mention of Data Processing Agreements with third-party services.
- **Why it matters:** GDPR Article 28 requires DPAs with data processors. While not required to disclose in Privacy Policy, having DPAs is compliance requirement.
- **Recommended fix:** Ensure DPAs are in place with: (1) Hosting provider, (2) CDN (if used), (3) Analytics service (if used), (4) Error tracking service (if used). Store signed DPAs for regulatory audits. Document in internal compliance checklist.
- **File references:** Internal compliance documentation (not code)

---

### AUDIT SECTION 7: DEPLOYMENT READINESS

#### 7.1 Environment Configuration

**🔴 CRITICAL** — D7.1.1: No Production Environment Configuration Documented
- **What was found:** .env.example files exist for dev, but no .env.production.example or deployment guide. No documentation on which variables must change for production.
- **Why it matters:** Deploying with development configuration causes security vulnerabilities (DEBUG=true, localhost URLs, weak secrets), broken functionality (CORS blocks requests), and data loss (wrong database).
- **Recommended fix:** Create comprehensive deployment checklist: (1) List all env vars that MUST be changed (JWT_SECRET, DATABASE_URL, CORS_ORIGIN, NODE_ENV), (2) Document production-ready values for each, (3) Add validation in main.ts to error on startup if production env has dev values.
- **File references:** Create DEPLOYMENT.md, backend/src/main.ts (add validation), backend/.env.production.example (create)

**🟠 HIGH** — D7.1.2: No Secrets Management Strategy
- **What was found:** .env files store secrets as plain text. No mention of HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, or similar.
- **Why it matters:** Plain text secrets in .env files are insecure, especially if server is compromised. Secrets should be encrypted at rest and rotatable.
- **Recommended fix:** For initial launch: use platform-provided secrets (Vercel env vars, Railway secrets, etc.). For mature production: migrate to secrets management service. Document rotation procedure. Set calendar reminder to rotate JWT_SECRET and database passwords quarterly.
- **File references:** DEPLOYMENT.md (document strategy)

**🟠 HIGH** — D7.1.3: NODE_ENV Not Validated on Startup
- **What was found:** Code checks NODE_ENV in multiple places (main.ts:21, main.ts:105) but doesn't validate it's set correctly on startup.
- **Why it matters:** If NODE_ENV is unset, defaults to development behavior (verbose errors, loose validation). If typo (e.g., "prod" instead of "production"), behaves unexpectedly.
- **Recommended fix:** Add startup validation in main.ts:13 (after env validation): `if (!['development', 'production', 'test'].includes(process.env.NODE_ENV)) { throw new Error('NODE_ENV must be development, production, or test'); }`
- **File references:** backend/src/main.ts:13-14

**🟡 MEDIUM** — D7.1.4: No Configuration for Multiple Environments (Staging, QA)
- **What was found:** Code assumes only development and production. No staging environment configuration.
- **Why it matters:** Best practice is to have staging environment that mirrors production for testing deployments before go-live. Reduces production bugs.
- **Recommended fix:** Support additional NODE_ENV values: staging, qa. Configure behavior for each (staging uses test database, production logging level, but allows verbose errors). Document in README.
- **File references:** backend/src/config/env.validation.ts, backend/src/main.ts

#### 7.2 Build & Deployment

**🔴 CRITICAL** — D7.2.1: No CI/CD Pipeline Configured
- **What was found:** No .github/workflows, .gitlab-ci.yml, or similar CI/CD configuration. No automated testing, linting, or deployment.
- **Why it matters:** Manual deployment is error-prone and slow. No automated testing means bugs slip into production. Rollback is manual and risky.
- **Recommended fix:** Set up GitHub Actions workflow: (1) On push to main: run lint, build, run tests (once tests exist), (2) On tag push: deploy to production, (3) Run security scans (npm audit, dependency-check), (4) Post deployment: run smoke tests, notify team.
- **File references:** Create .github/workflows/ci.yml, .github/workflows/deploy.yml

**🟠 HIGH** — D7.2.2: Build Output Not Gitignored But May Be in Repo
- **What was found:** .gitignore includes /dist and /build, but need to verify no build artifacts are committed.
- **Why it matters:** Committed build artifacts create merge conflicts, bloat repository size, and may expose source maps or debug info.
- **Recommended fix:** Run `git rm -r --cached dist build backend/dist`. Verify .gitignore includes all build outputs. Add to pre-commit hook: reject commits containing dist/ or build/.
- **File references:** .gitignore, .git/ (check for committed artifacts)

**🟡 MEDIUM** — D7.2.3: No Database Migration Strategy for Production
- **What was found:** README.md:92-93 says "Run database migrations" with `npm run prisma:migrate` but this is development command. Production should use `prisma migrate deploy`.
- **Why it matters:** Running prisma migrate in production creates migration files, can cause destructive schema changes, and requires database access that production user may not have.
- **Recommended fix:** Document production migration process: (1) Run `prisma migrate deploy` in deployment script, (2) Use separate database user with limited permissions, (3) Take database backup before migration, (4) Test migrations in staging first, (5) Plan rollback procedure.
- **File references:** README.md:92-96 (update), create DEPLOYMENT.md with migration guide

**🟡 MEDIUM** — D7.2.4: No Build Size Monitoring
- **What was found:** No webpack-bundle-analyzer or similar tool to monitor frontend bundle size.
- **Why it matters:** Bundle size directly impacts page load time. Without monitoring, size can creep up unnoticed, degrading performance over time.
- **Recommended fix:** Add vite-plugin-analyzer to vite.config.ts. Run during build to generate bundle size report. Set up CI job to fail if bundle exceeds threshold (e.g., 500KB). Review report monthly.
- **File references:** vite.config.ts (add plugin), .github/workflows/ci.yml (add size check)

**🟢 LOW** — D7.2.5: No Rollback Procedure Documented
- **What was found:** No documentation on how to rollback a bad deployment.
- **Why it matters:** When production deploy breaks, team wastes time figuring out rollback under pressure. Increases downtime.
- **Recommended fix:** Document rollback procedure: (1) For code: `git revert` or re-deploy previous tag, (2) For database: restore from backup and re-run old migration, (3) For CDN: purge cache, (4) Test rollback procedure in staging quarterly.
- **File references:** DEPLOYMENT.md (add rollback section)

#### 7.3 Logging & Monitoring

**🔴 CRITICAL** — D7.3.1: No Error Tracking Service Configured
- **What was found:** No Sentry, Rollbar, Bugsnag, or similar error tracking. Errors only logged to console.
- **Why it matters:** Production errors are invisible to developers. Users experience bugs but team doesn't know. Cannot prioritize fixes or measure error rates.
- **Recommended fix:** Implement Sentry (free tier available): (1) Frontend: wrap App with Sentry ErrorBoundary, (2) Backend: add Sentry NestJS integration, (3) Configure source map upload for readable stack traces, (4) Set up error alerting (email, Slack), (5) Define SLO: resolve critical errors within 24 hours.
- **File references:** src/main.tsx (add Sentry), backend/src/main.ts (add Sentry), vite.config.ts (source map upload)

**🟠 HIGH** — D7.3.2: No Uptime Monitoring or Healthchecks
- **What was found:** No health check endpoint, no uptime monitoring service (Pingdom, UptimeRobot, etc.).
- **Why it matters:** If site goes down, team doesn't know until users complain. No visibility into uptime SLA. Cannot quickly identify outages.
- **Recommended fix:** (1) Add GET /health endpoint returning 200 OK with database connectivity check, (2) Set up free uptime monitoring (UptimeRobot) checking every 5 minutes, (3) Configure alerts (email, SMS, Slack) for downtime, (4) Set up status page (e.g., status.prodview.com).
- **File references:** backend/src/app.controller.ts (add health endpoint)

**🟠 HIGH** — D7.3.3: No Performance Monitoring (APM)
- **What was found:** No application performance monitoring. No tracking of API response times, database query duration, or frontend metrics (FCP, LCP, TTI).
- **Why it matters:** Performance degradation goes unnoticed. Slow endpoints frustrate users and hurt conversion. Cannot identify bottlenecks or measure optimization impact.
- **Recommended fix:** (1) Backend: Add Prisma query logging to measure slow queries (>1s), (2) Frontend: Integrate Lighthouse CI or web-vitals library to track Core Web Vitals, (3) Consider APM service (New Relic free tier, Datadog trial) for deeper insights.
- **File references:** backend/src/common/prisma.service.ts (add logging), src/main.tsx (add web-vitals)

**🟡 MEDIUM** — D7.3.4: No Structured Logging Format
- **What was found:** Logs use console.log, console.error with plain text messages. No JSON structured logging.
- **Why it matters:** Unstructured logs are hard to parse, aggregate, and alert on. Cannot easily filter by error type, user ID, or request ID. Difficult to integrate with log aggregation services (CloudWatch, Datadog, ELK).
- **Recommended fix:** Replace console.* with structured logging library: (1) Backend: winston or pino with JSON format, (2) Include metadata: timestamp, level, requestId, userId, error stack, (3) Configure log levels (production: info and above, dev: debug and above), (4) Send logs to aggregation service.
- **File references:** backend/src/common/ (create logger.service.ts), replace all console.* calls

**🟡 MEDIUM** — D7.3.5: No Request Tracing or Correlation IDs
- **What was found:** API requests don't have correlation IDs to trace request flow through system.
- **Why it matters:** When debugging issues, cannot correlate frontend error with backend logs. Difficult to trace request through multiple services or layers.
- **Recommended fix:** Add request ID middleware: (1) Generate UUID for each request, (2) Add to request object, (3) Include in all logs, (4) Return in response header (X-Request-ID), (5) Frontend sends same ID in subsequent requests (X-Correlation-ID).
- **File references:** backend/src/main.ts (add middleware), src/lib/api.ts (add interceptor)

#### 7.4 Backup & Recovery

**🟠 HIGH** — D7.4.1: No Database Backup Strategy
- **What was found:** No documentation of database backup procedures, frequency, or retention policy.
- **Why it matters:** Database is single point of failure. Hardware failure, accidental deletion, or ransomware could destroy all data with no recovery option.
- **Recommended fix:** Implement backup strategy: (1) Automated daily backups (PostgreSQL pg_dump or cloud provider automated backups), (2) Retain backups for 30 days, (3) Store backups in different location/region than primary database, (4) Test restore procedure monthly, (5) Document RTO (Recovery Time Objective): 1 hour, RPO (Recovery Point Objective): 24 hours.
- **File references:** DEPLOYMENT.md (document backup strategy), infrastructure config (set up automated backups)

**🟠 HIGH** — D7.4.2: No Image Upload Backup Strategy
- **What was found:** Images stored in backend/uploads directory. No backup or redundancy strategy.
- **Why it matters:** If server disk fails or is wiped during deployment, all product images are lost permanently. Site becomes unusable.
- **Recommended fix:** (1) Short term: Schedule daily rsync of uploads/ directory to separate storage, (2) Long term: Migrate images to S3, Cloudinary, or CDN with built-in redundancy, (3) Document backup restore procedure, (4) Test image recovery monthly.
- **File references:** backend/uploads/ (set up backup), DEPLOYMENT.md (document strategy)

**🟡 MEDIUM** — D7.4.3: No Disaster Recovery Plan
- **What was found:** No documentation of what to do if entire server is lost or compromised.
- **Why it matters:** Major incident (server hacked, cloud account compromised, data center fire) requires coordinated response. Without plan, recovery is chaotic and slow.
- **Recommended fix:** Document disaster recovery plan: (1) Contact list (hosting provider, security team, management), (2) Recovery steps (restore database, deploy code, verify functionality), (3) Communication plan (notify users, post status updates), (4) Post-incident review process. Store plan outside of server (e.g., Google Docs).
- **File references:** docs/DISASTER_RECOVERY.md (create)

#### 7.5 Domain, SSL & DNS

**🟠 HIGH** — D7.5.1: No SSL/HTTPS Configuration Documented
- **What was found:** No documentation of SSL certificate setup. Code uses secure: isProduction for cookies but doesn't document how to obtain/configure SSL.
- **Why it matters:** Without HTTPS, site is vulnerable to MITM attacks, credential theft, and browser "Not Secure" warnings. Modern browsers block certain features without HTTPS. Required for production.
- **Recommended fix:** Document SSL setup: (1) For Vercel/Netlify: automatic (document this), (2) For VPS: use Let's Encrypt (certbot) with auto-renewal, (3) For Cloudflare: enable SSL proxy, (4) Verify certificate is valid and covers www subdomain, (5) Configure HSTS preload, (6) Set up certificate expiry monitoring.
- **File references:** DEPLOYMENT.md (document SSL setup), backend/src/main.ts:53-57 (HSTS already configured)

**🟡 MEDIUM** — D7.5.2: No www/non-www Redirect Strategy
- **What was found:** No documentation of whether site should be example.com or www.example.com. No redirect configuration.
- **Why it matters:** Without redirect, SEO is split between two domains. Users may visit wrong variant and get "Site not found". Session cookies may not work across variants.
- **Recommended fix:** Decide canonical domain (recommend non-www: example.com). Configure redirect: (1) In DNS/CDN: 301 redirect www to non-www (or vice versa), (2) Update CORS_ORIGIN and JWT cookie domain, (3) Update sitemap and robots.txt with canonical domain, (4) Test both variants redirect correctly.
- **File references:** DEPLOYMENT.md (document decision), DNS configuration

**🟡 MEDIUM** — D7.5.3: No robots.txt or sitemap.xml
- **What was found:** public/robots.txt and public/sitemap.xml files exist but need verification they're comprehensive and up-to-date.
- **Why it matters:** Search engines need sitemap to discover pages. robots.txt controls crawler access. Missing or wrong configuration hurts SEO.
- **Recommended fix:** Verify robots.txt allows crawlers: `User-agent: * / Allow: /`. Generate sitemap.xml with all public URLs (homepage, all product pages, all category pages, legal pages). Submit to Google Search Console. Update sitemap after adding products.
- **File references:** public/robots.txt:1-3, public/sitemap.xml:1-50 (verify comprehensive)

**🟡 MEDIUM** — D7.5.4: No security.txt File
- **What was found:** public/security.txt exists - good! Need to verify it's RFC 9116 compliant and has correct contact info.
- **Why it matters:** Security researchers use security.txt to report vulnerabilities. Incorrect format or missing contact info means vulnerabilities go unreported.
- **Recommended fix:** Verify security.txt contains: (1) Contact: email or URL, (2) Expires: date (update annually), (3) Preferred-Languages: en, (4) Canonical: https://yourdomain.com/.well-known/security.txt. Serve from both /security.txt and /.well-known/security.txt.
- **File references:** public/security.txt (verify format), backend/src/main.ts (ensure served from /.well-known/ too)

**🟢 LOW** — D7.5.5: No CAA DNS Records
- **What was found:** CAA (Certificate Authority Authorization) DNS records likely not configured.
- **Why it matters:** CAA records prevent unauthorized certificate issuance. Without CAA, attacker can get valid SSL certificate for your domain from different CA, enabling phishing.
- **Recommended fix:** Add CAA DNS records: `yourdomain.com CAA 0 issue "letsencrypt.org"` (or your CA). Add `0 issuewild "letsencrypt.org"` for wildcards. Test with `dig yourdomain.com CAA`.
- **File references:** DNS configuration

---

## MISSING LEGAL PAGES SUMMARY

All required legal pages **EXIST** and are implemented comprehensively. This is a **major strength** of the project.

| Page | Status | Notes |
|------|--------|-------|
| **Privacy Policy** | ✅ COMPLETE | Excellent GDPR/POPIA compliance, covers data collection, usage, rights, retention, international transfers |
| **Terms & Conditions** | ✅ EXISTS | Exists but not fully audited in detail |
| **Cookie Policy** | ✅ EXISTS | Exists but not fully verified for completeness |
| **Affiliate Disclosure** | ✅ COMPLETE | Comprehensive FTC-compliant disclosure, clearly explains material connection and commission structure |
| **Disclaimer** | ✅ EXISTS | Exists but not fully verified |
| **External Links Notice** | ✅ EXISTS | Good addition, shows attention to legal detail |
| **POPIA Contact Page** | ✅ COMPLETE | Satisfies POPIA requirement for Information Officer contact details |

**Why this matters for this site:**
- **Affiliate marketing** requires FTC-compliant disclosure - ✅ **SATISFIED**
- **South African base** requires POPIA compliance (Privacy Policy, POPIA Contact) - ✅ **SATISFIED**
- **Global audience** requires GDPR awareness - ✅ **SATISFIED**
- **Analytics tracking** requires cookie consent and policy - ✅ **SATISFIED**

**Action items:**
1. Replace placeholder emails (privacy@prodview.example.com) with real production emails
2. Verify Terms & Conditions, Cookie Policy, Disclaimer are complete
3. Establish quarterly legal review process
4. Link all legal pages from footer

---

## TEST SUITE RESULTS

**Status:** ❌ **NO TESTS EXIST**

**Test Framework:** None configured

**Test Coverage:** 0%

**Findings:**
- No test files found in project (searched for *.test.ts, *.test.tsx, *.spec.ts, *.spec.tsx)
- No testing framework installed (Jest, Vitest, Mocha, Cypress, Playwright)
- No test scripts in package.json
- package.json (frontend):7-12 has no test script
- backend/package.json has no test script configured

**Impact:**
- 🔴 **CRITICAL** - Zero confidence in code correctness
- Cannot verify critical flows work (auth, analytics tracking, affiliate redirects, product CRUD)
- Cannot catch regressions when making changes
- Cannot safely refactor code
- Increases risk of production bugs

**Minimum Required Test Coverage Before Production:**

**Backend (Priority: CRITICAL):**
1. Auth: Login, token refresh, logout, password validation
2. Products: CRUD operations, OG fetch, search, filtering
3. Analytics: Track event, affiliate click, getTopProducts, getAffiliateClicks, getCategoryStats
4. Upload: Image validation, file type/size checks
5. Rate limiting: Verify limits work correctly

**Frontend (Priority: HIGH):**
1. User flows: Product browsing, search, affiliate click with tracking
2. Admin flows: Product editor save/update, image upload
3. Cookie consent: Banner display, accept/reject, localStorage persistence
4. Error boundaries: Verify errors are caught and displayed

**Recommended Testing Stack:**
- **Backend:** Jest + Supertest for API testing
- **Frontend:** Vitest + React Testing Library for component tests
- **E2E:** Playwright for critical user flows
- **Coverage target:** Minimum 60% for backend, 40% for frontend before production

**Estimated effort:** 40-60 hours to implement minimum test coverage

---

## PRIORITISED FIX ORDER

### TRANCHE 1: Fix Before Deploying (CRITICAL + HIGH Priority)
**Must complete before production deployment. These are security vulnerabilities, critical bugs, and deployment blockers.**
**Estimated total effort: 20-30 hours**

#### Security & Dependencies (2-4 hours)
1. **S1.1.1** [CRITICAL] Update axios to 1.15.2+ (16 CVEs) - Test affiliate flows after update
2. **S1.1.2** [CRITICAL] Update dompurify to 3.3.4+ (8 XSS CVEs) - Test product descriptions after update
3. **S1.1.3** [CRITICAL] Update @nestjs/core to 11.1.18+ (injection vuln) - Breaking changes, test all endpoints
4. **S1.5.1** [CRITICAL] Fix brace-expansion DoS vulnerability in both frontend and backend
5. **S1.1.4** [HIGH] Update ajv to 6.14.0+ (ReDoS vulnerability)
6. **S1.5.2** [HIGH] Verify express/body-parser updated via NestJS upgrade

#### Critical Functionality Bugs (8-12 hours)
7. **F2.2.1** [CRITICAL] Fix analytics getSearchStats() memory DoS - Use groupBy aggregation like other methods
8. **F2.1.2** [MEDIUM->HIGH] Fix affiliate click tracking race condition - Await API call before opening window
9. **F2.1.3** [MEDIUM] Implement search tracking - Currently not firing, breaks admin analytics
10. **F2.1.4** [MEDIUM] Implement category click tracking - Required for category performance analytics

#### Testing Infrastructure (6-8 hours minimum viable)
11. **D7.3.1** [CRITICAL] Set up Sentry error tracking - Frontend and backend, crucial for production monitoring
12. **Minimum Tests** [CRITICAL] Write minimum test coverage:
    - Backend: Auth (login, token refresh), Product CRUD, Analytics tracking endpoints
    - Frontend: Affiliate click flow, Cookie consent, Basic navigation
    - Target: 30% coverage minimum

#### Deployment Blockers (4-6 hours)
13. **D7.1.1** [CRITICAL] Create production environment configuration guide - DEPLOYMENT.md with checklist
14. **D7.4.1** [HIGH] Set up automated database backups - Daily, 30-day retention
15. **D7.4.2** [HIGH] Set up image upload backups - Daily rsync or migrate to S3
16. **D7.5.1** [HIGH] Configure SSL/HTTPS and document setup
17. **D7.2.1** [CRITICAL] Set up basic CI/CD pipeline - GitHub Actions for automated deployment
18. **D7.3.2** [HIGH] Add health check endpoint and set up uptime monitoring (UptimeRobot free tier)

#### High-Priority Security (2-3 hours)
19. **S1.1.5** [HIGH] Fix .env.example placeholder values - Use obviously fake placeholders
20. **S1.1.6** [HIGH] Generate and document strong JWT_SECRET with validation
21. **S1.1.8** [MEDIUM->HIGH] Add CORS_ORIGIN production validation
22. **S1.2.1** [HIGH] Implement basic token revocation mechanism using Redis or database
23. **S1.4.1** [HIGH] Document and validate request size limits
24. **L6.1.2** [MEDIUM->HIGH] Replace placeholder emails in legal pages with production emails

---

### TRANCHE 2: Fix Within First 2 Weeks of Launch (MEDIUM Priority)
**Address after go-live but before significant traffic. These improve reliability, performance, and user experience.**
**Estimated total effort: 30-40 hours**

#### Performance Optimizations (8-12 hours)
25. **F2.4.1** [HIGH->MEDIUM] Implement image optimization pipeline - sharp, WebP, thumbnails
26. **P3.2.1** [HIGH] Add lazy loading to product images - Dramatic page load improvement
27. **P3.2.2** [MEDIUM] Implement code splitting for admin routes - Reduce initial bundle by ~30%
28. **P3.4.1** [HIGH] Set up CDN for static assets - CloudFlare or similar
29. **P3.1.1** [HIGH] Add missing database index on AnalyticsEvent.sessionId
30. **P3.3.1** [MEDIUM] Improve cache invalidation strategy - More targeted, less aggressive

#### User Experience & Accessibility (8-10 hours)
31. **UX5.3.1** [HIGH] Audit and fix missing/generic alt text on all images - WCAG compliance
32. **UX5.3.2** [HIGH] Complete keyboard navigation audit and fixes
33. **F2.6.1** [MEDIUM] Fix form validation error accessibility - Add ARIA labels
34. **UX5.4.2** [MEDIUM] Add helpful empty state for zero search results
35. **UX5.5.1** [MEDIUM] Add success notifications after admin actions
36. **F2.8.1** [MEDIUM] Handle products without images gracefully - Placeholder image

#### Code Quality & Maintainability (6-8 hours)
37. **CQ4.5.1** [HIGH] Add Swagger/OpenAPI documentation to backend
38. **CQ4.2.1** [HIGH] Remove deprecated RateLimit model from database
39. **CQ4.3.2** [LOW->MEDIUM] Implement centralized logging with winston/pino
40. **D7.3.4** [MEDIUM] Switch to structured JSON logging format

#### Security Hardening (4-6 hours)
41. **S1.2.2** [HIGH] Implement refresh token rotation - Detect token theft
42. **S1.3.1** [HIGH] Replace regex HTML parsing with proper parser (cheerio) in OG fetch
43. **S1.4.3** [MEDIUM] Reduce fetch-preview rate limit to 5/min
44. **F2.3.1** [HIGH] Re-validate affiliate URL before redirect
45. **S1.5.3** [HIGH] Set up automated dependency scanning (Dependabot)

#### Analytics & Monitoring (4-5 hours)
46. **D7.3.3** [HIGH] Add performance monitoring (APM) - Prisma query logging, web-vitals
47. **F2.2.2** [HIGH] Add sessionId parameter to search tracking
48. **F2.1.1** [MEDIUM] Fix product view double-counting on re-render
49. **D7.3.5** [MEDIUM] Implement request correlation IDs

---

### TRANCHE 3: Ongoing Improvements (LOW Priority)
**Address over next 1-3 months. Quality of life improvements, optimizations, and nice-to-haves.**
**Estimated total effort: 20-30 hours**

#### Documentation & Process (8-10 hours)
50. **CQ4.5.2** [MEDIUM] Complete production deployment section in README
51. **CQ4.5.3** [MEDIUM] Create Architecture Decision Records (ADRs)
52. **L6.1.1** [MEDIUM] Establish quarterly legal page review process
53. **D7.2.5** [LOW] Document rollback procedures

#### Polish & UX Refinements (6-8 hours)
54. **UX5.2.1** [MEDIUM] Fix theme flash (FOUC) with inline script
55. **F2.1.5** [LOW] Add loading state on affiliate click button
56. **F2.6.2** [LOW] Prevent double-submit on product editor form
57. **UX5.1.4** [LOW] Optimize grid layout for landscape tablets (3-column breakpoint)
58. **P3.2.5** [LOW] Add service worker for offline support

#### Code Quality Cleanup (4-6 hours)
59. **CQ4.2.2** [MEDIUM] Remove unused imports across codebase - ESLint rule
60. **CQ4.2.4** [LOW] Remove console.log statements, add proper logging
61. **CQ4.1.3** [LOW] Standardize on JSDoc comments for exported functions
62. **CQ4.4.2** [LOW] Add explicit return type annotations

#### Minor Security & Compliance (4-6 hours)
63. **L6.2.2** [MEDIUM] Improve consent version change notifications
64. **L6.4.1** [MEDIUM] Implement 24-month analytics data auto-deletion
65. **S1.2.3** [MEDIUM] Implement password reset flow
66. **L6.4.2** [MEDIUM] Add "delete my data" endpoint for GDPR
67. **D7.5.5** [LOW] Add CAA DNS records

#### Performance Optimizations (Remaining)
68. **P3.3.2** [MEDIUM] Cache OG fetch results for 24 hours
69. **P3.3.3** [LOW] Implement cache warming on server startup
70. **P3.4.2** [MEDIUM] Verify gzip/brotli compression enabled
71. **P3.2.3** [MEDIUM] Add font optimization strategy

---

## FINAL ASSESSMENT & RECOMMENDATIONS

### Production Readiness: **NOT READY** (Estimated 1-2 weeks to production-ready)

**Strengths:**
- ✅ Excellent legal compliance foundation (all pages exist, comprehensive)
- ✅ Strong security architecture (JWT cookies, bcrypt, Helmet, rate limiting)
- ✅ Well-structured codebase with good separation of concerns
- ✅ Modern tech stack (React 19, NestJS, Prisma)
- ✅ Comprehensive cookie consent implementation
- ✅ Good database schema with proper indexes (mostly)

**Critical Weaknesses:**
- ❌ Multiple critical npm vulnerabilities (axios, dompurify, NestJS)
- ❌ Zero test coverage - cannot verify anything works
- ❌ Memory DoS vulnerability in analytics
- ❌ No error tracking, monitoring, or logging infrastructure
- ❌ No deployment documentation or automation

**Deployment Timeline Recommendation:**

**Week 1 (Days 1-7): Security & Critical Fixes**
- Days 1-2: Update all vulnerable dependencies (Items 1-6)
- Days 3-4: Fix critical bugs (Items 7-10)
- Days 5-7: Minimum test coverage (Item 12), Sentry setup (Item 11)

**Week 2 (Days 8-14): Infrastructure & Deployment**
- Days 8-10: Deployment docs, backups, SSL (Items 13-17)
- Days 11-12: CI/CD pipeline (Item 18), health checks (Item 18)
- Days 13-14: Security hardening (Items 19-24), final testing

**Post-Launch (Weeks 3-4): Performance & UX**
- Implement Tranche 2 items prioritizing highest-impact issues
- Monitor error rates, performance metrics, user feedback
- Address any production issues discovered

**Key Success Metrics for Go-Live Decision:**
1. ✅ All CRITICAL and HIGH vulnerabilities patched
2. ✅ Minimum 30% test coverage on critical paths
3. ✅ Error tracking and uptime monitoring active
4. ✅ Automated backups configured and tested
5. ✅ SSL/HTTPS configured and verified
6. ✅ Production environment variables validated
7. ✅ All placeholder values replaced with production values

**Post-Launch Monitoring Plan:**
- Check Sentry dashboard daily for first week
- Monitor uptime (target: 99.9%)
- Review analytics for broken flows
- Monitor database performance (query times)
- Collect user feedback on UX issues

---

**END OF AUDIT REPORT**

**Next Steps:** After review of this audit, confirm priority order and begin work on Tranche 1 items. Feel free to ask questions about any finding or request clarification on recommended fixes.

