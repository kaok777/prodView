# API Contract Documentation

**Version:** 1.0.0
**Last Updated:** 2026-02-15
**Status:** Production

---

## 1. API Overview

### Base URLs

**Development:**
```
http://localhost:3000
```

**Production:**
```
https://your-domain.com
```

### Global Prefix

All API routes are prefixed with `/api` except:
- `/health` - Health check endpoint
- `/uploads/*` - Static file serving (images)
- `/` - API root information

### Content Type

- **Request:** `application/json` (except file upload which uses `multipart/form-data`)
- **Response:** `application/json`
- **Max Body Size:** 10MB (configurable via `MAX_BODY_SIZE` environment variable)

### API Versioning Strategy

No URL-based versioning is currently implemented. API is served at root level with global `/api` prefix.

Future breaking changes will be communicated via:
- Major version bump in package.json
- Migration guides in documentation
- Deprecation warnings in responses

### Rate Limiting

**Global Rate Limit:**
- Window: 15 minutes (900,000 ms)
- Max Requests: 1000 per IP address
- Standard Headers: `RateLimit-*` headers included in responses
- Static file serving (`/uploads/*`) is exempt from rate limiting

**Endpoint-Specific Throttling:**
Each endpoint may have additional throttling configured (documented per endpoint below).

### Authentication Mechanism

**Type:** JWT (JSON Web Token) with httpOnly cookies

**Token Storage:**
- Access Token: httpOnly cookie, 15-minute expiry
- Refresh Token: httpOnly cookie, 7-day expiry

**Cookie Configuration:**
- `httpOnly: true` (JavaScript cannot access)
- `secure: true` (HTTPS only in production)
- `sameSite: 'strict'` (CSRF protection)
- `path: '/'`

**Token Extraction:**
- Primary: httpOnly cookie (`accessToken`)
- Fallback: Authorization header (`Bearer <token>`)

**No Bearer Tokens in Response:**
Tokens are automatically set as httpOnly cookies and are NOT returned in response body.

---

## 2. Authentication & Authorization

### Authentication Flow

1. Client sends credentials to `/api/auth/login`
2. Server validates credentials
3. Server sets two httpOnly cookies: `accessToken` and `refreshToken`
4. Client receives user data (adminId, email, role)
5. Browser automatically sends cookies with subsequent requests

### Token Expiration & Refresh

- **Access Token:** 15 minutes (configurable via `JWT_EXPIRATION`)
- **Refresh Token:** 7 days (hardcoded)

To refresh expired access token:
1. Client calls `/api/auth/refresh`
2. Server validates refresh token from cookie
3. Server issues new access and refresh tokens as cookies

### Role-Based Access Control

**Roles:**
- `admin` - Full access to all admin endpoints

**Public Endpoints:**
Marked with `@Public()` decorator, no authentication required.

**Admin Endpoints:**
Marked with `@Roles('admin')` decorator, requires:
1. Valid JWT token (from cookie or Authorization header)
2. User role must be `admin`

### Authorization Errors

**401 Unauthorized:**
- No token provided
- Token expired
- Invalid token signature

**403 Forbidden:**
- Valid token but insufficient role permissions

---

## 3. Endpoint Catalogue

### 3.1 Root & Health Endpoints

#### API Root Information
**Method:** GET
**Route:** `/`

**Description:**
Returns API server information and current timestamp.

**Authentication Required:** No

**Request:**
```
Headers: None required
Query Parameters: None
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "status": "ok",
  "message": "ProdView API Server",
  "version": "1.0.0",
  "timestamp": "2026-02-15T12:00:00.000Z"
}
```

**Rate Limiting:** Inherits global rate limit (1000 req/15min)

---

#### Health Check
**Method:** GET
**Route:** `/health`

**Description:**
Health check endpoint for monitoring and load balancers. Returns server uptime and health status.

**Authentication Required:** No

**Request:**
```
Headers: None required
Query Parameters: None
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "status": "healthy",
  "uptime": 123456.789,
  "timestamp": "2026-02-15T12:00:00.000Z"
}
```

**Rate Limiting:** Inherits global rate limit (1000 req/15min)

---

### 3.2 Authentication Endpoints

#### Admin Login
**Method:** POST
**Route:** `/api/auth/login`

**Description:**
Authenticates admin user with email and password. Sets httpOnly cookies for access and refresh tokens.

**Authentication Required:** No

**Request:**

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@prodview.com",
  "password": "SecurePassword123!"
}
```

**Validation Rules:**
- `email`:
  - Type: string
  - Required: Yes
  - Format: Valid email format
  - Max Length: 254 characters
  - Error Message: "Invalid email format"

- `password`:
  - Type: string
  - Required: Yes
  - Min Length: 8 characters
  - Max Length: 128 characters
  - Pattern: Must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (!@#$%^&*(),.?":{}|<>)
  - Error Message: "Password must contain uppercase, lowercase, number, and special character"

**Response:**

**Success Response:**
```json
Status: 200 OK

Set-Cookie: accessToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/
Set-Cookie: refreshToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/

{
  "adminId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "admin@prodview.com",
  "role": "admin"
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": ["Password must contain uppercase, lowercase, number, and special character"],
  "error": "Bad Request"
}
```

```json
Status: 401 Unauthorized

