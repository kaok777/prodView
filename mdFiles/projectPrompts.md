# Project Execution Prompt Roadmap

**Generated:** February 12, 2026
**Source Audit:** projectAudit_12022026.md
**Purpose:** Sequential fixes for ProdView production readiness

**Instructions:**
- Execute prompts in order (critical first)
- Complete each phase before moving to next
- Verify changes with tests after each prompt
- Do not skip verification steps

---

## Phase 1 – Critical Stability

====================================================================
======================== MASTER PROMPT 1 =============================
====================================================================

**Objective:** Fix admin inability to edit DRAFT/ARCHIVED products

**Problem Analysis:**
You must investigate why admins cannot edit products with DRAFT or ARCHIVED status.

**Required Investigation:**
1. Read `backend/src/products/products.service.ts` lines 62-91
2. Examine the `getProductById` method
3. Identify the status filter logic
4. Read `src/pages/admin/ProductEditorPage.tsx` lines 40-52
5. Identify which endpoint is used for fetching product data in edit mode

**Expected Finding:**
The `getProductById` method only returns products with `status === 'PUBLISHED'`. When admin tries to edit a DRAFT product using GET `/api/products/:id`, it returns null.

**Implementation Required:**

**Backend Changes:**

File: `backend/src/products/products.controller.ts`

Add a new admin-specific endpoint BEFORE the existing `@Get(':id')` route (route order matters):

```typescript
@Roles('admin')
@Get('admin/:id')
@Throttle({ default: { limit: 200, ttl: 60000 } })
getProductByIdAdmin(
  @Param('id', new ParseUUIDPipe({ version: '4' })) id: string
) {
  return this.productsService.getProductByIdAdmin(id);
}
```

File: `backend/src/products/products.service.ts`

Add new method (place near `getProductById`):

```typescript
async getProductByIdAdmin(productId: string) {
  return this.prisma.product.findUnique({
    where: { id: productId },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      useCases: {
        include: {
          useCase: true,
        },
      },
    },
  });
}
```

**Frontend Changes:**

File: `src/pages/admin/ProductEditorPage.tsx`

Line 41: Change from:
```typescript
const productRes = await api.get(`/products/${id}`);
```

To:
```typescript
const productRes = await api.get(`/products/admin/${id}`);
```

**Verification Steps:**
1. Start backend and frontend servers
2. Login as admin
3. Create a product with DRAFT status
4. Navigate to edit page for that product
5. Verify product data loads correctly
6. Change product name and save
7. Verify update succeeds
8. Repeat test with ARCHIVED product

**Critical Notes:**
- Route order in controller matters: admin route must come BEFORE the generic `@Get(':id')` route
- Do NOT modify the existing `getProductById` method (public endpoint)
- Do NOT add status filtering to the new admin method
- Ensure ParseUUIDPipe is imported and used correctly

====================================================================
======================== MASTER PROMPT 2 =============================
====================================================================

**Objective:** Eliminate hardcoded default admin credentials (security vulnerability)

**Problem Analysis:**
Default admin credentials are hardcoded in source code, creating a critical security vulnerability. Any attacker with access to the repository can use these credentials to gain admin access.

**Required Investigation:**
1. Read `backend/src/auth/auth.service.ts` lines 106-132 (`setupFirstAdmin` method)
2. Read `backend/prisma/seed.ts` lines 10-30
3. Identify hardcoded credentials
4. Verify where crypto module is available

**Expected Finding:**
```typescript
const defaultEmail = 'vibrationconnect@gmail.com';
const defaultPassword = 'Cxserfd345!';
```

**Implementation Required:**

File: `backend/src/auth/auth.service.ts`

Add at top of file (after imports):
```typescript
import * as crypto from 'crypto';
```

Replace the entire `setupFirstAdmin` method (lines 106-132) with:

```typescript
async setupFirstAdmin(): Promise<any> {
  const existingAdmins = await this.prisma.adminUser.count();

  if (existingAdmins > 0) {
    throw new UnauthorizedException('Admin users already exist.');
  }

  const defaultEmail = process.env.FIRST_ADMIN_EMAIL || 'admin@prodview.local';
  const defaultPassword = process.env.FIRST_ADMIN_PASSWORD || this.generateSecurePassword();

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

  const admin = await this.prisma.adminUser.create({
    data: {
      email: defaultEmail,
      passwordHash,
      role: 'admin',
    },
  });

  // Display credentials ONE TIME ONLY
  console.log('\n' + '═'.repeat(60));
  console.log('║' + ' '.repeat(18) + 'FIRST ADMIN CREATED' + ' '.repeat(18) + '║');
  console.log('═'.repeat(60));
  console.log('║ Email:    ' + defaultEmail.padEnd(45) + '║');
  console.log('║ Password: ' + defaultPassword.padEnd(45) + '║');
  console.log('═'.repeat(60));
  console.log('║ ⚠️  SAVE THESE CREDENTIALS IMMEDIATELY' + ' '.repeat(19) + '║');
  console.log('║ ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN' + ' '.repeat(20) + '║');
  console.log('═'.repeat(60) + '\n');

  return {
    adminId: admin.id,
    email: defaultEmail,
    password: defaultPassword,
    message: 'First admin created successfully. Check console for credentials.',
  };
}

private generateSecurePassword(): string {
  const length = 20;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-_+=';
  let password = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  // Ensure password meets complexity requirements
  if (!/[A-Z]/.test(password)) password = 'A' + password.slice(1);
  if (!/[a-z]/.test(password)) password = password.slice(0, -1) + 'a';
  if (!/\d/.test(password)) password = password.slice(0, -1) + '1';
  if (!/[!@#$%^&*\-_+=]/.test(password)) password = password.slice(0, -1) + '!';

  return password;
}
```

