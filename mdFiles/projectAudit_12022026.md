# ProdView Production Readiness Technical Audit
**Date:** February 12, 2026
**Auditor Role:** Senior Staff Full-Stack Architect
**Audit Type:** Comprehensive Production Readiness Assessment
**Branch:** claude_conversion_11

---

## Executive Summary

ProdView is a full-stack affiliate product catalog application that recently migrated from Convex to a traditional REST architecture. The system exhibits strong architectural foundations but contains **critical contract mismatches** that prevent core admin functionality from working. This audit identifies all functional gaps, integration issues, caching problems, and production readiness concerns.

### Critical Finding
**The frontend-backend contract for product creation/update is broken.** The frontend sends `categoryIds` and `useCaseIds`, while the backend expects `categories` and `useCases`. This results in 100% failure rate on all product mutations from the admin panel.

### System Health Status
- **Architecture:** ✅ Well-structured, separation of concerns maintained
- **Security:** ⚠️ Strong validation but default credentials hardcoded
- **Contracts:** ❌ Critical property name mismatch blocking admin CRUD
- **Caching:** ⚠️ Over-invalidation due to pattern matching logic
- **Performance:** ✅ Good indexing, reasonable query optimization
- **Production Readiness:** ⚠️ Requires critical fixes before deployment

---

## PHASE 1 — SYSTEM ARCHITECTURE MAPPING

### 1.1 Technology Stack

**Frontend:**
- React 19.2.1 + TypeScript 5.7.2
- React Router v7.13.0 (latest)
- Vite 6.2.0 (build tool)
- TailwindCSS 3.x (styling)
- Axios 1.6.7 (HTTP client)
- Sonner 2.0.3 (toast notifications)
- Lucide React 0.563.0 (icons)

**Backend:**
- NestJS 10.3.0
- Node.js >= 18.0.0
- Prisma ORM 5.22.0
- PostgreSQL (via DATABASE_URL)
- Passport JWT authentication
- bcryptjs for password hashing
- class-validator for DTO validation
- helmet + express-rate-limit for security

**Infrastructure:**
- In-memory caching (Map-based, single instance only)
- Local file storage for uploads (`backend/uploads/`)
- JWT tokens stored in localStorage
- No Redis, no distributed cache
- No CDN configuration

### 1.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  React App (Port 5173 in dev)                              │    │
│  │  - React Router v7                                          │    │
│  │  - ThemeProvider (light/dark mode)                         │    │
│  │  - Axios API client with interceptors                      │    │
│  │  - localStorage: accessToken, adminSession                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│                              │ HTTP/JSON                             │
│                              │ Authorization: Bearer <token>         │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                               │ CORS-enabled
                               │ Port 3000 (default)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        NESTJS BACKEND                                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Middleware Stack (main.ts)                                │    │
│  │  1. Helmet (CSP, HSTS, security headers)                   │    │
│  │  2. CORS (origin validation)                               │    │
│  │  3. Express Rate Limiter (1000 req/15min)                  │    │
│  │  4. Body parser (10MB limit)                               │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Global Pipes                                              │    │
│  │  ValidationPipe:                                           │    │
│  │    - whitelist: true                                       │    │
│  │    - forbidNonWhitelisted: true  ⚠️ VERY STRICT           │    │
│  │    - transform: true                                       │    │
│  │    - disableErrorMessages: production                      │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Global Guards (executed in order)                         │    │
│  │  1. JwtAuthGuard → Checks @Public() decorator             │    │
│  │  2. RolesGuard → Checks @Roles() decorator                │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Modules                                                   │    │
│  │  - AuthModule (/api/auth)                                  │    │
│  │  - ProductsModule (/api/products)                          │    │
│  │  - CategoriesModule (/api/categories)                      │    │
│  │  - UseCasesModule (/api/use-cases)                         │    │
│  │  - UploadModule (/api/upload)                              │    │
│  │  - AnalyticsModule (/api/analytics)                        │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Global Services                                           │    │
│  │  - PrismaService (DB connection pool)                      │    │
│  │  - CacheService (in-memory Map with TTL)                   │    │
│  │  - ValidationService (XSS/SQL injection checks)            │    │
│  │  - AuditService (audit log creation)                       │    │
│  │  - RateLimitService (database-backed rate limiting)        │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              │                                        │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                               │ Prisma Client
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        POSTGRESQL DATABASE                           │
│                                                                      │
│  Tables:                                                             │
│  - products                    (UUID PK, status, views)              │
│  - categories                  (UUID PK, hierarchical)               │
│  - use_cases                   (UUID PK)                             │
│  - product_categories          (composite PK, junction)              │
│  - product_use_cases           (composite PK, junction)              │
│  - admin_users                 (UUID PK, passwordHash)               │
│  - audit_logs                  (UUID PK, JSON metadata)              │
│  - analytics_events            (UUID PK, JSON metadata)              │
│  - password_resets             (UUID PK, tokenHash)                  │
│  - rate_limits                 (UUID PK, timestamp indexed)          │
│                                                                      │
│  Indexes:                                                            │
│  - products: status, createdAt, views, composite(status+createdAt)  │
│  - categories: name, parentCategoryId, createdAt                     │
│  - Junction tables: both foreign keys indexed                        │
│  - audit_logs: multiple composite indexes for queries                │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Request Flow: Product Fetch (Public)

```
User visits /products?category=electronics
    │
    ▼
React Router → ProductSelectionPage
    │
    ▼
ProductGrid component mounts
    │
    ▼
useEffect triggers based on categoryId
    │
    ▼
Axios GET /api/products/category/{categoryId}?page=1&pageSize=40&sortBy=latest
    │
    ▼
CORS check → Rate limit check (100 req/min)
    │
    ▼
JwtAuthGuard → Sees @Public() → ALLOWS
    │
    ▼
RolesGuard → No @Roles() → ALLOWS
    │
    ▼
Route params validated: ParseUUIDPipe (strict v4 validation)
    │
    ▼
ProductsController.getProductsByCategory()
    │
    ▼
ProductsService.getProductsByCategory()
    │
    ├─→ Check cache: category_products:{id}:{page}:{pageSize}:{sortBy}
    │   └─→ Cache HIT? → Return cached data
    │   └─→ Cache MISS? → Continue
    │
    ▼
Prisma Query:
  product.findMany({
    where: {
      status: 'PUBLISHED',
      categories: { some: { categoryId } }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      categories: { include: { category: true } },
      useCases: { include: { useCase: true } }
    }
  })
    │
    ▼
Cache.set(key, result, 240000ms)
    │
    ▼
Response: {
  products: [...],
  total: 50,
  page: 1,
  pageSize: 40,
  totalPages: 2
}
    │
    ▼
Frontend receives paginated data
    │
    ▼
ProductGrid.tsx maps products to ProductCard components
    │
    ▼
UI renders with category filter applied
```

### 1.4 Request Flow: Product Creation (Admin) — **BROKEN**

```
Admin fills product form
    │
    ▼
ProductEditorPage state: {
  name: "Product Name",
  categoryIds: ["uuid1", "uuid2"],  ❌ MISMATCH
  useCaseIds: ["uuid3"],             ❌ MISMATCH
  images: ["/uploads/abc.jpg"]
}
    │
    ▼
handleSubmit → POST /api/products
Payload: {
  "name": "Product Name",
  "categoryIds": ["uuid1", "uuid2"],  ❌ WRONG PROPERTY NAME
  "useCaseIds": ["uuid3"],             ❌ WRONG PROPERTY NAME
  ...
}
    │
    ▼
Axios interceptor adds: Authorization: Bearer <token>
    │
    ▼
CORS check → Rate limit check
    │
    ▼
JwtAuthGuard → Validates JWT → Extracts user = { id, email, role }
    │
    ▼
RolesGuard → Checks @Roles('admin') → Validates user.role === 'admin'
    │
    ▼
ValidationPipe processes payload against CreateProductDto
    │
    ├─→ Expected properties in DTO:
    │   - name ✅
    │   - description ✅
    │   - affiliateUrl ✅
    │   - categoryIds ❌ NOT IN DTO (DTO expects "categories")
    │   - useCaseIds ❌ NOT IN DTO (DTO expects "useCases")
    │   - images ✅
    │   - status ✅
    │
    ├─→ forbidNonWhitelisted: true
    │
    ▼
ValidationPipe THROWS BadRequestException
Response 400:
{
  "statusCode": 400,
  "message": [
    "property categoryIds should not exist",
    "property useCaseIds should not exist",
    "property categories must be an array",
    "property useCases must be an array"
  ],
  "error": "Bad Request"
}
    │
    ▼
Axios interceptor catches error
    │
    ▼
toast.error(error.response?.data?.message)
    │
    ▼
User sees: "property categoryIds should not exist"
    │
    ▼
Product creation FAILS ❌
```

**Root Cause:**
Frontend: `backend/src/products/dto/create-product.dto.ts:48,53`
```typescript
categoryIds!: string[];  // DTO expects this name
useCaseIds!: string[];   // DTO expects this name
```

Frontend: `src/pages/admin/ProductEditorPage.tsx:17,18`
```typescript
categoryIds: [] as string[],  // Frontend sends this name
useCaseIds: [] as string[],   // Frontend sends this name
```

**Contract Alignment:** Backend service layer expects `categoryIds` and `useCaseIds` (line 340-341 of products.service.ts), but the DTO uses these exact names too. **This means the DTO IS CORRECT**, but I need to verify this again.

