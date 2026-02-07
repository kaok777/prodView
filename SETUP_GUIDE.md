# ProdView Complete Setup Guide

## Quick Overview

ProdView is now fully configured and ready to run. This guide will help a new engineer set up and run the application from scratch.

---

## 📋 System Requirements

- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 14.0 or higher
- **npm**: 9.0.0 or higher (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux

---

## 🚀 Complete Setup (15-20 minutes)

### Step 1: Install Prerequisites

#### Install Node.js
1. Visit [nodejs.org](https://nodejs.org/)
2. Download and install Node.js 20.x LTS
3. Verify installation:
```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show 9.x.x or higher
```

#### Install PostgreSQL
1. Visit [postgresql.org/download](https://www.postgresql.org/download/)
2. Download and install PostgreSQL 14+
3. During installation, remember the postgres user password
4. Verify installation:
```bash
psql --version  # Should show PostgreSQL 14.x or higher
```

### Step 2: Clone the Repository

```bash
git clone <repository-url>
cd prodView
```

### Step 3: Setup Database

```bash
# Start PostgreSQL service (if not running)
# Linux/Mac:
sudo service postgresql start
# Windows: PostgreSQL should start automatically

# Create database
psql -U postgres
# In PostgreSQL shell, run:
CREATE DATABASE prodview;
\q
```

### Step 4: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies (this may take 2-3 minutes)
npm install

# Copy environment template
cp .env.example .env

# IMPORTANT: Edit .env file
# Windows: notepad .env
# Mac/Linux: nano .env
# Update these variables:
# - DATABASE_URL (set correct password for postgres user)
# - JWT_SECRET (generate a random string of 32+ characters)
```

**Example `.env` configuration:**
```bash
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/prodview?schema=public"
JWT_SECRET="randomly-generated-secret-key-min-32-characters-here"
JWT_EXPIRATION="24h"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with sample data (optional but recommended)
npm run db:seed

# Start backend server
npm run start:dev
```

**Expected output:**
```
[Nest] INFO [NestApplication] Nest application successfully started +2ms
Backend running on http://localhost:3000
```

Keep this terminal open and running.

### Step 5: Setup Frontend (New Terminal)

```bash
# Open a NEW terminal/command prompt
# Navigate to project root
cd /path/to/prodView

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Verify .env contains:
# VITE_API_URL=http://localhost:3000
```

```bash
# Start frontend development server
npm run dev
```

**Expected output:**
```
VITE v6.2.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Your browser should automatically open to `http://localhost:5173`

---

## ✅ Verification Checklist

After setup, verify everything works:

### Backend Health Check
1. Open: http://localhost:3000
2. You should see: `{"message":"ProdView API is running"}`

### Frontend Access
1. Open: http://localhost:5173
2. You should see the ProdView homepage

### Admin Login (if seeded)
1. Navigate to: http://localhost:5173/admin/login
2. Login with:
   - Email: `admin@prodview.com`
   - Password: `ChangeThisPassword123!`
3. You should see the admin dashboard

### Database Connection
```bash
# In backend directory
npm run prisma:studio
```
This opens Prisma Studio at http://localhost:5555 where you can view/edit database records.

---

## 📁 Final Folder Structure

```
prodView/
├── backend/                     # Backend API (NestJS)
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── migrations/         # Database migration history
│   │   └── seed.ts            # Sample data seeder
│   ├── src/                    # Source code
│   │   ├── auth/              # JWT authentication
│   │   ├── products/          # Product CRUD
│   │   ├── categories/        # Categories management
│   │   ├── use-cases/         # Use cases management
│   │   ├── analytics/         # Analytics tracking
│   │   ├── upload/            # File upload handling
│   │   ├── audit/             # Audit logging
│   │   ├── common/            # Shared services
│   │   ├── guards/            # Auth guards
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Application entry
│   ├── uploads/               # Uploaded product images
│   │   └── .gitkeep
│   ├── .env                   # Environment variables (not committed)
│   ├── .env.example           # Environment template
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── src/                        # Frontend (React + Vite)
│   ├── components/            # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   ├── LeftSidebar.tsx
│   │   ├── RightSidebar.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductImage.tsx
│   │   └── ...
│   ├── pages/                 # Page components
│   │   ├── HomePage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── ProductSelectionPage.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminLoginPage.tsx
│   │       ├── ProductEditorPage.tsx
│   │       └── AdminAnalytics.tsx
│   ├── hooks/                 # Custom React hooks
│   │   └── useAnalytics.ts
│   ├── lib/                   # Utilities
│   │   └── api.ts            # Axios API client
│   ├── utils/                 # Helper functions
│   │   ├── security.ts
│   │   └── seo.ts
│   ├── contexts/              # React Context providers
│   │   └── ThemeContext.tsx
│   ├── App.tsx               # Main App component
│   └── main.tsx              # Application entry
│
├── public/                    # Static assets
│   ├── robots.txt
│   └── security.txt
│
├── .env                       # Frontend environment (not committed)
├── .env.example              # Frontend environment template
├── .gitignore
├── package.json              # Frontend dependencies
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS config
├── tsconfig.json             # TypeScript config
├── README.md                 # Main documentation
├── DEPLOYMENT.md             # Deployment guide
└── SETUP_GUIDE.md           # This file
```

---

## 🔧 Common Development Commands

### Backend

```bash
cd backend

# Development (with hot reload)
npm run start:dev

# Build for production
npm run build

# Start production build
npm run start:prod

# Database operations
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Create and run migration
npm run prisma:studio      # Open database GUI
npm run db:seed           # Seed with sample data

# Code formatting
npm run format
```

### Frontend

```bash
# From project root

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run lint

# Code formatting
npm run format
```

---

## 🎯 Verified Run Commands

### Start Development Environment

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

**Frontend:**
```bash
npm run build
# Output will be in dist/ directory
```

---

## 📦 Deployment Checklist

Before deploying to production:

- [ ] Update `.env` files with production values
- [ ] Generate strong JWT_SECRET (min 32 characters)
- [ ] Change default admin credentials
- [ ] Configure CORS_ORIGIN for your domain
- [ ] Set up PostgreSQL production database
- [ ] Configure SSL/TLS certificates
- [ ] Set up domain DNS records
- [ ] Enable database backups
- [ ] Configure monitoring/logging
- [ ] Test all endpoints
- [ ] Run security audit: `npm audit`
- [ ] Update ALLOWED_FILE_EXTENSIONS if needed
- [ ] Configure rate limiting for production traffic

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `Cannot connect to database`
```bash
# Check PostgreSQL is running
sudo service postgresql status  # Linux
brew services list | grep postgresql  # Mac
# Windows: Check Services app

# Verify DATABASE_URL in backend/.env
# Ensure database 'prodview' exists
psql -U postgres -l | grep prodview
```

**Error:** `Port 3000 is already in use`
```bash
# Kill process on port 3000
# Linux/Mac:
lsof -ti:3000 | xargs kill -9
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Frontend won't start

**Error:** `Cannot connect to backend`
- Verify backend is running on port 3000
- Check `VITE_API_URL` in frontend `.env`
- Try `http://localhost:3000` in browser (should show API message)

**Error:** `Port 5173 is already in use`
- Vite will automatically use next available port (5174, 5175, etc.)
- Or kill process on port 5173

### Database migration fails

```bash
cd backend

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Regenerate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### Cannot upload images

```bash
# Ensure uploads directory exists and is writable
cd backend
ls -la uploads/  # Should exist with .gitkeep
chmod 755 uploads/  # Linux/Mac
```

---

## 📚 Additional Resources

- **Main Documentation**: [README.md](./README.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **NestJS Docs**: https://docs.nestjs.com/
- **React Docs**: https://react.dev/
- **Prisma Docs**: https://www.prisma.io/docs/
- **Vite Docs**: https://vitejs.dev/

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review error logs in terminal
3. Check [README.md](./README.md) for detailed info
4. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)

---

## ✨ You're All Set!

Your ProdView application should now be running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Admin Panel**: http://localhost:5173/admin/login
- **Prisma Studio**: Run `npm run prisma:studio` in backend/

Happy coding! 🚀
