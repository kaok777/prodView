# Authentication & Session Security Migration

## Overview

This document describes the migration from insecure localStorage-based authentication to secure httpOnly cookie-based authentication with refresh token rotation.

## Issues Resolved

This migration resolves the following critical security issues:

- **CRITICAL-B1**: Hardcoded Admin Credentials
- **CRITICAL-B2**: Insecure Setup Endpoint
- **CRITICAL-F1**: Token Storage in localStorage (XSS vulnerability)
- **CRITICAL-F3**: Setup Endpoint Exposes Credentials
- **CRITICAL-F7**: Session Stored in Plain JSON
- **MEDIUM-F9**: Dual Authentication State Storage
- **MEDIUM-B5**: JWT Expiration Too Long (24 hours → 15 minutes)

## Security Improvements

### 1. HttpOnly Cookie Authentication

**Before:**
- Access tokens stored in `localStorage`
- Vulnerable to XSS attacks (any script can read tokens)
- Token valid for 24 hours

**After:**
- Access tokens stored in httpOnly cookies
- Cannot be accessed by JavaScript (XSS-proof)
- Access token valid for 15 minutes
- Refresh token valid for 7 days
- Automatic token rotation

### 2. Removed Hardcoded Credentials

**Before:**
- Admin credentials hardcoded in `auth.service.ts`
- Exposed in git history
- `/auth/setup-first-admin` endpoint publicly accessible

**After:**
- No hardcoded credentials
- Secure CLI script: `npm run create-admin`
- Credentials from environment variables or interactive prompt
- Setup endpoint completely removed

### 3. Token Refresh Mechanism

**Before:**
- No token refresh
- Users logged out after 24 hours

**After:**
- Automatic token refresh via `/auth/refresh` endpoint
- Access token expires in 15 minutes
- Refresh token rotates on each refresh
- Seamless user experience (no forced logout during active sessions)

## Backend Changes

### 1. Auth Service (`backend/src/auth/auth.service.ts`)

- Added `refreshAccessToken()` method
- Updated `login()` to return both access and refresh tokens
- Removed `setupFirstAdmin()` method (security risk)
- Access tokens now expire in 15 minutes

### 2. Auth Controller (`backend/src/auth/auth.controller.ts`)

- Updated `login()` to set httpOnly cookies
- Added `/auth/refresh` endpoint for token rotation
- Added `/auth/logout` endpoint to clear cookies
- Removed `/auth/setup-first-admin` endpoint

### 3. JWT Strategy (`backend/src/auth/strategies/jwt.strategy.ts`)

- Updated to extract JWT from httpOnly cookies first
- Fallback to Authorization header (backward compatibility)

### 4. Main Application (`backend/src/main.ts`)

- Added `cookie-parser` middleware
- CORS already configured with `credentials: true`

### 5. Admin Initialization Script (`backend/src/scripts/create-admin.ts`)

- Secure CLI tool for creating first admin
- Validates email and password complexity
- Reads from environment variables or prompts interactively
- Prevents multiple first-admin creation

## Frontend Changes

### 1. API Client (`src/lib/api.ts`)

**Before:**
```typescript
// Stored token in localStorage
localStorage.setItem('accessToken', token);

// Injected token in every request
config.headers.Authorization = `Bearer ${token}`;

// Hard redirect on 401
window.location.href = '/admin/login';
```

**After:**
```typescript
// No token storage needed (automatic cookie sending)
// withCredentials: true enables cookie transmission

// Automatic token refresh on 401
try {
  await api.post('/auth/refresh');
  // Retry original request
} catch {
  // Only redirect if refresh fails
  window.location.href = '/admin/login';
}
```

### 2. Admin Login Page (`src/pages/admin/AdminLoginPage.tsx`)

**Before:**
```typescript
// Stored token in localStorage
localStorage.setItem('accessToken', accessToken);

// Setup UI exposed credentials
<button onClick={handleSetup}>Setup Admin Account</button>
```

**After:**
```typescript
// No token storage - cookies handled automatically
setAdminSession(userData); // Only non-sensitive UI data

// Setup UI removed completely
```

### 3. Security Utils (`src/utils/security.ts`)

- Updated `clearAdminSession()` to note that actual logout requires calling `/auth/logout`
- Removed `accessToken` cleanup (handled by backend)

## Migration Guide

