# ProdView

ProdView is an affiliate marketing landing platform designed to serve as the destination website for traffic from social media advertising campaigns. The platform provides a product showcase with category filtering, use case tagging, clickable navigation, and affiliate link tracking with analytics.

## Overview

ProdView is a full-stack web application built with a decoupled architecture:

- **Frontend**: React 19 single-page application with TypeScript, TailwindCSS, and modern routing
- **Backend**: NestJS REST API with PostgreSQL database, Prisma ORM, JWT authentication, and file upload handling
- **Purpose**: Affiliate marketing landing pages with product discovery, filtering, and conversion tracking

The platform allows administrators to manage products, categories, and use cases through a protected admin dashboard, while providing public users with an optimized product discovery experience with SEO-friendly pages, dark/light theme support, and affiliate click tracking.

## Tech Stack

### Frontend
- **Framework**: React 19.2.1
- **Build Tool**: Vite 6.2.0
- **Language**: TypeScript 5.7.2
- **Styling**: TailwindCSS 3.x with custom CSS variables
- **Routing**: React Router DOM 7.13.0
- **State Management**: React Context (ThemeContext) + local state
- **Forms**: React Hook Form 7.71.1 with Zod 4.3.6 validation
- **HTTP Client**: Axios 1.6.7
- **UI Components**: Lucide React icons, custom components
- **SEO**: react-helmet-async 2.0.5 with Schema.org structured data
- **Sanitization**: DOMPurify 3.3.1
- **Notifications**: Sonner 2.0.3

### Backend
- **Framework**: NestJS 10.3.0
- **Language**: TypeScript 5.3.3
- **Database**: PostgreSQL (via Prisma ORM 5.22.0)
- **Authentication**: JWT (Passport.js) with bcryptjs password hashing
- **Security**: Helmet 7.1.0, CORS, rate limiting (express-rate-limit)
- **File Upload**: Multer 1.4.5-lts.1
- **Validation**: class-validator 0.14.1, class-transformer 0.5.1
- **Configuration**: @nestjs/config 3.1.1
- **Scheduling**: @nestjs/schedule 6.1.1
- **HTML Sanitization**: sanitize-html 2.11.0

### Development Tools
- **Node.js**: >=18.0.0
- **Package Manager**: npm
- **Linting**: ESLint (TypeScript ESLint)
- **Formatting**: Prettier 3.x
- **Path Aliases**: @/ for src/ (frontend only)

## Environment Setup

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (included with Node.js)
- **PostgreSQL**: 14.0 or higher
- **Operating System**: Linux, macOS, or Windows with WSL2

### Installation

#### 1. Clone Repository

```bash
git clone <repository-url>
cd prodView
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables (see Environment Variables section)
# Update DATABASE_URL, JWT_SECRET, and other required variables
nano .env  # or use your preferred editor

# Generate Prisma Client
npm run prisma:generate

# Create database (if not exists)
# Connect to PostgreSQL: psql -U postgres
# CREATE DATABASE prodview;
# \q

# Run database migrations
npm run prisma:migrate

# Seed database with sample data (optional)
npm run db:seed
```

#### 3. Frontend Setup

```bash
# Return to project root
cd ..

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
# Verify VITE_API_URL points to backend (default: http://localhost:3000/api)
nano .env
```

#### 4. Create Admin User

```bash
cd backend

# Run interactive admin creation script
npm run create-admin

# Follow prompts to enter email and password
# Password requirements: min 8 chars, uppercase, lowercase, digit, special char
```

For detailed admin user management, see `ADMIN_USER_RESET_GUIDE.md`.

### Development

#### Start Development Servers

**Option 1: Automated Startup (Recommended)**
```bash
# From project root (requires bash shell)
./start-dev.sh
```

**Option 2: Manual Startup**
```bash
# Terminal 1: Start PostgreSQL (if not running as service)
sudo service postgresql start

# Terminal 2: Start Backend (from project root)
cd backend
npm run start:dev

# Terminal 3: Start Frontend (from project root)
npm run dev
```

**Expected Behavior**:
- Backend API runs on `http://localhost:3000`
- Frontend dev server runs on `http://localhost:5173`
- Frontend automatically opens in default browser

#### Backend Development Commands

```bash
cd backend

# Development server with hot reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Debug mode
npm run start:debug

# Format code
npm run format
```

#### Frontend Development Commands

```bash
# Development server (opens browser automatically)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking without build
npm run lint

# Format code
npm run format
```

### Build

#### Production Build

**Backend**:
```bash
cd backend
npm run build
# Output: backend/dist/
```

**Frontend**:
```bash
npm run build
# Output: dist/
```

### Preview

Preview production build locally:

```bash
npm run preview
# Serves from dist/ on http://localhost:4173
```

## 📁 Project Structure

