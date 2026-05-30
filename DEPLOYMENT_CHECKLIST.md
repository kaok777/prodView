# DEPLOYMENT CHECKLIST

**Project:** ProdView - Affiliate Marketing Platform
**Environment:** Production Deployment Guide
**Last Updated:** 2026-05-30

This checklist documents all deployment requirements and configuration steps needed before going live.

---

## 1. ENVIRONMENT VARIABLES

Configure the following environment variables in your production environment. See `backend/.env.example` for full details.

### Backend Environment Variables
All variables marked with `[REQUIRED]` must be set before deployment.

```bash
# Database Configuration
DATABASE_URL=[REQUIRED] # PostgreSQL connection string with connection pool config
# Example: postgresql://user:password@host:5432/prodview?connection_limit=20&pool_timeout=20

# Security
NODE_ENV=production # [REQUIRED] Must be exactly "production"
JWT_SECRET=[REQUIRED] # Generate with: openssl rand -base64 48
ADMIN_EMAIL=[REQUIRED] # Admin account email
ADMIN_PASSWORD=[REQUIRED] # Strong password (min 8 chars)

# CORS Configuration
CORS_ORIGIN=[REQUIRED] # Frontend domain (e.g., https://yourdomain.com)
# Must NOT be localhost/127.0.0.1 in production

# Server Configuration
PORT=3000 # Backend port
MAX_BODY_SIZE=1048576 # Request body size limit (1MB recommended)
MAX_FILE_SIZE=5242880 # File upload limit (5MB recommended)

# Cache Configuration
REDIS_URL=[OPTIONAL] # Redis connection for distributed caching
# Example: redis://localhost:6379
# If not set, uses in-memory cache (not recommended for multi-instance deployments)

# Email Service (for password reset feature - not yet implemented)
EMAIL_HOST=[FUTURE]
EMAIL_PORT=[FUTURE]
EMAIL_USER=[FUTURE]
EMAIL_PASSWORD=[FUTURE]
EMAIL_FROM=[FUTURE]
```

### Frontend Environment Variables
Configure in your frontend hosting provider (Vercel, Netlify, etc.)

```bash
VITE_API_BASE_URL=[REQUIRED] # Backend API URL (e.g., https://api.yourdomain.com)
```

---

## 2. DATABASE SETUP

### Migration Steps
1. Ensure DATABASE_URL is configured with production database credentials
2. Run migrations to create all tables:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
3. Verify all tables created successfully:
   ```bash
   npx prisma db pull
   ```

### Database Performance Configuration
Configure PostgreSQL for production workload:

```sql
-- Connection pooling (adjust based on server resources)
-- Already configured in DATABASE_URL connection string:
-- ?connection_limit=20&pool_timeout=20

-- Recommended PostgreSQL settings (add to postgresql.conf)
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
```

### Backup Strategy
- [ ] Configure automated daily backups
- [ ] Test restore procedure before go-live
- [ ] Set backup retention policy (recommend: 30 days)

---

## 3. CDN CONFIGURATION FOR STATIC ASSETS (P3.4.1)

**Priority:** HIGH
**Performance Impact:** Reduces origin bandwidth by 80%+, improves global latency by 500ms+

### Why CDN is Critical
Currently, all product images are served directly from the backend `/uploads` path, which:
- Consumes origin server bandwidth for every image request
- Causes high latency for global users (500ms+ for US/EU users accessing SA server)
- Increases server load and costs
- Degrades user experience on slow connections

### Recommended CDN Providers
Choose one based on your needs:

1. **Cloudflare (Recommended for beginners)**
   - Free tier available
   - Easy setup (just change DNS)
   - Automatic image optimization
   - 1-year cache for images

2. **AWS CloudFront**
   - Best for high traffic
   - Integrates with S3 for origin storage
   - Advanced caching rules

3. **Vercel CDN**
   - Free if hosting frontend on Vercel
   - Zero-config for frontend assets
   - Requires separate config for backend images

### Setup Steps (Cloudflare Example)

#### Step 1: Configure Cloudflare CDN
1. Sign up for Cloudflare account
2. Add your domain (e.g., yourdomain.com)
3. Update DNS nameservers to Cloudflare
4. Enable "Proxy" (orange cloud) for your domain

#### Step 2: Configure Caching Rules
In Cloudflare dashboard → Caching → Cache Rules:

```
Rule 1: Cache product images
- URL Path: /uploads/*
- Cache Level: Standard
- Edge Cache TTL: 1 year (31536000 seconds)
- Browser Cache TTL: 1 year
- Cache-Control: public, immutable, max-age=31536000
```