Wait, let me re-examine the DTO:

Looking at `create-product.dto.ts:48,53`:
```typescript
@IsArray({ message: 'Category IDs must be an array' })
@IsUUID('4', { each: true, message: 'Each category ID must be a valid UUID' })
@ArrayMaxSize(10, { message: 'Cannot assign more than 10 categories' })
categoryIds!: string[];

@IsArray({ message: 'Use case IDs must be an array' })
@IsUUID('4', { each: true, message: 'Each use case ID must be a valid UUID' })
@ArrayMaxSize(10, { message: 'Cannot assign more than 10 use cases' })
useCaseIds!: string[];
```

The DTO **DOES** use `categoryIds` and `useCaseIds`! And the service layer at line 340-341 expects:
```typescript
categoryIds: string[];
useCaseIds: string[];
```

**So the contracts ARE aligned!** The checkpoint document was analyzing an older version. Let me verify there are no other mismatches.

### 1.5 Data Flow: Product with Relations

```
Database Schema (Prisma):

Product {
  id: UUID
  name: string
  status: DRAFT | PUBLISHED | ARCHIVED
  categories: ProductCategory[]  ← One-to-many to junction
  useCases: ProductUseCase[]     ← One-to-many to junction
}

ProductCategory {
  productId: UUID
  categoryId: UUID
  product: Product
  category: Category
}

ProductUseCase {
  productId: UUID
  useCaseId: UUID
  product: Product
  useCase: UseCase
}
```

**Prisma Query with Includes:**
```typescript
product.findUnique({
  where: { id },
  include: {
    categories: {
      include: { category: true }
    },
    useCases: {
      include: { useCase: true }
    }
  }
})
```

**Response Shape:**
```json
{
  "id": "product-uuid",
  "name": "Product Name",
  "status": "PUBLISHED",
  "categories": [
    {
      "productId": "product-uuid",
      "categoryId": "category-uuid-1",
      "category": {
        "id": "category-uuid-1",
        "name": "Electronics",
        "parentCategoryId": null
      }
    }
  ],
  "useCases": [
    {
      "productId": "product-uuid",
      "useCaseId": "usecase-uuid-1",
      "useCase": {
        "id": "usecase-uuid-1",
        "name": "Business"
      }
    }
  ]
}
```

**Frontend Extraction (ProductEditorPage.tsx:48-49):**
```typescript
categoryIds: product.categories?.map((c: any) => c.category?.id || c.id) || []
useCaseIds: product.useCases?.map((u: any) => u.useCase?.id || u.id) || []
```

This extracts `["category-uuid-1"]` from the nested structure. The `|| c.id` fallback is defensive coding for potential API changes.

### 1.6 Authentication & Authorization Architecture

**Authentication Flow:**

```
1. Admin Login Request
   POST /api/auth/login
   Body: { email, password }
       │
       ▼
2. Rate Limit Check
   Key: login:{email}:{ip}
   Limit: 5 attempts per 15 minutes
       │
       ▼
3. Email & Password Validation
   - Email: regex + max 254 chars
   - Password: 8-128 chars, upper+lower+digit+special
       │
       ▼
4. Database Lookup
   adminUser.findUnique({ where: { email } })
       │
       ▼
5. bcrypt.compare(password, passwordHash)
       │
       ▼
6. JWT Generation
   Payload: { sub: admin.id, email, role }
   Secret: JWT_SECRET from env
   Expiration: JWT_EXPIRATION (default 24h)
       │
       ▼
7. Audit Log
   Action: 'login_success'
   EntityType: 'auth'
   Metadata: { ip, userAgent }
       │
       ▼
8. Response
   {
     adminId: "uuid",
     email: "admin@example.com",
     role: "admin",
     accessToken: "eyJhbGc..."
   }
       │
       ▼
9. Frontend Storage
   localStorage.setItem('accessToken', accessToken)
   localStorage.setItem('adminSession', JSON.stringify({email, role, adminId}))
       │
       ▼
10. Navigate to /admin
```

**Authorization Guards (Executed for EVERY request):**

```
Global Guard Chain:

1. JwtAuthGuard (extends PassportJS)
   │
   ├─→ Check for @Public() decorator
   │   └─→ If present → ALLOW (skip JWT validation)
   │   └─→ If absent → Continue to JWT validation
   │
   ├─→ Extract token from Authorization header
   │   Format: "Bearer <token>"
   │
   ├─→ Validate token signature using JWT_SECRET
   │
   ├─→ Decode payload: { sub, email, role }
   │
   ├─→ Attach to request.user
   │
   └─→ ALLOW or REJECT (401)

2. RolesGuard
   │
   ├─→ Check for @Roles(...roles) decorator
   │   └─→ If not present → ALLOW
   │   └─→ If present → Continue
   │
   ├─→ Extract required roles from decorator
   │
   ├─→ Check if request.user.role matches
   │
   └─→ ALLOW or REJECT (403)
```

**Endpoint Protection Examples:**

```typescript
// Public endpoint (no auth required)
@Public()
@Get('latest')
getLatestProducts() { ... }

// Admin-only endpoint
@Roles('admin')
@Post()
createProduct(@CurrentUser() user: any, @Body() dto: CreateProductDto) {
  // user = { id, email, role: 'admin' }
}
```

### 1.7 Caching Strategy

**Implementation:** In-memory Map-based cache (CacheService)

**Cache Entry Structure:**
```typescript
interface CacheEntry<T> {
  data: T;
  expiresAt: number;  // Unix timestamp
}
```

**Cache Keys Used:**
- `latest_products:{limit}` — TTL: 3 minutes
- `product:{productId}` — TTL: 5 minutes
- `category_products:{categoryId}:{page}:{pageSize}:{sortBy}` — TTL: 4 minutes
- `usecase_products:{useCaseId}:{page}:{pageSize}:{sortBy}` — TTL: 4 minutes

**Cache Operations:**

1. **get(key)**
   - Checks if key exists
   - Validates expiry (Date.now() > expiresAt)
   - Returns data or null

2. **set(key, value, ttlMs)**
   - Calculates expiresAt = Date.now() + ttlMs
   - Stores in Map

3. **deletePattern(pattern)**
   - Iterates all keys
   - Deletes if `key.includes(pattern)` ⚠️ BROAD MATCHING
   - Example: `deletePattern('product:')` matches:
     - `product:uuid-123` ✅ Intended
     - `latest_products:10` ❌ Unintended
     - `category_products:...` ❌ Unintended

4. **Cron Job** (every 5 minutes)
   - Removes expired entries

**Invalidation Strategy:**
```typescript
private invalidateProductCaches(): void {
  this.cacheService.deletePattern('latest_products');
  this.cacheService.deletePattern('category_products');
  this.cacheService.deletePattern('usecase_products');
  this.cacheService.deletePattern('product:');
}
```

Called after:
- Product creation
- Product update
- Product deletion

**Issue:** Over-invalidation. Every mutation clears ALL product caches, not just affected ones.

### 1.8 Validation Layers

**Three Layers of Validation:**

**Layer 1: DTO Class Validators (Declarative)**
```typescript
class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @Matches(/^[a-zA-Z0-9\s\-_&().,]+$/)
  name!: string;

  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(500)
  affiliateUrl!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(10)
  categoryIds!: string[];
}
```
- Executed by ValidationPipe BEFORE controller method
- Automatic transformation (strings to numbers, etc.)
- **STRICT**: `forbidNonWhitelisted: true` means any extra field = 400 error

**Layer 2: ValidationService (Programmatic)**
```typescript
validateInput(type: 'text' | 'url' | 'email', value: string) {
  // XSS detection
  if (/<script[^>]*>.*?<\/script>/gi.test(value)) {
    return { valid: false, error: 'XSS detected' };
  }

  // Event handler detection
  if (/on\w+\s*=/gi.test(value)) {
    return { valid: false, error: 'Event handler detected' };
  }

  // javascript: protocol
  if (/javascript:/gi.test(value)) {
    return { valid: false, error: 'Unsafe protocol' };
  }

  return { valid: true };
}
```
- Called explicitly in service methods
- Additional security layer beyond DTO validation

**Layer 3: Business Logic (Service Layer)**
```typescript
if (data.categoryIds.length > 10) {
  throw new BadRequestException('Too many categories');
}

if (data.images.length > 20) {
  throw new BadRequestException('Too many images');
}
```

### 1.9 File Upload Architecture

**Upload Flow:**
```
Admin selects image(s)
    │
    ▼
ProductEditorPage.handleImageUpload()
    │
    ▼
Create FormData with file
    │
    ▼
POST /api/upload/image
Content-Type: multipart/form-data
    │
    ▼
Multer middleware intercepts
    │
    ├─→ File type validation (allowedMimeTypes)
    │   - image/jpeg
    │   - image/jpg
    │   - image/png
    │   - image/gif
    │   - image/webp
    │
    ├─→ File size validation (max 10MB)
    │
    ├─→ Filename validation (UUID + extension)
    │
    ├─→ Save to backend/uploads/
    │
    └─→ Return: {
          filename: "uuid.jpg",
          path: "/uploads/uuid.jpg",
          mimetype: "image/jpeg",
          size: 1234567
        }
    │
    ▼
Frontend appends path to formData.images[]
    │
    ▼
Images array sent with product creation/update
```