{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

```json
Status: 429 Too Many Requests

{
  "statusCode": 429,
  "message": "Too many requests from this IP, please try again later."
}
```

**Rate Limiting:** 5 requests per 15 minutes per IP

---

#### Refresh Token
**Method:** POST
**Route:** `/api/auth/refresh`

**Description:**
Refreshes expired access token using valid refresh token from cookie. Issues new access and refresh tokens.

**Authentication Required:** No (but requires valid refresh token in cookie)

**Request:**

**Headers:**
```
Cookie: refreshToken=<jwt>
```

**Request Body:** None

**Response:**

**Success Response:**
```json
Status: 200 OK

Set-Cookie: accessToken=<new_jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/
Set-Cookie: refreshToken=<new_jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/

{
  "message": "Token refreshed successfully"
}
```

**Error Responses:**

```json
Status: 401 Unauthorized

{
  "message": "No refresh token provided"
}
```

```json
Status: 401 Unauthorized

{
  "statusCode": 401,
  "message": "Invalid or expired refresh token"
}
```

**Rate Limiting:** 10 requests per 60 seconds per IP

---

#### Logout
**Method:** POST
**Route:** `/api/auth/logout`

**Description:**
Clears authentication cookies, logging out the admin user.

**Authentication Required:** No

**Request:**
```
Headers: None required
Request Body: None
```

**Response:**

**Success Response:**
```json
Status: 200 OK

Set-Cookie: accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
Set-Cookie: refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT

{
  "message": "Logged out successfully"
}
```

**Rate Limiting:** Inherits global rate limit (1000 req/15min)

---

### 3.3 Product Endpoints

#### Get Latest Products
**Method:** GET
**Route:** `/api/products/latest`

**Description:**
Retrieves the most recently created published products with pagination support.

**Authentication Required:** No

**Request:**

**Query Parameters:**
- `pageSize` (optional):
  - Type: integer
  - Min: 1
  - Max: 100
  - Default: 40
  - Description: Number of products per page

- `page` (optional):
  - Type: integer
  - Min: 1
  - Max: 1000
  - Default: 1
  - Description: Page number for pagination

**Example Request:**
```
GET /api/products/latest?pageSize=20&page=1
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "products": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Product Name",
      "description": "Product description text",
      "affiliateUrl": "https://example.com/affiliate-link",
      "images": ["/uploads/abc123.jpg", "/uploads/def456.jpg"],
      "views": 150,
      "status": "PUBLISHED",
      "createdAt": "2026-02-15T12:00:00.000Z",
      "updatedAt": "2026-02-15T12:00:00.000Z",
      "categories": [
        {
          "id": "cat-123",
          "name": "Electronics"
        }
      ],
      "useCases": [
        {
          "id": "use-123",
          "name": "Business"
        }
      ]
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": ["Page size must not exceed 100"],
  "error": "Bad Request"
}
```

**Rate Limiting:** 100 requests per 60 seconds per IP

---

#### Search Products
**Method:** GET
**Route:** `/api/products/search`

**Description:**
Searches products by keyword in name and description fields. Tracks search queries in analytics.

**Authentication Required:** No

**Request:**

**Query Parameters:**
- `keyword` (optional):
  - Type: string
  - Min Length: 1
  - Max Length: 100
  - Pattern: Alphanumeric, spaces, hyphens, underscores only (`^[a-zA-Z0-9\s\-_]+$`)
  - Description: Search term
  - Default: "" (returns all products)

- `page` (optional):
  - Type: integer
  - Min: 1
  - Max: 1000
  - Default: 1

- `pageSize` (optional):
  - Type: integer
  - Min: 1
  - Max: 100
  - Default: 20

**Example Request:**
```
GET /api/products/search?keyword=laptop&page=1&pageSize=10
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "products": [...],
  "total": 25,
  "page": 1,
  "pageSize": 10,
  "totalPages": 3
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": ["Search keyword contains invalid characters"],
  "error": "Bad Request"
}
```

**Rate Limiting:** 50 requests per 60 seconds per IP

---

#### Get Products by Category
**Method:** GET
**Route:** `/api/products/category/:categoryId`

**Description:**
Retrieves all published products belonging to a specific category.

**Authentication Required:** No

**Request:**

**Path Parameters:**
- `categoryId`:
  - Type: UUID v4
  - Required: Yes
  - Description: Category UUID
  - Validation: Must be valid UUID v4 format

**Query Parameters:**
- `page` (optional):
  - Type: integer
  - Min: 1
  - Max: 1000
  - Default: 1

- `pageSize` (optional):
  - Type: integer
  - Min: 1
  - Max: 100
  - Default: 20

- `sortBy` (optional):
  - Type: string
  - Allowed Values: "latest", "mostViewed"
  - Default: "latest"

**Example Request:**
```
GET /api/products/category/123e4567-e89b-12d3-a456-426614174000?sortBy=mostViewed
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "products": [...],
  "category": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Electronics"
  },
  "total": 50,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": "Validation failed (uuid v4 is expected)",
  "error": "Bad Request"
}
```

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Category not found"
}
```

**Rate Limiting:** 100 requests per 60 seconds per IP

---

#### Get Products by Use Case
**Method:** GET
**Route:** `/api/products/use-case/:useCaseId`

**Description:**
Retrieves all published products tagged with a specific use case.

**Authentication Required:** No

**Request:**

**Path Parameters:**
- `useCaseId`:
  - Type: UUID v4
  - Required: Yes
  - Description: Use case UUID
  - Validation: Must be valid UUID v4 format

**Query Parameters:**
- `page` (optional):
  - Type: integer
  - Min: 1
  - Max: 1000
  - Default: 1

- `pageSize` (optional):
  - Type: integer
  - Min: 1
  - Max: 100
  - Default: 20

- `sortBy` (optional):
  - Type: string
  - Allowed Values: "latest", "mostViewed"
  - Default: "latest"

**Example Request:**
```
GET /api/products/use-case/123e4567-e89b-12d3-a456-426614174000?page=1
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "products": [...],
  "useCase": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Business"
  },
  "total": 30,
  "page": 1,
  "pageSize": 20,
  "totalPages": 2
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": "Validation failed (uuid v4 is expected)",
  "error": "Bad Request"
}
```

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Use case not found"
}
```

**Rate Limiting:** 100 requests per 60 seconds per IP

---

#### Get Product by ID (Public)
**Method:** GET
**Route:** `/api/products/:id`

**Description:**
Retrieves a single product by ID. Only returns PUBLISHED products. Increments view count.

**Authentication Required:** No

**Request:**

**Path Parameters:**
- `id`:
  - Type: UUID v4
  - Required: Yes
  - Description: Product UUID
  - Validation: Must be valid UUID v4 format