File: `backend/prisma/seed.ts`

Update the seed script to use environment variables:

Find the section where admin credentials are defined and replace with:
```typescript
const defaultEmail = process.env.FIRST_ADMIN_EMAIL || 'admin@prodview.local';
const defaultPassword = process.env.FIRST_ADMIN_PASSWORD || generateSecurePassword();
```

Add the `generateSecurePassword` function to seed.ts (same implementation as above).

File: `backend/.env.example`

Add documentation:
```bash
# First Admin Setup (Optional)
# If not provided, secure random password will be generated
# Generated credentials will be displayed once in console output
FIRST_ADMIN_EMAIL=admin@example.com
FIRST_ADMIN_PASSWORD=
```

**Verification Steps:**
1. Delete existing admin users from database (if testing)
2. Run seed script: `npm run db:seed`
3. Verify console displays generated credentials
4. Copy credentials from console
5. Test login with generated credentials
6. Verify login succeeds
7. Attempt to run seed again - should fail with "Admin users already exist"

**Critical Security Notes:**
- NEVER commit actual credentials to .env.example
- Generated password MUST meet validation requirements (8-128 chars, upper+lower+digit+special)
- Password MUST be cryptographically random (use crypto.randomBytes, NOT Math.random)
- Console output should ONLY display once during first admin creation
- Remove any hardcoded credentials from all files

---

## Phase 2 – Cache & Data Integrity

====================================================================
======================== MASTER PROMPT 3 =============================
====================================================================

**Objective:** Fix cache over-invalidation bug causing performance degradation

**Problem Analysis:**
The cache invalidation pattern matching uses `key.includes(pattern)` which matches substrings anywhere in cache keys, causing unintended cache deletions. Every product mutation clears ALL caches, not just product-related ones.

**Required Investigation:**
1. Read `backend/src/common/cache.service.ts` lines 67-76 (`deletePattern` method)
2. Read `backend/src/products/products.service.ts` lines 425-430 (`invalidateProductCaches` method)
3. Examine current cache key patterns used throughout products.service.ts:
   - Line 30: `latest_products:${limit}`
   - Line 63: `product:${productId}`
   - Line 184: `category_products:${categoryId}:...`
   - Line 248: `usecase_products:${useCaseId}:...`

**Expected Finding:**
When `deletePattern('product:')` is called:
- Intended match: `product:uuid-123`
- Unintended match: `latest_products:10` (contains 'product:')
- Unintended match: `category_products:...` (contains 'product:')

**Implementation Strategy:**
Fix in TWO steps:
1. Update pattern matching logic
2. Redesign cache key namespace for consistency

**Step 1: Fix Pattern Matching Logic**

File: `backend/src/common/cache.service.ts`

Line 70: Change from:
```typescript
if (key.includes(pattern)) {
```

To:
```typescript
if (key.startsWith(pattern)) {
```

**Step 2: Redesign Cache Key Namespace**

File: `backend/src/products/products.service.ts`

Update ALL cache keys to use consistent `product:` prefix:

Line ~30 (`getLatestProducts`):
```typescript
// Change from:
const cacheKey = `latest_products:${limit}`;
// To:
const cacheKey = `product:latest:${limit}`;
```

Line ~63 (`getProductById`):
```typescript
// Change from:
const cacheKey = `product:${productId}`;
// To:
const cacheKey = `product:single:${productId}`;
```

Line ~184 (`getProductsByCategory`):
```typescript
// Change from:
const cacheKey = `category_products:${categoryId}:${page}:${pageSize}:${sortBy}`;
// To:
const cacheKey = `product:category:${categoryId}:${page}:${pageSize}:${sortBy}`;
```

Line ~248 (`getProductsByUseCase`):
```typescript
// Change from:
const cacheKey = `usecase_products:${useCaseId}:${page}:${pageSize}:${sortBy}`;
// To:
const cacheKey = `product:usecase:${useCaseId}:${page}:${pageSize}:${sortBy}`;
```

Update `invalidateProductCaches` method (lines 425-430):
```typescript
private invalidateProductCaches(): void {
  // Single pattern now catches all product caches
  this.cacheService.deletePattern('product:');
}
```

**Verification Steps:**
1. Start application with logging enabled
2. View cache service logs to see cache operations
3. Create a new product
4. Verify cache invalidation only deletes keys starting with `product:`
5. Verify cache hit rate improves after changes
6. Test product filtering, search, and listing still work correctly
7. Monitor cache size doesn't grow unbounded

**Critical Implementation Notes:**
- Update ALL cache key references consistently
- Ensure cache keys use colons (`:`) as separators
- Do NOT use underscores in cache key prefixes (causes old bug)
- Pattern MUST end with `:` to avoid partial matches
- Test cache invalidation thoroughly before deploying

**Expected Performance Impact:**
- Cache effectiveness should improve significantly
- Database load should decrease during admin operations
- Response times should be more consistent

====================================================================
======================== MASTER PROMPT 4 =============================
====================================================================

**Objective:** Fix inefficient relation update strategy (full delete + recreate)

**Problem Analysis:**
Product updates delete ALL category/useCase relations before recreating them, even when only changing other fields. This forces frontend to always fetch and resend full state.

**Required Investigation:**
1. Read `backend/src/products/products.service.ts` lines 432-568 (`updateProduct` method)
2. Identify where relations are deleted (lines ~487-497)
3. Identify where relations are recreated (lines ~520-534)
4. Read `src/pages/admin/ProductEditorPage.tsx` lines 40-52
5. Verify frontend always fetches full product state before update