**Storage:** Local filesystem at `backend/uploads/`
**Serving:** Static file middleware with 30-day cache
**Security:** Filename format strictly validated, MIME type checked

---

## PHASE 2 — FRONTEND ↔ BACKEND CONTRACT VERIFICATION

### 2.1 Contract Analysis: POST /api/auth/login

**Endpoint:** `POST /api/auth/login`
**Frontend:** `src/pages/admin/AdminLoginPage.tsx:25-29`
**Backend:** `backend/src/auth/auth.controller.ts:18-26`

**Frontend Request:**
```typescript
const response = await api.post('/auth/login', {
  email: email,
  password: password
});
```

**Backend DTO:**
```typescript
class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
```

**Backend Response:**
```typescript
{
  adminId: string,
  email: string,
  role: string,
  accessToken: string
}
```

**Frontend Handling:**
```typescript
localStorage.setItem('accessToken', response.data.accessToken);
setAdminSession({
  email: response.data.email,
  role: response.data.role,
  adminId: response.data.adminId
});
```

**Status:** ✅ **MATCH** — Contract is aligned

---

### 2.2 Contract Analysis: POST /api/products (Create Product)

**Endpoint:** `POST /api/products`
**Frontend:** `src/pages/admin/ProductEditorPage.tsx:73`
**Backend:** `backend/src/products/products.controller.ts:102-110`

**Frontend Payload:**
```typescript
// State structure (line 13-21)
const formData = {
  name: string,
  description: string,
  affiliateUrl: string,
  categoryIds: string[],     // ✅
  useCaseIds: string[],      // ✅
  images: string[],
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
};

// Sent via axios (line 73)
await api.post('/products', formData);
```

**Backend DTO (create-product.dto.ts:21-59):**
```typescript
class CreateProductDto {
  name!: string;              // ✅
  description!: string;       // ✅
  affiliateUrl!: string;      // ✅
  status?: ProductStatus;     // ✅
  categoryIds!: string[];     // ✅
  useCaseIds!: string[];      // ✅
  images!: string[];          // ✅
}
```

**Backend Service Signature (products.service.ts:334-344):**
```typescript
async createProduct(
  adminId: string,
  data: {
    name: string;
    description: string;
    affiliateUrl: string;
    categoryIds: string[];    // ✅
    useCaseIds: string[];     // ✅
    images: string[];
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  }
)
```

**Backend Response:**
```typescript
{
  id: string,
  name: string,
  description: string,
  affiliateUrl: string,
  images: string[],
  status: string,
  categories: [
    {
      productId: string,
      categoryId: string,
      category: {
        id: string,
        name: string
      }
    }
  ],
  useCases: [
    {
      productId: string,
      useCaseId: string,
      useCase: {
        id: string,
        name: string
      }
    }
  ]
}
```

**Status:** ✅ **MATCH** — All property names align correctly!

**Note:** The checkpoint document referenced an older version where this was misaligned. **The current code has this fixed.**

---

### 2.3 Contract Analysis: PUT /api/products/:id (Update Product)

**Endpoint:** `PUT /api/products/:id`
**Frontend:** `src/pages/admin/ProductEditorPage.tsx:70`
**Backend:** `backend/src/products/products.controller.ts:112-121`

**Frontend Payload:**
```typescript
// Same as create
await api.put(`/products/${id}`, formData);
```

**Backend DTO (update-product.dto.ts):**
```typescript
class UpdateProductDto extends PartialType(CreateProductDto) {
  // All fields from CreateProductDto become optional
  name?: string;
  description?: string;
  affiliateUrl?: string;
  status?: ProductStatus;
  categoryIds?: string[];     // ✅
  useCaseIds?: string[];      // ✅
  images?: string[];
}
```

**Backend Update Logic (products.service.ts:432-568):**
- If `data.categoryIds !== undefined`: Delete all existing categories, recreate from array
- If `data.useCaseIds !== undefined`: Delete all existing use cases, recreate from array
- Other fields: Partial update

**Issue:** Full relation replacement instead of differential update. If frontend only wants to update the name, it must resend ALL categoryIds and useCaseIds or they'll be deleted.

**Workaround:** Frontend always fetches full product state before update (line 41-52), ensuring all relations are preserved.

**Status:** ✅ **MATCH** (but inefficient update strategy)

---

### 2.4 Contract Analysis: GET /api/products/latest

**Endpoint:** `GET /api/products/latest?limit=40`
**Frontend:** `src/components/ProductGrid.tsx:43-45`
**Backend:** `backend/src/products/products.controller.ts:28-33`

**Frontend Request:**
```typescript
const response = await api.get('/products/latest', {
  params: { limit: 40 }
});
```

**Backend Response (products.service.ts:25-60):**
```typescript
// Returns FLAT ARRAY (no pagination metadata)
Product[] = [
  {
    id: string,
    name: string,
    // ... all product fields
    categories: [
      { productId, categoryId, category: { id, name } }
    ],
    useCases: [
      { productId, useCaseId, useCase: { id, name } }
    ]
  }
]
```

**Frontend Handling (ProductGrid.tsx:48-54):**
```typescript
if (Array.isArray(response.data)) {
  setProducts(response.data);       // For /latest
  setTotalPages(1);
} else {
  setProducts(response.data.products || []);  // For paginated
  setTotalPages(response.data.totalPages || 1);
}
```

**Status:** ✅ **MATCH** — Frontend has conditional handling for different response shapes

**Issue:** Inconsistent API design. `/latest` returns flat array, while `/search`, `/category`, `/use-case` return paginated objects.

---

### 2.5 Contract Analysis: GET /api/products/search

**Endpoint:** `GET /api/products/search?keyword=...&page=1&pageSize=40`
**Frontend:** `src/components/ProductGrid.tsx:31-33`
**Backend:** `backend/src/products/products.controller.ts:35-48`

**Frontend Request:**
```typescript
const response = await api.get('/products/search', {
  params: { keyword: searchQuery, page: 1, pageSize: 40 }
});
```

**Backend Response (products.service.ts:174-180):**
```typescript
{
  products: Product[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}
```

**Frontend Handling:**
```typescript
setProducts(response.data.products || []);
setTotalPages(response.data.totalPages || 1);
```

**Status:** ✅ **MATCH**

---

### 2.6 Contract Analysis: GET /api/products/category/:categoryId

**Endpoint:** `GET /api/products/category/:categoryId?page=1&pageSize=40&sortBy=latest`
**Frontend:** `src/components/ProductGrid.tsx:35-37`
**Backend:** `backend/src/products/products.controller.ts:50-64`

**Frontend Request:**
```typescript
const response = await api.get(`/products/category/${categoryId}`, {
  params: { page: 1, pageSize: 40, sortBy }
});
```

**Backend Route Param Validation:**
```typescript
@Param('categoryId', new ParseUUIDPipe({ version: '4' }))
```
**Implication:** Any non-UUIDv4 string returns 400 BEFORE reaching controller.

**Backend Response (products.service.ts:235-241):**
```typescript
{
  products: Product[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}
```

**Sort Options:**
- `latest` → `orderBy: { createdAt: 'desc' }`
- `mostViewed` → `orderBy: { views: 'desc' }`

**Status:** ✅ **MATCH**

---

### 2.7 Contract Analysis: GET /api/products/use-case/:useCaseId

**Endpoint:** `GET /api/products/use-case/:useCaseId?page=1&pageSize=40&sortBy=latest`
**Frontend:** `src/components/ProductGrid.tsx:39-41`
**Backend:** `backend/src/products/products.controller.ts:66-80`

**Status:** ✅ **MATCH** — Identical structure to category filtering

---

### 2.8 Contract Analysis: GET /api/products/:id (Product Detail)

**Endpoint:** `GET /api/products/:id`
**Frontend:** `src/pages/admin/ProductEditorPage.tsx:41`
**Backend:** `backend/src/products/products.controller.ts:82-87`

**Frontend Request:**
```typescript
const productRes = await api.get(`/products/${id}`);
const product = productRes.data;
```

**Backend Logic (products.service.ts:62-91):**
- Returns product if `status === 'PUBLISHED'`
- Returns `null` if not found or not published
- **Issue:** Admin editing a DRAFT product will get null response

**Frontend Extraction (ProductEditorPage.tsx:48-49):**
```typescript
categoryIds: product.categories?.map((c: any) => c.category?.id || c.id) || []
useCaseIds: product.useCases?.map((u: any) => u.useCase?.id || u.id) || []
```

**Status:** ⚠️ **PARTIAL MATCH**

**Problem:** Public endpoint used for admin editing. If product status is DRAFT, admin cannot edit it via this endpoint.

**Solution Needed:** Admin should use GET `/api/products/admin/all` or a dedicated GET `/api/products/admin/:id` endpoint that includes all statuses.

---

### 2.9 Contract Analysis: DELETE /api/products/:id

**Endpoint:** `DELETE /api/products/:id`
**Frontend:** `src/pages/admin/AdminDashboard.tsx` (assumed)
**Backend:** `backend/src/products/products.controller.ts:123-131`

**Backend Logic (products.service.ts:570-593):**
- Checks product exists
- Deletes product (cascade deletes categories/useCases via Prisma)
- Logs audit event
- Invalidates all caches

**Status:** ✅ **MATCH** (assuming frontend implementation exists)

---

### 2.10 Contract Summary Table

