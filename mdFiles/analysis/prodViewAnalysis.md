# ProdView - Comprehensive Read-Only Audit Report

**Generated:** 2026-02-07
**Application:** ProdView (Affiliate Product Catalog)
**Source:** Chef by Convex Generated Codebase
**Audit Type:** Strictly Read-Only Analysis

---

## 1. Technology Stack

### 1.1 Frontend Technologies
- **React:** Version 19.2.1 (latest stable)
- **TypeScript:** Version ~5.7.2
- **Build Tool:** Vite 6.2.0
- **Routing:** React Router DOM 7.13.0
- **Styling:** Tailwind CSS ~3 with PostCSS ~8 and Autoprefixer ~10
- **UI Components:** Custom components built from scratch
- **Icons:** Lucide React 0.563.0
- **Notifications:** Sonner 2.0.3 (toast notifications)
- **Utility Libraries:**
  - `clsx` 2.1.1 (conditional classnames)
  - `tailwind-merge` 3.1.0 (Tailwind class merging)

### 1.2 Backend Technologies
- **Backend Platform:** Convex 1.31.2 (serverless BaaS)
- **Authentication:** @convex-dev/auth 0.0.80
  - Password provider (for standard auth, not used in current flow)
  - Anonymous provider (for public users)
- **Password Hashing:** bcryptjs 3.0.3 (12 salt rounds)
- **Runtime:** Node.js (development) / Convex serverless runtime (production)

### 1.3 Development Tooling
- **TypeScript Configs:**
  - Root: tsconfig.json (references app and node configs)
  - App: tsconfig.app.json (frontend code)
  - Node: tsconfig.node.json (build scripts)
  - Convex: convex/tsconfig.json (backend functions)
- **Linting:** ESLint 9.21.0 with TypeScript support
- **Formatting:** Prettier 3.5.3
- **Environment:** dotenv 16.4.7
- **Process Management:** npm-run-all 4.1.5

### 1.4 Database
- **Type:** Convex Document Database (NoSQL, schema-based)
- **Schema Language:** Convex schema definitions (TypeScript-based)
- **Realtime:** Built-in reactive queries (WebSocket subscriptions)
- **Storage:** Convex File Storage for images

### 1.5 Authentication Mechanisms
- **Admin Auth:** Custom bcrypt-based authentication
  - Email/password login via actions
  - Session stored in localStorage (client-side)
  - Session validation via adminId lookup
  - **CRITICAL LIMITATION:** No server-side session tokens or JWT
- **Public Auth:** Convex Auth Anonymous provider
  - Automatic anonymous session for public users
  - Used for analytics session tracking

### 1.6 State Management
- **Primary:** Convex React hooks
  - `useQuery()` - reactive data fetching
  - `useMutation()` - server mutations
  - `useAction()` - server actions
- **Context API:** ThemeContext for dark/light mode
- **Local State:** React useState/useEffect for form and UI state
- **Persistence:** localStorage for admin session and theme preference

### 1.7 Styling System
- **Framework:** Tailwind CSS with custom configuration
- **Theme System:** CSS custom properties for colors
- **Dark Mode:** Class-based (.dark) with context-controlled toggle
- **Responsive:** Mobile-first approach with standard breakpoints

### 1.8 Analytics Tracking
- **Implementation:** Custom analytics via Convex mutations
- **Privacy:** Anonymous session IDs, no PII collection
- **Events Tracked:**
  - product_view
  - affiliate_click
  - category_click
  - use_case_click
  - search
  - page_view
- **Rate Limiting:** Applied per IP (100 events/min, 10 affiliate clicks/min)

### 1.9 Build Tooling
- **Frontend Build:** Vite (ES modules, code splitting, HMR)
- **Backend Build:** Convex CLI (automatic deployment on change)
- **Type Generation:** Convex auto-generates TypeScript types in convex/_generated/
- **Development Mode:** Parallel frontend (Vite) and backend (Convex) servers
- **Production Build:** `vite build` outputs to dist/

---

## 2. Application Purpose & User Flows

### 2.1 Application Purpose
ProdView is a full-stack affiliate product catalog application designed to:
- **Public Purpose:** Allow users to browse, filter, and discover products via affiliate links
- **Admin Purpose:** Provide administrators with tools to manage products, categories, use cases, and view analytics
- **Monetization:** Generate affiliate revenue through tracked affiliate link clicks

### 2.2 Public User Flows

#### Flow 1: Homepage Visit
1. User lands on `/`
2. Layout renders with Navbar, Left Sidebar (categories), Right Sidebar (use cases)
3. HomePage displays featured products via `getLatestProducts` query
4. User can click categories/use cases or search
5. Analytics tracks `page_view` event

#### Flow 2: Product Browsing
1. User navigates to `/products`
2. ProductSelectionPage loads all published products
3. ProductGrid displays products in grid/list view
4. User can filter by category (left sidebar) or use case (right sidebar)
5. Filtering triggers `getProductsByCategory` or `getProductsByUseCase` queries
6. **LIMITATION:** These queries load ALL products then filter in-memory (inefficient)
7. Analytics tracks category/use case click events

#### Flow 3: Product Search
1. User enters search term in Navbar search box
2. Search triggers `searchProducts` query with rate limiting (30/min per IP)
3. Full-text search on product names (search index used)
4. Results paginated (100 items max per page)
5. Analytics tracks search event with query metadata

#### Flow 4: Product Detail View
1. User clicks product card, navigates to `/products/:id`
2. ProductDetailPage loads product via `getProductById`
3. Query returns product only if status is "published"
4. Images loaded from Convex storage via `getImageUrl`
5. Analytics tracks `product_view` event

#### Flow 5: Affiliate Click
1. User clicks "Visit Site" button on product detail page
2. `trackAffiliateClick` mutation called with rate limiting (10/min per IP)
3. Click recorded in analyticsEvents table
4. Mutation returns affiliate URL
5. Link opens in new tab with `noopener,noreferrer` flags
6. Analytics tracks `affiliate_click` event

### 2.3 Admin User Flows

#### Flow 1: Admin Login
1. Admin navigates to `/admin/login`
2. AdminLoginPage renders email/password form
3. Form submission calls `adminLogin` action
4. Rate limiting checked (5 attempts per 15 min per email/IP)
5. Email and password validated (format, strength)
6. Password compared with bcrypt hash
7. On success:
   - Last login timestamp updated
   - Audit log created (`login_success`)
   - Session data (adminId, email, role) returned
   - Session stored in localStorage
   - Redirect to `/admin`
8. On failure:
   - Audit log created (failed login type)
   - Error message returned
   - Rate limit attempt recorded

#### Flow 2: Admin Dashboard
1. ProtectedRoute checks localStorage for admin session
2. If no session, redirects to `/admin/login`
3. AdminDashboard loads all products via `getAllProductsForAdmin`
4. **LIMITATION:** Query validates session but session is just adminId lookup (no token)
5. Dashboard displays product list table with status filters
6. Stats cards show counts by status (published, draft, archived)
7. Actions available: View, Edit, Delete (Delete button not wired)

#### Flow 3: Create Product
1. Admin clicks "Create New Product" on dashboard
2. Navigates to `/admin/products/new`
3. ProductEditorPage renders empty form
4. Admin fills:
   - Name, description, affiliate URL
   - Categories (multi-select, max 10)
   - Use cases (multi-select, max 10)
   - Images (upload, max 20)
5. Image upload:
   - `generateUploadUrl` mutation called (admin validation)
   - File uploaded to Convex storage
   - Storage ID stored
6. Form submission calls `createProduct` mutation
7. All inputs validated (XSS prevention, URL format, length limits)
8. Product created with status "draft"
9. createdBy and updatedBy set to admin ID
10. Audit log created (`create_product`)
11. Redirect to dashboard

#### Flow 4: Edit Product
1. Admin clicks "Edit" on dashboard product row
2. Navigates to `/admin/products/:id/edit`
3. ProductEditorPage loads product via query
4. Form pre-populated with existing data
5. Admin makes changes
6. Form submission calls `updateProduct` mutation
7. Inputs validated (same as create)
8. Product patched with new data
9. updatedAt timestamp and updatedBy admin ID updated
10. Audit log created (`update_product` with previous name)
11. Redirect to dashboard

