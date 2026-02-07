# Migration Guide: Convex to NestJS Backend

This document explains how to migrate the ProdView frontend from Convex to the new NestJS backend.

## Overview

The NestJS backend provides REST API endpoints that replace all Convex queries, mutations, and actions. The frontend needs to be updated to call these REST endpoints instead of using Convex React hooks.

## Key Changes

### 1. Remove Convex Dependencies

**Remove from `package.json`:**
- `convex`
- `@convex-dev/auth`

**Add HTTP client:**
```json
{
  "dependencies": {
    "axios": "^1.6.5"
  }
}
```

### 2. API Base URL Configuration

Create `src/config/api.ts`:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

Update `.env`:
```
VITE_API_URL=http://localhost:3000
```

### 3. Authentication Changes

#### Before (Convex):
```typescript
// AdminLoginPage.tsx
const adminLogin = useAction(api.adminAuth.adminLogin);
const result = await adminLogin({ email, password });
localStorage.setItem('adminSession', JSON.stringify(result));
```

#### After (NestJS):
```typescript
// AdminLoginPage.tsx
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const response = await axios.post(`${API_BASE_URL}/auth/login`, {
  email,
  password,
});

const { accessToken, ...userData } = response.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('adminSession', JSON.stringify(userData));
```

### 4. API Client Setup

Create `src/lib/api.ts`:

```typescript
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('adminSession');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## Endpoint Mapping

### Products

#### Get Latest Products
```typescript
// Before (Convex)
const products = useQuery(api.products.getLatestProducts, { limit: 10 });

// After (NestJS)
const { data: products } = await api.get('/products/latest?limit=10');
```

#### Get Product By ID
```typescript
// Before (Convex)
const product = useQuery(api.products.getProductById, { productId });

// After (NestJS)
const { data: product } = await api.get(`/products/${productId}`);
```

#### Search Products
```typescript
// Before (Convex)
const results = useQuery(api.products.searchProducts, {
  keyword,
  paginationOpts: { numItems: 100, cursor: null },
});

// After (NestJS)
const { data: results } = await api.get('/products/search', {
  params: { keyword, page: 1, pageSize: 100 }
});
```

#### Get Products By Category
```typescript
// Before (Convex)
const results = useQuery(api.products.getProductsByCategory, {
  categoryId,
  paginationOpts: { numItems: 100, cursor: null },
});

// After (NestJS)
const { data: results } = await api.get(`/products/category/${categoryId}`, {
  params: { page: 1, pageSize: 100 }
});
```

#### Create Product (Admin)
```typescript
// Before (Convex)
const createProduct = useMutation(api.products.createProduct);
await createProduct({
  adminId,
  name,
  description,
  affiliateUrl,
  categories,
  useCases,
  images,
});

// After (NestJS)
await api.post('/products', {
  name,
  description,
  affiliateUrl,
  categories,
  useCases,
  images,
});
```

#### Update Product (Admin)
```typescript
// Before (Convex)
const updateProduct = useMutation(api.products.updateProduct);
await updateProduct({
  adminId,
  productId,
  name,
  description,
  affiliateUrl,
  categories,
  useCases,
  images,
});

// After (NestJS)
await api.put(`/products/${productId}`, {
  name,
  description,
  affiliateUrl,
  categories,
  useCases,
  images,
  status: 'PUBLISHED', // DRAFT, PUBLISHED, ARCHIVED
});
```

#### Delete Product (Admin)
```typescript
// Before (Convex)
const deleteProduct = useMutation(api.products.deleteProduct);
await deleteProduct({ adminId, productId });

// After (NestJS)
await api.delete(`/products/${productId}`);
```

### Categories

#### Get All Categories
```typescript
// Before (Convex)
const categories = useQuery(api.categories.getAllCategories, {});

// After (NestJS)
const { data: categories } = await api.get('/categories');
```

#### Create Category (Admin)
```typescript
// Before (Convex)
const createCategory = useMutation(api.categories.createCategory);
await createCategory({ adminId, name, parentCategoryId });

// After (NestJS)
await api.post('/categories', { name, parentCategoryId });
```

### Use Cases

#### Get All Use Cases
```typescript
// Before (Convex)
const useCases = useQuery(api.useCases.getAllUseCases, {});

// After (NestJS)
const { data: useCases } = await api.get('/use-cases');
```

#### Create Use Case (Admin)
```typescript
// Before (Convex)
const createUseCase = useMutation(api.useCases.createUseCase);
await createUseCase({ adminId, name });