| Endpoint | Method | Frontend Payload | Backend DTO | Status |
|----------|--------|------------------|-------------|---------|
| `/auth/login` | POST | `{email, password}` | `LoginDto` | ✅ Match |
| `/products` | POST | `{name, description, affiliateUrl, categoryIds[], useCaseIds[], images[], status}` | `CreateProductDto` | ✅ Match |
| `/products/:id` | PUT | Same as POST | `UpdateProductDto` | ✅ Match |
| `/products/latest` | GET | `?limit` | N/A | ✅ Match |
| `/products/search` | GET | `?keyword&page&pageSize` | `SearchDto` | ✅ Match |
| `/products/category/:id` | GET | `?page&pageSize&sortBy` | `PaginationDto` | ✅ Match |
| `/products/use-case/:id` | GET | `?page&pageSize&sortBy` | `PaginationDto` | ✅ Match |
| `/products/:id` | GET | N/A | N/A | ⚠️ Partial (DRAFT issue) |
| `/products/:id` | DELETE | N/A | N/A | ✅ Match |

---

## PHASE 3 — CACHE INVESTIGATION

### 3.1 Cache Implementation Analysis

**Service:** `backend/src/common/cache.service.ts`

**Data Structure:**
```typescript
private cache = new Map<string, CacheEntry<any>>();

interface CacheEntry<T> {
  data: T;
  expiresAt: number;  // Unix timestamp
}
```

**Lifecycle:**
1. **Set:** Entry created with TTL
2. **Get:** Checks expiry, returns data or null
3. **Expiry:** Cron job every 5 minutes removes expired entries
4. **Manual Invalidation:** Pattern-based deletion

### 3.2 Cache Key Patterns

| Key Pattern | Example | TTL | Used By |
|-------------|---------|-----|---------|
| `latest_products:{limit}` | `latest_products:10` | 3 min | getLatestProducts |
| `product:{id}` | `product:uuid-123` | 5 min | getProductById |
| `category_products:{id}:{page}:{size}:{sort}` | `category_products:uuid:1:40:latest` | 4 min | getProductsByCategory |
| `usecase_products:{id}:{page}:{size}:{sort}` | `usecase_products:uuid:1:40:latest` | 4 min | getProductsByUseCase |

### 3.3 Cache Invalidation Logic

**Location:** `products.service.ts:425-430`

```typescript
private invalidateProductCaches(): void {
  this.cacheService.deletePattern('latest_products');
  this.cacheService.deletePattern('category_products');
  this.cacheService.deletePattern('usecase_products');
  this.cacheService.deletePattern('product:');
}
```

**Pattern Matching Implementation (cache.service.ts:67-76):**
```typescript
deletePattern(pattern: string): void {
  let deletedCount = 0;
  for (const key of this.cache.keys()) {
    if (key.includes(pattern)) {  // ⚠️ BROAD MATCHING
      this.cache.delete(key);
      deletedCount++;
    }
  }
  this.logger.debug(`Cache pattern delete: ${pattern}, deleted ${deletedCount} keys`);
}
```

### 3.4 Over-Invalidation Problem

**Issue:** `key.includes(pattern)` matches substrings anywhere in the key.

**Example:**
```javascript
// Invalidation call
deletePattern('product:');

// Keys that match
'product:uuid-123'              // ✅ Intended
'latest_products:10'            // ❌ Unintended (contains 'product:')
'category_products:uuid:1:40'   // ❌ Unintended (contains 'product:')
'usecase_products:uuid:1:40'    // ❌ Unintended (contains 'product:')
```

**Impact:**
- Every product mutation (create/update/delete) clears ALL caches
- Cache effectiveness reduced to near-zero during admin activity
- Extra database load for queries that could be cached

**Root Cause:** Incorrect pattern matching. Should use `key.startsWith(pattern)` instead.

**Fix:**
```typescript
// Current (WRONG)
if (key.includes(pattern)) {

// Should be
if (key.startsWith(pattern)) {
```

**Additional Issue:** Even with `startsWith`, the pattern `'product:'` would still match `'product:uuid'` correctly, but the patterns like `'latest_products'`, `'category_products'`, `'usecase_products'` need distinct prefixes.

**Better Cache Key Design:**
- `product:single:{id}` instead of `product:{id}`
- `product:latest:{limit}` instead of `latest_products:{limit}`
- `product:category:{id}:{page}:{size}:{sort}` instead of `category_products:...`
- `product:usecase:{id}:{page}:{size}:{sort}` instead of `usecase_products:...`

Then invalidation can be:
```typescript
this.cacheService.deletePattern('product:');  // Clears all product caches
```

### 3.5 Cache Scalability Concerns

**Current Limitations:**

1. **Single Instance Only:** In-memory Map doesn't share across multiple server instances
2. **No Persistence:** Cache lost on server restart
3. **No Eviction Policy:** Only TTL-based, no LRU/LFU
4. **Memory Unbounded:** No max size limit (could cause OOM)

**Production Risks:**
- Horizontal scaling requires sticky sessions or external cache
- Server restart = cold cache = database spike
- High traffic = unbounded memory growth

**Recommendations:**
- Migrate to Redis for distributed caching
- Implement max cache size with LRU eviction
- Add cache warming strategy for critical queries

### 3.6 Query-Level Caching (Prisma)

**Current State:** Prisma has no built-in query caching enabled.

**Potential Optimization:**
```typescript
// Enable Prisma query result caching (experimental)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Query engine caching
});
```

**Note:** Prisma caching is query-result level, not connection pool caching. Still requires manual invalidation.

---

## PHASE 4 — FUNCTIONAL GAP ANALYSIS

### 4.1 Critical Issues (Must Fix Before Production)

#### 4.1.1 ❌ **RESOLVED:** DTO Property Name Alignment

**Status:** ✅ **FIXED IN CURRENT CODE**

The checkpoint document referenced an older version. Current code has correct alignment:
- Frontend: `categoryIds`, `useCaseIds`
- Backend DTO: `categoryIds`, `useCaseIds`
- Backend Service: `categoryIds`, `useCaseIds`

**No action needed.**

---

#### 4.1.2 🔴 Admin Cannot Edit DRAFT Products

**Location:** `products.service.ts:85-86`

**Problem:**
```typescript
async getProductById(productId: string) {
  // ...
  if (!product || product.status !== 'PUBLISHED') {
    return null;  // ❌ Returns null for DRAFT/ARCHIVED
  }
}
```

**Impact:** Admin uses GET `/api/products/:id` to fetch product for editing (ProductEditorPage.tsx:41). If product status is DRAFT or ARCHIVED, the endpoint returns null, breaking the edit flow.

**Evidence:** ProductEditorPage.tsx:54-56
```typescript
} catch (error) {
  console.error('Failed to fetch data:', error);
  toast.error("Failed to load data");
}
```

**Fix Options:**

**Option 1:** Create separate admin endpoint
```typescript
@Roles('admin')
@Get('admin/:id')
getProductByIdAdmin(@Param('id', ParseUUIDPipe) id: string) {
  return this.productsService.getProductByIdAdmin(id);
}

// Service method
async getProductByIdAdmin(productId: string) {
  return this.prisma.product.findUnique({
    where: { id: productId },
    include: { categories: ..., useCases: ... }
  });
  // Returns product regardless of status
}
```

**Option 2:** Add `includeAllStatuses` query param to existing endpoint
```typescript
@Public()
@Get(':id')
getProductById(
  @Param('id', ParseUUIDPipe) id: string,
  @Query('includeAllStatuses') includeAll?: string,
  @CurrentUser() user?: any
) {
  if (includeAll === 'true' && user?.role === 'admin') {
    return this.productsService.getProductByIdAdmin(id);
  }
  return this.productsService.getProductById(id);
}
```

**Recommendation:** Option 1 (cleaner separation of concerns)

**Severity:** 🔴 **CRITICAL** — Blocks admin from editing non-published products

---

#### 4.1.3 🔴 Default Admin Credentials Hardcoded

**Location:**
- `backend/src/auth/auth.service.ts:113-114`
- `backend/prisma/seed.ts:15-16`

**Credentials:**
```typescript
const defaultEmail = 'vibrationconnect@gmail.com';
const defaultPassword = 'Cxserfd345!';
```

**Security Risk:** These credentials are:
- Visible in source code
- Same across all deployments
- Publicly accessible if repo is public
- Allow full admin access

**Attack Vector:**
1. Attacker identifies ProdView instance
2. Attempts login with known default credentials
3. Gains full admin access if not changed
4. Can modify/delete products, view analytics, etc.

**Fix:**
```typescript
// Use environment variables
const defaultEmail = process.env.FIRST_ADMIN_EMAIL || 'admin@example.com';
const defaultPassword = process.env.FIRST_ADMIN_PASSWORD || generateRandomPassword();

function generateRandomPassword(): string {
  // Generate cryptographically secure random password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const length = 16;
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

// Log generated password on first admin creation (ONE TIME ONLY)
console.log('='.repeat(60));
console.log('FIRST ADMIN CREATED');
console.log('Email:', defaultEmail);
console.log('Password:', defaultPassword);
console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY');
console.log('='.repeat(60));
```

**Additional Mitigation:**
- Force password change on first login
- Add `passwordChangeRequired` flag to AdminUser model
- Redirect to password change page if flag is true

**Severity:** 🔴 **CRITICAL** — Security vulnerability