#### Flow 5: Delete Product
1. Admin clicks delete button on dashboard
2. **LIMITATION:** Delete handler not implemented in UI
3. Backend mutation `deleteProduct` exists and works:
   - Validates admin session
   - Deletes product from database
   - Creates audit log
4. **RISK:** No image cleanup (orphaned images in storage)

#### Flow 6: View Analytics
1. Admin navigates to `/admin/analytics`
2. AdminAnalytics page loads multiple queries in parallel:
   - `getTopProducts` - most viewed (default 10, max 50)
   - `getAffiliateClicks` - most clicked (default 10, max 50)
   - `getCategoryStats` - category click counts
   - `getSearchStats` - popular search queries (default 20, max 100)
3. All queries validate admin session
4. Data aggregated from analyticsEvents table
5. Results displayed in cards/tables
6. Real-time updates via Convex reactive queries

### 2.4 Admin Security Boundaries

#### Authentication Boundary
- **Entry Point:** `/admin/login` (email/password)
- **Session Storage:** localStorage (client-side, NOT httpOnly cookie)
- **Session Validation:** `validateAdminSession` queries adminId existence
- **CRITICAL ISSUE:** No server-side session token, no JWT, no expiration
- **Impact:** Admin can fake session by inserting adminId in localStorage

#### Authorization Boundary
- **All admin mutations/queries:** Check `validateAdminSession(adminId)`
- **Validation Logic:** Simply verifies adminId exists in adminUsers table
- **LIMITATION:** No token verification, no cryptographic proof
- **Rate Limiting:** Login attempts rate-limited (5 per 15 min)

#### Audit Trail
- **All admin actions logged:** create_product, update_product, delete_product, create_category, create_use_case
- **Login events logged:** login_success, login_failed_*, login_rate_limited, login_error
- **Audit queries:** `getAuditLogs` (50-500 records), `getSecurityEvents` (security-specific)
- **Cleanup:** `cleanupOldLogs` (batch delete old entries, max 100 per call)

---

## 3. Core Features

### 3.1 Public Features

#### 3.1.1 Product Browsing
- Latest products displayed on homepage (configurable limit, max 100)
- Product grid/list view toggle (UI component)
- Responsive product cards with image, name, description, buttons
- Lazy-loaded images from Convex storage CDN

#### 3.1.2 Advanced Filtering
- Filter by categories (hierarchical support in schema)
- Filter by use cases (flat tags)
- Full-text search on product names and descriptions
- **LIMITATION:** Category/use case filtering loads all products then filters in memory

#### 3.1.3 Pagination
- Cursor-based pagination for search results (100 items max per page)
- Custom pagination for category/use case filters (offset-based simulation)

#### 3.1.4 Product Discovery
- Categories displayed in left sidebar (fetched from `getAllCategories`)
- Use cases displayed in right sidebar (fetched from `getAllUseCases`)
- Product detail page shows full info, images carousel, affiliate button

#### 3.1.5 SEO Optimization
- SEOHead component for dynamic meta tags
- Open Graph tags for social sharing
- Canonical URLs (placeholder)
- Semantic HTML structure
- robots.txt and security.txt present

#### 3.1.6 Responsive Design
- Mobile-first Tailwind CSS
- Collapsible sidebars on mobile
- Touch-friendly interactions
- Responsive images

#### 3.1.7 Dark Mode
- System preference detection (initial load)
- Manual toggle in Navbar
- Persisted in localStorage
- CSS variables for colors

### 3.2 Admin Features

#### 3.2.1 Product Management
- Create/edit/delete products (delete UI not wired)
- Draft/published/archived status workflow
- Multi-image upload (max 20 per product)
- Category assignment (max 10 per product)
- Use case assignment (max 10 per product)
- Rich text description (plain text, no WYSIWYG editor present)

#### 3.2.2 Analytics Dashboard
- Top viewed products (product_view events)
- Top affiliate clicks (affiliate_click events)
- Category performance (category_click events)
- Popular search queries (search events)
- Real-time updates via Convex reactivity

#### 3.2.3 Security
- Bcrypt password hashing (12 salt rounds)
- Rate limiting on login (5 per 15 min), search (30/min), analytics (100/min), affiliate (10/min)
- Input validation (email format, password strength, URL format, XSS prevention)
- Audit logging for all admin actions
- Failed login tracking

#### 3.2.4 Content Organization
- Hierarchical categories (parentCategoryId support)
- Flat use case tags
- Image library in Convex storage
- Status-based product filtering

### 3.3 Security Features Summary

#### Input Validation
- **Email:** RFC-compliant regex, max 254 chars
- **Password:** 8-128 chars, uppercase, lowercase, number, special char required
- **URL:** Valid HTTP/HTTPS, max 2048 chars
- **Text:** Blocks `<script>`, `on*=`, `javascript:`, max 10000 chars

#### Rate Limiting
- **Login:** 5 attempts per 15 min per email/IP combo
- **Search:** 30 queries per minute per IP
- **Analytics:** 100 events per minute per IP
- **Affiliate Clicks:** 10 clicks per minute per IP
- **Cleanup:** Old entries (>24 hours) deleted on each recordAttempt call

#### XSS Prevention
- Input sanitization on text fields
- URL protocol whitelist
- Meta security headers component (ineffective without HTTP headers)

#### CSRF Protection
- Convex handles CSRF automatically (claims-based)
- Sessions not in httpOnly cookies (localStorage instead)

#### Privacy
- Analytics use anonymous session IDs
- No PII in analytics events
- IP addresses optional (undefined from client)
- Metadata sanitized (max 1000-2000 chars)

---

## 4. Project Structure

### 4.1 Directory Layout

```
prodView/
├── convex/                         # Backend code (Convex functions)
│   ├── _generated/                 # Auto-generated types and API
│   │   ├── api.d.ts               # API type definitions
│   │   ├── api.js                 # API exports
│   │   ├── dataModel.d.ts         # Database schema types
│   │   ├── server.d.ts            # Server function types
│   │   └── server.js              # Server exports
│   ├── adminAuth.ts               # Admin authentication (login, setup)
│   ├── analytics.ts               # Analytics tracking and queries
│   ├── audit.ts                   # Audit logging system
│   ├── auth.config.ts             # Convex Auth configuration
│   ├── auth.ts                    # Convex Auth setup (Password, Anonymous)
│   ├── authActions.ts             # (File mentioned but not examined)
│   ├── authInternal.ts            # Internal auth helpers (session validation)
│   ├── categories.ts              # Category CRUD operations
│   ├── http.ts                    # HTTP router setup (auth routes added)
│   ├── products.ts                # Product CRUD and queries
│   ├── router.ts                  # Basic HTTP router
│   ├── schema.ts                  # Database schema definitions
│   ├── security.ts                # Security utilities (rate limit, validation)
│   ├── useCases.ts                # Use case CRUD operations
│   └── tsconfig.json              # TypeScript config for Convex
│
├── src/                           # Frontend code (React application)
│   ├── components/                # Reusable UI components
│   │   ├── Layout.tsx             # Main layout wrapper (Navbar + Sidebars)
│   │   ├── LeftSidebar.tsx        # Category navigation sidebar
│   │   ├── Navbar.tsx             # Top navigation bar (search, theme toggle)
│   │   ├── ProductCard.tsx        # Product card component
│   │   ├── ProductGrid.tsx        # Product grid/list layout
│   │   ├── ProductImage.tsx       # Image component with Convex storage
│   │   ├── ProtectedRoute.tsx     # Admin route protection
│   │   ├── RightSidebar.tsx       # Use case navigation sidebar
│   │   ├── SEOHead.tsx            # SEO meta tags component
│   │   └── SecurityHeaders.tsx    # Security headers component (meta tags)
│   │
│   ├── contexts/                  # React contexts
│   │   └── ThemeContext.tsx       # Dark/light theme management
│   │
│   ├── hooks/                     # Custom React hooks
│   │   └── useAnalytics.ts        # Analytics tracking hooks
│   │
│   ├── pages/                     # Page components
│   │   ├── admin/
│   │   │   ├── AdminAnalytics.tsx      # Analytics dashboard page
│   │   │   ├── AdminDashboard.tsx      # Product management dashboard
│   │   │   ├── AdminLoginPage.tsx      # Admin login page
│   │   │   └── ProductEditorPage.tsx   # Product create/edit form
│   │   ├── HomePage.tsx                # Public landing page
│   │   ├── ProductDetailPage.tsx       # Individual product page
│   │   └── ProductSelectionPage.tsx    # Product browsing/filtering page
│   │
│   ├── utils/                     # Utility functions
│   │   ├── security.ts            # Client security utils (session, sanitize)
│   │   └── seo.ts                 # SEO helpers
│   │
│   ├── lib/
│   │   └── utils.ts               # General utilities (likely cn() helper)
│   │
│   ├── App.tsx                    # Main app component (routing)
│   ├── index.css                  # Global styles (Tailwind directives)
│   ├── main.tsx                   # Application entry point (ConvexAuthProvider)
│   ├── SignInForm.tsx             # (Not examined, likely unused)
│   ├── SignOutButton.tsx          # (Not examined, likely unused)
│   └── vite-env.d.ts              # Vite environment type declarations
│
├── public/                        # Static assets
│   ├── robots.txt                 # SEO robots file
│   └── security.txt               # Security contact info
│
├── .env.local                     # Environment variables (VITE_CONVEX_URL)
├── components.json                # Component library config (shadcn-style)
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── postcss.config.cjs             # PostCSS configuration
├── setup.mjs                      # Setup script
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript root config
├── tsconfig.app.json              # App-specific TypeScript config
├── tsconfig.node.json             # Node-specific TypeScript config
└── vite.config.ts                 # Vite build configuration
```