**Example Request:**
```
GET /api/products/123e4567-e89b-12d3-a456-426614174000
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Product Name",
  "description": "Detailed product description",
  "affiliateUrl": "https://example.com/affiliate-link",
  "images": ["/uploads/abc123.jpg"],
  "views": 151,
  "status": "PUBLISHED",
  "createdAt": "2026-02-15T12:00:00.000Z",
  "updatedAt": "2026-02-15T12:00:00.000Z",
  "categories": [
    {
      "id": "cat-123",
      "name": "Electronics"
    }
  ],
  "useCases": [
    {
      "id": "use-123",
      "name": "Business"
    }
  ]
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": "Validation failed (uuid v4 is expected)",
  "error": "Bad Request"
}
```

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Product not found"
}
```

**Rate Limiting:** 200 requests per 60 seconds per IP

---

#### Get All Products (Admin)
**Method:** GET
**Route:** `/api/products/admin/all`

**Description:**
Retrieves all products (including DRAFT and ARCHIVED) for admin management. Returns products in descending creation order.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
```

**Query Parameters:**
- `limit` (optional):
  - Type: integer
  - Min: 1
  - Max: 100
  - Default: 100
  - Description: Maximum number of products to return

**Example Request:**
```
GET /api/products/admin/all?limit=50
```

**Response:**

**Success Response:**
```json
Status: 200 OK

[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Product Name",
    "description": "Product description",
    "affiliateUrl": "https://example.com/affiliate-link",
    "images": ["/uploads/abc123.jpg"],
    "views": 150,
    "status": "PUBLISHED",
    "createdAt": "2026-02-15T12:00:00.000Z",
    "updatedAt": "2026-02-15T12:00:00.000Z",
    "createdById": "admin-123",
    "updatedById": "admin-123",
    "categories": [...],
    "useCases": [...]
  }
]
```

**Error Responses:**

```json
Status: 401 Unauthorized

{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

```json
Status: 403 Forbidden

{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

**Rate Limiting:** 50 requests per 60 seconds per IP

---

#### Get Product by ID (Admin)
**Method:** GET
**Route:** `/api/products/admin/:id`

**Description:**
Retrieves a single product by ID with full details regardless of status (DRAFT, PUBLISHED, ARCHIVED).

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
```

**Path Parameters:**
- `id`:
  - Type: UUID v4
  - Required: Yes

**Example Request:**
```
GET /api/products/admin/123e4567-e89b-12d3-a456-426614174000
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Product Name",
  "description": "Product description",
  "affiliateUrl": "https://example.com/affiliate-link",
  "images": ["/uploads/abc123.jpg"],
  "views": 150,
  "status": "DRAFT",
  "createdAt": "2026-02-15T12:00:00.000Z",
  "updatedAt": "2026-02-15T12:00:00.000Z",
  "createdById": "admin-123",
  "updatedById": "admin-123",
  "categories": [...],
  "useCases": [...]
}
```

**Error Responses:**

```json
Status: 401 Unauthorized

{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Product not found"
}
```

**Rate Limiting:** 200 requests per 60 seconds per IP

---

#### Create Product
**Method:** POST
**Route:** `/api/products`

**Description:**
Creates a new product. Admin only. Creates audit log entry.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Product Name",
  "description": "Detailed product description with at least 10 characters",
  "affiliateUrl": "https://example.com/affiliate-link",
  "status": "DRAFT",
  "categoryIds": ["cat-uuid-1", "cat-uuid-2"],
  "useCaseIds": ["use-uuid-1"],
  "images": ["/uploads/abc123.jpg", "/uploads/def456.jpg"]
}
```

**Validation Rules:**

- `name`:
  - Type: string
  - Required: Yes
  - Min Length: 3
  - Max Length: 200
  - Pattern: `^[a-zA-Z0-9\s\-_&().,]+$`

- `description`:
  - Type: string
  - Required: Yes
  - Min Length: 10
  - Max Length: 10000

- `affiliateUrl`:
  - Type: string (URL)
  - Required: Yes
  - Max Length: 500
  - Must be valid HTTP/HTTPS URL

- `status`:
  - Type: enum
  - Required: No
  - Allowed Values: "DRAFT", "PUBLISHED", "ARCHIVED"
  - Default: "DRAFT"

- `categoryIds`:
  - Type: array of UUID v4 strings
  - Required: Yes
  - Max Items: 10
  - Each item must be valid UUID v4

- `useCaseIds`:
  - Type: array of UUID v4 strings
  - Required: Yes
  - Max Items: 10
  - Each item must be valid UUID v4

- `images`:
  - Type: array of strings
  - Required: Yes
  - Max Items: 20
  - Each item must be string (path to uploaded image)

**Response:**

**Success Response:**
```json
Status: 201 Created

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "New Product Name",
  "description": "Detailed product description",
  "affiliateUrl": "https://example.com/affiliate-link",
  "images": ["/uploads/abc123.jpg"],
  "views": 0,
  "status": "DRAFT",
  "createdAt": "2026-02-15T12:00:00.000Z",
  "updatedAt": "2026-02-15T12:00:00.000Z",
  "createdById": "admin-123",
  "updatedById": "admin-123",
  "categories": [...],
  "useCases": [...]
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": [
    "Product name must be at least 3 characters long",
    "Affiliate URL must be a valid HTTP/HTTPS URL"
  ],
  "error": "Bad Request"
}
```

```json
Status: 401 Unauthorized

{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "One or more category IDs not found"
}
```

**Rate Limiting:** 10 requests per 60 seconds per IP

---

#### Update Product
**Method:** PUT
**Route:** `/api/products/:id`

**Description:**
Updates an existing product. Admin only. All fields are optional. Creates audit log entry.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
Content-Type: application/json
```

**Path Parameters:**
- `id`:
  - Type: UUID v4
  - Required: Yes

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "status": "PUBLISHED",
  "categoryIds": ["cat-uuid-1", "cat-uuid-2"]
}
```

**Validation Rules:**
Same as Create Product DTO, but all fields are optional (PartialType).

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Updated Product Name",
  "description": "Original description",
  "affiliateUrl": "https://example.com/affiliate-link",
  "images": ["/uploads/abc123.jpg"],
  "views": 150,
  "status": "PUBLISHED",
  "createdAt": "2026-02-15T12:00:00.000Z",
  "updatedAt": "2026-02-15T13:00:00.000Z",
  "createdById": "admin-123",
  "updatedById": "admin-123",
  "categories": [...],
  "useCases": [...]
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": ["Status must be DRAFT, PUBLISHED, or ARCHIVED"],
  "error": "Bad Request"
}
```

```json
Status: 401 Unauthorized