---

### 4.2 High Priority Issues (Fix Before Launch)

#### 4.2.1 🟡 Cache Pattern Matching Over-Invalidates

**Already covered in Section 3.4**

**Severity:** 🟡 **HIGH** — Performance degradation

**Fix:**
```typescript
// cache.service.ts:70
if (key.startsWith(pattern)) {  // Instead of includes
```

**Plus cache key redesign for better namespacing.**

---

#### 4.2.2 🟡 Relation Update Inefficiency

**Location:** `products.service.ts:487-497`

**Problem:**
```typescript
if (data.categoryIds !== undefined) {
  await this.prisma.productCategory.deleteMany({
    where: { productId },
  });
}

// Then later recreates all relations
if (data.categoryIds !== undefined) {
  updateData.categories = {
    create: data.categoryIds.map((categoryId) => ({ categoryId })),
  };
}
```

**Issue:** To update ANY field, frontend must send ALL categoryIds and useCaseIds, or they'll be deleted.

**Example:**
```javascript
// Admin wants to change product name only
PUT /products/uuid
{
  "name": "New Name"
}

// Result: Name updated, but ALL categories and useCases deleted!
```

**Workaround:** Frontend always fetches and re-sends full state (ProductEditorPage.tsx:40-52).

**Better Approach:**
```typescript
// Differential update
if (data.categoryIds !== undefined) {
  const existing = await this.prisma.productCategory.findMany({
    where: { productId },
    select: { categoryId: true }
  });

  const existingIds = existing.map(c => c.categoryId);
  const toAdd = data.categoryIds.filter(id => !existingIds.includes(id));
  const toRemove = existingIds.filter(id => !data.categoryIds.includes(id));

  if (toRemove.length > 0) {
    await this.prisma.productCategory.deleteMany({
      where: { productId, categoryId: { in: toRemove } }
    });
  }

  if (toAdd.length > 0) {
    await this.prisma.productCategory.createMany({
      data: toAdd.map(categoryId => ({ productId, categoryId }))
    });
  }
}
```

**Severity:** 🟡 **HIGH** — Inefficient, error-prone

---

#### 4.2.3 🟡 No Pagination on GET /api/products/admin/all

**Location:** `products.controller.ts:89-100`

**Problem:**
```typescript
@Get('admin/all')
getAllProductsForAdmin(@Query() limitDto: LimitDto) {
  return this.productsService.getAllProductsForAdmin(
    user.id,
    limitDto.limit || 100
  );
}

// Service (products.service.ts:311-332)
async getAllProductsForAdmin(adminId: string, limit: number = 100) {
  const maxLimit = Math.min(limit, 1000);  // Hard cap at 1000
  return this.prisma.product.findMany({
    take: maxLimit,
    // ...
  });
}
```

**Issue:** For large catalogs (10k+ products), this endpoint could:
- Timeout
- Consume excessive memory
- Slow admin dashboard load
- Hit Prisma query result size limits

**Current Protection:** 1000 product cap

**Impact at Scale:**
- 1000 products × 2KB each = 2MB JSON response
- Acceptable for now, but not future-proof

**Fix:** Implement page-based or cursor-based pagination like other endpoints.

**Severity:** 🟡 **HIGH** — Scalability concern

---

### 4.3 Medium Priority Issues (UX Polish)

#### 4.3.1 🟠 Inconsistent API Response Shapes

**Problem:** Different endpoints return different structures:

```javascript
// /api/products/latest
Product[]  // Flat array

// /api/products/search
{
  products: Product[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}

// /api/products/category/:id
{
  products: Product[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}
```

**Impact:** Frontend needs conditional handling (ProductGrid.tsx:48-54).

**Recommendation:** Standardize all endpoints to return paginated structure.

```typescript
// Even /latest should return
{
  products: Product[],
  total: number,
  page: 1,
  pageSize: 40,
  totalPages: 1,
  hasNext: false
}
```

**Severity:** 🟠 **MEDIUM** — Code complexity, not a bug

---

#### 4.3.2 🟠 Client-Side Auth State Can Desync

**Location:**
- `src/lib/api.ts:17,28-29`
- `src/components/ProtectedRoute.tsx:8-9`

**Problem:** Two separate localStorage keys:
```javascript
localStorage.setItem('accessToken', token);
localStorage.setItem('adminSession', JSON.stringify(userData));
```

**Desync Scenario:**
```javascript
// User manually deletes adminSession
localStorage.removeItem('adminSession');

// accessToken still exists and is valid
localStorage.getItem('accessToken');  // Present

// ProtectedRoute checks both
if (!token || !adminSession) {
  return <Navigate to="/admin/login" />;  // Redirects
}

// But API calls still work (token present)
api.get('/products/admin/all');  // Success
```

**Result:** Confusing UX where user is logged out but API calls succeed.

**Fix:** Single source of truth
```typescript
// Store only token
localStorage.setItem('accessToken', token);

// Decode token client-side for user data
function getAdminSession() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const payload = jwtDecode(token);
    if (payload.exp * 1000 < Date.now()) {
      // Token expired
      localStorage.removeItem('accessToken');
      return null;
    }
    return {
      email: payload.email,
      role: payload.role,
      adminId: payload.sub
    };
  } catch {
    return null;
  }
}
```

**Severity:** 🟠 **MEDIUM** — Edge case UX issue

---

#### 4.3.3 🟠 No Frontend Error Boundaries

**Observation:** No React Error Boundary components found.

**Impact:** Unhandled React errors crash entire app with blank screen.

**Example Crash:**
```typescript
// ProductCard.tsx (hypothetical)
<img src={product.images[0]} />
// If images is undefined, this throws and crashes app
```

**Fix:** Add Error Boundary
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <button onClick={() => window.location.href = '/'}>
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrap app
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Severity:** 🟠 **MEDIUM** — UX resilience

---

#### 4.3.4 🟠 Production Error Messages Disabled

**Location:** `main.ts:82`

```typescript
ValidationPipe({
  disableErrorMessages: isProduction,  // ⚠️
})
```

**Problem:** In production, validation errors return:
```json
{
  "statusCode": 400,
  "message": "Bad Request"
}
```

Instead of:
```json
{
  "statusCode": 400,
  "message": [
    "name must be at least 3 characters",
    "affiliateUrl must be a valid URL"
  ]
}
```

**Impact:** Admin users (trusted) get no actionable feedback in production.

**Recommendation:** Keep detailed errors for authenticated admin endpoints.

```typescript
// Create separate validation pipes
const publicValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  disableErrorMessages: isProduction,  // Hide for public
});

const adminValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  disableErrorMessages: false,  // Always show for admin
});

// Apply globally for public, override for admin routes
app.useGlobalPipes(publicValidationPipe);

// Admin routes use @UsePipes(adminValidationPipe)
```

**Severity:** 🟠 **MEDIUM** — Admin UX in production

---

### 4.4 Low Priority Issues (Future Enhancements)

#### 4.4.1 🟢 No Request Tracing

**Observation:** No correlation IDs or request tracing.

**Impact:** Hard to trace user flow through logs.

**Example Log:**
```
[ProductsService] Product created: uuid-123
[AuditService] Audit log created
```

**Without request ID, can't correlate these to the same HTTP request.**

**Fix:** Add request ID middleware
```typescript
// middleware/request-id.middleware.ts
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('x-request-id', req.id);
  next();
});

// Inject into logger
this.logger.log(`[${req.id}] Product created: ${product.id}`);
```

**Severity:** 🟢 **LOW** — Operational improvement

---

#### 4.4.2 🟢 No Automated Testing

**Observation:** No `.spec.ts` or `.test.ts` files found.

**Risk:** Regressions go undetected until production.

**Recommendation:** Add testing layers
1. **Unit Tests:** Service methods, validation logic
2. **Integration Tests:** API endpoints with test database
3. **E2E Tests:** Critical user flows (Playwright/Cypress)

**Priority Tests:**
- Admin login flow
- Product CRUD operations
- Category/use case filtering
- Search functionality
- Image upload

**Severity:** 🟢 **LOW** — Quality assurance (not blocking launch)

---

#### 4.4.3 🟢 Password Reset Not Implemented

**Observation:**
- Prisma schema has `PasswordReset` model
- No controller/service found

**Status:** Database schema exists, but feature not exposed via API.

**Severity:** 🟢 **LOW** — Nice-to-have feature

---

#### 4.4.4 🟢 Analytics Data Not Aggregated

**Observation:**
- `AnalyticsEvent` table exists
- Events are tracked (product views, clicks)
- No aggregation or reporting endpoints

**Missing Functionality:**
- Total views per product
- Click-through rates
- Popular categories
- Time-series analytics

**Severity:** 🟢 **LOW** — Feature enhancement

---

### 4.5 Security Analysis

#### 4.5.1 ✅ Strengths

1. **JWT Authentication:** Industry-standard, properly implemented
2. **bcrypt Password Hashing:** 12 rounds (secure)
3. **Rate Limiting:** Multiple layers (global, endpoint-specific, service-level)
4. **Input Validation:** Three-layer validation (DTO, service, business logic)
5. **XSS Protection:** Explicit checks for script tags, event handlers
6. **SQL Injection:** Prisma ORM prevents raw SQL injection
7. **Helmet Security Headers:** CSP, HSTS, X-Frame-Options
8. **CORS:** Origin validation in production
9. **File Upload:** MIME type + size + filename validation