### 4.2 Feature Groupings

#### Backend Features (convex/)
- **Authentication:** adminAuth.ts, auth.ts, auth.config.ts, authInternal.ts
- **Authorization:** authInternal.ts (validateAdminSession)
- **Data Management:** products.ts, categories.ts, useCases.ts
- **Security:** security.ts (rate limiting, input validation)
- **Audit:** audit.ts (action logging, security events)
- **Analytics:** analytics.ts (event tracking, reporting)
- **HTTP:** http.ts, router.ts (HTTP routes, auth integration)
- **Schema:** schema.ts (database definitions)

#### Frontend Features (src/)
- **Routing:** App.tsx (React Router v7 setup)
- **Layout:** components/Layout.tsx, Navbar.tsx, LeftSidebar.tsx, RightSidebar.tsx
- **Product Display:** components/ProductCard.tsx, ProductGrid.tsx, ProductImage.tsx
- **Public Pages:** pages/HomePage.tsx, ProductSelectionPage.tsx, ProductDetailPage.tsx
- **Admin Pages:** pages/admin/* (AdminLoginPage, AdminDashboard, ProductEditorPage, AdminAnalytics)
- **Security:** components/ProtectedRoute.tsx, utils/security.ts
- **SEO:** components/SEOHead.tsx, utils/seo.ts
- **State:** contexts/ThemeContext.tsx, hooks/useAnalytics.ts

### 4.3 Shared Utilities

#### Backend Internal Functions (convex/)
- `internal.security.*` - Rate limiting, input validation
- `internal.audit.*` - Audit logging
- `internal.authInternal.*` - Session validation, admin queries
- `internal.adminAuth.*` - Admin authentication queries

#### Frontend Utilities (src/utils/)
- `security.ts` - Client-side sanitization, session management, client info
- `seo.ts` - SEO helpers (not examined)
- `lib/utils.ts` - General utilities (not examined)

---

## 5. Data Models

### 5.1 Database Schema Overview

The application uses 9 tables total:
- **Application Tables:** 8 custom tables
- **Auth Tables:** Convex Auth system tables (imported from @convex-dev/auth)

### 5.2 Application Tables

#### Table 1: products

**Purpose:** Core entity storing product information for the affiliate catalog.

**Fields:**
- `name` (string) - Product name (trimmed, validated for XSS, max 10000 chars)
- `description` (string) - Product description (trimmed, validated for XSS, max 10000 chars)
- `images` (array of storage IDs) - Product images (max 20, stored in Convex storage)
- `affiliateUrl` (string) - External affiliate link (validated URL, http/https only, max 2048 chars)
- `categories` (array of category IDs) - Associated categories (max 10)
- `useCases` (array of use case IDs) - Associated use cases (max 10)
- `status` (union: draft | published | archived) - Publication status
- `createdAt` (number) - Creation timestamp (Date.now())
- `updatedAt` (number) - Last update timestamp (Date.now())
- `createdBy` (adminUsers ID) - Creator admin ID
- `updatedBy` (adminUsers ID) - Last editor admin ID

**Indexes:**
- `by_status` - Filter by publication status
- `by_created_at` - Chronological sorting
- `by_updated_at` - Recent updates
- `by_status_and_created_at` - Composite (used for published products query)
- `search_name` - Full-text search on name (filtered by status)
- `search_description` - Full-text search on description (filtered by status)

**Query Patterns:**
- Published products only for public users
- All products (any status) for admin users
- Full-text search with status filter
- **LIMITATION:** No indexes for categories or useCases arrays (inefficient filtering)

---

#### Table 2: categories

**Purpose:** Hierarchical categorization system for organizing products.

**Fields:**
- `name` (string) - Category name (no length limit specified)
- `parentCategoryId` (optional category ID) - Parent category for hierarchy
- `createdAt` (number) - Creation timestamp

**Indexes:**
- `by_name` - Name lookups
- `by_parent` - Hierarchical queries (find children of parent)
- `by_created_at` - Chronological sorting

**Query Patterns:**
- Fetch all categories (no filtering in getAllCategories)
- **AMBIGUITY:** Hierarchical structure defined but no queries utilize it

---

#### Table 3: useCases

**Purpose:** Flat tag system for product use case categorization.

**Fields:**
- `name` (string) - Use case name
- `createdAt` (number) - Creation timestamp

**Indexes:**
- `by_name` - Name lookups
- `by_created_at` - Chronological sorting

**Query Patterns:**
- Fetch all use cases (no filtering in getAllUseCases)

---

#### Table 4: adminUsers

**Purpose:** Admin user accounts with bcrypt-hashed passwords.

**Fields:**
- `email` (string) - Admin email (unique, lowercase trimmed, RFC-compliant, max 254 chars)
- `passwordHash` (string) - Bcrypt hash (12 salt rounds)
- `role` (literal: "admin") - User role (hardcoded to "admin")
- `createdAt` (number) - Account creation timestamp
- `lastLoginAt` (optional number) - Last successful login timestamp

**Indexes:**
- `by_email` - Authentication lookups (unique constraint via query logic)
- `by_created_at` - Admin management
- `by_last_login` - Activity tracking

**Security:**
- Passwords hashed with bcrypt (12 rounds)
- Email validated on creation
- Password strength enforced (8-128 chars, mixed case, number, special char)
- **DEFAULT ADMIN:** xxxxxxxxxxxx / xxxxxxxxxxxx (hardcoded in setupFirstAdmin)

---

#### Table 5: auditLogs

**Purpose:** Comprehensive audit trail for all admin actions and security events.

**Fields:**
- `adminUserId` (adminUsers ID or null) - User who performed action (null for system/anonymous)
- `action` (string) - Action type (max 100 chars)
- `entityType` (string) - Type of entity affected (max 50 chars)
- `entityId` (string) - ID of affected entity (max 100 chars)
- `timestamp` (number) - Action timestamp (Date.now())
- `metadata` (optional object) - Additional context (sanitized to 2000 chars if too large)

**Indexes:**
- `by_admin_user` - User activity history
- `by_entity` - Entity change history (composite: entityType + entityId)
- `by_timestamp` - Chronological queries
- `by_admin_and_timestamp` - User activity timelines (composite)
- `by_entity_and_timestamp` - Entity change timelines (composite)

**Tracked Actions:**
- **Product:** create_product, update_product, delete_product
- **Category:** create_category
- **Use Case:** create_use_case
- **Authentication:** login_success, login_failed_user_not_found, login_failed_invalid_password, login_rate_limited, login_error
- **Password Reset:** password_reset_requested, password_reset_completed (functionality exists but not used)

**Cleanup:**
- `cleanupOldLogs` mutation deletes old logs (configurable days, max 100 per call)
- **LIMITATION:** No automatic cleanup (requires manual/scheduled execution)

---

#### Table 6: passwordResets

**Purpose:** Password reset token management (functionality defined but unused in UI).

**Fields:**
- `adminId` (adminUsers ID) - Admin requesting reset
- `tokenHash` (string) - Hashed reset token
- `expiresAt` (number) - Token expiration timestamp
- `createdAt` (number) - Token creation timestamp
- `used` (optional boolean) - Token usage flag

**Indexes:**
- `by_token_hash` - Token validation
- `by_admin` - User's reset requests
- `by_expires_at` - Cleanup queries

**Security:**
- Tokens are hashed before storage
- Expiration enforced
- Old tokens cleaned up on new token creation

**Status:** Defined but not implemented in frontend

---

#### Table 7: analyticsEvents

**Purpose:** User interaction and behavior tracking for analytics.

**Fields:**
- `eventType` (string) - Event category (whitelist: product_view, affiliate_click, category_click, use_case_click, search, page_view)
- `entityId` (optional string) - Related entity ID (product/category/use case)
- `metadata` (optional object) - Event context (sanitized to 1000 chars)
- `timestamp` (number) - Event timestamp
- `sessionId` (string) - Anonymous session identifier (Math.random() generated)

**Indexes:**
- `by_event_type` - Event filtering
- `by_timestamp` - Time-based analysis
- `by_entity` - Entity-specific analytics (entityId)
- `by_event_and_timestamp` - Efficient reporting (composite)

**Privacy:**
- No PII stored
- Anonymous session IDs (client-generated random string)
- IP addresses optional (undefined from client)
- Metadata sanitized

**Query Patterns:**
- Top products by views (aggregate product_view events)
- Top affiliate clicks (aggregate affiliate_click events)
- Category stats (aggregate category_click events)
- Search stats (aggregate search events, extract query from metadata)

---

#### Table 8: rateLimits

**Purpose:** Rate limiting and abuse prevention tracking.

**Fields:**
- `key` (string) - Rate limit identifier (e.g., "login:email:ip", "search:ip", "analytics:ip")
- `timestamp` (number) - Attempt timestamp
- `ip` (optional string) - Client IP (anonymized, optional)
- `userAgent` (optional string) - Client user agent

**Indexes:**
- `by_key` - Rate limit checks
- `by_timestamp` - Cleanup queries
- `by_key_and_timestamp` - Window-based limiting (composite, range queries)

**Rate Limits:**
- **Login:** 5 attempts per 15 minutes per email/IP
- **Search:** 30 queries per minute per IP
- **Analytics:** 100 events per minute per IP
- **Affiliate:** 10 clicks per minute per IP

**Cleanup:**
- Entries older than 24 hours deleted on every `recordAttempt` call
- **PERFORMANCE ISSUE:** Cleanup runs on every rate-limited operation (should be scheduled)

---

### 5.3 Auth Tables (Convex Auth)

**Source:** Imported from `@convex-dev/auth/server`

These tables handle the Convex Auth system for public users:
- **users** - User accounts (anonymous users)
- **authSessions** - Session management
- **authAccounts** - Auth provider accounts
- **authVerificationCodes** - Verification codes
- **authRefreshTokens** - Refresh tokens
- **authRateLimits** - Convex Auth rate limiting

**Usage in ProdView:**
- Anonymous provider enabled (public users auto-authenticated)
- Password provider enabled (not used in current admin flow)
- Admin auth bypasses Convex Auth (custom bcrypt implementation)

---

## 6. Convex Dependency Inventory

### 6.1 Convex Queries (Public & Admin)

#### products.ts

**`getLatestProducts`** (PUBLIC)
- **Args:** `{ limit: number }` (max 100)
- **Returns:** Array of published products
- **Logic:** Query by status="published", ordered by createdAt desc
- **Used By:** HomePage, ProductSelectionPage
- **Index Used:** `by_status_and_created_at`

**`getProductById`** (PUBLIC)
- **Args:** `{ productId: Id<"products"> }`
- **Returns:** Product document or null
- **Logic:** Get product by ID, return null if not published
- **Used By:** ProductDetailPage
- **Index Used:** None (direct ID lookup)

**`searchProducts`** (PUBLIC)
- **Args:** `{ keyword: string, paginationOpts: PaginationOptions, ip?: string }`
- **Returns:** Paginated products matching search
- **Logic:**
  - Rate limit check (30/min per IP)
  - Input validation (text sanitization)
  - Full-text search on name (search index)
  - Filtered by status="published"
  - Paginated (100 items max)
- **Used By:** Navbar search, ProductSelectionPage
- **Index Used:** `search_name`

**`getProductsByCategory`** (PUBLIC)
- **Args:** `{ categoryId: Id<"categories">, paginationOpts: PaginationOptions }`
- **Returns:** Paginated products in category
- **Logic:**
  - **INEFFICIENT:** Loads ALL published products
  - Filters in-memory for categoryId in categories array
  - Manual pagination with cursor (offset-based)
- **Used By:** ProductSelectionPage (category filter)
- **Index Used:** `by_status_and_created_at` (but still loads all)
- **LIMITATION:** No array index for categories

**`getProductsByUseCase`** (PUBLIC)
- **Args:** `{ useCaseId: Id<"useCases">, paginationOpts: PaginationOptions }`
- **Returns:** Paginated products with use case
- **Logic:** Same as getProductsByCategory (inefficient)
- **Used By:** ProductSelectionPage (use case filter)
- **Index Used:** `by_status_and_created_at` (but still loads all)
- **LIMITATION:** No array index for useCases

**`getImageUrl`** (PUBLIC)
- **Args:** `{ storageId: Id<"_storage"> }`
- **Returns:** Public URL string
- **Logic:** Convex storage URL retrieval
- **Used By:** ProductImage component

**`getAllProductsForAdmin`** (ADMIN)
- **Args:** `{ adminId: Id<"adminUsers">, limit?: number }`
- **Returns:** Array of products (any status)
- **Logic:**
  - Validates admin session
  - Returns all products ordered by createdAt desc
  - Limit: default 100, max 1000
- **Used By:** AdminDashboard
- **Index Used:** `by_created_at`

---

#### categories.ts

**`getAllCategories`** (PUBLIC)
- **Args:** None
- **Returns:** Array of all categories
- **Logic:** Query all, ordered asc (by what field? Not specified)
- **Used By:** LeftSidebar, ProductEditorPage
- **AMBIGUITY:** Sort order unclear

**`getCategoryById`** (PUBLIC)
- **Args:** `{ categoryId: Id<"categories"> }`
- **Returns:** Category document
- **Logic:** Direct ID lookup
- **Used By:** Unknown (likely internal)

---

#### useCases.ts

**`getAllUseCases`** (PUBLIC)
- **Args:** None
- **Returns:** Array of all use cases
- **Logic:** Query all, ordered asc
- **Used By:** RightSidebar, ProductEditorPage

**`getUseCaseById`** (PUBLIC)
- **Args:** `{ useCaseId: Id<"useCases"> }`
- **Returns:** Use case document
- **Logic:** Direct ID lookup
- **Used By:** Unknown (likely internal)

---

#### analytics.ts

**`getTopProducts`** (ADMIN)
- **Args:** `{ adminId: Id<"adminUsers">, limit?: number }`
- **Returns:** Array of products with view counts
- **Logic:**
  - Validates admin session
  - Fetches all product_view events
  - Aggregates counts by entityId (productId)
  - Sorts by count desc
  - Fetches product docs for top N (default 10, max 50)
- **Used By:** AdminAnalytics
- **PERFORMANCE:** Loads all product_view events (no pagination)

**`getAffiliateClicks`** (ADMIN)
- **Args:** `{ adminId: Id<"adminUsers">, limit?: number }`
- **Returns:** Array of products with click counts
- **Logic:** Same as getTopProducts but for affiliate_click events
- **Used By:** AdminAnalytics

**`getCategoryStats`** (ADMIN)
- **Args:** `{ adminId: Id<"adminUsers"> }`
- **Returns:** Array of categories with click counts
- **Logic:**
  - Validates admin session
  - Fetches all category_click events
  - Aggregates by entityId (categoryId)
  - Fetches category docs
  - Sorts by clicks desc
- **Used By:** AdminAnalytics

**`getSearchStats`** (ADMIN)
- **Args:** `{ adminId: Id<"adminUsers">, limit?: number }`
- **Returns:** Array of search queries with counts
- **Logic:**
  - Validates admin session
  - Fetches all search events
  - Extracts query from metadata
  - Aggregates counts
  - Sorts by count desc
  - Returns top N (default 20, max 100)
- **Used By:** AdminAnalytics

---

#### audit.ts

**`getAuditLogs`** (ADMIN)
- **Args:** `{ adminId: Id<"adminUsers">, limit?: number }`
- **Returns:** Array of audit log entries
- **Logic:**
  - Validates admin session
  - Query by timestamp desc
  - Limit: default 50, max 500
- **Used By:** Unknown (likely admin audit page if exists)
- **Index Used:** `by_timestamp`

**`getSecurityEvents`** (ADMIN)
- **Args:** `{ adminId: Id<"adminUsers">, limit?: number }`
- **Returns:** Array of security-related audit logs
- **Logic:**
  - Validates admin session
  - Fetches 2x limit logs
  - Filters for security actions (login_*, password_reset_*)
  - Returns top limit (default 100, max 500)
- **Used By:** Unknown (likely admin security page if exists)
- **Index Used:** `by_timestamp`

---

#### authInternal.ts (Internal Queries)

**`validateAdminSession`** (INTERNAL)
- **Args:** `{ adminId: Id<"adminUsers"> }`
- **Returns:** Admin document or null
- **Logic:** Get admin by ID, return if exists
- **Used By:** All admin mutations/queries
- **CRITICAL LIMITATION:** No token validation, just ID existence check

**`getCurrentAdminInternal`** (INTERNAL)
- **Args:** `{ adminId?: Id<"adminUsers"> }`
- **Returns:** Admin document or null
- **Logic:** Same as validateAdminSession but optional adminId
- **Status:** Placeholder, not fully implemented

**`getAdminByEmail`** (INTERNAL)
- **Args:** `{ email: string }`
- **Returns:** Admin document or null
- **Logic:** Query by email (unique)
- **Used By:** adminLogin action
- **Index Used:** `by_email`

**`getResetTokenByHash`** (INTERNAL)
- **Args:** `{ tokenHash: string }`
- **Returns:** Password reset token document or null
- **Logic:** Query by token hash (unique)
- **Used By:** Password reset flow (not implemented in UI)
- **Index Used:** `by_token_hash`

---

#### adminAuth.ts (Internal Query)

**`getAdminByEmail`** (INTERNAL)
- **Args:** `{ email: string }`
- **Returns:** Admin document or null
- **Logic:** Duplicate of authInternal.getAdminByEmail
- **Used By:** adminLogin action

---

#### security.ts (Internal Queries)

**`checkRateLimit`** (INTERNAL)
- **Args:** `{ key: string, windowMs: number, maxAttempts: number }`
- **Returns:** `{ allowed: boolean, remaining: number, resetTime: number }`
- **Logic:**
  - Query rateLimits by key and timestamp >= (now - windowMs)
  - Check if count < maxAttempts
  - Return allow status and metadata
- **Used By:** All rate-limited mutations/queries
- **Index Used:** `by_key_and_timestamp`

**`validateInput`** (INTERNAL)
- **Args:** `{ type: "email" | "password" | "url" | "text", value: string }`
- **Returns:** `{ valid: boolean, error: string | null }`
- **Logic:**
  - Email: RFC regex, max 254 chars
  - Password: strength checks (uppercase, lowercase, number, special, 8-128 chars)
  - URL: valid URL object, http/https only, max 2048 chars
  - Text: XSS prevention (no `<script>`, `on*=`, `javascript:`), max 10000 chars
- **Used By:** All input-accepting mutations
- **No Index:** Validation is in-memory

---

### 6.2 Convex Mutations (Admin & Public)

#### products.ts

**`generateUploadUrl`** (ADMIN)
- **Args:** `{ adminId: Id<"adminUsers"> }`
- **Returns:** Upload URL string
- **Logic:**
  - Validates admin session
  - Generates Convex storage upload URL
- **Used By:** ProductEditorPage (image upload)

**`createProduct`** (ADMIN)
- **Args:** `{ adminId, name, description, affiliateUrl, categories, useCases, images }`
- **Returns:** Product ID string
- **Logic:**
  - Validates admin session
  - Validates all inputs (XSS, URL format, lengths)
  - Enforces limits (10 categories, 10 use cases, 20 images)
  - Inserts product with status="draft"
  - Sets createdBy and updatedBy to admin ID
  - Logs audit action
- **Used By:** ProductEditorPage (create flow)

**`updateProduct`** (ADMIN)
- **Args:** `{ adminId, productId, name, description, affiliateUrl, categories, useCases, images }`
- **Returns:** Product ID string
- **Logic:**
  - Validates admin session
  - Fetches existing product
  - Validates all inputs (same as create)
  - Patches product with new data
  - Updates updatedAt timestamp and updatedBy
  - Logs audit action with previous name
- **Used By:** ProductEditorPage (edit flow)

**`deleteProduct`** (ADMIN)
- **Args:** `{ adminId: Id<"adminUsers">, productId: Id<"products"> }`
- **Returns:** None
- **Logic:**
  - Validates admin session
  - Fetches product (for audit log)
  - Deletes product document
  - Logs audit action
  - **LIMITATION:** Does not delete associated images from storage
- **Used By:** AdminDashboard (button not wired)

---

#### categories.ts

**`createCategory`** (ADMIN)
- **Args:** `{ adminId: Id<"adminUsers">, name: string, parentCategoryId?: Id<"categories"> }`
- **Returns:** Category ID
- **Logic:**
  - Validates admin session
  - Inserts category with optional parent
  - Logs audit action
- **Used By:** Unknown (likely admin category management if exists)

---

#### useCases.ts

**`createUseCase`** (ADMIN)
- **Args:** `{ adminId: Id<"adminUsers">, name: string }`
- **Returns:** Use case ID
- **Logic:**
  - Validates admin session
  - Inserts use case
  - Logs audit action
- **Used By:** Unknown (likely admin use case management if exists)

---

#### analytics.ts

**`trackEvent`** (PUBLIC)
- **Args:** `{ eventType: string, entityId?: string, metadata?: object, timestamp: number, ip?: string }`
- **Returns:** None
- **Logic:**
  - Rate limit check (100/min per IP)
  - Validates event type against whitelist
  - Sanitizes metadata (max 1000 chars)
  - Records rate limit attempt
  - Inserts analytics event with anonymous sessionId
  - Silently fails on error (no exception thrown)
- **Used By:** useAnalytics hook

**`trackAffiliateClick`** (PUBLIC)
- **Args:** `{ productId: Id<"products">, ip?: string, userAgent?: string }`
- **Returns:** `{ redirectUrl: string }`
- **Logic:**
  - Rate limit check (10/min per IP)
  - Fetches product (must be published)
  - Records rate limit attempt
  - Inserts affiliate_click event
  - Returns affiliate URL
- **Used By:** useAffiliateTracking hook

---

#### audit.ts (Internal Mutation)

**`logAction`** (INTERNAL)
- **Args:** `{ adminUserId, action, entityType, entityId, metadata? }`
- **Returns:** None
- **Logic:**
  - Validates field lengths (action max 100, entityType max 50, entityId max 100)
  - Sanitizes metadata (max 2000 chars, truncates if too large)
  - Inserts audit log entry
- **Used By:** All admin mutations, login actions

**`cleanupOldLogs`** (INTERNAL)
- **Args:** `{ daysToKeep: number }`
- **Returns:** `{ deletedCount: number, remaining: number }`
- **Logic:**
  - Calculates cutoff time (now - daysToKeep * 24h)
  - Queries logs older than cutoff
  - Deletes up to 100 entries
  - Returns deletion stats
- **Used By:** Unknown (likely scheduled task if configured)

---

#### security.ts (Internal Mutation)

**`recordAttempt`** (INTERNAL)
- **Args:** `{ key: string, ip?: string, userAgent?: string }`
- **Returns:** None
- **Logic:**
  - Inserts rate limit entry with current timestamp
  - **CLEANUP:** Queries and deletes entries older than 24h (inline)
  - **PERFORMANCE ISSUE:** Cleanup on every call
- **Used By:** All rate-limited operations

---

#### authInternal.ts (Internal Mutations)

**`updateLastLogin`** (INTERNAL)
- **Args:** `{ adminId: Id<"adminUsers"> }`
- **Returns:** None
- **Logic:** Patches admin with lastLoginAt timestamp
- **Used By:** adminLogin action (on success)

**`insertResetToken`** (INTERNAL)
- **Args:** `{ adminId, tokenHash, expiresAt }`
- **Returns:** Token ID
- **Logic:**
  - Cleans up old tokens for admin
  - Inserts new password reset token
- **Used By:** Password reset flow (not implemented in UI)

**`deleteResetTokenMutation`** (INTERNAL)
- **Args:** `{ tokenId: Id<"passwordResets"> }`
- **Returns:** None
- **Logic:** Deletes reset token by ID
- **Used By:** Password reset flow

**`insertAdmin`** (INTERNAL)
- **Args:** `{ email: string, passwordHash: string }`
- **Returns:** Admin ID
- **Logic:** Inserts admin with role="admin" and createdAt
- **Used By:** setupFirstAdmin, createAdmin

**`updateAdminPassword`** (INTERNAL)
- **Args:** `{ adminId, passwordHash }`
- **Returns:** None
- **Logic:** Patches admin with new password hash
- **Used By:** Password reset flow

---

#### adminAuth.ts (Internal Mutation)

**`updateLastLogin`** (INTERNAL)
- **Args:** `{ adminId: Id<"adminUsers"> }`
- **Returns:** None
- **Logic:** Duplicate of authInternal.updateLastLogin
- **Used By:** adminLogin action

**`createAdmin`** (INTERNAL)
- **Args:** `{ email: string, password: string }`
- **Returns:** Admin ID
- **Logic:**
  - Validates email and password
  - Checks for existing admin
  - Hashes password with bcrypt (12 rounds)
  - Inserts admin
- **Used By:** Unknown (likely admin user management if exists)

**`setupFirstAdmin`** (MUTATION, PUBLIC)
- **Args:** None
- **Returns:** `{ adminId, email, password, message }`
- **Logic:**
  - Checks if any admins exist (fails if yes)
  - Creates default admin: xxxxxxxxxxxx / xxxxxxxxxxxx
  - Returns credentials
- **Used By:** Initial setup (one-time)
- **SECURITY RISK:** Default credentials hardcoded

---

### 6.3 Convex Actions

#### adminAuth.ts

**`adminLogin`** (PUBLIC ACTION)
- **Args:** `{ email: string, password: string, ip?: string, userAgent?: string }`
- **Returns:** `{ adminId: string, email: string, role: string }`
- **Logic:**
  - Rate limit check (5 per 15 min per email/IP)
  - Validates email and password format
  - Records rate limit attempt
  - Fetches admin by email
  - Compares password with bcrypt hash
  - Updates last login timestamp
  - Logs audit action (success or failure)
  - Returns admin session data (NOT a token, just data)
- **Used By:** AdminLoginPage
- **SECURITY ISSUE:** No session token issued, only adminId returned

---

### 6.4 Convex Auth Hooks

#### auth.ts

**`auth`** - Convex Auth instance
- **Providers:** Password, Anonymous
- **Used By:** HTTP routes (auth.addHttpRoutes)

**`signIn`** - Sign-in function (not used in current flow)

**`signOut`** - Sign-out function (not used in current flow)

**`store`** - Auth state store

**`isAuthenticated`** - Authentication check

**`loggedInUser`** (QUERY)
- **Returns:** Current authenticated user (from Convex Auth users table)
- **Logic:** Gets userId from auth context, fetches user doc
- **Used By:** Unknown (public users don't use this)
- **AMBIGUITY:** Admin auth bypasses this system

---

### 6.5 Realtime Features

All Convex queries are reactive by default:
- **Automatic Updates:** When data changes, all subscribed components re-render
- **WebSocket Connection:** Convex client maintains persistent connection
- **Optimistic Updates:** Mutations can optionally update UI before server confirms

**Examples:**
- AdminDashboard updates in real-time when products change
- Analytics page updates as new events are tracked
- Product lists update when products are published/unpublished

**No Polling:** Convex uses server-push model (no client polling required)

---

## 7. Risks, Ambiguities & Critical Issues

### 7.1 CRITICAL Security Risks

#### Risk 1: Admin Authentication System is Fundamentally Broken

**Issue:**
The admin authentication system does NOT use session tokens or JWT. Instead:
1. `adminLogin` action returns `{ adminId, email, role }` after successful login
2. This data is stored in localStorage (client-side, unencrypted)
3. All admin mutations call `validateAdminSession(adminId)` which ONLY checks if adminId exists in adminUsers table
4. There is NO cryptographic proof of authentication

**Impact:**
- **Any user can fake admin access** by inserting a valid adminId into localStorage
- No session expiration (localStorage persists indefinitely)
- No way to invalidate sessions server-side
- CSRF vulnerable (no token verification)
- Session hijacking trivial (just copy adminId)

**Evidence:**
- `convex/authInternal.ts:5-15` - validateAdminSession only does `ctx.db.get(args.adminId)`
- `convex/adminAuth.ts:99-103` - adminLogin returns plain data, not a token
- `src/utils/security.ts:37-59` - Session stored in localStorage without encryption

**Severity:** CRITICAL - Application is not production-ready

**Required Fix:**
1. Implement JWT-based session tokens
2. Store tokens in httpOnly cookies or secure storage
3. Validate tokens cryptographically in validateAdminSession
4. Add session expiration (e.g., 24 hours)
5. Implement logout functionality (token invalidation)

---

#### Risk 2: Hardcoded Admin Credentials

**Issue:**
Default admin credentials are hardcoded in `convex/adminAuth.ts:201-202`:
```typescript
const defaultEmail = "xxxxxxxxxxxx";
const defaultPassword = "xxxxxxxxxxxx";
```

**Impact:**
- If codebase is public, credentials are exposed
- Credentials visible in version history
- No forced password change on first login
- Violates security best practices

**Evidence:** `convex/adminAuth.ts:201-202`

**Severity:** HIGH

**Required Fix:**
1. Move credentials to environment variables
2. Use CLI prompts for setup instead
3. Force password change on first login
4. Remove from version history (git filter-branch)

---

#### Risk 3: Security Headers Only in Meta Tags

**Issue:**
`SecurityHeaders.tsx` component only renders `<meta>` tags for security policies. True security headers must be set at the HTTP response level.

**Impact:**
- Meta CSP has lower priority than HTTP header CSP
- Some security features (X-Frame-Options, etc.) don't work via meta tags
- Browser support inconsistent for meta-based security
- False sense of security

**Evidence:** `src/components/SecurityHeaders.tsx` (component examined via projectStructure.md)

**Severity:** MEDIUM

**Required Fix:**
1. Configure security headers in HTTP router (`convex/http.ts`)
2. Or configure in hosting platform (Vercel, Netlify headers config)
3. Remove meta tag approach

---

#### Risk 4: Client-Side IP Address Collection

**Issue:**
`getClientInfo()` in `src/utils/security.ts:18-24` returns `ip: undefined` because client-side JavaScript cannot access real IP.

**Impact:**
- Rate limiting by IP is ineffective (all requests from same "undefined" key)
- Abuse prevention weakened
- Analytics IP tracking doesn't work

**Evidence:** `src/utils/security.ts:22`

**Severity:** MEDIUM

**Required Fix:**
1. Extract IP from HTTP headers server-side (X-Forwarded-For, etc.)
2. Pass IP to mutations via Convex HTTP routes or actions
3. Update rate limiting to use server-extracted IP

---

### 7.2 Data Integrity Risks

#### Risk 5: Orphaned Images in Storage

**Issue:**
`deleteProduct` mutation does not delete associated images from Convex storage.

**Impact:**
- Storage bloat over time
- Cost increase (storage charges)
- No cleanup mechanism for replaced images either

**Evidence:** `convex/products.ts:336-363` - deleteProduct only deletes product doc

**Severity:** MEDIUM

**Required Fix:**
1. Fetch product.images array before deletion
2. Call `ctx.storage.delete(imageId)` for each image
3. Implement cleanup for image replacements in updateProduct
4. Add batch cleanup utility for orphaned images

---

#### Risk 6: No Cascade Deletion

**Issue:**
If a category or use case is deleted (mutation not implemented), products still reference it.

**Impact:**
- Dangling references in products.categories and products.useCases arrays
- UI may break when trying to display deleted categories
- Data inconsistency

**Evidence:** No delete mutations for categories/useCases

**Severity:** LOW (delete functionality not implemented yet)

**Required Fix:**
1. Implement cascade deletion (remove references from products)
2. Or prevent deletion if category/use case is in use
3. Add referential integrity checks

---

### 7.3 Performance Risks

#### Risk 7: Inefficient Product Filtering

**Issue:**
`getProductsByCategory` and `getProductsByUseCase` queries load ALL published products into memory then filter.

**Impact:**
- Poor performance with large datasets (>1000 products)
- High memory usage
- Slow queries
- Database bandwidth waste

**Evidence:** `convex/products.ts:78-134` - `.collect()` then `.filter()`

**Severity:** HIGH (scalability issue)

**Required Fix:**
1. Add search indexes or composite indexes for array fields
2. Use Convex array filtering in query (if supported)
3. Or restructure data (junction tables for categories/useCases)

---

#### Risk 8: Rate Limit Cleanup on Every Request

**Issue:**
`recordAttempt` mutation queries and deletes old rate limit entries (>24h) on EVERY call.

**Impact:**
- Performance overhead on every rate-limited operation
- Unnecessary database queries
- Could slow down login, search, analytics tracking

**Evidence:** `convex/security.ts:43-51` - cleanup loop in recordAttempt

**Severity:** MEDIUM

**Required Fix:**
1. Implement Convex cron job for scheduled cleanup
2. Or move cleanup to background task
3. Or use TTL-based approach (if Convex supports it)

---

#### Risk 9: Analytics Aggregation Performance

**Issue:**
`getTopProducts`, `getAffiliateClicks`, etc. load ALL events of a type into memory for aggregation.

**Impact:**
- Performance degrades as event count grows
- Memory issues with large analytics datasets
- Slow admin analytics page

**Evidence:** `convex/analytics.ts:134-137` - `.collect()` with no limit

**Severity:** MEDIUM

**Required Fix:**
1. Add pagination or time range filtering
2. Use database aggregation (if Convex supports it)
3. Pre-aggregate stats in separate table (materialized views)
4. Archive old events periodically

---

### 7.4 Functional Gaps

#### Gap 1: Delete Product Button Not Wired

**Issue:**
AdminDashboard has delete buttons but no onClick handler.

**Impact:**
- Admins cannot delete products via UI
- Backend mutation exists and works
- User confusion

**Evidence:** projectStructure.md line 987-994

**Severity:** LOW

**Required Fix:**
1. Wire up delete button to call `deleteProduct` mutation
2. Add confirmation dialog
3. Show success/error notifications
4. Implement optimistic UI updates

---

#### Gap 2: Password Reset Flow Not Implemented

**Issue:**
Database schema, internal mutations, and audit logging exist for password reset, but no UI or action implemented.

**Impact:**
- Admins cannot reset forgotten passwords
- Must manually update database
- Poor user experience

**Evidence:**
- `convex/schema.ts:73-82` - passwordResets table defined
- `convex/authInternal.ts:49-88` - reset token mutations defined
- No UI in AdminLoginPage

**Severity:** MEDIUM

**Required Fix:**
1. Implement "Forgot Password" link on login page
2. Create password reset action (email token generation)
3. Create password reset confirmation page
4. Integrate with email service (Resend, SendGrid, etc.)

---

#### Gap 3: Admin User Management Missing

**Issue:**
Only one admin can exist (setupFirstAdmin is one-time). No UI to create additional admins.

**Impact:**
- Cannot add multiple admin users
- Single point of failure (one admin account)
- No role differentiation (all admins have same permissions)

**Evidence:**
- `convex/adminAuth.ts:146-189` - createAdmin mutation exists (internal only)
- No admin user management page

**Severity:** MEDIUM

**Required Fix:**
1. Create admin user management page (CRUD admins)
2. Expose createAdmin via mutation with proper validation
3. Implement role-based access control (RBAC)
4. Add password change functionality

---

#### Gap 4: Category/Use Case Management UI Missing

**Issue:**
Mutations exist for creating categories and use cases, but no admin UI for management.

**Impact:**
- Admins must manually call mutations via Convex dashboard
- Cannot edit or delete categories/use cases
- No hierarchical category UI (parentCategoryId not utilized)

**Evidence:**
- `convex/categories.ts:20-50` - createCategory mutation exists
- No admin category management page

**Severity:** LOW

**Required Fix:**
1. Create category management page (CRUD, hierarchical tree view)
2. Create use case management page (CRUD, simple list)
3. Add edit/delete mutations
4. Implement drag-and-drop for category hierarchy

---

### 7.5 Ambiguities & Unclear Behaviors

#### Ambiguity 1: Product Status Workflow

**Issue:**
Products have draft/published/archived status, but no clear workflow for status transitions.

**Questions:**
- Can published products be reverted to draft?
- Can archived products be republished?
- Should status changes be audited?
- Are there permission differences per status?

**Evidence:** `convex/schema.ts:13` - status union defined

**Impact:** Business logic unclear

**Recommendation:** Document status workflow, add status change audit logging

---

#### Ambiguity 2: Category Hierarchy Not Used

**Issue:**
Categories have `parentCategoryId` field for hierarchy, but no queries or UI utilize it.

**Questions:**
- Should categories display hierarchically?
- Should product filtering respect hierarchy (include child categories)?
- Is hierarchy meant for navigation breadcrumbs?

**Evidence:**
- `convex/schema.ts:34` - parentCategoryId field
- `convex/categories.ts:9` - getAllCategories returns flat list

**Impact:** Feature incomplete or unused

**Recommendation:** Either implement hierarchy features or remove field

---

#### Ambiguity 3: Search Pagination Unclear

**Issue:**
`searchProducts` uses `paginationOptsValidator` but implementation details unclear.

**Questions:**
- How are cursors generated for search results?
- Are results stable across pages (same order)?
- Does pagination work correctly with search index?

**Evidence:** `convex/products.ts:36-76` - pagination used but not documented

**Impact:** Potential pagination bugs

**Recommendation:** Test pagination thoroughly, add comments explaining cursor logic

---

#### Ambiguity 4: Anonymous Session Generation

**Issue:**
Analytics events use `Math.random().toString(36).substring(7)` for sessionId.

**Questions:**
- Is this meant to be per-page-load or persistent?
- Should sessionId be stored in localStorage?
- How are sessions correlated for user journey tracking?

**Evidence:** `convex/analytics.ts:67, 112` - random sessionId on every event

**Impact:** Analytics may not track user sessions accurately

**Recommendation:** Generate sessionId once per session, store in sessionStorage

---

#### Ambiguity 5: Convex Auth Usage

**Issue:**
Convex Auth is configured with Password and Anonymous providers, but admin auth bypasses it entirely.

**Questions:**
- Why is Password provider enabled if not used?
- Should admin auth use Convex Auth instead of custom bcrypt?
- What is the long-term auth strategy?

**Evidence:**
- `convex/auth.ts:6-8` - Password provider configured
- `convex/adminAuth.ts` - Custom bcrypt authentication

**Impact:** Architectural inconsistency

**Recommendation:** Either unify on Convex Auth or remove unused provider

---

### 7.6 Code Quality Issues

#### Issue 1: Duplicate Functions

**Issue:**
`getAdminByEmail` and `updateLastLogin` are defined in both `adminAuth.ts` and `authInternal.ts`.

**Evidence:**
- `convex/adminAuth.ts:127-144`
- `convex/authInternal.ts:30-46`

**Impact:** Code duplication, maintenance burden

**Severity:** LOW

**Recommendation:** Consolidate into authInternal.ts, remove duplicates

---

#### Issue 2: Generic Error Messages

**Issue:**
Many error messages are vague (e.g., "Failed to save product").

**Examples:**
- ProductEditorPage: Generic error messages without specifics
- No distinction between validation errors and server errors

**Impact:** Poor user experience, difficult debugging

**Severity:** LOW

**Recommendation:** Extract error details from Convex errors, show specific validation messages

---

#### Issue 3: No Testing

**Issue:**
No test files found in codebase.

**Impact:**
- No automated testing
- High regression risk
- Manual testing burden
- Confidence low for refactoring

**Severity:** MEDIUM

**Recommendation:**
1. Add unit tests for utilities (security.ts, etc.)
2. Add integration tests for Convex functions
3. Add E2E tests for critical flows (login, product CRUD)
4. Set up CI/CD pipeline

---

### 7.7 Deployment Concerns

#### Concern 1: Environment Variables

**Issue:**
Only `VITE_CONVEX_URL` is configured. Missing:
- Admin email configuration
- SMTP settings for password reset
- Analytics configuration
- Image storage limits
- Rate limit configuration

**Severity:** MEDIUM

**Recommendation:** Document all required environment variables

---

#### Concern 2: First Admin Setup

**Issue:**
`setupFirstAdmin` is a public mutation that can be called by anyone if no admins exist.

**Impact:**
- Security risk if database is wiped (attacker can create first admin)
- No safeguard against accidental execution

**Evidence:** `convex/adminAuth.ts:192-220` - mutation is public

**Severity:** MEDIUM

**Recommendation:**
1. Make setupFirstAdmin an internal mutation
2. Create CLI tool for setup
3. Or require secret token for execution

---

#### Concern 3: No Monitoring/Logging

**Issue:**
No error tracking (Sentry, etc.) or monitoring (APM) configured.

**Impact:**
- Production errors invisible
- Performance issues undetected
- User issues unreported

**Severity:** LOW

**Recommendation:** Integrate error tracking service

---

### 7.8 Risk Summary Table

| Risk ID | Risk | Severity | Impact | Remediation Effort |
|---------|------|----------|--------|-------------------|
| 1 | Admin auth system broken (no tokens) | CRITICAL | Admin access fakeable | High (redesign auth) |
| 2 | Hardcoded admin credentials | HIGH | Credentials exposed | Low (move to env vars) |
| 3 | Security headers in meta tags only | MEDIUM | Headers ineffective | Low (config change) |
| 4 | Client-side IP collection | MEDIUM | Rate limiting weak | Medium (server-side IP) |
| 5 | Orphaned images in storage | MEDIUM | Storage bloat | Medium (add cleanup) |
| 6 | No cascade deletion | LOW | Dangling references | Medium (implement cascade) |
| 7 | Inefficient product filtering | HIGH | Scalability issue | High (index/restructure) |
| 8 | Rate limit cleanup on every request | MEDIUM | Performance overhead | Medium (scheduled cleanup) |
| 9 | Analytics aggregation performance | MEDIUM | Slow analytics page | Medium (optimize queries) |
| 10 | Delete button not wired | LOW | UI incomplete | Low (wire button) |
| 11 | Password reset not implemented | MEDIUM | Poor UX | High (full flow) |
| 12 | Admin user management missing | MEDIUM | Single admin only | Medium (CRUD UI) |
| 13 | Category/use case mgmt missing | LOW | Manual DB edits | Medium (CRUD UI) |

---

## 8. Technology Assessment

### 8.1 Strengths

**Convex Backend:**
- Excellent choice for rapid development
- Real-time updates out of the box
- Type-safe API generation
- Serverless scaling
- Built-in file storage

**React 19:**
- Latest stable version
- Modern hooks-based architecture
- Good performance

**TypeScript:**
- Full type safety across stack
- Convex generates types from schema
- Reduces runtime errors

**Tailwind CSS:**
- Rapid UI development
- Consistent design system
- Dark mode support

**bcryptjs:**
- Industry-standard password hashing
- Appropriate salt rounds (12)

### 8.2 Weaknesses

**Custom Admin Auth:**
- Should use Convex Auth or established JWT library
- Current implementation fundamentally insecure

**No Testing Framework:**
- Vitest, Jest, or Playwright should be added

**No Error Tracking:**
- Sentry or similar needed for production

**No Email Service:**
- Required for password reset, notifications

**Client-Side Session Storage:**
- Should use httpOnly cookies or secure token storage

---

## 9. Recommendations

### 9.1 Immediate Priorities (Pre-Production)

1. **Fix Admin Authentication** (CRITICAL)
   - Implement JWT-based sessions or use Convex Auth
   - Add session expiration
   - Implement logout

2. **Remove Hardcoded Credentials** (HIGH)
   - Move to environment variables
   - Update documentation

3. **Fix Security Headers** (MEDIUM)
   - Configure at HTTP layer
   - Remove meta tag approach

4. **Implement Server-Side IP Extraction** (MEDIUM)
   - Fix rate limiting effectiveness

5. **Optimize Product Filtering** (HIGH)
   - Add indexes or restructure data
   - Critical for scalability

### 9.2 High Priority (Post-Launch)

6. **Add Testing** (HIGH)
   - Unit, integration, and E2E tests
   - CI/CD pipeline

7. **Implement Image Cleanup** (MEDIUM)
   - Delete orphaned images
   - Add to product deletion flow

8. **Add Error Tracking** (MEDIUM)
   - Integrate Sentry or similar

9. **Optimize Rate Limit Cleanup** (MEDIUM)
   - Scheduled cron job instead of inline

10. **Wire Delete Button** (LOW)
    - Complete admin dashboard functionality

### 9.3 Medium Priority (Future Enhancements)

11. **Password Reset Flow** (MEDIUM)
    - Full implementation with email

12. **Admin User Management** (MEDIUM)
    - CRUD interface for admins
    - Role-based access control

13. **Category/Use Case Management** (LOW)
    - CRUD interfaces
    - Hierarchical category UI

14. **Improve Error Messages** (LOW)
    - Specific validation feedback

15. **Optimize Analytics Queries** (MEDIUM)
    - Pagination, time ranges, pre-aggregation

### 9.4 Low Priority (Nice to Have)

16. **Product Versioning** (LOW)
    - Audit trail for edits
    - Rollback capability

17. **Bulk Operations** (LOW)
    - Bulk publish/archive/delete

18. **Enhanced Analytics** (LOW)
    - Charts, graphs, date filters

19. **Product Approval Workflow** (LOW)
    - Multi-stage approval process

20. **Export Functionality** (LOW)
    - Export products/analytics to CSV

---

## 10. Conclusion

### 10.1 Overall Assessment

ProdView is a **well-structured affiliate product catalog application** with a solid architectural foundation. The codebase demonstrates:

**Strengths:**
- Clean separation of concerns (frontend/backend)
- Comprehensive database schema with proper indexes
- Security-conscious design (rate limiting, input validation, audit logging)
- Real-time updates via Convex
- Responsive, accessible UI
- SEO-optimized
- Modern tech stack (React 19, TypeScript, Tailwind)

**Critical Weaknesses:**
- **Admin authentication system is fundamentally insecure** (no session tokens)
- Hardcoded credentials in source code
- Performance issues with product filtering (inefficient queries)
- No testing infrastructure
- Several UI features incomplete (delete button, password reset)

### 10.2 Production Readiness: NOT READY

**Blockers:**
1. **Authentication system must be redesigned** before production deployment
2. Hardcoded credentials must be removed
3. Product filtering performance must be optimized for scalability

**Timeline Estimate:**
- **Minimum fixes:** 2-3 weeks (auth redesign, credentials, performance)
- **Production-ready with testing:** 4-6 weeks
- **Full feature completion:** 8-10 weeks

### 10.3 Use Case Suitability

**Suitable For:**
- Small to medium-scale affiliate catalogs (<10,000 products)
- Internal product management tools
- Proof-of-concept or MVP applications
- Educational projects demonstrating full-stack development

**Not Suitable For (Without Fixes):**
- Public production deployments (security issues)
- High-traffic sites (performance issues)
- Multi-tenant applications (no tenant isolation)
- Compliance-sensitive environments (audit logging insufficient)

### 10.4 Final Verdict

**ProdView demonstrates strong engineering fundamentals** with a well-thought-out schema, comprehensive security features, and modern architecture. However, **the authentication system's critical flaw makes it unsuitable for production** in its current state.

**With the recommended fixes implemented**, particularly the authentication redesign and performance optimizations, this application would be **production-ready for a small to medium-scale affiliate product catalog** with robust admin capabilities and excellent user experience.

The codebase is **maintainable and extensible**, with clear patterns and good separation of concerns. The use of Convex as the backend provides excellent scalability potential and developer experience.

---

**End of Audit Report**

**Next Steps:**
1. Review this report with development team
2. Prioritize fixes based on Risk Summary Table
3. Create implementation plan for authentication redesign
4. Set up testing infrastructure
5. Schedule security review after fixes

**Questions/Clarifications:**
Contact the development team via the issues tracker or documentation.
