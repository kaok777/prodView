# Contributing to ProdView

Thank you for contributing to ProdView! This document outlines coding standards and conventions to maintain consistency across the codebase.

## Table of Contents

- [Naming Conventions](#naming-conventions)
- [Error Handling](#error-handling)
- [Code Style](#code-style)
- [Git Workflow](#git-workflow)

## Naming Conventions

### TypeScript/JavaScript Code (Frontend & Backend)

**Variables, Functions, and Parameters:** Use **camelCase**
```typescript
// ✅ Good
const productId = '123';
const categoryIds = ['cat1', 'cat2'];
function getLatestProducts(page: number, pageSize: number) { }

// ❌ Bad
const product_id = '123';
const CategoryIds = ['cat1', 'cat2'];
function get_latest_products(page, page_size) { }
```

**Classes, Interfaces, Types, and Enums:** Use **PascalCase**
```typescript
// ✅ Good
class ProductService { }
interface CreateProductDto { }
type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
enum ImageSource { MANUAL_UPLOAD, OG_FETCH }

// ❌ Bad
class productService { }
interface createProductDto { }
type product_status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
```

**Constants:** Use **UPPER_SNAKE_CASE**
```typescript
// ✅ Good
const MAX_FILE_SIZE = 10485760;
const DEFAULT_PAGE_SIZE = 40;

// ❌ Bad
const maxFileSize = 10485760;
const defaultPageSize = 40;
```

**React Components:** Use **PascalCase** for component names and files
```typescript
// ✅ Good
// File: ProductCard.tsx
export function ProductCard({ product }: { product: Product }) { }

// ❌ Bad
// File: product-card.tsx
export function product_card({ product }) { }
```

**Files and Directories:**
- **Components:** PascalCase (e.g., `ProductCard.tsx`, `AdminDashboard.tsx`)
- **Services/Utilities:** kebab-case (e.g., `auth.service.ts`, `cache.service.ts`)
- **Hooks:** camelCase with `use` prefix (e.g., `useAuth.ts`, `useProducts.ts`)
- **Types/Interfaces:** kebab-case or match related file (e.g., `product.types.ts`)

### Database (Prisma Schema)

**Model Names:** Use **PascalCase**
```prisma
// ✅ Good
model Product { }
model AdminUser { }
model ProductCategory { }

// ❌ Bad
model product { }
model admin_user { }
```

**Field Names:** Use **camelCase** (Prisma will map to snake_case in database)
```prisma
// ✅ Good
model Product {
  id          String   @id @default(uuid())
  name        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
}

// ❌ Bad (don't use snake_case in schema)
model Product {
  id           String   @id @default(uuid())
  created_at   DateTime @default(now())
  created_by_id String
}
```

**Table Names:** Use **snake_case** with `@@map` directive
```prisma
// ✅ Good
model Product {
  // fields...
  @@map("products")
}

model AdminUser {
  // fields...
  @@map("admin_users")
}
```

**Why this convention?**
- Prisma automatically maps `createdAt` → `created_at` in the database
- TypeScript/JavaScript code uses camelCase everywhere (consistent with language conventions)
- Database uses snake_case (consistent with PostgreSQL conventions)
- No manual mapping required in most cases

### API Endpoints

**Route Paths:** Use **kebab-case** for multi-word resources
```typescript
// ✅ Good
@Get('api/products/latest')
@Get('api/use-cases')
@Post('api/password-reset')

// ❌ Bad
@Get('api/products/Latest')
@Get('api/useCases')
@Post('api/password_reset')
```

**Query Parameters:** Use **camelCase**
```typescript
// ✅ Good
GET /api/products?pageSize=20&sortBy=views

// ❌ Bad
GET /api/products?page_size=20&sort_by=views
```

### Environment Variables

**Format:** Use **UPPER_SNAKE_CASE**
```bash
# ✅ Good
DATABASE_URL=postgresql://...
JWT_SECRET=...
MAX_FILE_SIZE=10485760

# ❌ Bad
databaseUrl=postgresql://...
jwtSecret=...
maxFileSize=10485760
```

## Validation

### Duplicate Validation (Frontend & Backend)

ProdView uses **dual validation** for security and UX:
- **Frontend**: Zod schemas (`src/lib/validationSchemas.ts`) - immediate user feedback
- **Backend**: class-validator DTOs (`backend/src/*/dto/*.dto.ts`) - security enforcement

**⚠️ Important**: Validation rules must be kept in sync between frontend and backend.

**See:** `VALIDATION_RULES.md` for complete validation rules reference and known inconsistencies.

**When changing validation rules:**
1. Update backend DTO first (authoritative source)
2. Update frontend Zod schema to match
3. Update VALIDATION_RULES.md
4. Test both frontend form and direct API calls

## Error Handling

### Exception Handling Standard

**1. Always throw exceptions for errors (never return null for errors)**
```typescript
// ✅ Good
async getProductById(id: string): Promise<Product> {
  const product = await this.prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundException(`Product with ID ${id} not found`);
  }
  return product;
}

// ❌ Bad
async getProductById(id: string): Promise<Product | null> {
  const product = await this.prisma.product.findUnique({ where: { id } });
  return product; // Returns null on error - calling code must check
}
```

**2. Use specific NestJS exception classes**
```typescript
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

// ✅ Good - Specific exception types
if (!user) throw new NotFoundException('User not found');
if (password !== hashedPassword) throw new UnauthorizedException('Invalid credentials');
if (user.role !== 'admin') throw new ForbiddenException('Admin access required');
if (existingEmail) throw new ConflictException('Email already in use');

// ❌ Bad - Generic or inconsistent errors
if (!user) return null;
if (password !== hashedPassword) throw new Error('Invalid credentials');
```

**3. Wrap async operations in try/catch blocks**
```typescript
// ✅ Good
async createProduct(dto: CreateProductDto): Promise<Product> {
  try {
    return await this.prisma.product.create({ data: dto });
  } catch (error) {
    if (error.code === 'P2002') {
      throw new ConflictException('Product with this name already exists');
    }
    throw new InternalServerErrorException('Failed to create product');
  }
}

// ❌ Bad - Unhandled promise rejection
async createProduct(dto: CreateProductDto): Promise<Product> {
  return await this.prisma.product.create({ data: dto }); // Can throw uncaught errors
}
```

**Global Error Handlers:**

Both backend and frontend have global error handlers configured to catch unhandled promise rejections:

- **Backend** (`backend/src/main.ts`): `process.on('unhandledRejection')` and `process.on('uncaughtException')`
- **Frontend** (`src/main.tsx`): `window.addEventListener('unhandledrejection')` and `window.addEventListener('error')`

These prevent crashes but should NOT be relied upon - always handle errors in try/catch blocks.

**4. Frontend error handling**
```typescript
// ✅ Good - Handle errors in API calls
try {
  const product = await api.getProduct(id);
  setProduct(product);
} catch (error) {
  if (error.response?.status === 404) {
    toast.error('Product not found');
  } else {
    toast.error('Failed to load product');
  }
}

// ❌ Bad - No error handling
const product = await api.getProduct(id);
setProduct(product);
```

## Code Style

### Linting and Formatting

**ESLint** is configured for both frontend and backend to enforce code quality standards.

**Frontend (root directory):**
```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors
npm run type-check  # TypeScript type checking
npm run format      # Format code with Prettier
```

**Backend (backend directory):**
```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors
npm run format      # Format code with Prettier
```

**Key ESLint Rules:**
- `@typescript-eslint/no-unused-vars` - Catches unused imports and variables (auto-fixable)
- `@typescript-eslint/no-explicit-any` - Warns when using `any` type
- React Hooks rules (frontend only)

**Best Practices:**
- Run `npm run lint:fix` before committing to auto-remove unused imports
- Fix all linting errors before creating pull requests
- Use `_` prefix for intentionally unused parameters (e.g., `_req`, `_error`)

### Logging and Console Statements

**Fixed: CQ4.2.4 - Console.log statements should be avoided in production code.**

**Rules:**
- **NEVER** use `console.log()` in production code
- **AVOID** `console.warn()` and `console.error()` except in global error handlers
- **DO** use conditional logging for development only
- **DO** use proper logging libraries for production

**Development-only logging:**
```typescript
// ✅ Good - Conditional development logging
if (process.env.NODE_ENV === 'development') {
  console.log('[Debug] Product created:', product.id);
}

// ❌ Bad - Always logs (production noise)
console.log('[Debug] Product created:', product.id);
```

**Production logging (backend):**
```typescript
// Currently: console.error for global error handlers (acceptable)
// Future: Migrate to winston/pino when implementing centralized logging

// ✅ Acceptable for now - Global error handlers only
process.on('uncaughtException', (error: Error) => {
  console.error('🔴 Uncaught Exception:', error);
  process.exit(1);
});

// ❌ Bad - Logging in service methods
async createProduct(dto: CreateProductDto) {
  console.log('Creating product:', dto.name);  // Remove this
  return await this.prisma.product.create({ data: dto });
}
```

**Production logging (frontend):**
```typescript
// ✅ Good - Error tracking service (when implemented)
if (process.env.NODE_ENV === 'production') {
  Sentry.captureException(error);
}

// ❌ Bad - Console logging in production
catch (error) {
  console.error('Failed to load products:', error);
}
```

**See**: [LOGGING_STRATEGY.md](./LOGGING_STRATEGY.md) for complete centralized logging documentation (CQ4.3.2).

### Comments and Documentation

**Use JSDoc/TSDoc for all exported functions, classes, and interfaces**

**JSDoc Standard (Fixed: CQ4.1.3):**
- ALL exported functions, classes, and interfaces MUST have JSDoc comments
- Include description, @param tags, @returns tag, and @throws if applicable
- Use proper formatting with /** */ syntax
- Keep descriptions concise but informative

```typescript
// ✅ Good - Complete JSDoc
/**
 * Retrieves the latest published products with pagination.
 *
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of products per page (default: 40)
 * @returns Paginated list of products with metadata
 * @throws {NotFoundException} If page number exceeds total pages
 */
export async function getLatestProducts(
  page: number = 1,
  pageSize: number = 40
): Promise<PaginatedProducts> {
  // Implementation...
}

// ❌ Bad - No documentation
export async function getLatestProducts(page, pageSize) {
  // Implementation...
}

// ⚠️ Acceptable for internal/private functions
function calculateOffset(page: number, size: number): number {
  return (page - 1) * size;
}
```

**Class and Interface Documentation:**
```typescript
// ✅ Good
/**
 * Service for managing product catalog operations.
 *
 * Handles product CRUD operations, caching, and OG tag fetching.
 * All operations are authenticated and logged to audit trail.
 */
export class ProductsService {
  // ...
}

/**
 * Data transfer object for creating a new product.
 *
 * Used by POST /products endpoint.
 */
export interface CreateProductDto {
  name: string;
  description: string;
  // ...
}
```

**Inline comments:** Use `//` for brief explanations, `/* */` for longer explanations
```typescript
// ✅ Good - Inline comment explaining WHY
// Calculate expiration time (24 hours from now)
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

// ✅ Good - Multi-line comment for context
/*
 * Fixed: P3.3.1 - Surgical cache invalidation
 * Only invalidate affected caches instead of clearing all caches
 * to prevent cache stampede during bulk updates.
 */
await this.cacheService.delete(`product:${id}`);

// ❌ Bad - Stating the obvious (code is self-explanatory)
// Set i to 0
let i = 0;
```

**When to comment:**
- **DO**: Explain WHY, not WHAT (code shows what)
- **DO**: Document business logic and rules
- **DO**: Explain non-obvious optimizations
- **DO**: Reference audit fixes or GitHub issues
- **DON'T**: Restate the code in English
- **DON'T**: Leave commented-out code (use git history instead)

### TypeScript

**Avoid `any` types - use proper types or `unknown`**
```typescript
// ✅ Good
interface ProductMetadata {
  source: string;
  vendor: string;
}

function processMetadata(metadata: ProductMetadata) { }

// ❌ Bad
function processMetadata(metadata: any) { }
```

**Metadata Types** (Backend):

For JSON metadata fields in the database, use typed interfaces from `backend/src/common/types/metadata.types.ts`:

```typescript
import { SearchMetadata, isSearchMetadata, safelyTypedMetadata } from '@/common/types/metadata.types';

// ✅ Good - Type-safe metadata handling
const metadata = safelyTypedMetadata<SearchMetadata>(event.metadata, isSearchMetadata);
if (metadata) {
  console.log(metadata.searchTerm); // TypeScript knows this exists
}

// ❌ Bad - Using 'any'
const metadata = event.metadata as any;
console.log(metadata.searchTerm); // No type safety
```

**Define interfaces for all data structures**
```typescript
// ✅ Good
interface CreateProductDto {
  name: string;
  description: string;
  affiliateUrl: string;
  categoryIds: string[];
  useCaseIds: string[];
}

// ❌ Bad
function createProduct(data: any) { }
```

## Git Workflow

### Branch Naming

**Format:** `type/description`

**Types:**
- `feature/` - New features (e.g., `feature/og-preview`)
- `fix/` - Bug fixes (e.g., `fix/login-redirect`)
- `refactor/` - Code refactoring (e.g., `refactor/cache-service`)
- `docs/` - Documentation only (e.g., `docs/api-documentation`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

**Examples:**
```bash
# ✅ Good
git checkout -b feature/add-product-filtering
git checkout -b fix/authentication-bug
git checkout -b refactor/error-handling

# ❌ Bad
git checkout -b new-feature
git checkout -b fix_auth
git checkout -b FEATURE-123
```

### Commit Messages

**Format:** `<type>: <description>`

```bash
# ✅ Good
git commit -m "feat: add Swagger API documentation"
git commit -m "fix: resolve cache invalidation issue"
git commit -m "refactor: standardize error handling in services"
git commit -m "docs: update CONTRIBUTING.md with naming conventions"

# ❌ Bad
git commit -m "updated files"
git commit -m "fix bug"
git commit -m "WIP"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring (no behavior change)
- `docs:` - Documentation changes
- `style:` - Code style/formatting (no logic change)
- `test:` - Adding or updating tests
- `chore:` - Maintenance (dependencies, config, etc.)

---

## Quick Reference Card

| **Context** | **Convention** | **Example** |
|-------------|---------------|-------------|
| Variables, functions | camelCase | `productId`, `getProducts()` |
| Classes, interfaces | PascalCase | `ProductService`, `CreateProductDto` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| React components | PascalCase | `ProductCard.tsx` |
| Component files | PascalCase | `AdminDashboard.tsx` |
| Service files | kebab-case | `auth.service.ts` |
| Prisma models | PascalCase | `Product`, `AdminUser` |
| Prisma fields | camelCase | `createdAt`, `updatedAt` |
| Database tables | snake_case | `products`, `admin_users` |
| API routes | kebab-case | `/api/use-cases` |
| Query params | camelCase | `?pageSize=20` |
| Environment vars | UPPER_SNAKE_CASE | `DATABASE_URL` |
| Git branches | type/kebab-case | `feature/add-search` |
| Commits | type: description | `feat: add search` |

---

**Questions?** Open an issue or ask in team discussions.