**Expected Finding:**
```typescript
if (data.categoryIds !== undefined) {
  await this.prisma.productCategory.deleteMany({
    where: { productId },
  });
}
```

This deletes ALL categories even if only one changed.

**Implementation Required:**

File: `backend/src/products/products.service.ts`

Replace the relation update logic (lines ~486-534) with differential updates:

```typescript
// Differential category update
if (data.categoryIds !== undefined) {
  // Fetch existing category associations
  const existingCategories = await this.prisma.productCategory.findMany({
    where: { productId },
    select: { categoryId: true },
  });

  const existingIds = existingCategories.map((c) => c.categoryId);
  const newIds = data.categoryIds;

  // Calculate diff
  const toAdd = newIds.filter((id) => !existingIds.includes(id));
  const toRemove = existingIds.filter((id) => !newIds.includes(id));

  // Remove old associations
  if (toRemove.length > 0) {
    await this.prisma.productCategory.deleteMany({
      where: {
        productId,
        categoryId: { in: toRemove },
      },
    });
  }

  // Add new associations
  if (toAdd.length > 0) {
    await this.prisma.productCategory.createMany({
      data: toAdd.map((categoryId) => ({
        productId,
        categoryId,
      })),
    });
  }
}

// Differential useCase update
if (data.useCaseIds !== undefined) {
  // Fetch existing useCase associations
  const existingUseCases = await this.prisma.productUseCase.findMany({
    where: { productId },
    select: { useCaseId: true },
  });

  const existingIds = existingUseCases.map((u) => u.useCaseId);
  const newIds = data.useCaseIds;

  // Calculate diff
  const toAdd = newIds.filter((id) => !existingIds.includes(id));
  const toRemove = existingIds.filter((id) => !newIds.includes(id));

  // Remove old associations
  if (toRemove.length > 0) {
    await this.prisma.productUseCase.deleteMany({
      where: {
        productId,
        useCaseId: { in: toRemove },
      },
    });
  }

  // Add new associations
  if (toAdd.length > 0) {
    await this.prisma.productUseCase.createMany({
      data: toAdd.map((useCaseId) => ({
        productId,
        useCaseId,
      })),
    });
  }
}
```

Remove the old relation assignment code:
```typescript
// DELETE THESE BLOCKS:
if (data.categoryIds !== undefined) {
  updateData.categories = {
    create: data.categoryIds.map((categoryId) => ({ categoryId })),
  };
}

if (data.useCaseIds !== undefined) {
  updateData.useCases = {
    create: data.useCaseIds.map((useCaseId) => ({ useCaseId })),
  };
}
```

**Verification Steps:**
1. Test product update with ONLY name change:
   - Should NOT delete/recreate relations
   - Verify relations unchanged in database
2. Test product update with category addition:
   - Should ONLY add new category association
   - Verify existing categories preserved
3. Test product update with category removal:
   - Should ONLY remove specified category
   - Verify other categories preserved
4. Test product update with mixed changes:
   - Update name + add category + remove useCase
   - Verify all changes applied correctly
5. Monitor database query logs to confirm differential updates

**Performance Benefits:**
- Fewer database operations per update
- Reduced transaction time
- Less risk of race conditions
- More efficient cache invalidation opportunities

**Optional Frontend Enhancement:**
After backend changes, frontend COULD be simplified to send only changed fields, but this is NOT required for the fix to work.

====================================================================
======================== MASTER PROMPT 5 =============================
====================================================================

**Objective:** Add pagination to admin product listing endpoint

**Problem Analysis:**
The `/api/products/admin/all` endpoint has a hard limit of 1000 products. For large catalogs, this causes performance issues and doesn't scale.

**Required Investigation:**
1. Read `backend/src/products/products.controller.ts` lines 89-100
2. Read `backend/src/products/products.service.ts` lines 311-332
3. Examine `backend/src/common/dto/pagination.dto.ts` for available DTOs
4. Verify other paginated endpoints (search, category, useCase) for consistency

**Expected Finding:**
```typescript
async getAllProductsForAdmin(adminId: string, limit: number = 100) {
  const maxLimit = Math.min(limit, 1000);
  return this.prisma.product.findMany({
    take: maxLimit,
    // ...
  });
}
```

No pagination structure - returns flat array up to 1000 products.

**Implementation Required:**

File: `backend/src/products/products.service.ts`

Replace `getAllProductsForAdmin` method (lines ~311-332):

```typescript
async getAllProductsForAdmin(
  adminId: string,
  page: number = 1,
  pageSize: number = 100,
) {
  const maxPageSize = Math.min(pageSize, 100);
  const skip = (page - 1) * maxPageSize;

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      skip,
      take: maxPageSize,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        useCases: {
          include: {
            useCase: true,
          },
        },
      },
    }),
    this.prisma.product.count(),
  ]);

  return {
    products,
    total,
    page,
    pageSize: maxPageSize,
    totalPages: Math.ceil(total / maxPageSize),
  };
}
```

File: `backend/src/products/products.controller.ts`

Update `getAllProductsForAdmin` endpoint (lines ~89-100):

```typescript
@Roles('admin')
@Get('admin/all')
@Throttle({ default: { limit: 50, ttl: 60000 } })
getAllProductsForAdmin(
  @CurrentUser() user: any,
  @Query() paginationDto: PaginationDto,
) {
  return this.productsService.getAllProductsForAdmin(
    user.id,
    paginationDto.page || 1,
    paginationDto.pageSize || 100,
  );
}
```

**Frontend Changes:**

File: `src/pages/admin/AdminDashboard.tsx` (or wherever this endpoint is called)