{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Product not found"
}
```

**Rate Limiting:** 20 requests per 60 seconds per IP

---

#### Delete Product
**Method:** DELETE
**Route:** `/api/products/:id`

**Description:**
Deletes a product permanently. Admin only. Creates audit log entry. Cascades to product categories and use cases.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
```

**Path Parameters:**
- `id`:
  - Type: UUID v4
  - Required: Yes

**Example Request:**
```
DELETE /api/products/123e4567-e89b-12d3-a456-426614174000
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "message": "Product deleted successfully"
}
```

**Error Responses:**

```json
Status: 401 Unauthorized

{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Product not found"
}
```

**Rate Limiting:** 10 requests per 60 seconds per IP

---

### 3.4 Category Endpoints

#### Get All Categories
**Method:** GET
**Route:** `/api/categories`

**Description:**
Retrieves all categories with their parent-child relationships.

**Authentication Required:** No

**Request:**
```
No parameters required
```

**Response:**

**Success Response:**
```json
Status: 200 OK

[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Electronics",
    "parentCategoryId": null,
    "createdAt": "2026-02-15T12:00:00.000Z",
    "childCategories": [
      {
        "id": "234e5678-e89b-12d3-a456-426614174001",
        "name": "Laptops",
        "parentCategoryId": "123e4567-e89b-12d3-a456-426614174000",
        "createdAt": "2026-02-15T12:00:00.000Z"
      }
    ]
  }
]
```

**Rate Limiting:** 100 requests per 60 seconds per IP

---

#### Get Category by ID
**Method:** GET
**Route:** `/api/categories/:id`

**Description:**
Retrieves a single category by ID with relationships.

**Authentication Required:** No

**Request:**

**Path Parameters:**
- `id`:
  - Type: UUID v4
  - Required: Yes

**Example Request:**
```
GET /api/categories/123e4567-e89b-12d3-a456-426614174000
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Electronics",
  "parentCategoryId": null,
  "createdAt": "2026-02-15T12:00:00.000Z",
  "parentCategory": null,
  "childCategories": [...]
}
```

**Error Responses:**

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Category not found"
}
```

**Rate Limiting:** 100 requests per 60 seconds per IP

---

#### Create Category
**Method:** POST
**Route:** `/api/categories`

**Description:**
Creates a new category. Admin only. Creates audit log entry.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Category",
  "parentCategoryId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Validation Rules:**

- `name`:
  - Type: string
  - Required: Yes
  - Min Length: 2
  - Max Length: 100
  - Pattern: `^[a-zA-Z0-9\s\-_&().,]+$`

- `parentCategoryId`:
  - Type: UUID v4
  - Required: No
  - Must be valid UUID v4 if provided

**Response:**

**Success Response:**
```json
Status: 201 Created

{
  "id": "345e6789-e89b-12d3-a456-426614174002",
  "name": "New Category",
  "parentCategoryId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-02-15T12:00:00.000Z"
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": ["Category name must be at least 2 characters long"],
  "error": "Bad Request"
}
```

```json
Status: 409 Conflict

{
  "statusCode": 409,
  "message": "Category name already exists"
}
```

**Rate Limiting:** 10 requests per 60 seconds per IP

---

#### Update Category
**Method:** PUT
**Route:** `/api/categories/:id`

**Description:**
Updates an existing category. Admin only. Creates audit log entry.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
Content-Type: application/json
```

**Path Parameters:**
- `id`:
  - Type: UUID v4
  - Required: Yes

**Request Body:**
```json
{
  "name": "Updated Category Name"
}
```

**Validation Rules:**
Same as Create Category DTO, but all fields are optional.

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "id": "345e6789-e89b-12d3-a456-426614174002",
  "name": "Updated Category Name",
  "parentCategoryId": "123e4567-e89b-12d3-a456-426614174000",
  "createdAt": "2026-02-15T12:00:00.000Z"
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": "At least one field must be provided for update"
}
```

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Category not found"
}
```

```json
Status: 409 Conflict

{
  "statusCode": 409,
  "message": "Circular reference detected"
}
```

**Rate Limiting:** 20 requests per 60 seconds per IP

---

#### Delete Category
**Method:** DELETE
**Route:** `/api/categories/:id`

**Description:**
Deletes a category permanently. Admin only. Creates audit log entry. Cascades to product categories.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
```

**Path Parameters:**
- `id`:
  - Type: UUID v4
  - Required: Yes

**Example Request:**
```
DELETE /api/categories/345e6789-e89b-12d3-a456-426614174002
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "message": "Category deleted successfully"
}
```

**Error Responses:**

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Category not found"
}
```

**Rate Limiting:** 10 requests per 60 seconds per IP

---

### 3.5 Use Case Endpoints

#### Get All Use Cases
**Method:** GET
**Route:** `/api/use-cases`

**Description:**
Retrieves all use cases.

**Authentication Required:** No

**Request:**
```
No parameters required
```

**Response:**

**Success Response:**
```json
Status: 200 OK

[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Business",
    "createdAt": "2026-02-15T12:00:00.000Z"
  },
  {
    "id": "234e5678-e89b-12d3-a456-426614174001",
    "name": "Personal",
    "createdAt": "2026-02-15T12:00:00.000Z"
  }
]
```

**Rate Limiting:** 100 requests per 60 seconds per IP

---

#### Get Use Case by ID
**Method:** GET
**Route:** `/api/use-cases/:id`

**Description:**
Retrieves a single use case by ID.

**Authentication Required:** No

**Request:**

**Path Parameters:**
- `id`:
  - Type: UUID v4
  - Required: Yes

**Example Request:**
```
GET /api/use-cases/123e4567-e89b-12d3-a456-426614174000
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Business",
  "createdAt": "2026-02-15T12:00:00.000Z"
}
```

