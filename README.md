# ProdView

**ProdView** is a modern affiliate product showcase platform built with a decoupled architecture featuring a NestJS backend API and React frontend.

## 🏗️ Architecture

- **Backend**: NestJS + PostgreSQL + Prisma ORM
- **Frontend**: React + Vite + TailwindCSS
- **Authentication**: JWT-based with bcrypt password hashing
- **File Storage**: Local filesystem with Multer
- **Database**: PostgreSQL with Prisma migrations

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: >= 18.0.0 ([Download](https://nodejs.org/))
- **PostgreSQL**: >= 14.0 ([Download](https://www.postgresql.org/download/))
- **npm**: >= 9.0.0 (comes with Node.js)
- **Git**: Latest version

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd prodView
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and configure your database connection
# Update DATABASE_URL, JWT_SECRET, and other variables
nano .env  # or use your preferred editor

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed the database with sample data
npm run db:seed

# Start the backend server
npm run start:dev
```

The backend API will be available at `http://localhost:3000`

### 3. Frontend Setup

```bash
# Navigate to project root (if in backend/)
cd ..

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env to point to your backend
nano .env  # Verify VITE_API_URL=http://localhost:3000

# Start the development server
npm run dev
```

The frontend will open automatically at `http://localhost:5173`

## 🔧 Development

### Backend Commands

```bash
cd backend

# Development (with hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database commands
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run migrations (dev)
npm run prisma:deploy      # Deploy migrations (production)
npm run prisma:studio      # Open Prisma Studio (database GUI)

# Seed database
npm run db:seed

# Code formatting
npm run format
```

### Frontend Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Type checking
npm run lint

# Code formatting
npm run format
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

### Image upload fails

- Check UPLOAD_DIR exists and is writable
- Verify MAX_FILE_SIZE is appropriate
- Check file extension is allowed

## 📧 Support

For issues and questions:
- Open a [GitHub Issue](https://github.com/your-repo/issues)
- Check existing documentation
- Review error logs in backend console

---

Built with ❤️ using NestJS, React, and PostgreSQL
