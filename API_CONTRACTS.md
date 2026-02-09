# ProdView API Contracts

**Version:** 1.0.0
**Last Updated:** 2026-02-10
**Purpose:** Formal documentation of all API contracts between frontend and backend

---

## Overview

This document defines the **stable, canonical API contracts** for ProdView. These contracts ensure frontend/backend compatibility and prevent drift during future refactoring.

### Core Principles

1. **Image URLs** are always full paths starting with `/` (e.g., `/uploads/uuid.png`)
2. **Property names** use `camelCase` consistently
3. **UUIDs** are validated as v4 format
4. **Relation IDs** use explicit suffixes: `categoryIds`, `useCaseIds` (not `categories`, `useCases`)
5. **Timestamps** follow ISO 8601 format
6. **Status enums** use UPPERCASE (DRAFT, PUBLISHED, ARCHIVED)

---

## 🔐 Authentication

### POST `/api/auth/login`

**Request:**
```typescript
{
  email: string;      // Valid email, max 254 chars
  password: string;   // 8-128 chars, must have uppercase, lowercase, number, special char
}
```

**Response (200 OK):**
```typescript
{
  adminId: string;      // UUID v4
  email: string;
  role: string;         // "admin"
  accessToken: string;  // JWT token
}
```

**Frontend Storage:**
- `localStorage.setItem('accessToken', accessToken)`
- `localStorage.setItem('adminSession', JSON.stringify({ adminId, email, role }))`

**Security:**
- Rate limited: 5 attempts per 15 minutes per email+IP
- Audit logged on success/failure

---

### POST `/api/auth/setup-first-admin`

**Request:** None

**Response (200 OK):**
```typescript
{
  adminId: string;
  email: string;
  password: string;  // Plain text (only returned on creation)
  message: string;
}
```

**Security:**
- Rate limited: 1 attempt per hour
- Only works if no admins exist
- **⚠️ Change default credentials immediately**

---

## 📦 Products

### Product Entity Schema

**Canonical Shape:**
```typescript
interface Product {
  id: string;                 // UUID v4
  name: string;              // 3-200 chars, alphanumeric + allowed punctuation
  description: string;       // 10-2000 chars
  affiliateUrl: string;      // Valid HTTP/HTTPS URL, max 500 chars
  images: string[];          // Array of paths: ["/uploads/uuid.png"]
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;         // ISO 8601
  updatedAt: string;         // ISO 8601
  createdById: string;       // UUID v4
  updatedById: string;       // UUID v4
  categories: ProductCategory[];
  useCases: ProductUseCase[];
}

interface ProductCategory {
  productId: string;
  categoryId: string;
  category: Category;  // Nested object
}

interface ProductUseCase {
  productId: string;
  useCaseId: string;
  useCase: UseCase;    // Nested object
}
```

---

### GET `/api/products/latest?limit=10`

**Query Params:**
- `limit` (optional): Integer, 1-100, default 10

**Response (200 OK):**
```typescript
Product[]  // Array of products with nested relations
```

**Caching:** 3 minutes
**Filters:** Only `status: "PUBLISHED"`

---

### GET `/api/products/:id`

**Path Params:**
- `id`: UUID v4 (validated by ParseUUIDPipe)

**Response (200 OK):**
```typescript
Product | null
```

**Caching:** 5 minutes
**Filters:** Only `status: "PUBLISHED"`

---

### GET `/api/products/search?keyword=...&page=1&pageSize=20`

**Query Params:**
- `keyword` (optional): String, 1-100 chars, alphanumeric + dash/underscore
- `page` (optional): Integer, 1-1000, default 1
- `pageSize` (optional): Integer, 1-100, default 20

**Response (200 OK):**
```typescript
{
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

**Rate Limit:** 30 requests per minute per IP

---

### POST `/api/products` (Admin Only)

**Request:**
```typescript
{
  name: string;              // Required, 3-200 chars
  description: string;       // Required, 10-2000 chars
  affiliateUrl: string;      // Required, valid HTTP/HTTPS URL
  categoryIds: string[];     // Required, array of UUID v4, max 10
  useCaseIds: string[];      // Required, array of UUID v4, max 10
  images: string[];          // Required, array of paths, max 20
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";  // Optional, default DRAFT
}
```

**Response (201 Created):**
```typescript
Product  // Full product with nested relations
```

**Validation:**
- All fields validated via `CreateProductDto`
- `forbidNonWhitelisted: true` (extra fields rejected)
- Relations checked for existence in DB

---

### PUT `/api/products/:id` (Admin Only)

**Request:**
```typescript
{
  name?: string;
  description?: string;
  affiliateUrl?: string;
  categoryIds?: string[];  // ⚠️ Full replacement, not incremental
  useCaseIds?: string[];   // ⚠️ Full replacement, not incremental
  images?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}