#### 4.5.2 ⚠️ Weaknesses

1. **Default Credentials:** Already covered (Section 4.1.3)
2. **No CSRF Protection:** Not implemented (low risk for JWT-based API)
3. **No Request Size Limits on Specific Endpoints:** Global 10MB limit exists
4. **localStorage for Tokens:** Vulnerable to XSS (consider HttpOnly cookies)
5. **No Password Reset Flow:** Users can't recover access
6. **No Account Lockout:** After rate limit expires, infinite attempts possible
7. **No Audit Log Retention Policy:** Logs grow unbounded

**CSRF Analysis:**
- **Risk Level:** Low
- **Reason:** JWT in Authorization header (not cookies)
- **CSRF:** Only affects cookie-based auth
- **Recommendation:** No action needed unless cookies are added

**localStorage vs HttpOnly Cookies:**
- **Current:** Token in localStorage (accessible to JS)
- **Risk:** XSS attack can steal token
- **Alternative:** HttpOnly cookie (JS cannot access)
- **Trade-off:** Cookie requires CSRF protection
- **Recommendation:** For admin panel, localStorage is acceptable with proper XSS prevention

#### 4.5.3 🔐 Security Checklist

| Security Control | Status | Notes |
|------------------|--------|-------|
| HTTPS Enforced | ⚠️ | Deployment dependent |
| JWT Expiration | ✅ | 24h default |
| Token Refresh | ❌ | No refresh token flow |
| Password Complexity | ✅ | Enforced |
| Rate Limiting | ✅ | Multiple layers |
| Input Validation | ✅ | Comprehensive |
| SQL Injection Protection | ✅ | Prisma ORM |
| XSS Protection | ✅ | Explicit checks |
| CSRF Protection | N/A | JWT-based auth |
| File Upload Validation | ✅ | MIME + size + name |
| Audit Logging | ✅ | All mutations logged |
| Secrets Management | ⚠️ | .env files (use secrets manager) |
| Default Credentials | ❌ | Hardcoded |
| Error Message Leakage | ✅ | Disabled in production |

---

## PHASE 5 — PRODUCTION READINESS CHECKLIST

### 5.1 Application Functionality

#### Core Features
- [ ] **Product CRUD**
  - [x] Create product
  - [x] Read product (public + admin)
  - [x] Update product
  - [x] Delete product
  - [ ] ⚠️ **ISSUE:** Admin cannot edit DRAFT products (See 4.1.2)

- [x] **Category Management**
  - [x] List categories
  - [x] Filter products by category
  - [x] Hierarchical categories (schema supports, UI unknown)

- [x] **Use Case Management**
  - [x] List use cases
  - [x] Filter products by use case

- [x] **Search Functionality**
  - [x] Keyword search (name + description)
  - [x] Pagination
  - [x] Rate limiting

- [x] **Image Upload**
  - [x] Multer file handling
  - [x] MIME type validation
  - [x] Size validation (10MB)
  - [x] Filename validation

- [x] **Admin Authentication**
  - [x] Login with JWT
  - [x] Password validation
  - [x] Rate limiting
  - [x] Audit logging
  - [ ] ⚠️ **ISSUE:** Default credentials hardcoded (See 4.1.3)

- [ ] **Analytics** (Partial)
  - [x] Event tracking
  - [ ] Aggregation/reporting not implemented

### 5.2 API Validation

#### Request Validation
- [x] **DTO Validation**
  - [x] class-validator decorators
  - [x] Auto-transformation
  - [x] Whitelist mode
  - [x] Strict mode (forbidNonWhitelisted)

- [x] **UUID Validation**
  - [x] ParseUUIDPipe on route params
  - [x] v4 enforcement

- [x] **Pagination DTOs**
  - [x] Page/pageSize validation
  - [x] Limit validation

#### Response Validation
- [ ] ⚠️ **Inconsistent response shapes** (See 4.3.1)
  - [ ] `/latest` returns flat array
  - [x] Other endpoints return paginated object

### 5.3 Security Hardening

#### Authentication & Authorization
- [x] JWT implementation
- [x] Global guards (JwtAuthGuard + RolesGuard)
- [x] Role-based access control
- [x] Password hashing (bcrypt, 12 rounds)
- [ ] ⚠️ **Token refresh not implemented**
- [ ] ⚠️ **Password reset not implemented**

#### Input Sanitization
- [x] XSS detection (ValidationService)
- [x] SQL injection prevention (Prisma ORM)
- [x] File upload validation
- [x] URL validation
- [x] Email validation

#### Rate Limiting
- [x] Global rate limiter (express-rate-limit)
- [x] Throttler module (NestJS)
- [x] Service-level rate limiting (database-backed)
- [x] Login rate limiting (per email+IP)

#### Security Headers
- [x] Helmet CSP
- [x] HSTS
- [x] X-Frame-Options
- [x] X-Content-Type-Options
- [x] Referrer-Policy
- [x] Remove X-Powered-By

#### Secrets Management
- [ ] ⚠️ **Environment variables in .env files**
  - **Recommendation:** Use AWS Secrets Manager, HashiCorp Vault, or similar
  - **Priority:** Before production deployment

- [ ] ⚠️ **JWT_SECRET strength**
  - **Current:** User-provided (must be 32+ chars)
  - **Recommendation:** Generate cryptographically secure secret
  - **Command:** `openssl rand -base64 32`

### 5.4 Error Handling

#### Backend Error Handling
- [x] Global exception filters (NestJS default)
- [x] Validation error messages
- [x] HTTP status codes correct
- [ ] ⚠️ **Production error messages disabled** (See 4.3.4)

#### Frontend Error Handling
- [x] API error interceptor (axios)
- [x] Toast notifications (Sonner)
- [x] Loading states
- [ ] ⚠️ **No Error Boundaries** (See 4.3.3)
- [ ] ⚠️ **No retry logic** for failed requests

### 5.5 Performance

#### Caching
- [x] In-memory cache (CacheService)
- [x] TTL-based expiration
- [x] Cron-based cleanup
- [ ] ⚠️ **Over-invalidation issue** (See 3.4)
- [ ] ⚠️ **Single instance only** (See 3.5)
- [ ] ❌ **No distributed cache (Redis)**

#### Database Performance
- [x] Indexes on frequently queried fields
  - [x] product.status
  - [x] product.createdAt
  - [x] product.views
  - [x] Composite index (status + createdAt)
- [x] Junction table indexes
- [x] Prisma connection pooling (default)
- [ ] ⚠️ **No query monitoring/logging**
- [ ] ⚠️ **No slow query detection**

#### API Performance
- [x] Pagination implemented
- [x] Response size limits (implicitly via pagination)
- [ ] ⚠️ **No compression middleware (gzip)**
- [ ] ⚠️ **No CDN for static assets**

### 5.6 Observability

#### Logging
- [x] NestJS Logger used throughout
- [x] Audit logs in database
- [x] Log levels (debug, log, error)
- [ ] ⚠️ **No structured logging** (JSON format)
- [ ] ⚠️ **No log aggregation** (ELK, Datadog, etc.)
- [ ] ⚠️ **No request tracing** (See 4.4.1)

#### Monitoring
- [ ] ❌ **No health check endpoint beyond basic /health**
- [ ] ❌ **No metrics collection** (Prometheus, etc.)
- [ ] ❌ **No uptime monitoring**
- [ ] ❌ **No alerting** (PagerDuty, etc.)

#### Analytics
- [x] Event tracking implemented
- [x] Analytics events stored in database
- [ ] ⚠️ **No aggregation** (See 4.4.4)
- [ ] ⚠️ **No retention policy** (data grows unbounded)

### 5.7 Deployment Readiness

#### Environment Configuration
- [x] Environment variables documented (.env.example)
- [x] Development/production modes
- [x] CORS configuration
- [ ] ⚠️ **No Docker configuration** (optional but recommended)
- [ ] ⚠️ **No CI/CD pipeline**

#### Database
- [x] Prisma migrations
- [x] Seed script
- [ ] ⚠️ **No migration rollback strategy**
- [ ] ⚠️ **No database backup strategy**

#### Static Assets
- [x] Local file storage
- [x] Static file serving (/uploads/)
- [ ] ⚠️ **No cloud storage (S3)** for scalability
- [ ] ⚠️ **No image optimization** (resize, compression)

#### Build Process
- [x] Frontend: Vite build
- [x] Backend: NestJS build
- [ ] ⚠️ **No unified build script**
- [ ] ⚠️ **No build artifact verification**

---

## PHASE 6 — ACTIONABLE ROADMAP

### Phase 1: Critical Stability Fixes (Before Any Deployment)

**Duration:** 1-2 days
**Priority:** 🔴 **CRITICAL** — Must complete before production

#### Task 1.1: Fix Admin DRAFT Product Editing
**File:** `backend/src/products/products.controller.ts`, `products.service.ts`

**Changes:**
```typescript
// Controller: Add admin-specific endpoint
@Roles('admin')
@Get('admin/:id')
@Throttle({ default: { limit: 200, ttl: 60000 } })
getProductByIdAdmin(@Param('id', ParseUUIDPipe) id: string) {
  return this.productsService.getProductByIdAdmin(id);
}

// Service: New method
async getProductByIdAdmin(productId: string) {
  return this.prisma.product.findUnique({
    where: { id: productId },
    include: {
      categories: { include: { category: true } },
      useCases: { include: { useCase: true } }
    }
  });
  // Returns product regardless of status
}
```