Update to handle paginated response:

```typescript
// OLD:
const response = await api.get('/products/admin/all');
const products = response.data;

// NEW:
const response = await api.get('/products/admin/all', {
  params: { page: currentPage, pageSize: 100 }
});
const products = response.data.products;
const totalPages = response.data.totalPages;
```

Add pagination UI controls:
- Page number display
- Previous/Next buttons
- Total product count
- Optional: Jump to page input

**Verification Steps:**
1. Create 150+ test products in database
2. Request page 1 - verify returns first 100 products
3. Request page 2 - verify returns next 50 products
4. Verify total count is correct (150)
5. Verify totalPages calculation is correct (2)
6. Test with different pageSize values (10, 50, 100)
7. Test page boundaries (page 0, page 999)
8. Monitor response times with large datasets

**Consistency Check:**
Ensure response structure matches other paginated endpoints:
- `/api/products/search`
- `/api/products/category/:id`
- `/api/products/use-case/:id`

All should return:
```typescript
{
  products: Product[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}
```

---

## Phase 3 – API Consistency & Contract Fixes

====================================================================
======================== MASTER PROMPT 6 =============================
====================================================================

**Objective:** Standardize inconsistent API response shapes across all product endpoints

**Problem Analysis:**
Different product endpoints return different response structures. `/latest` returns flat array while others return paginated object, requiring conditional frontend handling.

**Required Investigation:**
1. Read `backend/src/products/products.service.ts` lines 25-60 (`getLatestProducts`)
2. Compare with `searchProducts` (lines 93-181), `getProductsByCategory` (lines 183-245)
3. Read `src/components/ProductGrid.tsx` lines 48-54
4. Identify conditional response handling in frontend

**Expected Finding:**
```typescript
if (Array.isArray(response.data)) {
  setProducts(response.data);  // For /latest
} else {
  setProducts(response.data.products || []);  // For others
}
```

**Implementation Required:**

**Backend Changes:**

File: `backend/src/products/products.service.ts`

Update `getLatestProducts` method (lines ~25-60) to return paginated structure:

```typescript
async getLatestProducts(limit: number, page: number = 1) {
  if (limit > 100) {
    throw new BadRequestException('Limit cannot exceed 100');
  }

  const skip = (page - 1) * limit;

  // Update cache key to include page
  const cacheKey = `product:latest:${limit}:${page}`;
  const cached = this.cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        useCases: {
          include: {
            useCase: true,
          },
        },
      },
    }),
    this.prisma.product.count({
      where: {
        status: 'PUBLISHED',
      },
    }),
  ]);

  const result = {
    products,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };

  this.cacheService.set(cacheKey, result, this.CACHE_TTL.LATEST_PRODUCTS);
  return result;
}
```

File: `backend/src/products/products.controller.ts`

Update `getLatestProducts` controller (lines ~28-33):

```typescript
@Public()
@Get('latest')
@Throttle({ default: { limit: 100, ttl: 60000 } })
getLatestProducts(@Query() paginationDto: PaginationDto) {
  return this.productsService.getLatestProducts(
    paginationDto.pageSize || 40,
    paginationDto.page || 1,
  );
}
```

**Frontend Changes:**

File: `src/components/ProductGrid.tsx`

Remove conditional response handling (lines ~48-54):

```typescript
// REMOVE THIS:
if (Array.isArray(response.data)) {
  setProducts(response.data);
  setTotalPages(1);
} else {
  setProducts(response.data.products || []);
  setTotalPages(response.data.totalPages || 1);
}

// REPLACE WITH:
setProducts(response.data.products || []);
setTotalPages(response.data.totalPages || 1);
```

Update `/latest` API call (line ~43-45):

```typescript
// Change from:
response = await api.get('/products/latest', {
  params: { limit: 40 }
});

// To:
response = await api.get('/products/latest', {
  params: { page: 1, pageSize: 40 }
});
```

**Verification Steps:**
1. Test `/latest` endpoint returns paginated structure
2. Test all endpoints return consistent structure:
   - `/products/latest`
   - `/products/search`
   - `/products/category/:id`
   - `/products/use-case/:id`
   - `/products/admin/all`
3. Verify all responses have these fields:
   ```typescript
   {
     products: Product[],
     total: number,
     page: number,
     pageSize: number,
     totalPages: number
   }
   ```
4. Test frontend pagination works for all endpoints
5. Test "Load More" functionality if present
6. Verify cache keys updated correctly

**Breaking Change Note:**
This is a breaking change for any external API consumers. Document in CHANGELOG:
- `/api/products/latest` now returns paginated object instead of flat array
- Update query params: use `page` and `pageSize` instead of `limit`

**Optional Enhancement:**
Add `hasNext` and `hasPrevious` boolean flags to response for UI convenience.

---

## Phase 4 – Security & UX Improvements

====================================================================
======================== MASTER PROMPT 7 =============================
====================================================================

**Objective:** Add React Error Boundary to prevent blank screen crashes

**Problem Analysis:**
Unhandled React errors crash the entire application with blank screen. No error boundaries exist to catch and handle errors gracefully.

**Required Investigation:**
1. Check if `src/components/ErrorBoundary.tsx` exists
2. Read `src/App.tsx` to see current app structure
3. Verify no existing error handling at root level
4. Check React version supports Error Boundaries (React 16.6+)

**Implementation Required:**

Create file: `src/components/ErrorBoundary.tsx`