```

**Response (200 OK):**
```typescript
Product  // Updated product with nested relations
```

**⚠️ Important:**
- Providing `categoryIds` or `useCaseIds` **deletes all existing relations** and creates new ones
- Frontend must always send the complete desired set

---

### DELETE `/api/products/:id` (Admin Only)

**Response (200 OK):**
```typescript
void
```

**Cascade Behavior:**
- Deletes product
- Auto-deletes all `product_categories` entries (Prisma cascade)
- Auto-deletes all `product_use_cases` entries (Prisma cascade)

---

## 📁 Categories

### Category Entity Schema

**Canonical Shape:**
```typescript
interface Category {
  id: string;                     // UUID v4
  name: string;                   // 2-100 chars
  parentCategoryId: string | null; // UUID v4 or null
  createdAt: string;              // ISO 8601
  parentCategory?: Category | null;
  childCategories?: Category[];
}
```

---

### GET `/api/categories`

**Response (200 OK):**
```typescript
Category[]  // Includes parentCategory and childCategories
```

**Caching:** 10 minutes

---

### POST `/api/categories` (Admin Only)

**Request:**
```typescript
{
  name: string;                   // Required, 2-100 chars
  parentCategoryId?: string;      // Optional, UUID v4
}
```

**Response (201 Created):**
```typescript
Category
```

**Validation:**
- Circular reference prevention
- Parent existence check

---

### PUT `/api/categories/:id` (Admin Only)

**Request:**
```typescript
{
  name?: string;
  parentCategoryId?: string | null;
}
```

**Response (200 OK):**
```typescript
Category
```

**Validation:**
- Cannot be its own parent
- Circular reference prevention (checks full parent chain)

---

### DELETE `/api/categories/:id` (Admin Only)

**Response (200 OK):**
```typescript
void
```

**Protection:**
- ❌ Fails if category has child categories (409 Conflict)
- ❌ Fails if category is used by products (409 Conflict)

---

## 🏷️ Use Cases

### UseCase Entity Schema

**Canonical Shape:**
```typescript
interface UseCase {
  id: string;        // UUID v4
  name: string;      // 2-100 chars
  createdAt: string; // ISO 8601
}
```

---

### GET `/api/use-cases`

**Response (200 OK):**
```typescript
UseCase[]
```

**Caching:** 10 minutes

---

### POST `/api/use-cases` (Admin Only)

**Request:**
```typescript
{
  name: string;  // Required, 2-100 chars
}
```

**Response (201 Created):**
```typescript
UseCase
```

---

### PUT `/api/use-cases/:id` (Admin Only)

**Request:**
```typescript
{
  name?: string;
}
```

**Response (200 OK):**
```typescript
UseCase
```

---

### DELETE `/api/use-cases/:id` (Admin Only)

**Response (200 OK):**
```typescript
void
```

**Protection:**
- ❌ Fails if use case is used by products (409 Conflict)

---

## 🖼️ Image Upload

### POST `/api/upload/image` (Admin Only)

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (single file)

**Validation:**
- Mime types: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- Max size: 10MB
- Filename: Auto-generated UUID + extension

**Response (200 OK):**
```typescript
{
  filename: string;     // "uuid.png"
  path: string;         // "/uploads/uuid.png"
  mimetype: string;     // "image/png"
  size: number;         // Bytes
}
```

**Frontend Usage:**
- Store `response.data.path` in product `images` array
- Never store just filename—always the full path

---

## 🔒 Security

### Authentication Header

All admin routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Role-Based Access

- **Public Routes:** No auth required (`@Public()` decorator)
- **Admin Routes:** JWT + `role: "admin"` required (`@Roles('admin')` decorator)

### Guards Order (Global)

1. `JwtAuthGuard` (validates token, populates `request.user`)
2. `RolesGuard` (checks role if `@Roles()` decorator present)

### Validation Pipeline

1. **Route-level:** `ParseUUIDPipe` for path params
2. **DTO-level:** `class-validator` decorators
3. **Service-level:** Custom `ValidationService` for XSS/injection
4. **Prisma-level:** Type safety

---

## 📊 Error Responses

### Standard Error Format

```typescript
{
  statusCode: number;
  message: string | string[];  // Array for validation errors
  error: string;               // "Bad Request", "Unauthorized", etc.
}
```

### Common Status Codes

- `400 Bad Request`: Validation failure, malformed payload
- `401 Unauthorized`: Missing/invalid JWT, failed login
- `403 Forbidden`: Valid JWT but insufficient role
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Cannot delete due to dependencies
- `413 Payload Too Large`: File upload exceeds 10MB
- `429 Too Many Requests`: Rate limit exceeded

---

## 🔄 Frontend Contract Enforcement

### TypeScript Interfaces

Create in `src/types/api.ts`:

```typescript
// products/dto/create-product.dto.ts → Frontend mirror
export interface CreateProductPayload {
  name: string;
  description: string;
  affiliateUrl: string;
  categoryIds: string[];  // ✅ Correct property name
  useCaseIds: string[];   // ✅ Correct property name
  images: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  affiliateUrl?: string;
  categoryIds?: string[];
  useCaseIds?: string[];
  images?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export interface Product {
  id: string;
  name: string;
  description: string;
  affiliateUrl: string;
  images: string[];  // Always full paths: ["/uploads/uuid.png"]
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  categories: {
    categoryId: string;
    category: { id: string; name: string };
  }[];
  useCases: {
    useCaseId: string;
    useCase: { id: string; name: string };
  }[];
}
```

### Image URL Construction

```typescript
import { BACKEND_BASE_URL } from "@/lib/api";

// ✅ Correct
const imageUrl = `${BACKEND_BASE_URL}${product.images[0]}`;
// Result: "http://localhost:3000/uploads/uuid.png"

// ❌ Wrong
const imageUrl = `${API_BASE_URL}${product.images[0]}`;
// Result: "http://localhost:3000/api/uploads/uuid.png" (404)
```

---

## 🧪 Breaking Change Protocol

If any contract must change:

1. **Version the endpoint** (e.g., `/api/v2/products`)
2. **Maintain v1 for 3 months**
3. **Update this document**
4. **Add deprecation warnings**
5. **Coordinate frontend/backend deployments**

---

## 📝 Change Log

### v1.0.0 (2026-02-10)
- ✅ Aligned DTO property names: `categoryIds`, `useCaseIds` (not `categories`, `useCases`)
- ✅ Documented image URL construction requirements
- ✅ Added CRUD operations for Categories and Use Cases
- ✅ Formalized validation rules and error responses
- ✅ Documented security guards and role enforcement

---

**END OF API CONTRACTS**