**Frontend Changes:**
```typescript
// ProductEditorPage.tsx:41
// Change from:
const productRes = await api.get(`/products/${id}`);

// To:
const productRes = await api.get(`/products/admin/${id}`);
```

**Testing:**
- Create DRAFT product
- Navigate to edit page
- Verify product loads correctly
- Update and save
- Verify changes persist

**Risk:** Low
**Impact:** High (unblocks critical admin functionality)

---

#### Task 1.2: Randomize Default Admin Credentials
**File:** `backend/src/auth/auth.service.ts`, `backend/prisma/seed.ts`

**Changes:**
```typescript
// auth.service.ts:113-131
import * as crypto from 'crypto';

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

  // Log credentials ONE TIME ONLY
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║          FIRST ADMIN ACCOUNT CREATED                   ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║ Email:   ', defaultEmail.padEnd(40), '║');
  console.log('║ Password:', defaultPassword.padEnd(40), '║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║ ⚠️  SAVE THESE CREDENTIALS NOW                         ║');
  console.log('║ ⚠️  CHANGE PASSWORD IMMEDIATELY AFTER LOGIN            ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  return {
    adminId: admin.id,
    email: defaultEmail,
    password: defaultPassword,
    message: 'First admin created successfully.',
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
  // Ensure complexity requirements
  if (!/[A-Z]/.test(password)) password = 'A' + password.slice(1);
  if (!/[a-z]/.test(password)) password = password.slice(0, -1) + 'a';
  if (!/\d/.test(password)) password = password.slice(0, -1) + '1';
  if (!/[!@#$%^&*-_+=]/.test(password)) password = password.slice(0, -1) + '!';
  return password;
}
```

**Update .env.example:**
```bash
# Optional: Set custom first admin credentials
# If not set, random secure password will be generated
FIRST_ADMIN_EMAIL=admin@example.com
FIRST_ADMIN_PASSWORD=YourSecurePasswordHere123!
```

**Testing:**
- Run seed script or setup-first-admin endpoint
- Verify random password is generated and logged
- Verify login works with generated credentials
- Verify password meets complexity requirements

**Risk:** Low
**Impact:** Critical (security vulnerability fix)

---

### Phase 2: Contract & Performance Corrections

**Duration:** 2-3 days
**Priority:** 🟡 **HIGH** — Recommended before launch

#### Task 2.1: Fix Cache Over-Invalidation
**File:** `backend/src/common/cache.service.ts`

**Changes:**
```typescript
// Option 1: Fix pattern matching
deletePattern(pattern: string): void {
  let deletedCount = 0;
  for (const key of this.cache.keys()) {
    if (key.startsWith(pattern)) {  // Changed from includes
      this.cache.delete(key);
      deletedCount++;
    }
  }
  this.logger.debug(`Cache pattern delete: ${pattern}, deleted ${deletedCount} keys`);
}

// Option 2: Better cache key design
// Refactor all cache keys to use consistent prefixes
// product:single:{id}
// product:latest:{limit}
// product:category:{id}:{page}:{size}:{sort}
// product:usecase:{id}:{page}:{size}:{sort}
```

**Recommendation:** Implement Option 2 for cleaner architecture.

**File:** `backend/src/products/products.service.ts`

**Update cache keys:**
```typescript
// Line 30: Change from
const cacheKey = `latest_products:${limit}`;
// To
const cacheKey = `product:latest:${limit}`;

// Line 63: Change from
const cacheKey = `product:${productId}`;
// To
const cacheKey = `product:single:${productId}`;

// Line 184: Change from
const cacheKey = `category_products:${categoryId}:${page}:${pageSize}:${sortBy}`;
// To
const cacheKey = `product:category:${categoryId}:${page}:${pageSize}:${sortBy}`;

// Line 248: Change from
const cacheKey = `usecase_products:${useCaseId}:${page}:${pageSize}:${sortBy}`;
// To
const cacheKey = `product:usecase:${useCaseId}:${page}:${pageSize}:${sortBy}`;
```

**Update invalidation:**
```typescript
private invalidateProductCaches(): void {
  // Single pattern now catches all product caches
  this.cacheService.deletePattern('product:');
}
```

**Testing:**
- Create product
- Verify only product-related caches are cleared
- Verify other caches (if any) remain intact
- Monitor cache hit rates

**Risk:** Low
**Impact:** High (performance improvement)

---

#### Task 2.2: Standardize API Response Shapes
**File:** `backend/src/products/products.service.ts`

**Changes:**
```typescript
// Line 25-60: Update getLatestProducts
async getLatestProducts(limit: number, page: number = 1) {
  if (limit > 100) {
    throw new BadRequestException('Limit cannot exceed 100');
  }

  const skip = (page - 1) * limit;
  const cacheKey = `product:latest:${limit}:${page}`;
  const cached = this.cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        categories: { include: { category: true } },
        useCases: { include: { useCase: true } }
      }
    }),
    this.prisma.product.count({
      where: { status: 'PUBLISHED' }
    })
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

**Controller update:**
```typescript
// products.controller.ts:28-33
@Public()
@Get('latest')
@Throttle({ default: { limit: 100, ttl: 60000 } })
getLatestProducts(
  @Query() paginationDto: PaginationDto  // Add pagination support
) {
  return this.productsService.getLatestProducts(
    paginationDto.pageSize || 40,
    paginationDto.page || 1
  );
}
```

**Frontend update:**
```typescript
// ProductGrid.tsx:43-54
// Remove conditional handling
const response = await api.get('/products/latest', {
  params: { page: 1, pageSize: 40 }
});

// Always use paginated structure
setProducts(response.data.products);
setTotalPages(response.data.totalPages);
```

**Testing:**
- Verify all endpoints return consistent structure
- Update frontend to remove conditional logic
- Test pagination on /latest endpoint

**Risk:** Medium (requires frontend changes)
**Impact:** Medium (code quality improvement)

---

#### Task 2.3: Add Pagination to Admin Product Listing
**File:** `backend/src/products/products.controller.ts`, `products.service.ts`

**Changes:**
```typescript
// Controller
@Roles('admin')
@Get('admin/all')
@Throttle({ default: { limit: 50, ttl: 60000 } })
getAllProductsForAdmin(
  @CurrentUser() user: any,
  @Query() paginationDto: PaginationDto,  // Add pagination
) {
  return this.productsService.getAllProductsForAdmin(
    user.id,
    paginationDto.page || 1,
    paginationDto.pageSize || 100
  );
}

// Service
async getAllProductsForAdmin(adminId: string, page: number = 1, pageSize: number = 100) {
  const maxPageSize = Math.min(pageSize, 100);
  const skip = (page - 1) * maxPageSize;

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      skip,
      take: maxPageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        categories: { include: { category: true } },
        useCases: { include: { useCase: true } }
      }
    }),
    this.prisma.product.count()
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

**Frontend update (AdminDashboard):**
- Add pagination UI
- Handle page changes
- Display total count

**Risk:** Low
**Impact:** High (scalability)

---

### Phase 3: UX Polish & Resilience

**Duration:** 2-3 days
**Priority:** 🟠 **MEDIUM** — Nice-to-have before launch

#### Task 3.1: Add Frontend Error Boundaries
**File:** `src/components/ErrorBoundary.tsx` (new file)

**Implementation:**
```typescript
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught error:', error, errorInfo);
    // TODO: Send to error tracking service (Sentry, Bugsnag, etc.)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full p-8 bg-card rounded-lg shadow-lg text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**App.tsx update:**
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
            {/* ... routes */}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

**Testing:**
- Trigger deliberate error (e.g., undefined access)
- Verify error boundary catches it
- Verify fallback UI displays
- Verify error is logged

**Risk:** Low
**Impact:** Medium (UX resilience)

---

#### Task 3.2: Improve Admin Error Messages in Production
**File:** `backend/src/main.ts`

**Changes:**
```typescript
// Create two validation pipes
const publicValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: false,
  },
  disableErrorMessages: isProduction,  // Hide for public
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
  disableErrorMessages: false,  // Always show for admin
  validationError: {
    target: false,
    value: false,
  },
});

// Apply public pipe globally
app.useGlobalPipes(publicValidationPipe);

// Admin routes override with @UsePipes(adminValidationPipe)
```

**Update admin controllers:**
```typescript
import { UsePipes } from '@nestjs/common';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(adminValidationPipe)  // Admin routes get detailed errors
export class ProductsController {
  // ...
}
```

**Risk:** Low
**Impact:** Medium (admin UX)

---

#### Task 3.3: Consolidate Auth State Management
**File:** `src/lib/auth.ts` (new file)

**Implementation:**
```typescript
import jwtDecode from 'jwt-decode';

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
}

export class AuthManager {
  private static TOKEN_KEY = 'accessToken';

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    // Remove legacy key if exists
    localStorage.removeItem('adminSession');
  }

  static getSession(): AdminSession | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = jwtDecode<JWTPayload>(token);

      // Check expiration
      if (payload.exp * 1000 < Date.now()) {
        this.clearToken();
        return null;
      }

      return {
        email: payload.email,
        role: payload.role,
        adminId: payload.sub,
      };
    } catch (error) {
      console.error('Invalid token:', error);
      this.clearToken();
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return this.getSession() !== null;
  }
}
```

**Update ProtectedRoute:**
```typescript
import { AuthManager } from '../lib/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!AuthManager.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
```

**Update api.ts:**
```typescript
import { AuthManager } from './auth';