**Error Responses:**

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Use case not found"
}
```

**Rate Limiting:** 100 requests per 60 seconds per IP

---

#### Create Use Case
**Method:** POST
**Route:** `/api/use-cases`

**Description:**
Creates a new use case. Admin only. Creates audit log entry.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Education"
}
```

**Validation Rules:**

- `name`:
  - Type: string
  - Required: Yes
  - Min Length: 2
  - Max Length: 100
  - Pattern: `^[a-zA-Z0-9\s\-_&().,]+$`

**Response:**

**Success Response:**
```json
Status: 201 Created

{
  "id": "345e6789-e89b-12d3-a456-426614174002",
  "name": "Education",
  "createdAt": "2026-02-15T12:00:00.000Z"
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": ["Use case name must be at least 2 characters long"],
  "error": "Bad Request"
}
```

```json
Status: 409 Conflict

{
  "statusCode": 409,
  "message": "Use case name already exists"
}
```

**Rate Limiting:** 10 requests per 60 seconds per IP

---

#### Update Use Case
**Method:** PUT
**Route:** `/api/use-cases/:id`

**Description:**
Updates an existing use case. Admin only. Creates audit log entry.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
Content-Type: application/json
```

**Path Parameters:**
- `id`:
  - Type: UUID v4
  - Required: Yes

**Request Body:**
```json
{
  "name": "Updated Use Case Name"
}
```

**Validation Rules:**
Same as Create Use Case DTO, but all fields are optional.

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "id": "345e6789-e89b-12d3-a456-426614174002",
  "name": "Updated Use Case Name",
  "createdAt": "2026-02-15T12:00:00.000Z"
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": "At least one field must be provided for update"
}
```

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Use case not found"
}
```

**Rate Limiting:** 20 requests per 60 seconds per IP

---

#### Delete Use Case
**Method:** DELETE
**Route:** `/api/use-cases/:id`

**Description:**
Deletes a use case permanently. Admin only. Creates audit log entry. Cascades to product use cases.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
```

**Path Parameters:**
- `id`:
  - Type: UUID v4
  - Required: Yes

**Example Request:**
```
DELETE /api/use-cases/345e6789-e89b-12d3-a456-426614174002
```

**Response:**

**Success Response:**
```json
Status: 200 OK

{
  "message": "Use case deleted successfully"
}
```

**Error Responses:**

```json
Status: 404 Not Found

{
  "statusCode": 404,
  "message": "Use case not found"
}
```

**Rate Limiting:** 10 requests per 60 seconds per IP

---

### 3.6 Analytics Endpoints

#### Track Event
**Method:** POST
**Route:** `/api/analytics/track`

**Description:**
Tracks user interaction events for analytics. Public endpoint for frontend event tracking.

**Authentication Required:** No

**Request:**

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "eventType": "product_view",
  "entityId": "123e4567-e89b-12d3-a456-426614174000",
  "sessionId": "abc123def456",
  "metadata": {
    "referrer": "google",
    "device": "mobile"
  }
}
```

**Validation Rules:**

- `eventType`:
  - Type: enum
  - Required: Yes
  - Allowed Values: "product_view", "category_click", "use_case_click", "search", "affiliate_click"

- `entityId`:
  - Type: UUID v4
  - Required: No
  - Must be valid UUID v4 if provided

- `sessionId`:
  - Type: string
  - Required: No
  - Max Length: 100

- `metadata`:
  - Type: object
  - Required: No
  - Max Size: 10KB (10240 bytes)
  - Max Depth: 5 levels
  - Max Keys: 50 total keys

**Response:**

**Success Response:**
```json
Status: 201 Created

{
  "id": "analytics-event-uuid",
  "eventType": "product_view",
  "entityId": "123e4567-e89b-12d3-a456-426614174000",
  "metadata": {...},
  "timestamp": "2026-02-15T12:00:00.000Z",
  "sessionId": "abc123def456"
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": ["Metadata size must not exceed 10KB"],
  "error": "Bad Request"
}
```

**Rate Limiting:** 200 requests per 60 seconds per IP

---

#### Track Affiliate Click
**Method:** POST
**Route:** `/api/analytics/affiliate-click`

**Description:**
Tracks affiliate link clicks for conversion tracking. Public endpoint called when user clicks affiliate URL.

**Authentication Required:** No

**Request:**

**Headers:**
```
Content-Type: application/json
User-Agent: <browser-user-agent>
```

**Request Body:**
```json
{
  "productId": "123e4567-e89b-12d3-a456-426614174000",
  "sessionId": "abc123def456"
}
```

**Validation Rules:**

- `productId`:
  - Type: UUID v4
  - Required: Yes

- `sessionId`:
  - Type: string
  - Required: No
  - Max Length: 100

**Response:**

**Success Response:**
```json
Status: 201 Created

{
  "message": "Affiliate click tracked successfully"
}
```

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": ["Product ID must be a valid UUID"],
  "error": "Bad Request"
}
```

**Rate Limiting:** 100 requests per 60 seconds per IP

---

#### Get Top Products (Admin)
**Method:** GET
**Route:** `/api/analytics/top-products`

**Description:**
Retrieves products with the most views for analytics dashboard. Admin only.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
```

**Query Parameters:**
- `limit` (optional):
  - Type: integer
  - Min: 1
  - Max: 100
  - Default: 10

**Example Request:**
```
GET /api/analytics/top-products?limit=20
```

**Response:**

**Success Response:**
```json
Status: 200 OK

[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Product Name",
    "views": 1500,
    "status": "PUBLISHED",
    "createdAt": "2026-02-15T12:00:00.000Z"
  }
]
```

**Error Responses:**

```json
Status: 401 Unauthorized

