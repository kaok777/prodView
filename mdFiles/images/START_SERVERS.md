# ProdView - Server Startup Guide

**Last Updated:** February 13, 2026
**Status:** Comprehensive startup instructions for development environment

---

## Quick Start (Development)

### Prerequisites Checklist

Before starting the servers, ensure:

- [ ] PostgreSQL is installed and running on `localhost:5432`
- [ ] Node.js v18+ is installed
- [ ] npm is installed
- [ ] Git repository is cloned
- [ ] Environment variables are configured

---

## Step-by-Step Startup Procedure

### 1. Start PostgreSQL Database

**Check if PostgreSQL is running:**
```bash
# Option 1: Check service status (Linux)
sudo systemctl status postgresql

# Option 2: Check if port is listening
nc -zv localhost 5432

# Option 3: Try connecting
psql -U postgres -h localhost -p 5432 -c "SELECT version();"
```

**Start PostgreSQL if needed:**
```bash
# Linux (systemd)
sudo systemctl start postgresql

# Linux (init.d)
sudo service postgresql start

# macOS (Homebrew)
brew services start postgresql

# Windows (PowerShell as Admin)
Start-Service -Name postgresql-x64-14

# Docker (if using Docker)
docker-compose up -d postgres
```

**Verify database exists:**
```bash
psql -U postgres -h localhost -p 5432 -c "\l" | grep prodview
```

**Create database if needed:**
```bash
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE prodview;"
```

---

### 2. Backend Server Startup

**Open Terminal 1 - Backend:**

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Generate Prisma client (after schema changes or first time)
npx prisma generate

# Run database migrations (first time or after schema changes)
npx prisma migrate deploy

# Optional: Seed database with initial data
npx prisma db seed

# Start backend in development mode with hot reload
npm run start:dev
```

**Expected Output:**
```
[Nest] 12345  - 02/13/2026, 3:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 02/13/2026, 3:00:00 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 02/13/2026, 3:00:00 PM     LOG [InstanceLoader] ConfigHostModule dependencies initialized
[Nest] 12345  - 02/13/2026, 3:00:00 PM     LOG [InstanceLoader] ConfigModule dependencies initialized
[Nest] 12345  - 02/13/2026, 3:00:00 PM     LOG [RoutesResolver] AuthController {/api/auth}: +3ms
[Nest] 12345  - 02/13/2026, 3:00:00 PM     LOG [RouterExplorer] Mapped {/api/auth/login, POST} route +2ms
Backend server running on http://localhost:3000
Environment: development
CORS origins: http://localhost:5173
```

**Common Backend Issues:**

| Issue | Solution |
|-------|----------|
| `Can't reach database server` | Start PostgreSQL (see Step 1) |
| `P3009: migrate.lock is missing` | Run `npx prisma migrate deploy` |
| `Port 3000 already in use` | Kill existing process: `lsof -ti:3000 \| xargs kill -9` |
| `MODULE_NOT_FOUND` | Run `npm install` |
| `Prisma Client not generated` | Run `npx prisma generate` |

---

### 3. Verify Backend is Running

**Test 1: Health Check (API endpoint)**
```bash
curl http://localhost:3000/api/products
# Should return JSON, not "Connection refused"
```

**Test 2: Static File Serving (Critical for images)**
```bash
# Use an actual filename from backend/uploads/ directory
curl -I http://localhost:3000/uploads/84bd49e5-9cb6-4ce5-88c6-807ea0b70c03.png

# Expected output:
# HTTP/1.1 200 OK
# Content-Type: image/png
# Cache-Control: public, max-age=2592000, immutable
# Content-Length: 24330
```

**Test 3: CORS Headers**
```bash
curl -I -H "Origin: http://localhost:5173" http://localhost:3000/api/products

# Should include:
# Access-Control-Allow-Origin: http://localhost:5173
```

---

### 4. Frontend Server Startup

**Open Terminal 2 - Frontend:**

```bash
# Navigate to project root (where package.json with vite is located)
cd /mnt/c/Users/kwabe/OneDrive/Desktop/Coding/prodView

# Install dependencies (first time only)
npm install

# Start Vite development server
npm run dev
```