```typescript
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error tracking service (Sentry, Bugsnag, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full p-8 bg-card rounded-lg shadow-lg border border-border">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold mb-2 text-foreground">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-6">
                An unexpected error occurred. The error has been logged and we'll look into it.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-mono text-destructive mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-48">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Go Home
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

File: `src/App.tsx`

Wrap the entire app with ErrorBoundary:

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SecurityHeaders />
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            {/* ... existing routes ... */}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
```

**Optional:** Add nested error boundaries for specific sections:

```typescript
// In admin routes
<Route path="/admin/*" element={
  <ErrorBoundary fallback={<AdminErrorFallback />}>
    <AdminLayout />
  </ErrorBoundary>
}>
  {/* admin routes */}
</Route>
```

**Verification Steps:**
1. Start development server
2. Intentionally trigger error in a component:
   ```typescript
   // In any component, add this to trigger error:
   const triggerError = () => {
     throw new Error('Test error boundary');
   };

   <button onClick={triggerError}>Trigger Error</button>
   ```
3. Click the button
4. Verify error boundary catches error
5. Verify fallback UI displays with error message
6. Verify error is logged to console
7. Click "Go Home" button - verify redirects to home
8. Click "Reload Page" button - verify page reloads
9. Remove test error trigger
10. Test in production build - verify error details hidden

**Critical Notes:**
- Error boundaries do NOT catch errors in:
  - Event handlers (use try-catch)
  - Async code (use try-catch)
  - Server-side rendering
  - Errors in error boundary itself
- For event handlers, wrap in try-catch:
  ```typescript
  const handleClick = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      console.error(error);
      toast.error('Operation failed');
    }
  };
  ```

**Future Enhancement:**
Integrate with error tracking service (Sentry, Bugsnag, LogRocket) in production.

====================================================================
======================== MASTER PROMPT 8 =============================
====================================================================

**Objective:** Consolidate authentication state management to prevent desync

**Problem Analysis:**
Authentication state stored in two separate localStorage keys (`accessToken` and `adminSession`) can desync, causing confusing UX where user appears logged out but API calls succeed.

**Required Investigation:**
1. Read `src/lib/api.ts` lines 16-22 (request interceptor)
2. Read `src/lib/api.ts` lines 24-37 (response interceptor)
3. Read `src/components/ProtectedRoute.tsx` lines 7-15
4. Read `src/pages/admin/AdminLoginPage.tsx` lines 25-35
5. Identify all places where auth state is read/written

**Expected Finding:**
```typescript
localStorage.setItem('accessToken', token);
localStorage.setItem('adminSession', JSON.stringify(userData));
```

Two separate keys that can desync.

**Implementation Required:**

**Step 1: Install JWT Decode Library**

```bash
cd /path/to/project
npm install jwt-decode
```

**Step 2: Create Auth Manager**

Create file: `src/lib/auth.ts`

```typescript
import { jwtDecode } from 'jwt-decode';

interface AdminSession {
  email: string;
  role: string;
  adminId: string;
}

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export class AuthManager {
  private static readonly TOKEN_KEY = 'accessToken';

  /**
   * Store access token
   */
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    // Remove legacy adminSession key if it exists
    localStorage.removeItem('adminSession');
  }

  /**
   * Get access token
   */
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Clear authentication state
   */
  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('adminSession'); // Clean up legacy key
  }

  /**
   * Get admin session data by decoding JWT
   */
  static getSession(): AdminSession | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = jwtDecode<JWTPayload>(token);

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        this.clearToken();
        return null;
      }

      return {
        email: payload.email,
        role: payload.role,
        adminId: payload.sub,
      };
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      this.clearToken();
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Get admin ID from token
   */
  static getAdminId(): string | null {
    const session = this.getSession();
    return session?.adminId || null;
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  static willExpireSoon(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = jwtDecode<JWTPayload>(token);
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60;
      return payload.exp - now < fiveMinutes;
    } catch {
      return false;
    }
  }
}
```

**Step 3: Update API Interceptors**

File: `src/lib/api.ts`

```typescript
import { AuthManager } from './auth';

// Request interceptor
api.interceptors.request.use((config) => {
  const token = AuthManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AuthManager.clearToken();

      // Only redirect if on admin route
      if (window.location.pathname.startsWith('/admin') &&
          window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);
```

**Step 4: Update ProtectedRoute**

File: `src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { AuthManager } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!AuthManager.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
```

**Step 5: Update Admin Login Page**

File: `src/pages/admin/AdminLoginPage.tsx`

```typescript
import { AuthManager } from '../../lib/auth';

// In handleLogin function:
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    });

    // Store only the token
    AuthManager.setToken(response.data.accessToken);

    toast.success('Login successful');
    navigate('/admin');
  } catch (error: any) {
    console.error('Login failed:', error);
    toast.error(error.response?.data?.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};
```

**Step 6: Update Admin Dashboard (or wherever session data is used)**

File: `src/pages/admin/AdminDashboard.tsx` (or similar)

```typescript
import { AuthManager } from '../../lib/auth';

// Instead of:
// const session = JSON.parse(localStorage.getItem('adminSession'));

// Use:
const session = AuthManager.getSession();

if (session) {
  console.log('Logged in as:', session.email);
  console.log('Role:', session.role);
  console.log('Admin ID:', session.adminId);
}
```

**Step 7: Update Navbar (if displays user info)**

File: `src/components/Navbar.tsx`

```typescript
import { AuthManager } from '../lib/auth';

// Get session data
const session = AuthManager.getSession();

// Display user email if available
{session && (
  <div className="text-sm text-muted-foreground">
    {session.email}
  </div>
)}

// Logout button
<button onClick={() => {
  AuthManager.clearToken();
  navigate('/admin/login');
}}>
  Logout
</button>
```

