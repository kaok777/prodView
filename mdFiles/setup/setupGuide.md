# ProdView Local Development Setup Guide

**Version:** 1.0
**Last Updated:** 2026-02-15
**Target Audience:** Software Engineers, Full-Stack Developers

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Configuration](#frontend-configuration)
5. [Database Setup](#database-setup)
6. [Admin User Management](#admin-user-management)
7. [Seeding Sample Data](#seeding-sample-data)
8. [Running the Application](#running-the-application)
9. [Production Build Testing](#production-build-testing)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Verification Command |
|----------|----------------|-------------|---------------------|
| Node.js | 18.0.0 | 18.x LTS or 20.x LTS | `node --version` |
| npm | 9.0.0 | Latest bundled with Node | `npm --version` |
| PostgreSQL | 14.0 | 14.x or 15.x | `psql --version` |
| Git | 2.30.0 | Latest stable | `git --version` |

### Operating System

- **Linux**: Ubuntu 20.04+, Debian 11+, Fedora 35+
- **macOS**: 11 (Big Sur) or later
- **Windows**: Windows 10/11 with WSL2 (Ubuntu 20.04+ recommended)

**Note:** Windows without WSL2 is NOT recommended due to path handling and PostgreSQL compatibility issues.

### System Requirements

- **RAM**: Minimum 4GB (8GB recommended for concurrent development)
- **Disk Space**: 2GB free space (node_modules + database)
- **Network**: Internet connection for package installation

---

## Repository Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd prodView
```

### 2. Verify Repository Structure

```bash
# Expected directories
ls -la
# Should show: backend/, src/, public/, mdFiles/, etc.

# Verify critical files exist
ls -1 package.json backend/package.json backend/prisma/schema.prisma
```

### 3. Install Frontend Dependencies

```bash
# From project root
npm install
```

**Expected Output:**
- Installs React 19.2.1, Vite 6.2.0, TypeScript 5.7.2, and all frontend dependencies
- Should complete without WARN or ERR messages (peer dependency warnings acceptable)

**If you encounter peer dependency conflicts with React 19:**
```bash
npm install --legacy-peer-deps
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

**Expected Output:**
- Installs NestJS 10.3.0, Prisma 5.22.0, and backend dependencies
- Prisma client will be generated during postinstall script

---

## Backend Configuration

### 1. Create Environment File

```bash
cd backend
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `backend/.env` with your local settings:

```env
# Database Configuration
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/prodview?schema=public"

# JWT Configuration
JWT_SECRET="CHANGE_THIS_TO_RANDOM_32_CHAR_STRING_MINIMUM"
JWT_EXPIRATION="24h"

# Server Configuration
PORT=3000
NODE_ENV="development"

# CORS Configuration
CORS_ORIGIN="http://localhost:5173"
CORS_MAX_AGE=86400

# File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Admin Seeding (Optional - for db:seed script)
ADMIN_EMAIL="admin@prodview.com"
ADMIN_PASSWORD="ChangeThisPassword123!"
```

### Critical Configuration Notes

#### DATABASE_URL
- **Format:** `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`
- **Default PostgreSQL User:** `postgres`
- **Common Ports:** 5432 (default)
- **Database Name:** Must be `prodview` (matches Prisma schema)

**Example for local PostgreSQL:**
```
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/prodview?schema=public"
```

#### JWT_SECRET
- **Requirement:** Minimum 32 characters (enforced by env.validation.ts)
- **Generation:**
  ```bash
  # Generate cryptographically secure secret
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Security:** NEVER commit real secrets to version control

#### CORS_ORIGIN
- **Development:** `http://localhost:5173` (Vite default port)
- **Multiple Origins:** Comma-separated if needed
- **Wildcard:** NOT recommended even in development

#### UPLOAD_DIR
- **Default:** `./uploads` (relative to backend directory)
- **Permissions:** Must be writable by Node.js process
- **Gitignore:** Already configured to ignore uploads/

---

## Frontend Configuration

### 1. Create Environment File

```bash
# From project root
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` (frontend root):

```env
# Backend API Configuration
VITE_API_URL="http://localhost:3000"

# Optional: Feature Flags
ENABLE_CHEF=false
```

### Configuration Notes

#### VITE_API_URL
- **Must NOT include trailing slash**
- **Must NOT include /api suffix** (handled by api.ts)
- **Development:** `http://localhost:3000`
- **Production:** Set to your deployed backend URL

**Common Mistakes:**
- L `VITE_API_URL="http://localhost:3000/"`
- L `VITE_API_URL="http://localhost:3000/api"`
-  `VITE_API_URL="http://localhost:3000"`

#### ENABLE_CHEF
- **Purpose:** Feature flag for Vite plugin (development tool)
- **Default:** `false`
- **Production:** MUST be `false`

---

## Database Setup

### 1. Start PostgreSQL Service

**Linux (Ubuntu/Debian):**
```bash
sudo service postgresql start
sudo service postgresql status  # Verify running
```

**macOS (Homebrew):**
```bash
brew services start postgresql@14
brew services list  # Verify running
```

**Docker Alternative:**
```bash
docker run --name prodview-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=prodview \
  -p 5432:5432 \
  -d postgres:14
```

### 2. Create Database

**Method 1: psql Command Line**
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Inside psql prompt
CREATE DATABASE prodview;

# Grant permissions (if using non-postgres user)
GRANT ALL PRIVILEGES ON DATABASE prodview TO yourusername;

# Exit psql
\q
```

**Method 2: Direct Command**
```bash
createdb -U postgres prodview
```

### 3. Verify Database Connection

```bash
cd backend

# Test connection using Prisma
npx prisma db pull --schema=./prisma/schema.prisma

# Expected: Should connect successfully (may show no tables yet)
```

**If connection fails:**
- Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check DATABASE_URL in backend/.env
- Verify database exists: `psql -U postgres -l | grep prodview`

### 4. Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

**Expected Output:**
```
 Generated Prisma Client to ./node_modules/@prisma/client
```

### 5. Run Database Migrations

```bash
cd backend
npm run prisma:migrate
```

**This creates all tables:**
- `AdminUser` - Administrator accounts
- `Category` - Product categories
- `UseCase` - Product use case tags
- `Product` - Product listings with metadata
- `AnalyticsEvent` - User interaction tracking

**Expected Output:**
```
Database reset successful
Running migrations...
 Applied X migrations
```

### 6. Verify Schema

```bash
cd backend

# Open Prisma Studio to inspect database
npm run prisma:studio
```

**Opens:** Browser at `http://localhost:5555` with visual database editor

**Expected Tables:**
- AdminUser (empty)
- Category (empty)
- UseCase (empty)
- Product (empty)
- AnalyticsEvent (empty)

---

## Admin User Management

### Create Admin User (Interactive CLI)

```bash
cd backend
npm run create-admin
```

**Interactive Prompts:**
```
Enter admin email: admin@prodview.com
Enter admin password: ********
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character (!@#$%^&*)

**Example Valid Passwords:**
- `SecurePass123!`
- `Admin@2026Pass`
- `MyStr0ng!Pwd`

**Success Output:**
```
Admin user created successfully!
Email: admin@prodview.com
```

**Implementation Details:**
- Script: `backend/src/scripts/create-admin.ts`
- Password hashing: bcryptjs with salt rounds 10
- Validation: class-validator decorators
- Idempotent: Creates only if email doesn't exist

### Verify Admin User

```bash
cd backend
npx prisma studio
```

Navigate to `AdminUser` table - should show 1 record with hashed password.

### Reset Admin User (if needed)

See `ADMIN_USER_RESET_GUIDE.md` for complete instructions on clearing and recreating admin users.

---

## Seeding Sample Data

### Seed Categories and Use Cases

```bash
cd backend
npm run db:seed
```

**What Gets Created:**

**Categories:**
1. Electronics
2. Software
3. Services

**Use Cases:**
1. Business
2. Personal
3. Education

**Expected Output:**
```
Starting database seed...
Created 3 categories
Created 3 use cases
Database seed completed successfully!
```

**Idempotency:** Script will fail if categories/use cases already exist (unique constraint). To re-seed:

```bash
cd backend

# Method 1: Delete via Prisma Studio
npm run prisma:studio
# Manually delete all Category and UseCase records

# Method 2: Reset entire database (  DESTRUCTIVE)
npx prisma migrate reset
npm run db:seed
```

### Verify Seeded Data

```bash
cd backend
npx prisma studio
```

**Expected State:**
- `Category` table: 3 records
- `UseCase` table: 3 records
- `Product` table: 0 records (create via admin dashboard)

---

## Running the Application

### Development Mode (Recommended)

#### Option 1: Automated Startup Script

```bash
# From project root
./start-dev.sh
```

**What This Does:**
1. Verifies PostgreSQL is running
2. Starts backend dev server (port 3000)
3. Starts frontend dev server (port 5173)
4. Opens browser to `http://localhost:5173`

**Requirements:**
- Bash shell (Linux/macOS/WSL2)
- Executable permissions: `chmod +x start-dev.sh`

#### Option 2: Manual Startup (Three Terminals)

**Terminal 1: PostgreSQL (if not running as service)**
```bash
sudo service postgresql start
```

**Terminal 2: Backend Development Server**
```bash
cd backend
npm run start:dev
```

**Expected Output:**
```
[Nest] INFO [NestApplication] Nest application successfully started
[Nest] INFO [RoutesResolver] Mapped {/health, GET} route
Backend server running on http://localhost:3000
```

**Terminal 3: Frontend Development Server**
```bash
# From project root
npm run dev
```

**Expected Output:**
```
VITE v6.2.0  ready in 1234 ms

œ  Local:   http://localhost:5173/
œ  Network: use --host to expose
œ  press h + enter to show help
```

### Verify Application Is Running

**Backend Health Check:**
```bash
curl http://localhost:3000/health
```

**Expected Response:** `{"status":"ok","database":"connected"}`

**Frontend Access:**
- Open browser to `http://localhost:5173`
- Should see ProdView home page
- Network requests to `http://localhost:3000/api/*` should succeed

### Access Admin Dashboard

1. Navigate to `http://localhost:5173/admin/login`
2. Enter admin credentials (from create-admin step)
3. Should redirect to `http://localhost:5173/admin/dashboard`

**If login fails:**
- Verify admin user exists: `cd backend && npx prisma studio`
- Check browser console for API errors
- Verify backend is running: `curl http://localhost:3000/api/auth/login`

---

## Production Build Testing

### Build Backend

```bash
cd backend
npm run build
```

**Expected Output:**
- Creates `backend/dist/` directory
- Compiles TypeScript to JavaScript
- No TypeScript errors

**Verify Build:**
```bash
ls -la backend/dist/
# Should show compiled .js files matching src/ structure
```

### Build Frontend

```bash
# From project root
npm run build
```

**Expected Output:**
- Creates `dist/` directory
- Bundles with Vite
- Optimizes assets (minification, tree-shaking)
- No TypeScript errors

**Build Artifacts:**
```bash
ls -la dist/
# Should show:
# - index.html (entry point)
# - assets/ (bundled JS/CSS with hashed filenames)
```

### Preview Production Build Locally

```bash
npm run preview
```

**Expected Output:**
```
œ  Local:   http://localhost:4173/
œ  Network: use --host to expose
```

**Testing Checklist:**
- [ ] Homepage loads without errors
- [ ] Product filtering works
- [ ] Product detail pages render
- [ ] Admin login accessible
- [ ] Theme toggle works (light/dark)
- [ ] Images load correctly (if products exist)
- [ ] Console shows no errors

### Test Production Backend

```bash
cd backend
npm run start:prod
```

**Prerequisites:**
- Must run `npm run build` first
- Requires `NODE_ENV=production` in .env

**Expected Behavior:**
- Runs from `dist/` compiled code
- Production optimizations enabled
- Logging reduced (no debug messages)

---

## Troubleshooting

### PostgreSQL Connection Issues

**Symptom:** Backend fails to start with "Can't reach database server"

**Solutions:**

1. **Verify PostgreSQL is running:**
   ```bash
   pg_isready -h localhost -p 5432
   ```
   Expected: `localhost:5432 - accepting connections`

2. **Check DATABASE_URL format:**
   ```bash
   cd backend
   grep DATABASE_URL .env
   ```
   Must match: `postgresql://USER:PASS@localhost:5432/prodview?schema=public`

3. **Verify database exists:**
   ```bash
   psql -U postgres -l | grep prodview
   ```
   Should list `prodview` database

4. **Test direct connection:**
   ```bash
   psql -U postgres -d prodview
   ```
   Should connect without error

**Common Mistakes:**
- Wrong password in DATABASE_URL
- Database name typo (must be `prodview`)
- PostgreSQL not running
- Firewall blocking port 5432

---

### Backend Won't Start

**Symptom:** `npm run start:dev` fails or hangs

**Solutions:**

1. **Check port 3000 availability:**
   ```bash
   lsof -i :3000
   ```
   If occupied, kill the process or change PORT in .env

2. **Verify environment variables:**
   ```bash
   cd backend
   cat .env | grep -E "DATABASE_URL|JWT_SECRET|PORT"
   ```
   All required variables must be set

3. **Regenerate Prisma Client:**
   ```bash
   cd backend
   npm run prisma:generate
   ```

4. **Check for compilation errors:**
   ```bash
   cd backend
   npx tsc --noEmit
   ```

5. **Clear node_modules and reinstall:**
   ```bash
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   ```

---

### Frontend Can't Connect to Backend

**Symptom:** "Network Error" or "Failed to fetch" in browser console

**Solutions:**

1. **Verify backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"ok",...}`

2. **Check VITE_API_URL:**
   ```bash
   grep VITE_API_URL .env
   ```
   Must be: `VITE_API_URL="http://localhost:3000"` (no trailing slash)

3. **Verify CORS configuration:**
   ```bash
   cd backend
   grep CORS_ORIGIN .env
   ```
   Must be: `CORS_ORIGIN="http://localhost:5173"`

4. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (macOS)
   - Or open DevTools ’ Network tab ’ Disable cache

5. **Restart both servers:**
   ```bash
   # Kill all Node processes
   pkill -f node

   # Restart from scratch
   cd backend && npm run start:dev
   # In new terminal
   npm run dev
   ```

---

### Database Migration Errors

**Symptom:** `npm run prisma:migrate` fails with errors

**Solutions:**

1. **Check Prisma schema syntax:**
   ```bash
   cd backend
   npx prisma validate
   ```

2. **Reset database (  DESTRUCTIVE):**
   ```bash
   cd backend
   npx prisma migrate reset
   ```
   This will:
   - Drop database
   - Recreate database
   - Run all migrations
   - Run seed script

3. **Manual migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name migration_name
   ```

---

### Images Not Loading

**Symptom:** Product images show broken image icon or 404 errors

**Root Cause:** Backend server must be running to serve static files from `backend/uploads/`

**Solutions:**

1. **Verify backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check uploads directory exists:**
   ```bash
   ls -la backend/uploads/
   ```
   If missing: `mkdir -p backend/uploads`

3. **Verify static file serving:**
   ```bash
   curl -I http://localhost:3000/uploads/some-existing-file.jpg
   ```
   Should return `200 OK` (if file exists)

4. **Upload test image via admin dashboard:**
   - Login to admin dashboard
   - Create/edit product
   - Upload image
   - Verify file appears in `backend/uploads/`

**For detailed troubleshooting, see:** `mdFiles/images/IMAGE_FIX_RESOLUTION.md`

---

### Admin Login Fails

**Symptom:** "Invalid credentials" error despite correct password

**Solutions:**

1. **Verify admin user exists:**
   ```bash
   cd backend
   npx prisma studio
   ```
   Check `AdminUser` table for record

2. **Recreate admin user:**
   ```bash
   cd backend
   npm run create-admin
   ```
   Use different email or delete existing user first

3. **Check JWT configuration:**
   ```bash
   cd backend
   grep JWT_SECRET .env
   ```
   Must be at least 32 characters

4. **Clear browser cookies:**
   - DevTools ’ Application ’ Cookies
   - Delete all cookies for localhost:5173

5. **Verify password meets requirements:**
   - Minimum 8 characters
   - Must include uppercase, lowercase, digit, special character

**For complete admin user management, see:** `ADMIN_USER_RESET_GUIDE.md`

---

### TypeScript Compilation Errors

**Symptom:** `npm run build` fails with TypeScript errors

**Solutions:**

1. **Check TypeScript version:**
   ```bash
   npx tsc --version
   ```
   Frontend: 5.7.2, Backend: 5.3.3

2. **Verify tsconfig.json:**
   ```bash
   cat tsconfig.json
   cat backend/tsconfig.json
   ```

3. **Clear TypeScript cache:**
   ```bash
   # Frontend
   rm -rf node_modules/.vite tsconfig.tsbuildinfo

   # Backend
   cd backend
   rm -rf node_modules/.cache dist tsconfig.tsbuildinfo
   ```

4. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install

   cd backend
   rm -rf node_modules package-lock.json
   npm install
   ```

---

### Port Already in Use

**Symptom:** "Port 3000 already in use" or "Port 5173 already in use"

**Solutions:**

1. **Find process using port:**
   ```bash
   # Backend port
   lsof -i :3000

   # Frontend port
   lsof -i :5173
   ```

2. **Kill process:**
   ```bash
   kill -9 <PID>
   ```

3. **Change port in configuration:**
   ```bash
   # Backend: Edit backend/.env
   PORT=3001

   # Frontend: Edit vite.config.ts server.port
   ```

---

### React 19 Peer Dependency Warnings

**Symptom:** npm install shows peer dependency warnings for React 19

**Solution:** This is expected for some packages not yet updated for React 19

```bash
npm install --legacy-peer-deps
```

**Affected Packages:**
- react-helmet-async (declares React 16-18 but works with 19)

**Note:** These are warnings, not errors. Application functions correctly.

---

## Additional Resources

- **Technical Audit:** `mdFiles/analysis/projectAudit_12022026.md`
- **Deployment Guide:** `mdFiles/deployment/deploymentGuide.md`
- **Admin User Management:** `ADMIN_USER_RESET_GUIDE.md`
- **Image Upload Troubleshooting:** `mdFiles/images/IMAGE_FIX_RESOLUTION.md`
- **API Contracts:** `API_CONTRACTS.md`
- **Security Documentation:** `backend/SECURITY.md`

---

## Quick Reference Commands

```bash
# Start development servers
./start-dev.sh                          # Automated startup
cd backend && npm run start:dev         # Backend only
npm run dev                             # Frontend only

# Database management
cd backend && npx prisma studio         # Visual database editor
cd backend && npm run prisma:migrate    # Run migrations
cd backend && npm run db:seed           # Seed sample data

# Admin user
cd backend && npm run create-admin      # Create admin user

# Production builds
cd backend && npm run build             # Build backend
npm run build                           # Build frontend
npm run preview                         # Preview frontend build

# Troubleshooting
curl http://localhost:3000/health       # Check backend
pg_isready                              # Check PostgreSQL
lsof -i :3000                          # Check port usage
```

---

**Document Maintained By:** Development Team
**For Issues:** Check troubleshooting section or consult technical audit
