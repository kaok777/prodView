# Frontend Migration Status

## Completed ✅

### Core Infrastructure
- ✅ Removed Convex dependencies from package.json
- ✅ Added axios dependency
- ✅ Created API client (`src/lib/api.ts`)
- ✅ Updated main.tsx (removed ConvexAuthProvider)
- ✅ Created `.env.example` with VITE_API_URL

### Authentication
- ✅ Updated AdminLoginPage to use REST API
- ✅ Updated ProtectedRoute to check JWT token
- ✅ Updated security.ts to clear accessToken

### Analytics
- ✅ Rewrote useAnalytics hook to use REST API
- ✅ Rewrote useAffiliateTracking hook to use REST API
- ✅ Added session ID generation

### Components
- ✅ Updated LeftSidebar (categories and use cases)
- ✅ Updated ProductImage (using static file paths)
- ✅ Updated ProductCard (using product.id instead of product._id)

### Pages
- ✅ Updated HomePage to fetch from REST API

## Remaining Files to Update 🔄

### Product Pages
1. **src/pages/ProductSelectionPage.tsx**
   - Remove `useQuery` from convex
   - Fetch products with filtering/search from REST API
   - Update ID references (_id → id)

2. **src/pages/ProductDetailPage.tsx**
   - Remove `useQuery` from convex
   - Fetch single product from REST API
   - Update ID references

### Admin Pages
3. **src/pages/admin/AdminDashboard.tsx**
   - Remove `useQuery` from convex
   - Fetch products from `/products/admin/all`
   - Update status enum (lowercase → uppercase)
   - Wire up delete functionality

4. **src/pages/admin/ProductEditorPage.tsx**
   - Remove `useMutation` from convex
   - Use axios for create/update
   - Handle file upload via `/upload/image`
   - Update category/useCase ID handling

5. **src/pages/admin/AdminAnalytics.tsx**
   - Remove `useQuery` from convex
   - Fetch analytics from REST endpoints
   - Update all data fetching

### Other Components
6. **src/components/RightSidebar.tsx** (if exists and uses Convex)
7. **src/components/ProductGrid.tsx** (if uses Convex)
8. **src/components/Navbar.tsx** (if uses Convex for search)

## Key Changes to Remember

### ID Field Changes
```typescript
// Before (Convex)
product._id
category._id
useCase._id

// After (NestJS)
product.id
category.id
useCase.id
```

### Status Enum Changes
```typescript
// Before (Convex)
'draft' | 'published' | 'archived'

// After (NestJS)
'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
```

### Image Handling
```typescript
// Before (Convex)
<ProductImage storageId={product.images[0]} alt={product.name} />

// After (NestJS)
<ProductImage imagePath={product.images[0]} alt={product.name} />
```

### Data Fetching Pattern
```typescript
// Before (Convex)
const products = useQuery(api.products.getLatestProducts, { limit: 10 });

// After (NestJS)
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await api.get('/products/latest?limit=10');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Admin Mutations
```typescript
// Before (Convex)
const createProduct = useMutation(api.products.createProduct);
await createProduct({ adminId, ...productData });

// After (NestJS)
await api.post('/products', productData);
// JWT token automatically added by axios interceptor
```

## API Endpoint Reference

### Products (Public)
- GET `/products/latest?limit=10`
- GET `/products/search?keyword=...&page=1&pageSize=100`
- GET `/products/category/:id?page=1&pageSize=100`
- GET `/products/use-case/:id?page=1&pageSize=100`
- GET `/products/:id`

### Products (Admin)
- GET `/products/admin/all?limit=100` (requires JWT)
- POST `/products` (requires JWT)
- PUT `/products/:id` (requires JWT)
- DELETE `/products/:id` (requires JWT)

### Categories
- GET `/categories`
- POST `/categories` (requires JWT)

### Use Cases
- GET `/use-cases`
- POST `/use-cases` (requires JWT)

### Analytics
- POST `/analytics/track`
- POST `/analytics/affiliate-click`
- GET `/analytics/top-products?limit=10` (requires JWT)
- GET `/analytics/affiliate-clicks?limit=10` (requires JWT)
- GET `/analytics/category-stats` (requires JWT)
- GET `/analytics/search-stats?limit=20` (requires JWT)

### File Upload
- POST `/upload/image` (requires JWT, multipart/form-data)

## Verification Commands

### Check for remaining Convex imports
```bash
grep -r "from.*convex" src/ --include="*.ts" --include="*.tsx"
grep -r "import.*convex" src/ --include="*.ts" --include="*.tsx"
```

### Check for _id references
```bash
grep -r "\._id" src/ --include="*.ts" --include="*.tsx"
```

### Check for old status values
```bash
grep -r '"draft"\\|"published"\\|"archived"' src/ --include="*.ts" --include="*.tsx"
```

## Testing Checklist

- [ ] Admin login works
- [ ] Homepage loads products
- [ ] Product search works
- [ ] Category filtering works
- [ ] Use case filtering works
- [ ] Product detail page loads
- [ ] Admin dashboard shows products
- [ ] Product creation works
- [ ] Product editing works
- [ ] Product deletion works
- [ ] Image upload works
- [ ] Analytics tracking works
- [ ] Analytics dashboard shows stats

## Environment Setup

Create `.env` file:
```
VITE_API_URL=http://localhost:3000
```

Start backend first:
```bash
cd backend
npm run start:dev
```

Then start frontend:
```bash
npm run dev
```