#### Step 3: Update Image URLs in Code
Two options:

**Option A: Use CDN domain for images (Recommended)**
```typescript
// In backend/src/main.ts or environment config
const CDN_BASE_URL = process.env.CDN_BASE_URL || BACKEND_BASE_URL;

// In frontend/src/lib/api.ts
export const IMAGE_BASE_URL = import.meta.env.VITE_CDN_URL || BACKEND_BASE_URL;

// Update ProductImage component to use IMAGE_BASE_URL
```

**Option B: Use Cloudflare Workers to rewrite URLs**
No code changes needed - Cloudflare serves `/uploads/*` automatically.

#### Step 4: Configure Origin Server Cache Headers
Update backend/src/main.ts to set proper cache headers for static files:

```typescript
// Add to main.ts after app.useStaticAssets()
app.use('/uploads', (req, res, next) => {
  res.set('Cache-Control', 'public, immutable, max-age=31536000');
  res.set('Vary', 'Accept-Encoding');
  next();
});
```

#### Step 5: Test CDN Setup
```bash
# Test image loads from CDN
curl -I https://yourdomain.com/uploads/some-image.jpg

# Verify headers:
# - cf-cache-status: HIT (after first request)
# - cache-control: public, immutable, max-age=31536000
# - age: > 0 (indicates cached)
```

### Performance Verification
After CDN setup, verify improvements:
- [ ] Images load from CDN (check `cf-cache-status` header)
- [ ] Global latency improved (test from multiple regions)
- [ ] Origin server bandwidth reduced (check hosting metrics)
- [ ] Lighthouse score improved (target: 90+ Performance)

---

## 4. HTTP COMPRESSION (P3.4.2)

**Priority:** MEDIUM
**Performance Impact:** Reduces response size by 70-90%

### Backend Compression
Already implemented in Session 3 fixes (see P3.4.2 fix log).

### Reverse Proxy Compression (If using nginx)
Add to nginx config:

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript
           application/json application/javascript application/xml+rss
           application/rss+xml application/atom+xml image/svg+xml
           text/x-component text/x-cross-domain-policy;

# Brotli compression (if module available)
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css text/xml text/javascript
             application/json application/javascript application/xml+rss;
```

### Verify Compression
```bash
curl -H "Accept-Encoding: gzip,deflate,br" -I https://yourdomain.com/api/products/latest

# Should see header:
# content-encoding: br (or gzip)
```

---

## 5. SSL/HTTPS CONFIGURATION

**Priority:** CRITICAL
**Security Requirement:** HTTPS is mandatory for production

### Setup Steps
1. Obtain SSL certificate (free with Let's Encrypt, Cloudflare, or hosting provider)
2. Configure certificate on reverse proxy or hosting provider
3. Enforce HTTPS redirect (HTTP → HTTPS)
4. Update CORS_ORIGIN to use https:// protocol
5. Update frontend VITE_API_BASE_URL to https://

### Verify SSL
```bash
# Test SSL configuration
curl -I https://yourdomain.com

