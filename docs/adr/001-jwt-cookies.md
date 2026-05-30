# 001. JWT Tokens in HTTP-only Cookies

**Date:** 2026-05-30
**Status:** Accepted
**Deciders:** Development Team

## Context

We needed to decide how to store JWT authentication tokens in the frontend application. The main options were:

1. **localStorage** - Common approach, easy to implement
2. **sessionStorage** - Similar to localStorage but cleared on tab close
3. **HTTP-only cookies** - Server-set cookies not accessible to JavaScript
4. **In-memory only** - Most secure but lost on refresh

Security was a primary concern, as affiliate marketing sites are targets for XSS attacks trying to steal admin credentials or manipulate affiliate links.

## Decision

We will store JWT tokens in **HTTP-only cookies** set by the backend.

Implementation details:
- Backend sets `accessToken` cookie with `httpOnly: true`, `secure: true` (production), `sameSite: 'strict'`
- Frontend axios client configured with `withCredentials: true`
- No JavaScript access to tokens (XSS protection)
- Automatic inclusion in API requests via browser
- Cookie expiration matches JWT expiration (24 hours)

## Consequences

### Positive

- **XSS Protection**: Tokens cannot be stolen via XSS attacks (no `document.cookie` access)
- **Automatic transmission**: Browser automatically includes cookies in requests
- **Secure flag**: Forces HTTPS-only transmission in production
- **SameSite protection**: Prevents CSRF attacks via `sameSite: 'strict'`
- **Standard approach**: Well-established pattern used by major platforms

### Negative

- **CORS complexity**: Requires `credentials: true` in CORS configuration
- **Mobile apps**: HTTP-only cookies don't work well with mobile apps (would need alternative auth for future mobile app)
- **Cross-domain**: Cookies don't work across different domains (frontend and backend must share cookie domain)
- **Logout complexity**: Must call backend endpoint to clear cookie (can't clear client-side)

### Risks

- **Cookie size limits**: Cookies limited to 4KB (JWT tokens are small, so acceptable)
- **Third-party cookie blocking**: Some browsers block third-party cookies (not an issue for same-domain deployment)
- **CSRF attacks**: Mitigated by SameSite=strict, but requires awareness

## Alternatives Considered

### localStorage
- **Rejected because**: Vulnerable to XSS attacks. If an attacker injects malicious JavaScript, they can read localStorage and steal tokens.

### In-memory only
- **Rejected because**: Tokens lost on page refresh, creating poor UX. Would require refresh tokens or frequent re-authentication.

## Related Decisions

- Backend CORS configuration must allow credentials
- Backend cookie configuration in `backend/src/main.ts`
- Frontend axios client configuration in `src/lib/api.ts`

## Notes

This decision aligns with OWASP recommendations for JWT storage in web applications. For future mobile apps, we would need to implement a different auth flow (e.g., in-memory + refresh tokens).
