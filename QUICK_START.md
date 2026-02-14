# Quick Start Guide - After Authentication Security Fixes

## Initial Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (includes cookie-parser)
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your secure credentials
# IMPORTANT: Change JWT_SECRET and admin credentials
nano .env  # or your preferred editor

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Create first admin user (REQUIRED - setup endpoint removed)
npm run create-admin

# Start backend server
npm run start:dev
```

### 2. Frontend Setup

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

### 3. Login

- Navigate to: http://localhost:5173/admin/login
- Use credentials you entered in `npm run create-admin`
- Tokens are now stored in httpOnly cookies (automatic)

## Important Changes

### ⚠️ BREAKING CHANGES

1. **Setup Endpoint Removed:**
   - `/auth/setup-first-admin` NO LONGER EXISTS
   - Use `npm run create-admin` instead
   - First admin must be created via CLI

2. **Token Storage Changed:**
   - Tokens NO LONGER in `localStorage`
   - Tokens stored in httpOnly cookies
   - Cannot access tokens via JavaScript (security feature)

3. **Token Expiration:**
   - Access tokens: 15 minutes (was 24 hours)
   - Refresh tokens: 7 days
   - Automatic refresh on expiration

### ✅ What Still Works

1. **Login Flow:**
   - Same login form
   - Same credentials
   - Cookies handled automatically

2. **Protected Routes:**
   - Still require authentication
   - Cookies sent automatically
   - No code changes needed

3. **API Calls:**
   - `withCredentials: true` already set
   - Cookies sent automatically
   - No manual token injection needed

## Common Tasks

### Create Admin User

```bash
cd backend
npm run create-admin
```

### Check if Cookies Are Set

1. Open browser DevTools (F12)
2. Go to Application → Cookies
3. Look for:
   - `accessToken` (httpOnly: ✓)
   - `refreshToken` (httpOnly: ✓)

### Logout

Call the logout API:

```typescript
import api from './lib/api';

await api.post('/auth/logout');
clearAdminSession();
```

### Troubleshooting

#### "Cannot create admin - admin already exists"

**Solution:** Admin user already exists in database. Use existing credentials or delete admin from database (Prisma Studio).

```bash
npx prisma studio
# Navigate to AdminUser table
# Delete existing admin if needed
```

#### "CORS error when logging in"

**Solution:**
- Check CORS_ORIGIN in backend .env matches frontend URL
- Ensure backend is running on correct port (3000)
- Ensure frontend is running on correct port (5173)

#### "Token not being sent"

**Solution:**
- Check cookies are set in DevTools
- Verify `withCredentials: true` in api.ts
- Ensure domains match (localhost vs 127.0.0.1)

#### "Immediately logged out after login"

**Solution:**
- Check JWT_SECRET is set in .env
- Verify JWT_SECRET matches in auth module
- Check cookie sameSite setting

## Environment Variables

### Required

```env
DATABASE_URL="postgresql://user:password@localhost:5432/prodview"
JWT_SECRET="your-super-secure-jwt-secret-min-32-chars"
```

### Optional (with defaults)

```env
JWT_EXPIRATION="15m"              # Default: 15m
PORT=3000                         # Default: 3000
NODE_ENV="development"            # Default: development
CORS_ORIGIN="http://localhost:5173"  # Default: localhost:5173
```

### For Create-Admin Script

```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="YourSecurePassword123!"
```

## Security Checklist

Before deploying to production:

- [ ] Change JWT_SECRET from default value
- [ ] JWT_SECRET is at least 32 characters
- [ ] ADMIN_PASSWORD meets complexity requirements
- [ ] NODE_ENV set to "production"
- [ ] CORS_ORIGIN set to production frontend URL
- [ ] HTTPS enabled (required for secure cookies)
- [ ] Database credentials are secure
- [ ] .env file not committed to git

## Development Workflow

### Making API Calls

```typescript
import api from './lib/api';

// Cookies sent automatically - no manual token handling
const response = await api.get('/products');
```

### Checking Authentication

```typescript
import { getAdminSession } from './utils/security';

const session = getAdminSession();
if (session) {
  console.log('Logged in as:', session.email);
}
```

### Logging Out

```typescript
import api from './lib/api';
import { clearAdminSession } from './utils/security';

await api.post('/auth/logout');
clearAdminSession();
navigate('/admin/login');
```

## Documentation

For detailed information, see:

- **Migration Guide:** `backend/AUTHENTICATION_MIGRATION.md`
- **Full Summary:** `AUTH_SECURITY_FIX_SUMMARY.md`
- **Issue Linkage:** `mdFiles/analysis/projectIssueLinkage.md`

## Support

If you encounter issues:

1. Check troubleshooting section above
2. Review AUTHENTICATION_MIGRATION.md
3. Check backend logs for detailed errors
4. Verify all environment variables are set

## Next Steps

After authentication is working:

1. Test login/logout flow
2. Verify cookies in DevTools
3. Test protected routes
4. Deploy to staging environment
5. Proceed to Master Prompt 2 (Input Validation & XSS Defense)