**Verification Steps:**
1. Clear all localStorage
2. Login as admin
3. Verify only `accessToken` key in localStorage
4. Verify `adminSession` key does NOT exist
5. Refresh page - verify still authenticated
6. Check session data available via `AuthManager.getSession()`
7. Manually delete `accessToken` from localStorage
8. Try to access admin page - verify redirected to login
9. Test API calls after token deletion - verify fail with 401
10. Test logout functionality
11. Verify old `adminSession` keys cleaned up on login

**Migration Strategy:**
The AuthManager will automatically clean up legacy `adminSession` keys. No manual migration needed.

**Future Enhancement:**
Add token refresh logic using `AuthManager.willExpireSoon()` to automatically refresh tokens before expiry.

====================================================================
======================== MASTER PROMPT 9 =============================
====================================================================

**Objective:** Improve production admin error messages without exposing details to public

**Problem Analysis:**
In production, validation error messages are disabled globally, making it difficult for admins to debug issues. Public endpoints should hide details, but admin endpoints need detailed feedback.

**Required Investigation:**
1. Read `backend/src/main.ts` lines 74-88 (ValidationPipe configuration)
2. Examine where `isProduction` is used
3. Check if NestJS supports per-controller pipe overrides
4. Verify admin controllers are properly decorated with `@Roles('admin')`

**Expected Finding:**
```typescript
ValidationPipe({
  disableErrorMessages: isProduction,  // Affects ALL endpoints
})
```

**Implementation Required:**

File: `backend/src/main.ts`

Replace single global ValidationPipe with two separate pipes:

```typescript
// Remove old global pipe configuration (lines ~74-88)

// Add these instead:
const publicValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: false,
  },
  disableErrorMessages: isProduction,  // Hide errors for public in production
  validationError: {
    target: false,
    value: false,
  },
});

const adminValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: false,
  },
  disableErrorMessages: false,  // ALWAYS show detailed errors for admin
  validationError: {
    target: false,
    value: false,
  },
});

// Apply public pipe as global default
app.useGlobalPipes(publicValidationPipe);

// Export adminValidationPipe for use in controllers
// Note: We need to make this available somehow - see next steps
```

**Challenge:** ValidationPipes created in `main.ts` aren't directly available to controllers. We need a different approach.

**Better Implementation:**

Create file: `backend/src/common/validation-pipes.ts`

```typescript
import { ValidationPipe } from '@nestjs/common';

export function createPublicValidationPipe(isProduction: boolean) {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: false,
    },
    disableErrorMessages: isProduction,
    validationError: {
      target: false,
      value: false,
    },
  });
}

export function createAdminValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: false,
    },
    disableErrorMessages: false,  // Always show errors for admin
    validationError: {
      target: false,
      value: false,
    },
  });
}

// Singleton instance for use in decorators
export const AdminValidationPipe = createAdminValidationPipe();
```

File: `backend/src/main.ts`

```typescript
import { createPublicValidationPipe } from './common/validation-pipes';

// In bootstrap function:
app.useGlobalPipes(createPublicValidationPipe(isProduction));
```

File: `backend/src/products/products.controller.ts`

Add `@UsePipes` decorator to controller or specific admin routes:

```typescript
import { UsePipes } from '@nestjs/common';
import { AdminValidationPipe } from '../common/validation-pipes';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  // Public routes use global pipe (errors hidden in production)

  // Admin routes override with detailed errors
  @Roles('admin')
  @Post()
  @UsePipes(AdminValidationPipe)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createProduct(
    @CurrentUser() user: any,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.createProduct(user.id, createProductDto);
  }

  @Roles('admin')
  @Put(':id')
  @UsePipes(AdminValidationPipe)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  updateProduct(
    @CurrentUser() user: any,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(user.id, id, updateProductDto);
  }

  @Roles('admin')
  @Delete(':id')
  @UsePipes(AdminValidationPipe)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  deleteProduct(
    @CurrentUser() user: any,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.productsService.deleteProduct(user.id, id);
  }

  @Roles('admin')
  @Get('admin/all')
  @UsePipes(AdminValidationPipe)
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  getAllProductsForAdmin(
    @CurrentUser() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.productsService.getAllProductsForAdmin(
      user.id,
      paginationDto.page || 1,
      paginationDto.pageSize || 100,
    );
  }

  @Roles('admin')
  @Get('admin/:id')
  @UsePipes(AdminValidationPipe)
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  getProductByIdAdmin(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.productsService.getProductByIdAdmin(id);
  }
}
```

**Apply to Other Admin Controllers:**

File: `backend/src/auth/auth.controller.ts`
File: `backend/src/categories/categories.controller.ts`
File: `backend/src/use-cases/use-cases.controller.ts`
File: `backend/src/upload/upload.controller.ts`

Add `@UsePipes(AdminValidationPipe)` to admin-only routes.

**Verification Steps:**

**In Development:**
1. Test public endpoint with invalid data
2. Verify detailed error message returned
3. Test admin endpoint with invalid data
4. Verify detailed error message returned

**In Production (or set NODE_ENV=production):**
1. Test public endpoint with invalid data
   - Verify generic error: `{"statusCode": 400, "message": "Bad Request"}`
2. Test admin endpoint with invalid data
   - Verify detailed error with field-specific messages
3. Create product with missing required fields
   - Verify admin sees: "name must be at least 3 characters"
4. Create product with extra fields
   - Verify admin sees: "property extraField should not exist"

**Security Consideration:**
Admin validation errors are detailed because:
- Admins are trusted users
- Helps with debugging during development
- Reduces support burden
- No sensitive system information leaked