# Should return 200 OK with HTTPS
# Check SSL rating: https://www.ssllabs.com/ssltest/
```

---

## 6. BUILD PROCESS

### Backend Build
```bash
cd backend
npm ci --production # Install production dependencies only
npx prisma generate # Generate Prisma client
npm run build # Compile TypeScript
```

### Frontend Build
```bash
npm ci --production
npm run build # Creates optimized production build in dist/
```

### Verify Build Success
- [ ] Backend build succeeds without errors
- [ ] Frontend build succeeds without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors (run `npm run lint`)
- [ ] Bundle size is reasonable (check dist/ folder size)

---

## 7. START COMMANDS

### Backend
```bash
cd backend
NODE_ENV=production node dist/main.js
```

### Frontend
Serve static files from `dist/` folder using:
- Nginx
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static file hosting

---

## 8. POST-DEPLOYMENT VERIFICATION

After deployment, verify all functionality:

### Critical Functionality
- [ ] Homepage loads and displays products
- [ ] Product search works
- [ ] Product detail page loads
- [ ] Category filtering works
- [ ] Use case filtering works
- [ ] Affiliate link click tracking works (check analytics)
- [ ] Product view tracking works (check analytics)
- [ ] Admin login works
- [ ] Admin can create/edit products
- [ ] Image upload works
- [ ] OG fetch preview works

### Performance Checks
- [ ] Run Lighthouse audit (target: 90+ Performance, 100 Accessibility)
- [ ] Test on 3G connection (acceptable load times)
- [ ] Verify lazy loading works (images load on scroll)
- [ ] Check CDN cache hit rate (should be >80% after warmup)
- [ ] Verify compression is working (check response headers)

### Security Checks
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Admin routes require authentication
- [ ] CORS only allows your frontend domain
- [ ] Rate limiting works (test by spamming search)
- [ ] No stack traces in error responses
- [ ] Environment variables not exposed in client code

### Analytics Verification
- [ ] Product views are tracked
- [ ] Affiliate clicks are tracked
- [ ] Search queries are tracked
- [ ] Admin dashboard shows correct data

---

## 9. MONITORING & LOGGING

### Application Monitoring
Recommended tools:
- **Sentry** - Error tracking (configure SENTRY_DSN env var)
- **LogRocket** - Session replay for debugging
- **New Relic** - Application performance monitoring

### Server Monitoring
- [ ] Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- [ ] Configure server resource alerts (CPU, memory, disk)
- [ ] Monitor database connections and slow queries
- [ ] Set up log aggregation (e.g., Logtail, Papertrail)

### Key Metrics to Monitor
- Response time (p50, p95, p99)
- Error rate
- Cache hit rate
- Database connection pool utilization
- Disk space usage (uploads folder grows over time)

---

## 10. LEGAL & COMPLIANCE

**CRITICAL: Complete before accepting real traffic**

### Legal Pages
All legal pages have been created with placeholder content. **YOU MUST:**
- [ ] Review all legal pages with a qualified legal professional
- [ ] Replace ALL `[REPLACE THIS]` placeholders with accurate information
- [ ] Ensure POPIA compliance (South Africa)
- [ ] Consider GDPR compliance for global visitors
- [ ] Fill in Information Officer contact details (POPIA requirement)

### Cookie Consent
- [ ] Verify cookie consent banner blocks tracking scripts when declined
- [ ] Test that declining consent actually prevents analytics from loading
- [ ] Verify consent choice is persisted (banner doesn't reappear)
- [ ] Test in both light and dark mode

### Affiliate Disclosure
- [ ] Verify affiliate disclosure appears on all product pages
- [ ] Ensure disclosure is visible and not hidden

---

## 11. SCALING CONSIDERATIONS

### When Traffic Grows
If you exceed ~1,000 concurrent users, consider:

1. **Horizontal Scaling**
   - Deploy multiple backend instances behind load balancer
   - Switch from in-memory cache to Redis (distributed cache)
   - Use database connection pooling (already configured)

2. **Database Optimization**
   - Enable query logging to identify slow queries
   - Add database read replicas for analytics queries
   - Consider archiving old analytics data (>90 days)

3. **CDN & Caching**
   - Enable Cloudflare Argo for even faster routing
   - Implement cache warming strategy (P3.3.3)
   - Consider moving images to S3/Cloudinary

---

## 12. ROLLBACK PLAN

In case deployment fails:

1. **Database Rollback**
   ```bash
   # Restore from backup
   psql prodview < backup_2026-05-30.sql
   ```

2. **Application Rollback**
   - Keep previous version deployed
   - Use blue-green deployment strategy
   - DNS failover to previous version

3. **Emergency Contacts**
   - Database admin: [YOUR CONTACT]
   - Hosting provider support: [SUPPORT LINK]
   - Domain registrar support: [SUPPORT LINK]

---

## DEPLOYMENT CHECKLIST SUMMARY

Use this checklist on deployment day:

**Pre-Deployment**
- [ ] All environment variables configured
- [ ] Database backup created
- [ ] SSL certificate obtained
- [ ] CDN configured (if applicable)
- [ ] Build succeeds without errors
- [ ] Legal pages reviewed by legal professional

**Deployment**
- [ ] Database migrations applied
- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] DNS configured correctly
- [ ] SSL working (HTTPS)

**Post-Deployment**
- [ ] All critical functionality verified
- [ ] Performance checks passed (Lighthouse)
- [ ] Security checks passed
- [ ] Analytics tracking verified
- [ ] Monitoring alerts configured
- [ ] Error tracking configured

**Go-Live**
- [ ] Remove "Coming Soon" page (if applicable)
- [ ] Submit sitemap to Google Search Console
- [ ] Enable analytics tracking
- [ ] Announce launch 🎉

---

**Notes:**
- This checklist will be updated as new deployment requirements are identified
- Always test in staging environment before production deployment
- Keep this document in version control and update after each deployment