```
prodView/
├── backend/                    # NestJS Backend
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── migrations/        # Database migrations
│   │   └── seed.ts           # Database seeding script
│   ├── src/
│   │   ├── auth/             # Authentication module
│   │   ├── products/         # Products module
│   │   ├── categories/       # Categories module
│   │   ├── use-cases/        # Use cases module
│   │   ├── analytics/        # Analytics module
│   │   ├── upload/           # File upload module
│   │   ├── audit/            # Audit logging
│   │   ├── common/           # Shared services
│   │   ├── guards/           # Auth guards
│   │   ├── app.module.ts     # Root module
│   │   └── main.ts           # Entry point
│   ├── uploads/              # Uploaded files (gitignored)
│   ├── .env.example          # Environment template
│   ├── package.json
│   └── tsconfig.json
│
├── src/                       # React Frontend
│   ├── components/           # Reusable components
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProductCard.tsx
│   │   └── ...
│   ├── pages/                # Page components
│   │   ├── HomePage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── ProductSelectionPage.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminLoginPage.tsx
│   │       ├── ProductEditorPage.tsx
│   │       └── AdminAnalytics.tsx
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities
│   │   └── api.ts           # Axios client
│   ├── utils/                # Helper functions
│   ├── contexts/             # React contexts
│   └── main.tsx             # Entry point
│
├── public/                   # Static assets
├── .env.example             # Frontend environment template
├── package.json             # Frontend dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── README.md               # This file
```

## 🔐 Environment Variables

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | - | ✅ |
| `JWT_EXPIRATION` | JWT token expiration time | `24h` | ✅ |
| `PORT` | API server port | `3000` | ✅ |
| `NODE_ENV` | Environment mode | `development` | ✅ |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5173` | ✅ |
| `UPLOAD_DIR` | File upload directory | `./uploads` | ✅ |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` | ✅ |
| `RATE_LIMIT_TTL` | Rate limit window (seconds) | `60` | ⚠️ |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | ⚠️ |
| `ADMIN_EMAIL` | Default admin email (seed) | - | ⚠️ |
| `ADMIN_PASSWORD` | Default admin password (seed) | - | ⚠️ |

### Frontend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` | ✅ |

## 🗃️ Database

### Creating the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE prodview;

# Grant permissions (if needed)
GRANT ALL PRIVILEGES ON DATABASE prodview TO your_user;

# Exit
\q
```

### Running Migrations

```bash
cd backend

# Development - creates migration and applies it
npm run prisma:migrate

# Production - applies existing migrations
npm run prisma:deploy

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

## 👤 Default Admin Account

After running `npm run db:seed` in the backend:

- **Email**: `admin@prodview.com` (or value from `.env`)
- **Password**: `ChangeThisPassword123!` (or value from `.env`)

**⚠️ IMPORTANT**: Change these credentials immediately in production!

## 🎯 API Endpoints

### Public Endpoints

- `GET /products/latest?limit=10` - Get latest products
- `GET /products/:id` - Get product by ID
- `GET /products/search?keyword=...` - Search products
- `GET /products/category/:id` - Get products by category
- `GET /products/use-case/:id` - Get products by use case
- `GET /categories` - Get all categories
- `GET /use-cases` - Get all use cases
- `POST /analytics/track` - Track analytics event
- `POST /analytics/affiliate-click` - Track affiliate click

### Admin Endpoints (Requires JWT)

- `POST /auth/login` - Admin login
- `POST /auth/refresh` - Refresh JWT token
- `GET /products/admin/all` - Get all products (admin view)
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `POST /upload/image` - Upload product image
- `GET /analytics/top-products` - Get analytics data
- `GET /analytics/affiliate-clicks` - Get click data
- `GET /analytics/category-stats` - Get category stats
- `GET /analytics/search-stats` - Get search stats

## 🧪 Testing

```bash
# Backend tests (if configured)
cd backend
npm run test

# Frontend tests (if configured)
npm run test
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for:

- VPS/Cloud deployment (DigitalOcean, AWS, etc.)
- Docker deployment
- Environment configuration
- Database setup
- SSL/TLS configuration
- CI/CD pipelines

## 🔒 Security Considerations

1. **Change default credentials** in `.env` files
2. **Use strong JWT_SECRET** (minimum 32 characters)
3. **Enable HTTPS** in production
4. **Configure CORS** properly for your domain
5. **Set secure database password**
6. **Implement rate limiting** (already configured)
7. **Regular security updates** for dependencies
8. **Backup database** regularly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Backend won't start

- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env`
- Run migrations: `npm run prisma:migrate`
- Check port 3000 is not in use: `lsof -i :3000`

### Frontend can't connect to backend

- Verify backend is running on port 3000
- Check VITE_API_URL in frontend `.env`
- Check CORS_ORIGIN in backend `.env`
- Clear browser cache and restart dev server

### Database connection errors

- Verify PostgreSQL service is running
- Check DATABASE_URL format is correct
- Ensure database `prodview` exists
- Verify user has proper permissions

### Images not rendering/loading

**Root cause:** Backend server not running (serves static files)

**Quick fix:**
```bash
# Start all servers
./start-dev.sh

# Or manually start backend
cd backend && npm run start:dev
```

**Detailed guide:** See [`mdFiles/IMAGE_FIX_RESOLUTION.md`](./mdFiles/IMAGE_FIX_RESOLUTION.md)

### Image upload fails

- Check UPLOAD_DIR exists and is writable
- Verify MAX_FILE_SIZE is appropriate
- Check file extension is allowed
- Ensure backend server is running

## 📧 Support

For issues and questions:
- Open a [GitHub Issue](https://github.com/your-repo/issues)
- Check existing documentation
- Review error logs in backend console

---

Built with ❤️ using NestJS, React, and PostgreSQL