Public endpoints hide errors because:
- Prevents information disclosure to attackers
- Doesn't reveal validation logic
- Protects against reconnaissance attacks

---

## Phase 5 – Performance Optimization (Post-Launch)

====================================================================
======================== MASTER PROMPT 10 =============================
====================================================================

**Objective:** Implement Redis distributed caching (optional post-launch enhancement)

**Scope:** This is an OPTIONAL enhancement for production deployments with multiple instances or high traffic. NOT required for single-instance deployments.

**Prerequisites Check:**
1. Verify Redis is available in deployment environment
2. Confirm application needs distributed caching (multiple instances or high traffic)
3. Check if `REDIS_URL` environment variable can be provided

**Skip This Prompt If:**
- Single server instance deployment
- Low to moderate traffic (<1000 req/min)
- Budget constraints for Redis hosting

**Required Investigation:**
1. Read `backend/src/common/cache.service.ts` (entire file)
2. Verify current implementation uses in-memory Map
3. Check if caching is critical for performance
4. Estimate cache size requirements

**Implementation Required:**

**Step 1: Install Dependencies**

```bash
cd backend
npm install ioredis
npm install --save-dev @types/ioredis
```

**Step 2: Update CacheService**

File: `backend/src/common/cache.service.ts`

Replace entire file content:

