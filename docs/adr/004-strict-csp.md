# 004. Strict Content Security Policy

**Date:** 2026-05-30
**Status:** Accepted
**Deciders:** Development Team

## Context

Content Security Policy (CSP) is a security layer that helps detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks. We needed to decide on our CSP strictness level:

1. **No CSP** - No protection, easiest to implement
2. **Permissive CSP** - Allow `unsafe-inline` and `unsafe-eval`
3. **Strict CSP** - No inline scripts/styles, no eval, only whitelisted sources
4. **Nonce-based CSP** - Strictest, requires nonce for every script/style

As an affiliate marketing platform with admin functionality, we are a target for:
- XSS attacks to inject malicious affiliate links
- Script injection to steal admin credentials
- Data exfiltration attacks

## Decision

We will implement a **strict Content Security Policy** without `unsafe-inline` or `unsafe-eval`.

Implementation details (backend/src/main.ts):
```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'"],  // No unsafe-inline
    scriptSrc: ["'self'"],  // No unsafe-inline, no unsafe-eval
    imgSrc: ["'self'", 'data:', 'https:'],  // Allow external product images
    connectSrc: ["'self'"],  // API calls only to same origin
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],  // In production
  },
}
```

## Consequences

### Positive

- **XSS Protection**: Inline scripts cannot execute, even if injected
- **Eval Prevention**: Dynamic code execution patterns are blocked
- **Reduced Attack Surface**: Only scripts from our domain can execute
- **External Image Support**: `imgSrc` allows HTTPS for product images from vendors
- **Standard Compliance**: Follows OWASP CSP recommendations
- **Browser Reporting**: CSP violations logged in browser console for debugging

### Negative

- **CSS Limitations**: Cannot use inline styles (all styles must be in CSS files)
- **Development Complexity**: React inline styles not allowed (use CSS Modules or styled-components)
- **Third-party Integration**: Cannot easily add analytics or chat widgets that require inline scripts
- **Debugging Difficulty**: CSP violations can be cryptic for developers unfamiliar with CSP
- **Build Process**: Requires all assets to be properly bundled

### Risks

- **Breaking Changes**: Future features requiring inline scripts need careful planning
- **Third-party Services**: Some services (e.g., analytics) may not work without `unsafe-inline`
- **Performance**: Minor overhead from CSP header parsing
- **Browser Support**: Older browsers may not fully support CSP (acceptable trade-off)

## Workarounds for Common Scenarios

**Inline Styles:**
```typescript
// ❌ Bad (CSP violation)
<div style={{ color: 'red' }}>Text</div>

// ✅ Good (use CSS classes)
<div className="text-red">Text</div>
```

**Event Handlers:**
```typescript
// ❌ Bad (CSP violation)
<button onclick="alert('Hi')">Click</button>

// ✅ Good (use addEventListener or React onClick)
<button onClick={() => alert('Hi')}>Click</button>
```

**Dynamic Code Execution:**
The CSP policy blocks all forms of dynamic code execution including:
- String-to-code evaluation
- Dynamic function creation from strings
- setTimeout/setInterval with string arguments

All code should be written as proper TypeScript/JavaScript functions instead. Data should be parsed with JSON.parse() rather than evaluated as code.

## Alternatives Considered

### Permissive CSP (unsafe-inline allowed)
- **Pros**: Easier development, allows inline styles/scripts, works with all third-party services
- **Cons**: Provides minimal XSS protection (defeats purpose of CSP)
- **Rejected because**: Security is more important than developer convenience for admin platform

### No CSP
- **Pros**: No restrictions, maximum flexibility
- **Cons**: Zero protection against XSS/injection attacks
- **Rejected because**: Unacceptable security posture for admin system

### Nonce-based CSP
- **Pros**: Strictest possible policy, allows inline scripts with nonces
- **Cons**: Requires server-side rendering or complex build process to inject nonces
- **Rejected because**: Too complex for current SPA architecture

## Related Decisions

- Helmet configuration in `backend/src/main.ts`
- React inline styles avoided throughout codebase
- All styles in CSS files or CSS Modules

## Notes

This strict CSP has prevented several potential XSS vulnerabilities during development where developers accidentally tried to use inline scripts.

If future features absolutely require inline scripts (unlikely), we can:
1. Re-evaluate nonce-based CSP
2. Move that specific feature to a separate subdomain with different CSP
3. Find alternative implementation without inline scripts

The `imgSrc: ['https:']` exception is necessary for displaying product images from external vendor sites (Amazon, vendor CDNs, etc.).

## Implementation Impact

**Files where CSP is enforced:**
- All HTML pages served by the application
- All React components (no inline styles allowed)
- All JavaScript modules (no string-based code execution)

**Developer Guidelines:**
1. Always use CSS classes instead of inline styles
2. Use React event handlers instead of HTML attributes
3. Parse JSON with JSON.parse(), never treat data as code
4. Bundle all JavaScript through Vite build process
5. Test features in development mode where CSP is enforced

**Testing CSP Compliance:**
```bash
# Check browser console for CSP violations
# Look for: "Refused to execute inline script because..."
# Fix all violations before deploying
```

This decision prioritizes security over development convenience, making it significantly harder for attackers to inject malicious code into the application.