{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Rate Limiting:** 50 requests per 60 seconds per IP

---

#### Get Affiliate Clicks (Admin)
**Method:** GET
**Route:** `/api/analytics/affiliate-clicks`

**Description:**
Retrieves recent affiliate click data for analytics dashboard. Admin only.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
```

**Query Parameters:**
- `limit` (optional):
  - Type: integer
  - Min: 1
  - Max: 100
  - Default: 10

**Example Request:**
```
GET /api/analytics/affiliate-clicks?limit=50
```

**Response:**

**Success Response:**
```json
Status: 200 OK

[
  {
    "id": "event-uuid",
    "eventType": "affiliate_click",
    "entityId": "123e4567-e89b-12d3-a456-426614174000",
    "timestamp": "2026-02-15T12:00:00.000Z",
    "metadata": {...}
  }
]
```

**Rate Limiting:** 50 requests per 60 seconds per IP

---

#### Get Category Stats (Admin)
**Method:** GET
**Route:** `/api/analytics/category-stats`

**Description:**
Retrieves analytics statistics grouped by category. Admin only.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
```

**Example Request:**
```
GET /api/analytics/category-stats
```

**Response:**

**Success Response:**
```json
Status: 200 OK

[
  {
    "categoryId": "123e4567-e89b-12d3-a456-426614174000",
    "categoryName": "Electronics",
    "productCount": 25,
    "totalViews": 5000,
    "avgViewsPerProduct": 200
  }
]
```

**Rate Limiting:** 50 requests per 60 seconds per IP

---

#### Get Search Stats (Admin)
**Method:** GET
**Route:** `/api/analytics/search-stats`

**Description:**
Retrieves search query statistics for understanding user search behavior. Admin only.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
```

**Query Parameters:**
- `limit` (optional):
  - Type: integer
  - Min: 1
  - Max: 100
  - Default: 20

**Example Request:**
```
GET /api/analytics/search-stats?limit=30
```

**Response:**

**Success Response:**
```json
Status: 200 OK

[
  {
    "searchTerm": "laptop",
    "searchCount": 150,
    "lastSearched": "2026-02-15T12:00:00.000Z"
  }
]
```

**Rate Limiting:** 50 requests per 60 seconds per IP

---

### 3.7 Upload Endpoints

#### Upload Image
**Method:** POST
**Route:** `/api/upload/image`

**Description:**
Uploads a product image. Admin only. Validates file type, size, and generates UUID filename.

**Authentication Required:** Yes
**Required Role:** admin

**Request:**

**Headers:**
```
Cookie: accessToken=<jwt>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
- `file`:
  - Type: File
  - Required: Yes
  - Allowed MIME Types: image/jpeg, image/jpg, image/png, image/gif, image/webp
  - Max Size: 10MB (10485760 bytes)

**Example Request:**
```
POST /api/upload/image
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="product.jpg"
Content-Type: image/jpeg

<binary data>
------WebKitFormBoundary--
```

**Response:**

**Success Response:**
```json
Status: 201 Created

{
  "path": "/uploads/abc123-def456-ghi789.jpg",
  "mimetype": "image/jpeg",
  "size": 524288
}
```

**Note:** Filename is NOT returned for security reasons (LOW-B2 fix).

**Error Responses:**

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": "No file uploaded",
  "error": "Bad Request"
}
```

```json
Status: 400 Bad Request

{
  "statusCode": 400,
  "message": "Invalid file type. Only images are allowed.",
  "error": "Bad Request"
}
```

```json
Status: 413 Payload Too Large

{
  "statusCode": 413,
  "message": "File size exceeds 10MB limit",
  "error": "Payload Too Large"
}
```

```json
Status: 401 Unauthorized