### For Development

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install cookie-parser @types/cookie-parser
   ```

2. **Update Environment Variables:**
   ```bash
   cp .env.example .env
   # Edit .env and set:
   JWT_EXPIRATION="15m"
   ADMIN_EMAIL="your-email@example.com"
   ADMIN_PASSWORD="YourSecurePassword123!"
   ```

3. **Create First Admin:**
   ```bash
   npm run create-admin
   ```

4. **Start Backend:**
   ```bash
   npm run start:dev
   ```

5. **Start Frontend:**
   ```bash
   cd ../
   npm run dev
   ```

### For Production

1. **Database Migration:**
   - No schema changes required
   - Existing admin users remain intact

2. **Environment Variables:**
   ```bash
   JWT_SECRET="your-production-secret-min-32-chars"
   JWT_EXPIRATION="15m"
   CORS_ORIGIN="https://yourdomain.com"
   NODE_ENV="production"
   ```

3. **Create Admin (if needed):**
   ```bash
   npm run create-admin
   ```

4. **Deploy Application:**
   - Ensure HTTPS is enabled (required for secure cookies)
   - Update frontend VITE_API_URL to production backend URL

### Session Migration

**Important:** Existing sessions will be invalidated during migration.

- Users will be logged out and must log in again
- This is expected and secure (old tokens are no longer valid)
- No data loss occurs

## Testing

### Manual Testing Checklist

- [ ] Admin can log in successfully
- [ ] Cookies are set with httpOnly flag
- [ ] Access token expires after 15 minutes
- [ ] Token automatically refreshes on API calls
- [ ] User remains logged in during active session
- [ ] Logout clears cookies
- [ ] Cannot access admin routes without authentication
- [ ] XSS cannot steal tokens (verify in DevTools)

### Token Verification

1. **Check Cookies (Browser DevTools → Application → Cookies):**
   ```
   accessToken: [JWT] (HttpOnly, Secure in prod, SameSite: Strict)
   refreshToken: [JWT] (HttpOnly, Secure in prod, SameSite: Strict)
   ```

2. **Verify httpOnly Flag:**
   - Try `document.cookie` in DevTools console
   - Should NOT show accessToken or refreshToken

3. **Verify Token Expiration:**
   ```javascript
   // Decode JWT (use jwt.io or browser extension)
   // Check 'exp' claim - should be ~15 minutes from 'iat'
   ```

## Rollback Plan

If issues occur, rollback is possible but NOT recommended (security risk):

1. **Backend Rollback:**
   - Revert auth.service.ts to return token in response
   - Re-add setup endpoint (temporary)

2. **Frontend Rollback:**
   - Revert api.ts to store token in localStorage
   - Re-add token injection in request interceptor

3. **After Rollback:**
   - All 7 security issues return
   - Plan immediate re-migration

## Security Best Practices

### Password Management

- Passwords hashed with bcrypt (12 rounds)
- Password complexity enforced:
  - Minimum 8 characters
  - Uppercase, lowercase, number, special character
  - Maximum 128 characters

### Token Security

- Access tokens: 15 minutes (short-lived)
- Refresh tokens: 7 days (rotate on use)
- Tokens stored in httpOnly cookies (XSS-proof)
- SameSite: Strict (CSRF protection)
- Secure flag in production (HTTPS only)

### Environment Security

- Never commit credentials to git
- Use environment variables for secrets
- Rotate JWT_SECRET regularly
- Use strong JWT_SECRET (min 32 chars)

## Troubleshooting

### Issue: "CORS error when logging in"

**Solution:**
- Ensure backend CORS has `credentials: true`
- Ensure frontend API has `withCredentials: true`
- Verify CORS_ORIGIN matches frontend URL exactly

### Issue: "Token not being sent to backend"

**Solution:**
- Check cookies are set (DevTools → Application → Cookies)
- Verify domain matches (localhost vs 127.0.0.1 issue)
- Ensure `withCredentials: true` in axios config

### Issue: "401 Unauthorized immediately after login"

**Solution:**
- Check cookie SameSite setting (should be 'strict' or 'lax')
- Verify JWT_SECRET is the same in auth module and .env
- Check token expiration (may be too short for testing)

### Issue: "Create admin script fails"

**Solution:**
- Ensure DATABASE_URL is correct in .env
- Run `npm run prisma:generate` first
- Check admin doesn't already exist: `npx prisma studio`

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Support

For issues or questions:
1. Check this migration guide
2. Review troubleshooting section
3. Check backend logs for detailed error messages
4. Verify environment variables are set correctly