// After (NestJS)
await api.post('/use-cases', { name });
```

### Analytics

#### Track Event
```typescript
// Before (Convex)
const trackEvent = useMutation(api.analytics.trackEvent);
await trackEvent({
  eventType,
  entityId,
  metadata,
  timestamp: Date.now(),
});

// After (NestJS)
await api.post('/analytics/track', {
  eventType,
  entityId,
  metadata,
  sessionId: getSessionId(), // Generate on client
});
```

#### Track Affiliate Click
```typescript
// Before (Convex)
const trackAffiliateClick = useMutation(api.analytics.trackAffiliateClick);
const result = await trackAffiliateClick({ productId });
window.open(result.redirectUrl, '_blank');

// After (NestJS)
const { data } = await api.post('/analytics/affiliate-click', { productId });
window.open(data.redirectUrl, '_blank');
```

#### Get Top Products (Admin)
```typescript
// Before (Convex)
const topProducts = useQuery(api.analytics.getTopProducts, { adminId, limit: 10 });

// After (NestJS)
const { data: topProducts } = await api.get('/analytics/top-products?limit=10');
```

### File Upload

#### Upload Image (Admin)
```typescript
// Before (Convex)
const generateUploadUrl = useMutation(api.products.generateUploadUrl);
const uploadUrl = await generateUploadUrl({ adminId });
const response = await fetch(uploadUrl, {
  method: 'POST',
  body: file,
});
const { storageId } = await response.json();

// After (NestJS)
const formData = new FormData();
formData.append('file', file);

const { data } = await api.post('/upload/image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
const imagePath = data.path; // /uploads/filename.jpg
```

## React Hook Replacements

Replace Convex hooks with custom hooks using React Query or SWR.

### Example with React Query

Install:
```bash
npm install @tanstack/react-query
```

Create custom hooks in `src/hooks/useProducts.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useLatestProducts(limit: number = 10) {
  return useQuery({
    queryKey: ['products', 'latest', limit],
    queryFn: async () => {
      const { data } = await api.get(`/products/latest?limit=${limit}`);
      return data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`);
      return data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData) => {
      const { data } = await api.post('/products', productData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

## Image Handling

### Before (Convex Storage)
```typescript
// ProductImage.tsx
const imageUrl = useQuery(api.products.getImageUrl, { storageId });
<img src={imageUrl} />
```

### After (NestJS Static Files)
```typescript
// ProductImage.tsx
const imageUrl = `${API_BASE_URL}${imagePath}`;
<img src={imageUrl} />
```

## Session Management

### Update ProtectedRoute.tsx

```typescript
// Before
const adminSession = getAdminSession();
if (!adminSession || !adminSession.adminId) {
  return <Navigate to="/admin/login" />;
}

// After
const token = localStorage.getItem('accessToken');
if (!token) {
  return <Navigate to="/admin/login" />;
}

// Optional: Validate token with backend
useEffect(() => {
  api.get('/auth/validate').catch(() => {
    localStorage.removeItem('accessToken');
    navigate('/admin/login');
  });
}, []);
```

## Data Model Changes

### Product Status
```typescript
// Before: lowercase strings
status: 'draft' | 'published' | 'archived'

// After: uppercase enum
status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
```

### IDs
```typescript
// Before: Convex IDs (custom format)
productId: 'k1234567890abcdef'

// After: UUIDs
productId: '123e4567-e89b-12d3-a456-426614174000'
```

### Pagination
```typescript
// Before: Cursor-based
paginationOpts: { numItems: 100, cursor: 'next_cursor' }

// After: Page-based
{ page: 1, pageSize: 100 }

// Response includes:
{
  products: [...],
  total: 500,
  page: 1,
  pageSize: 100,
  totalPages: 5
}
```

## Testing the Migration

1. Start backend: `cd backend && npm run start:dev`
2. Test login: `POST /auth/login`
3. Test product fetch: `GET /products/latest?limit=10`
4. Test admin endpoints with JWT token
5. Update frontend API calls progressively
6. Test all user flows (browse, search, admin CRUD)

## Rollback Plan

Keep Convex code in a separate branch until migration is complete and tested in production.

## Production Deployment

1. Deploy PostgreSQL database
2. Deploy NestJS backend
3. Update frontend `VITE_API_URL` to backend URL
4. Deploy frontend with updated API calls
5. Monitor logs and error rates
6. Decommission Convex deployment

## Troubleshooting

### CORS Errors
Update `main.ts` CORS configuration:
```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  credentials: true,
});
```

### Authentication Errors
Check JWT token in localStorage and Authorization header.

### Image Upload Errors
Verify `uploads` directory exists and has write permissions.

### Database Connection
Verify `DATABASE_URL` in `.env` and PostgreSQL is running.
