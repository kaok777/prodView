# ProdView Backend

NestJS + PostgreSQL + Prisma backend for ProdView affiliate product catalog.

## Stack

- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + bcrypt
- **File Upload:** Multer
- **Rate Limiting:** NestJS Throttler

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/prodview?schema=public"
JWT_SECRET="your-super-secure-jwt-secret-change-this-in-production"
JWT_EXPIRATION="24h"
PORT=3000
```

### 3. Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with default admin
npm run db:seed
```

**Default Admin Credentials:**
- Email: `vibrationconnect@gmail.com`
- Password: `Cxserfd345!`

### 4. Start Development Server

```bash
npm run start:dev
```

Backend runs on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /auth/login` - Admin login (returns JWT)
- `POST /auth/setup-first-admin` - Create first admin (one-time)

### Products (Public)

- `GET /products/latest?limit=10` - Get latest published products
- `GET /products/search?keyword=...&page=1&pageSize=100` - Search products
- `GET /products/category/:categoryId?page=1&pageSize=100` - Filter by category
- `GET /products/use-case/:useCaseId?page=1&pageSize=100` - Filter by use case
- `GET /products/:id` - Get product by ID

### Products (Admin - Requires JWT)

- `GET /products/admin/all?limit=100` - Get all products (any status)
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Categories

- `GET /categories` - Get all categories (public)
- `GET /categories/:id` - Get category by ID (public)
- `POST /categories` - Create category (admin)

### Use Cases

- `GET /use-cases` - Get all use cases (public)
- `GET /use-cases/:id` - Get use case by ID (public)
- `POST /use-cases` - Create use case (admin)

### Analytics

- `POST /analytics/track` - Track analytics event (public)
- `POST /analytics/affiliate-click` - Track affiliate click (public)
- `GET /analytics/top-products?limit=10` - Get top viewed products (admin)
- `GET /analytics/affiliate-clicks?limit=10` - Get top clicked products (admin)
- `GET /analytics/category-stats` - Get category click stats (admin)
- `GET /analytics/search-stats?limit=20` - Get popular searches (admin)

### File Upload (Admin - Requires JWT)

- `POST /upload/image` - Upload single image
- `POST /upload/images` - Upload multiple images

## Authentication

All admin endpoints require JWT authentication.

**Login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vibrationconnect@gmail.com","password":"Cxserfd345!"}'
```

**Response:**

```json
{
  "adminId": "uuid",
  "email": "vibrationconnect@gmail.com",
  "role": "admin",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Use Token:**

```bash
curl -X GET http://localhost:3000/products/admin/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Management

```bash
# Open Prisma Studio (GUI)
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:deploy
```

## Production Build

```bash
# Build
npm run build

# Run production server
npm run start:prod
```

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding
├── src/
│   ├── analytics/          # Analytics module
│   ├── auth/               # Authentication module
│   │   └── strategies/     # JWT & Local strategies
│   ├── categories/         # Categories module
│   ├── common/             # Shared services & decorators
│   ├── guards/             # Auth guards
│   ├── products/           # Products module
│   ├── upload/             # File upload module
│   ├── use-cases/          # Use cases module
│   ├── app.module.ts       # Root module
│   └── main.ts             # Bootstrap
├── uploads/                # Uploaded images
├── .env                    # Environment variables
└── package.json
```

## Security Features

- **JWT Authentication:** Secure token-based auth
- **bcrypt Password Hashing:** 12 salt rounds
- **Rate Limiting:** Configurable per endpoint
- **Input Validation:** XSS prevention, URL validation
- **Role-Based Access Control:** Admin vs public
- **Audit Logging:** All admin actions logged

## Migration from Convex

This backend replaces Convex entirely:

- ✅ PostgreSQL database with proper relations
- ✅ JWT-based authentication (fixes Convex auth issues)
- ✅ Efficient category/use case filtering with joins
- ✅ Real file upload handling
- ✅ Production-ready security
- ✅ No hardcoded credentials in code (env vars)

## Notes

- Change `JWT_SECRET` in production
- Change default admin password after first login
- Configure CORS origins for production
- Set up PostgreSQL backups
- Use environment-specific `.env` files