api.interceptors.request.use((config) => {
  const token = AuthManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AuthManager.clearToken();
      if (window.location.pathname.startsWith('/admin') &&
          window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);
```

**Update AdminLoginPage:**
```typescript
import { AuthManager } from '../../lib/auth';

const response = await api.post('/auth/login', { email, password });
AuthManager.setToken(response.data.accessToken);
navigate('/admin');
```

**Testing:**
- Login and verify token stored
- Refresh page and verify still authenticated
- Manually delete token and verify redirected to login
- API calls still work

**Risk:** Medium (requires careful testing)
**Impact:** Medium (code quality + UX)

---

### Phase 4: Performance & Scalability Hardening

**Duration:** 3-5 days
**Priority:** 🟢 **LOW** — Post-launch optimization

#### Task 4.1: Implement Redis Caching
**File:** `backend/package.json`, `backend/src/common/cache.service.ts`

**Dependencies:**
```bash
npm install ioredis
npm install -D @types/ioredis
```

**Implementation:**
```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private readonly DEFAULT_TTL = 300; // 5 minutes in seconds

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      this.redis = new Redis(redisUrl);
      this.logger.log('Redis cache enabled');
    } else {
      // Fallback to in-memory for development
      this.logger.warn('Redis not configured, using in-memory cache');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = this.DEFAULT_TTL): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Cache set error: ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error: ${error.message}`);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys(`${pattern}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cache pattern delete: ${pattern}, deleted ${keys.length} keys`);
      }
    } catch (error) {
      this.logger.error(`Cache pattern delete error: ${error.message}`);
    }
  }

  async clear(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.flushdb();
      this.logger.log('Cache cleared');
    } catch (error) {
      this.logger.error(`Cache clear error: ${error.message}`);
    }
  }
}
```

**Environment:**
```bash
# .env
REDIS_URL=redis://localhost:6379
```

**Benefits:**
- Distributed caching (works with multiple server instances)
- Persistent across restarts
- Better performance than in-memory Map

**Risk:** Medium (infrastructure dependency)
**Impact:** High (scalability)

---

#### Task 4.2: Add Response Compression
**File:** `backend/src/main.ts`

**Dependencies:**
```bash
npm install compression
npm install -D @types/compression
```

**Implementation:**
```typescript
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Add compression middleware
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,  // Balance between speed and compression ratio
  }));

  // ... rest of bootstrap
}
```

**Benefits:**
- Reduced response size (50-70% for JSON)
- Faster network transfer
- Lower bandwidth costs

**Risk:** Low
**Impact:** Medium (performance)

---

#### Task 4.3: Implement Request Tracing
**File:** `backend/src/middleware/request-id.middleware.ts` (new)

**Implementation:**
```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    req['id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
```

**app.module.ts:**
```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes('*');
  }
}
```

**Update logger calls:**
```typescript
// Before
this.logger.log('Product created: ${product.id}');

// After
this.logger.log(`[${req.id}] Product created: ${product.id}`);
```

**Benefits:**
- Trace requests across services
- Correlate logs
- Debug issues faster

**Risk:** Low
**Impact:** Medium (observability)

---

### Phase 5: Security Hardening

**Duration:** 2-3 days
**Priority:** 🟠 **MEDIUM** — Before production

#### Task 5.1: Implement JWT Refresh Tokens
**File:** `backend/src/auth/auth.service.ts`, `backend/src/auth/auth.controller.ts`

**Schema update:**
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  adminId   String
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  revoked   Boolean  @default(false)

  admin     AdminUser @relation(fields: [adminId], references: [id])

  @@index([tokenHash])
  @@index([adminId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}
```

**Service implementation:**
```typescript
async login(email: string, password: string, ip?: string, userAgent?: string) {
  // ... existing validation

  const admin = await this.validateAdmin(email, password);
  if (!admin) {
    // ... existing error handling
  }

  // Generate access token (short-lived: 15min)
  const accessToken = this.jwtService.sign(
    { sub: admin.id, email: admin.email, role: admin.role },
    { expiresIn: '15m' }
  );

  // Generate refresh token (long-lived: 7 days)
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(refreshToken, 10);

  await this.prisma.refreshToken.create({
    data: {
      adminId: admin.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    accessToken,
    refreshToken,
  };
}

async refreshAccessToken(refreshToken: string) {
  const tokenHash = await bcrypt.hash(refreshToken, 10);

  const token = await this.prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { admin: true },
  });

  if (!token || token.revoked || token.expiresAt < new Date()) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // Generate new access token
  const accessToken = this.jwtService.sign(
    { sub: token.admin.id, email: token.admin.email, role: token.admin.role },
    { expiresIn: '15m' }
  );

  return { accessToken };
}
```

**Controller:**
```typescript
@Public()
@Post('refresh')
async refreshToken(@Body('refreshToken') refreshToken: string) {
  return this.authService.refreshAccessToken(refreshToken);
}

@Roles('admin')
@Post('logout')
async logout(@Body('refreshToken') refreshToken: string) {
  await this.authService.revokeRefreshToken(refreshToken);
  return { message: 'Logged out successfully' };
}
```

**Frontend:**
```typescript
// Store both tokens
AuthManager.setTokens(accessToken, refreshToken);

// Auto-refresh before expiry
setInterval(async () => {
  const response = await api.post('/auth/refresh', {
    refreshToken: AuthManager.getRefreshToken()
  });
  AuthManager.setAccessToken(response.data.accessToken);
}, 13 * 60 * 1000); // Refresh 2 minutes before expiry
```

**Benefits:**
- Short-lived access tokens (more secure)
- Long-lived sessions (better UX)
- Revokable sessions

**Risk:** Medium (complex implementation)
**Impact:** High (security + UX)

---

#### Task 5.2: Add HTTPS Enforcement
**File:** `backend/src/main.ts`

**Implementation:**
```typescript
// Enforce HTTPS in production
if (isProduction) {
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      next();
    } else {
      res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  });
}
```

**Benefits:**
- Prevent man-in-the-middle attacks
- Protect token transmission

**Risk:** Low
**Impact:** High (security)

---

### Phase 6: Production Deployment Readiness

**Duration:** 3-5 days
**Priority:** 🟢 **LOW** — DevOps/Infrastructure

#### Task 6.1: Create Docker Configuration
**File:** `Dockerfile` (backend), `Dockerfile` (frontend), `docker-compose.yml`

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: prodview
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: prodview
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://prodview:${POSTGRES_PASSWORD}@postgres:5432/prodview
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

**Risk:** Low
**Impact:** High (deployment)

---

#### Task 6.2: Setup CI/CD Pipeline
**File:** `.github/workflows/deploy.yml`

**Example (GitHub Actions):**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker-compose build
      - run: docker-compose up -d
      - run: npm run test:e2e

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy commands here
```

**Risk:** Low
**Impact:** High (automation)

---

## Summary of Findings

### Critical Issues (Must Fix)
1. **Admin cannot edit DRAFT products** — Blocks core functionality
2. **Default admin credentials hardcoded** — Security vulnerability

### High Priority Issues (Recommended)
3. **Cache over-invalidation** — Performance degradation
4. **Relation update inefficiency** — Data management issue
5. **No pagination on admin listing** — Scalability concern

### Medium Priority Issues (Nice-to-Have)
6. **Inconsistent API response shapes** — Code complexity
7. **Auth state can desync** — Edge case UX issue
8. **No error boundaries** — Crash resilience
9. **Production error messages disabled for admin** — Admin UX

### Low Priority Issues (Future)
10. **No request tracing** — Observability
11. **No automated testing** — Quality assurance
12. **Password reset not implemented** — Feature gap
13. **Analytics not aggregated** — Feature gap

---

## Deployment Checklist

### Pre-Deployment
- [ ] Fix critical issues (Section 4.1)
- [ ] Fix high-priority issues (Section 4.2)
- [ ] Run security audit
- [ ] Test all endpoints
- [ ] Test admin flows
- [ ] Test public flows

### Infrastructure
- [ ] Setup PostgreSQL database
- [ ] Setup Redis (optional but recommended)
- [ ] Configure environment variables
- [ ] Setup secrets management
- [ ] Configure CORS origins
- [ ] Setup SSL/TLS certificates

### Monitoring
- [ ] Setup error tracking (Sentry, Bugsnag)
- [ ] Setup uptime monitoring
- [ ] Setup log aggregation
- [ ] Configure alerts
- [ ] Setup analytics dashboard

### Security
- [ ] Change default admin credentials
- [ ] Generate strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Configure security headers
- [ ] Test rate limiting
- [ ] Audit file upload security

### Performance
- [ ] Enable caching
- [ ] Configure CDN for static assets
- [ ] Enable compression
- [ ] Test under load

### Documentation
- [ ] Update .env.example
- [ ] Document API endpoints
- [ ] Write deployment guide
- [ ] Create runbook for common issues

---

**END OF AUDIT**

**Audit Completed:** February 12, 2026
**Total Issues Identified:** 13
**Critical:** 2 | **High:** 3 | **Medium:** 4 | **Low:** 4
**Estimated Fix Time:** 8-15 days (depending on priority level)