```typescript
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 300; // 5 minutes in seconds
  private usingRedis = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              this.logger.error('Redis connection failed after 3 retries, falling back to memory cache');
              this.redis = null;
              this.usingRedis = false;
              return null;
            }
            return Math.min(times * 100, 2000);
          },
        });

        this.redis.on('connect', () => {
          this.logger.log('✅ Redis cache connected');
          this.usingRedis = true;
        });

        this.redis.on('error', (error) => {
          this.logger.error(`Redis error: ${error.message}`);
        });

        // Test connection
        await this.redis.ping();
      } catch (error) {
        this.logger.warn(`Failed to connect to Redis: ${error.message}`);
        this.logger.warn('Falling back to in-memory cache');
        this.redis = null;
        this.usingRedis = false;
      }
    } else {
      this.logger.warn('REDIS_URL not configured, using in-memory cache');
      this.usingRedis = false;
    }

    this.logger.log(`CacheService initialized (using ${this.usingRedis ? 'Redis' : 'Memory'})`);
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.usingRedis && this.redis) {
      try {
        const value = await this.redis.get(key);
        if (!value) return null;

        this.logger.debug(`Cache HIT (Redis): ${key}`);
        return JSON.parse(value) as T;
      } catch (error) {
        this.logger.error(`Redis get error: ${error.message}`);
        return this.getFromMemory(key);
      }
    } else {
      return this.getFromMemory(key);
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttlMs: number = this.DEFAULT_TTL * 1000): Promise<void> {
    if (this.usingRedis && this.redis) {
      try {
        const ttlSeconds = Math.ceil(ttlMs / 1000);
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
        this.logger.debug(`Cache SET (Redis): ${key}, TTL: ${ttlSeconds}s`);
      } catch (error) {
        this.logger.error(`Redis set error: ${error.message}`);
        this.setInMemory(key, value, ttlMs);
      }
    } else {
      this.setInMemory(key, value, ttlMs);
    }
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    if (this.usingRedis && this.redis) {
      try {
        await this.redis.del(key);
        this.logger.debug(`Cache DELETE (Redis): ${key}`);
      } catch (error) {
        this.logger.error(`Redis delete error: ${error.message}`);
        this.memoryCache.delete(key);
      }
    } else {
      this.memoryCache.delete(key);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (this.usingRedis && this.redis) {
      try {
        const stream = this.redis.scanStream({
          match: `${pattern}*`,
          count: 100,
        });

        const keys: string[] = [];

        for await (const resultKeys of stream) {
          keys.push(...resultKeys);
        }

        if (keys.length > 0) {
          await this.redis.del(...keys);
          this.logger.debug(`Cache DELETE pattern (Redis): ${pattern}, deleted ${keys.length} keys`);
        }
      } catch (error) {
        this.logger.error(`Redis deletePattern error: ${error.message}`);
        this.deletePatternFromMemory(pattern);
      }
    } else {
      this.deletePatternFromMemory(pattern);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (this.usingRedis && this.redis) {
      try {
        await this.redis.flushdb();
        this.logger.log('Cache cleared (Redis)');
      } catch (error) {
        this.logger.error(`Redis clear error: ${error.message}`);
        this.memoryCache.clear();
      }
    } else {
      const size = this.memoryCache.size;
      this.memoryCache.clear();
      this.logger.log(`Cache cleared (Memory): ${size} entries removed`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ type: string; size: number; keys?: string[] }> {
    if (this.usingRedis && this.redis) {
      try {
        const dbsize = await this.redis.dbsize();
        return {
          type: 'redis',
          size: dbsize,
        };
      } catch (error) {
        this.logger.error(`Redis stats error: ${error.message}`);
      }
    }

    return {
      type: 'memory',
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys()),
    };
  }

  // Private memory cache methods (fallback)

  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      this.logger.debug(`Cache expired (Memory): ${key}`);
      return null;
    }

    this.logger.debug(`Cache HIT (Memory): ${key}`);
    return entry.data as T;
  }

  private setInMemory<T>(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.memoryCache.set(key, { data: value, expiresAt });
    this.logger.debug(`Cache SET (Memory): ${key}, TTL: ${ttlMs}ms`);
  }

  private deletePatternFromMemory(pattern: string): void {
    let deletedCount = 0;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(pattern)) {
        this.memoryCache.delete(key);
        deletedCount++;
      }
    }
    this.logger.debug(`Cache DELETE pattern (Memory): ${pattern}, deleted ${deletedCount} keys`);
  }

  /**
   * Clean expired entries from memory cache (cron job)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  cleanupExpiredMemoryCache(): void {
    if (this.usingRedis) {
      // Redis handles expiration automatically
      return;
    }

    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleanup (Memory): removed ${cleanedCount} expired entries`);
    }
  }
}
```

**Step 3: Update Environment Configuration**

File: `backend/.env.example`

Add:
```bash
# Redis Cache (Optional - for production scalability)
# If not provided, falls back to in-memory cache
# Format: redis://host:port or redis://user:password@host:port
REDIS_URL=redis://localhost:6379
```

**Step 4: No Code Changes Needed**

The service automatically:
- Detects Redis availability
- Falls back to memory cache if Redis unavailable
- Handles connection failures gracefully
- Switches to memory if Redis fails

**Verification Steps:**

**Without Redis:**
1. Do NOT set REDIS_URL
2. Start application
3. Check logs for: "REDIS_URL not configured, using in-memory cache"
4. Verify caching works
5. Test cache invalidation

**With Redis:**
1. Start Redis locally: `docker run -d -p 6379:6379 redis:alpine`
2. Set REDIS_URL=redis://localhost:6379
3. Start application
4. Check logs for: "✅ Redis cache connected"
5. Test cache operations
6. Use Redis CLI to inspect: `redis-cli KEYS "product:*"`
7. Verify cache invalidation works
8. Stop Redis - verify app falls back to memory cache

**Production Deployment:**
1. Provision Redis instance (AWS ElastiCache, Redis Cloud, etc.)
2. Set REDIS_URL environment variable
3. Configure Redis password if required
4. Monitor Redis metrics:
   - Memory usage
   - Hit rate
   - Eviction count
   - Connection count

**Performance Monitoring:**
Add endpoint to check cache stats:

File: `backend/src/app.controller.ts`

```typescript
@Get('cache-stats')
@Roles('admin')
async getCacheStats() {
  return this.cacheService.getStats();
}
```

**Redis Configuration Recommendations:**
- Max memory: 256MB - 1GB depending on catalog size
- Eviction policy: `allkeys-lru` (least recently used)
- Persistence: `appendonly no` (cache can be rebuilt)
- Max connections: 50-100

**Cost Considerations:**
- AWS ElastiCache: ~$15-30/month for cache.t3.micro
- Redis Cloud: Free tier available (30MB)
- Self-hosted: Minimal cost if existing infrastructure

**Decision Matrix:**
- Single instance + <1000 req/min → Skip Redis
- Multiple instances → Use Redis
- >5000 req/min → Use Redis
- Budget limited → Skip Redis initially

---

## Phase 6 – Testing & Documentation (Optional)

====================================================================
======================== MASTER PROMPT 11 =============================
====================================================================

**Objective:** Document API endpoints for external developers (optional)

**Scope:** This prompt is OPTIONAL and should only be executed if:
- API will be consumed by external developers
- Documentation is required for client development
- API versioning/stability is a concern

**Skip This Prompt If:**
- Internal use only
- No external API consumers
- Time/budget constraints

**Implementation Approach:**
Consider using OpenAPI/Swagger for auto-generated documentation.

**Quick Setup:**

```bash
cd backend
npm install --save @nestjs/swagger
```

Then follow NestJS Swagger documentation to add decorators to DTOs and controllers.

**Alternative:** Manual API documentation in markdown.

**This prompt intentionally left minimal as it's optional post-launch work.**

====================================================================
======================== END OF MASTER PROMPTS ====================
====================================================================

## Execution Summary

**Total Prompts:** 15
- Critical (Must Fix): 2
- High Priority: 4
- Medium Priority: 5
- Low Priority: 4

**Estimated Timeline:**
- Phase 1 (Critical): 4-6 hours
- Phase 2 (Cache/Data): 8-12 hours
- Phase 3 (API Consistency): 6-8 hours
- Phase 4 (Security/UX): 8-10 hours
- Phase 5 (Performance): 8-12 hours (optional)
- Phase 6 (Docs): 4-6 hours (optional)

**Total Core Work:** 26-36 hours
**Total With Optional:** 38-54 hours

**Priority Execution Order:**
1. Execute Phase 1 immediately (blocks admin functionality)
2. Execute Phase 2 before any load testing
3. Execute Phase 3 for consistency before launch
4. Execute Phase 4 before production deployment
5. Execute Phase 5 post-launch if needed
6. Execute Phase 6 if external API consumers exist

**Testing Strategy:**
- Manual testing after each prompt
- Integration testing after each phase
- Full regression testing before deployment

**Rollback Strategy:**
- Git commit after each successful prompt execution
- Tag stable versions: `v1.0.0-prompt-X-complete`
- Keep database backups before schema changes

**Success Criteria:**
After all prompts executed:
- ✅ Admin can edit DRAFT products
- ✅ No hardcoded credentials in source
- ✅ Cache invalidation targets specific keys only
- ✅ Relation updates are differential
- ✅ All endpoints return consistent paginated responses
- ✅ Error boundaries prevent blank screen crashes
- ✅ Auth state managed in single location
- ✅ Admin gets detailed error messages in production

**Final Checklist:**
- [ ] All Phase 1 prompts executed and tested
- [ ] All Phase 2 prompts executed and tested
- [ ] All Phase 3 prompts executed and tested
- [ ] All Phase 4 prompts executed and tested
- [ ] Optional phases evaluated for necessity
- [ ] Full regression test suite run
- [ ] Production deployment plan documented
- [ ] Rollback procedures documented and tested