{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Rate Limiting:** 20 requests per 60 seconds per IP

**File Storage:**
- Files are stored in `backend/uploads/` directory
- Filenames are generated as UUIDs with original extension
- Files are served statically via `/uploads/<filename>` route

---

## 4. Data Models

### Product

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID v4 | Yes | Auto-generated | Product unique identifier |
| name | string | Yes | 3-200 chars, alphanumeric | Product name |
| description | string | Yes | 10-10000 chars | Product description |
| affiliateUrl | string (URL) | Yes | Valid HTTP/HTTPS, max 500 chars | Affiliate marketing URL |
| images | string[] | Yes | Max 20 items | Array of image paths |
| views | integer | Yes | Default: 0 | View count (auto-incremented) |
| status | enum | Yes | DRAFT, PUBLISHED, ARCHIVED | Product status |
| createdAt | DateTime | Yes | Auto-generated | Creation timestamp |
| updatedAt | DateTime | Yes | Auto-updated | Last update timestamp |
| createdById | UUID v4 | Yes | FK to AdminUser | Creator admin ID |
| updatedById | UUID v4 | Yes | FK to AdminUser | Last updater admin ID |
| categories | Category[] | Yes | Many-to-many | Associated categories |
| useCases | UseCase[] | Yes | Many-to-many | Associated use cases |

---

### Category

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID v4 | Yes | Auto-generated | Category unique identifier |
| name | string | Yes | 2-100 chars, unique | Category name |
| parentCategoryId | UUID v4 | No | FK to Category | Parent category (for hierarchy) |
| createdAt | DateTime | Yes | Auto-generated | Creation timestamp |
| parentCategory | Category | No | Self-referencing | Parent category object |
| childCategories | Category[] | No | Self-referencing | Child categories |
| products | Product[] | No | Many-to-many | Products in category |

---

### UseCase

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID v4 | Yes | Auto-generated | Use case unique identifier |
| name | string | Yes | 2-100 chars, unique | Use case name |
| createdAt | DateTime | Yes | Auto-generated | Creation timestamp |
| products | Product[] | No | Many-to-many | Products with this use case |

---

### AdminUser

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID v4 | Yes | Auto-generated | Admin unique identifier |
| email | string | Yes | Valid email, unique, max 254 chars | Admin email |
| passwordHash | string | Yes | Bcrypt hash | Hashed password |
| role | string | Yes | Default: "admin" | User role |
| createdAt | DateTime | Yes | Auto-generated | Creation timestamp |
| lastLoginAt | DateTime | No | Nullable | Last login timestamp |
| createdProducts | Product[] | No | One-to-many | Products created by admin |
| updatedProducts | Product[] | No | One-to-many | Products updated by admin |

---

### AnalyticsEvent

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID v4 | Yes | Auto-generated | Event unique identifier |
| eventType | enum | Yes | product_view, category_click, use_case_click, search, affiliate_click | Event type |
| entityId | UUID v4 | No | Nullable | Related entity ID |
| metadata | JSON | No | Max 10KB, max 5 levels, max 50 keys | Additional event data |
| timestamp | DateTime | Yes | Auto-generated | Event timestamp |
| sessionId | string | Yes | Max 100 chars | User session identifier |

---

### AuditLog

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID v4 | Yes | Auto-generated | Audit log unique identifier |
| adminUserId | UUID v4 | No | FK to AdminUser | Admin who performed action |
| action | string | Yes | - | Action performed |
| entityType | string | Yes | - | Type of entity affected |
| entityId | string | Yes | - | ID of entity affected |
| timestamp | DateTime | Yes | Auto-generated | Action timestamp |
| metadata | JSON | No | - | Additional action metadata |

---

## 5. Validation Rules

### Global Validation Configuration

**Pipe:** NestJS ValidationPipe with class-validator decorators

**Configuration:**
```typescript
{
  whitelist: true,              // Strip properties without decorators
  forbidNonWhitelisted: true,   // Throw error on extra properties
  transform: true,               // Auto-transform types
  enableImplicitConversion: false, // Explicit type conversion only
  disableErrorMessages: true (in production), // Hide validation details in prod
  validationError: {
    target: false,               // Don't expose DTO class
    value: false                 // Don't expose submitted value
  }
}
```

### Common Validation Decorators

**String Validation:**
- `@IsString()` - Must be string type
- `@MinLength(n)` - Minimum length
- `@MaxLength(n)` - Maximum length
- `@Matches(regex)` - Pattern matching

**Number Validation:**
- `@IsInt()` - Must be integer
- `@Min(n)` - Minimum value
- `@Max(n)` - Maximum value

**Type Validation:**
- `@IsEmail()` - Valid email format
- `@IsUrl()` - Valid URL format
- `@IsUUID('4')` - Valid UUID v4 format
- `@IsEnum(enum)` - Must be enum value

**Array Validation:**
- `@IsArray()` - Must be array
- `@ArrayMinSize(n)` - Minimum array length
- `@ArrayMaxSize(n)` - Maximum array length

**Object Validation:**
- `@IsObject()` - Must be object
- `@ValidateNested()` - Validate nested objects

**Optional Fields:**
- `@IsOptional()` - Field is optional

### Custom Validators

**MaxJsonSize:**
Validates JSON object size in bytes (used for metadata fields).
```typescript
@MaxJsonSize(10240) // 10KB limit
metadata?: Record<string, any>;
```

**MaxObjectDepth:**
Validates JSON nesting depth to prevent deeply nested objects.
```typescript
@MaxObjectDepth(5) // 5 levels max
metadata?: Record<string, any>;
```

**MaxObjectKeys:**
Validates total number of keys in JSON object (prevents key explosion attacks).
```typescript
@MaxObjectKeys(50) // 50 keys max
metadata?: Record<string, any>;
```

### Input Sanitization

**HTML Sanitization:**
- Implemented via `sanitize-html` library
- Applied to user-generated text fields (description, metadata)
- Removes script tags, event handlers, dangerous attributes

**SQL Injection Prevention:**
- Prisma ORM with parameterized queries
- No raw SQL string concatenation

**XSS Prevention:**
- Input validation with regex patterns
- Output encoding on frontend (DOMPurify)
- Content Security Policy headers

---

## 6. Error Handling Strategy

### Global Exception Filter

NestJS built-in exception filter handles all errors with standardized format.

### Standard Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error message or array of messages",
  "error": "Bad Request"
}
```

### HTTP Status Codes

**2xx Success:**
- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST

**4xx Client Errors:**
- `400 Bad Request` - Validation error, malformed request
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource does not exist
- `409 Conflict` - Duplicate resource, circular reference
- `413 Payload Too Large` - File/body exceeds size limit
- `429 Too Many Requests` - Rate limit exceeded

**5xx Server Errors:**
- `500 Internal Server Error` - Unexpected server error

### Validation Error Messages

**Development Mode:**
- Detailed validation messages with field names
- Multiple error messages per request
- Example: `["Password must be at least 8 characters long", "Email is required"]`

**Production Mode:**
- Validation messages disabled (`disableErrorMessages: true`)
- Generic error responses to prevent information disclosure

### Error Logging

**Audit Logs:**
- All admin actions logged to AuditLog table
- Includes adminUserId, action, entityType, entityId, timestamp, metadata

**Application Logs:**
- Logged to console (stdout/stderr)
- Configurable log level via `LOG_LEVEL` environment variable
- Levels: error, warn, info, debug, verbose

---

## 7. Security Considerations

### CORS Configuration

**Allowed Origins:**
- Configurable via `CORS_ORIGIN` environment variable
- Comma-separated list for multiple origins
- Development: `http://localhost:5173`
- Production: Specific domain(s) only

**Allowed Methods:**
- GET, POST, PUT, DELETE, PATCH, OPTIONS

**Credentials:**
- `credentials: true` - Allows cookies to be sent

**Preflight Cache:**
- `maxAge: 86400` (24 hours) - Reduces OPTIONS requests

**Allowed Headers:**
- Content-Type, Authorization, X-Requested-With

**Exposed Headers:**
- Content-Range, X-Content-Range

---

### Cookie Security

**httpOnly Flag:**
- Cookies cannot be accessed by JavaScript
- Prevents XSS attacks from stealing tokens

**Secure Flag:**
- Cookies only sent over HTTPS in production
- Prevents man-in-the-middle attacks

**SameSite Attribute:**
- `sameSite: 'strict'` - Prevents CSRF attacks
- Cookies only sent for same-site requests

**Cookie Expiry:**
- Access Token: 15 minutes
- Refresh Token: 7 days
- Automatic expiration reduces attack window

---

### Content Security Policy (CSP)

Implemented via Helmet middleware with strict directives:

```javascript
defaultSrc: ["'self'"]
styleSrc: ["'self'"]                    // No unsafe-inline
scriptSrc: ["'self'"]                   // No unsafe-inline or unsafe-eval
imgSrc: ["'self'", "data:", "https:"]   // Allow external images
connectSrc: ["'self'"]
fontSrc: ["'self'"]
objectSrc: ["'none'"]
mediaSrc: ["'self'"]
frameSrc: ["'none'"]
baseUri: ["'self'"]
formAction: ["'self'"]
upgradeInsecureRequests: [] (production only)
```

---

### Rate Limiting

**Global Rate Limit:**
- 1000 requests per 15 minutes per IP
- Applies to all endpoints except static files

**Endpoint-Specific Throttling:**
- Login: 5 requests per 15 minutes
- Refresh: 10 requests per 60 seconds
- Analytics tracking: 200 requests per 60 seconds
- Admin mutations: 10-20 requests per 60 seconds
- Public reads: 50-200 requests per 60 seconds

**Headers:**
- Standard rate limit headers included in responses
- Client can check remaining quota

---

### Input Validation

**Type Safety:**
- TypeScript strict mode
- Runtime validation via class-validator

**Whitelist Approach:**
- `whitelist: true` - Strip undeclared properties
- `forbidNonWhitelisted: true` - Reject extra properties

**Pattern Matching:**
- Regex validation for names, keywords, paths
- Prevents injection attacks via special characters

**Size Limits:**
- String length limits (e.g., max 200 chars for names)
- Array size limits (e.g., max 20 images)
- JSON size limits (e.g., max 10KB for metadata)
- Body size limit: 10MB

---

### External Redirect Protection

**Affiliate URL Validation:**
- Must be valid HTTP/HTTPS URL
- Max length: 500 characters
- URL format validation prevents javascript: or data: URIs

**No Automatic Redirects:**
- API never redirects to affiliate URLs
- Frontend handles affiliate navigation with user confirmation

---

### File Upload Security

**Type Validation:**
- MIME type checking (server-side)
- Allowed types: image/jpeg, image/jpg, image/png, image/gif, image/webp

**Size Validation:**
- Max 10MB per file
- Enforced at Multer middleware level

**Filename Sanitization:**
- Original filename discarded
- UUID-based filename generation
- Prevents directory traversal attacks

**Storage:**
- Local filesystem (backend/uploads/)
- Separate from application code
- Static file serving with security headers

**Response Security:**
- Filename NOT included in response (LOW-B2 fix)
- Only path, mimetype, and size returned

---

### Authentication Security

**Password Requirements:**
- Min 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character

**Password Storage:**
- Bcrypt hashing with salt rounds 10
- Passwords never logged or returned in responses

**JWT Security:**
- Secret key: Min 32 characters (enforced by env.validation.ts)
- Short-lived access tokens (15 minutes)
- Refresh token rotation on refresh

**Failed Login Handling:**
- Rate limited to 5 attempts per 15 minutes
- Generic error message (no user enumeration)

---

### CSRF Protection

**Mechanism:**
- httpOnly cookies with `sameSite: 'strict'`
- No CSRF tokens required due to cookie configuration

**Note:** CSRF tokens may be added in future for additional protection.

---

### Security Headers

**Helmet Configuration:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- HSTS: max-age=31536000; includeSubDomains; preload

**Custom Headers:**
- X-Powered-By header removed

---

## 8. Versioning Strategy

### Current Approach

**No URL-Based Versioning:**
- All endpoints served at `/api/*`
- No `/v1/` or `/v2/` prefixes

**Breaking Changes Strategy:**
- Major version bump in package.json
- Migration guide documentation
- Deprecation warnings in response headers (future)

### Future Versioning Plan

If breaking changes are required:

**Option 1: URL Versioning**
```
/api/v1/products
/api/v2/products
```

**Option 2: Header Versioning**
```
Accept: application/vnd.prodview.v1+json
```

**Option 3: Query Parameter**
```
/api/products?api_version=1
```

Current recommendation: URL versioning for clarity and cacheability.

---

## 9. Additional Notes

### Pagination Strategy

**Query Parameters:**
- `page` - Page number (1-indexed)
- `pageSize` - Items per page
- `sortBy` - Sort order (where applicable)

**Response Format:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

**Limits:**
- Max page: 1000
- Max pageSize: 100
- Default pageSize varies by endpoint (10-40)

---

### Static File Serving

**Route:** `/uploads/:filename`

**Configuration:**
- Excluded from `/api` prefix
- Excluded from rate limiting
- Cache-Control: public, max-age=2592000 (30 days), immutable
- X-Content-Type-Options: nosniff

**Path Resolution:**
- Production: `dist/../../uploads` (relative to compiled code)
- Development: `backend/uploads`

---

### Database Relationships

**Many-to-Many:**
- Product ” Category (via ProductCategory join table)
- Product ” UseCase (via ProductUseCase join table)

**One-to-Many:**
- AdminUser ’ Product (createdBy)
- AdminUser ’ Product (updatedBy)
- Category ’ Category (parent-child hierarchy)

**Cascade Deletes:**
- Deleting Product cascades to ProductCategory and ProductUseCase
- Deleting Category cascades to ProductCategory
- Deleting UseCase cascades to ProductUseCase

---

### Environment Variables Reference

See `.env.example` files for complete list:
- `backend/.env.example` - Backend configuration
- `.env.example` (root) - Frontend configuration

**Critical Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Min 32 characters (validated on startup)
- `CORS_ORIGIN` - Allowed origins (comma-separated)
- `PORT` - Backend server port (default: 3000)
- `NODE_ENV` - Environment mode (development, production, test)

---

### Testing the API

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Public Endpoint:**
```bash
curl http://localhost:3000/api/products/latest?pageSize=5
```

**Admin Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@prodview.com","password":"SecurePassword123!"}' \
  -c cookies.txt
```

**Authenticated Request:**
```bash
curl http://localhost:3000/api/products/admin/all \
  -b cookies.txt
```

---

## Document Maintenance

**Last Updated:** 2026-02-15
**Reviewed By:** Principal Backend Architect
**Next Review:** When breaking changes are introduced

**Change Log:**
- 2026-02-15: Initial production-grade documentation created
- Reflects codebase state as of commit: claude_conversion_37

---

**End of API Contract Documentation**