**Expected Output:**
```
  VITE v5.0.11  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Common Frontend Issues:**

| Issue | Solution |
|-------|----------|
| `Port 5173 already in use` | Kill existing: `lsof -ti:5173 \| xargs kill -9` |
| `MODULE_NOT_FOUND` | Run `npm install` in root directory |
| `Cannot find module vite` | Ensure you're in root dir, run `npm install` |
| `.env file not found` | Copy `.env.example` to `.env` |

---

### 5. Verify Image Rendering

**Manual Browser Test:**

1. Open browser: http://localhost:5173
2. Navigate to any product page
3. Check if product images render
4. Open DevTools (F12) → Network tab → Filter by "Img"
5. Look for requests to `localhost:3000/uploads/*`
6. Status should be `200 OK`, not `404` or `(failed)`

**Expected Network Request:**
```
Request URL: http://localhost:3000/uploads/84bd49e5-9cb6-4ce5-88c6-807ea0b70c03.png
Request Method: GET
Status Code: 200 OK
Content-Type: image/png
Cache-Control: public, max-age=2592000, immutable
```

**If images DON'T load:**

1. **Check Backend is Running**
   ```bash
   curl http://localhost:3000/api/products
   # Should NOT return "Connection refused"
   ```

2. **Check Static File Serving**
   ```bash
   ls backend/uploads/
   # Should show .png, .jpg files

   curl -I http://localhost:3000/uploads/[any-filename-from-above]
   # Should return 200 OK
   ```

3. **Check Browser Console**
   - Look for CORS errors
   - Look for 404 errors
   - Check if imagePath is correct format (`/uploads/uuid.png`)

4. **Check Environment Variables**
   ```bash
   # Frontend .env should have:
   cat .env | grep VITE_API_URL
   # Should output: VITE_API_URL=http://localhost:3000/api
   ```

---

## Development Workflow

### Normal Day-to-Day Startup

```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend
cd .. && npm run dev

# Leave both terminals open while developing
```

### Stopping Servers

```bash
# In each terminal, press:
Ctrl + C

# Or kill by port:
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

---

## Production Deployment Notes

### Environment Variables

**Backend `.env` (production):**
```env
DATABASE_URL="postgresql://user:password@prod-host:5432/prodview?schema=public"
JWT_SECRET="<256-bit-random-secret>"
JWT_EXPIRATION="15m"
PORT=3000
NODE_ENV=production
CORS_ORIGIN="https://yourdomain.com,https://www.yourdomain.com"
UPLOAD_DIR="./uploads"
```

**Frontend `.env.production`:**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Build Commands

**Backend:**
```bash
cd backend
npm run build
# Output: backend/dist/

# Start production server
npm run start:prod
```

**Frontend:**
```bash
cd ../
npm run build
# Output: dist/

# Preview production build
npm run preview
```

---

## Troubleshooting Guide

### Images Not Loading - Diagnostic Steps

```bash
# Step 1: Verify backend is running
curl http://localhost:3000/api/products
# ✅ Should return JSON
# ❌ If "Connection refused" → Backend not running

# Step 2: Check if files exist
ls -la backend/uploads/
# ✅ Should show .png/.jpg files
# ❌ If empty → Upload images via admin panel

# Step 3: Test static file serving
curl -I http://localhost:3000/uploads/[filename-from-step-2]
# ✅ Should return HTTP/1.1 200 OK
# ❌ If 404 → Check main.ts static assets config
# ❌ If connection refused → Backend not running

# Step 4: Check CORS
curl -H "Origin: http://localhost:5173" http://localhost:3000/api/products
# ✅ Should include Access-Control-Allow-Origin header
# ❌ If missing → Check CORS_ORIGIN in backend/.env

# Step 5: Check frontend URL construction
# Open browser console on http://localhost:5173
# Run: console.log(import.meta.env.VITE_API_URL)
# ✅ Should output: http://localhost:3000/api
# ❌ If undefined → Check .env file exists
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql
# or
nc -zv localhost 5432

# Check database exists
psql -U postgres -h localhost -p 5432 -c "\l" | grep prodview

# Check connection string
cd backend
cat .env | grep DATABASE_URL
# Should match your PostgreSQL credentials
```

### Port Already in Use

```bash
# Find process using port
lsof -ti:3000  # Backend
lsof -ti:5173  # Frontend

# Kill process
kill -9 [PID]

# Or kill all node processes (nuclear option)
pkill -f node
```

---

## Quick Reference

### URLs
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api
- **Static Files:** http://localhost:3000/uploads/
- **Admin Panel:** http://localhost:5173/admin/login

### Default Admin Credentials (Development Only)
- **Email:** vibrationconnect@gmail.com
- **Password:** Cxserfd345!

⚠️ **Change these immediately in production!**

### Key Files
- Backend config: `backend/.env`
- Frontend config: `.env`
- Database schema: `backend/prisma/schema.prisma`
- Static assets: `backend/uploads/`
- Upload config: `backend/src/upload/upload.module.ts`
- Static serving: `backend/src/main.ts` (line 90-97)

---

## Verification Checklist

Before reporting "images not loading" issue:

- [ ] PostgreSQL database is running (`nc -zv localhost 5432`)
- [ ] Backend server is running (`curl http://localhost:3000/api/products`)
- [ ] Frontend server is running (browser can access http://localhost:5173)
- [ ] Static file serving works (`curl -I http://localhost:3000/uploads/[filename]`)
- [ ] Files physically exist (`ls backend/uploads/`)
- [ ] CORS is configured (`CORS_ORIGIN="http://localhost:5173"` in backend/.env)
- [ ] Environment variables loaded (`.env` files exist and are correct)
- [ ] No errors in backend terminal
- [ ] No errors in frontend terminal
- [ ] No errors in browser console (F12)

If all items are checked and images still don't load, then investigate code issues.

---

**For questions or issues, check:**
- `mdFiles/projectUploadFix.md` - Detailed technical analysis
- `mdFiles/projectAudit_12022026.md` - System architecture overview
- Backend logs in Terminal 1
- Frontend logs in Terminal 2
- Browser DevTools Console and Network tab
