# Centralized Logging Strategy

**Fixed: CQ4.3.2 - Document centralized logging strategy**

This document outlines the logging strategy for ProdView, including current implementation and future enhancements.

## Current State (As of 2026-05-30)

### Backend Logging

**Current Implementation:**
- Global error handlers in `backend/src/main.ts`:
  - `process.on('unhandledRejection')` - Logs unhandled promise rejections
  - `process.on('uncaughtException')` - Logs uncaught exceptions
- Prisma query logging in `backend/src/common/prisma.service.ts`:
  - Development: All queries with duration and color-coding
  - Production: Only slow queries (>1000ms)
- Console.error/console.warn in error handlers

**Limitations:**
- No structured logging (plain text)
- No log aggregation
- Logs lost after server restart or log rotation
- No correlation IDs for request tracing
- No log levels (debug, info, warn, error)

### Frontend Logging

**Current Implementation:**
- Global error handlers in `src/main.tsx`:
  - `window.addEventListener('unhandledrejection')` - Catches unhandled promises
  - `window.addEventListener('error')` - Catches uncaught errors
- Console.error for error logging

**Limitations:**
- No persistent error storage
- No user context (which user experienced error)
- No error aggregation or deduplication
- Errors lost on page refresh

---

## Future State (Centralized Logging)

### Phase 1: Structured Logging (Backend)

**Goal:** Replace console.log/console.error with structured logging library.

**Recommended Library:** [Pino](https://getpino.io/) or [Winston](https://github.com/winstonjs/winston)

**Why Pino:**
- Extremely fast (low performance overhead)
- JSON-structured logs (easy to parse)
- Built-in log levels
- Request correlation IDs
- Child loggers for context

**Implementation:**

```typescript
// backend/src/common/logger.service.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',  // Human-readable in dev
    options: { colorize: true }
  } : undefined,  // JSON in production
});

export default logger;
```

**Usage:**

```typescript
// Before (console.log)
console.log('Product created:', product.id);

// After (structured logging)
logger.info({ productId: product.id }, 'Product created');

// Error logging
try {
  await operation();
} catch (error) {
  logger.error({ error, productId }, 'Failed to create product');
  throw error;
}
```

**Benefits:**
- Structured JSON logs → easy parsing
- Log levels (debug, info, warn, error)
- Performance overhead <1ms per log
- Request correlation IDs

---

### Phase 2: Log Aggregation (Backend)

**Goal:** Send logs to centralized service for analysis and alerting.

**Recommended Services:**

1. **CloudWatch Logs** (AWS)
   - Built-in if deployed on AWS
   - $0.50/GB ingested + $0.03/GB stored
   - CloudWatch Insights for querying
   - Alarms for error rate spikes

2. **DataDog** (Multi-cloud)
   - Full observability platform
   - APM + Logs + Metrics
   - $15/host/month + log ingestion
   - Best for enterprise

3. **Better Stack (formerly Logtail)**
   - Modern logging platform
   - $10/month for 3GB/month
   - Live tail, search, alerts
   - Great for startups

**Implementation (CloudWatch example):**

```typescript
// backend/src/common/logger.service.ts
import pino from 'pino';
import { createWriteStream } from 'pino-cloudwatch';

const logger = pino(createWriteStream({
  logGroupName: '/prodview/backend',
  logStreamName: `instance-${process.env.INSTANCE_ID}`,
  awsRegion: 'us-east-1',
}));
```

**Benefits:**
- Logs persisted beyond server restarts
- Search and filter logs by any field
- Alerts on error rate > threshold
- Correlate logs with metrics

---

### Phase 3: Error Tracking (Frontend & Backend)

**Goal:** Track errors with user context, stack traces, and replay.

**Recommended Services:**

1. **Sentry** (Most popular)
   - Error tracking + performance monitoring
   - Free tier: 5k errors/month
   - Stack traces with source maps
   - User context and breadcrumbs
   - Session replay (paid)

2. **LogRocket** (Frontend focus)
   - Session replay + error tracking
   - See exactly what user did before error
   - $99/month for 10k sessions
   - Great for debugging UX issues

3. **BugSnag** (Alternative)
   - Similar to Sentry
   - Good support, simpler UI
   - $49/month for 7.5k errors

**Implementation (Sentry example):**

**Backend:**
```typescript
// backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% of requests
});

// Global error handler
process.on('unhandledRejection', (error) => {
  Sentry.captureException(error);
  logger.error({ error }, 'Unhandled rejection');
});
```

**Frontend:**
```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE,
});

// Wrap app
createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);
```

**Benefits:**
- Automatic error capturing
- Stack traces with source maps
- User context (logged-in admin email)
- Deployment tracking (know which version caused error)
- Email/Slack alerts on new errors

---

### Phase 4: Request Tracing (Advanced)

**Goal:** Trace requests across frontend → backend → database with correlation IDs.

**Recommended:** OpenTelemetry + Jaeger/DataDog APM

**Use Cases:**
- Debug slow API requests
- See database query duration per request
- Identify performance bottlenecks
- Correlate frontend errors with backend logs

**When to implement:** After product-market fit, if debugging performance issues.

---

## Implementation Roadmap

### Immediate (Can do now)
- ✅ Global error handlers (already done)
- ✅ Console.log policy documented (CONTRIBUTING.md)
- ✅ Prisma query logging (already done)

### Short-term (1-2 weeks)
- [ ] Replace console.log with Pino structured logging
- [ ] Add log levels throughout codebase
- [ ] Implement request correlation IDs

### Medium-term (1-3 months)
- [ ] Integrate Sentry for error tracking (frontend + backend)
- [ ] Set up CloudWatch Logs or Better Stack
- [ ] Configure error rate alerts

### Long-term (3-6 months)
- [ ] Add session replay (LogRocket or Sentry Replay)
- [ ] Implement distributed tracing (OpenTelemetry)
- [ ] Log-based metrics and dashboards

---

## Logging Best Practices

### What to Log

**DO Log:**
- Errors and exceptions (always)
- Authentication events (login, logout, failures)
- Admin actions (product create/update/delete)
- Critical business events (affiliate clicks)
- Performance issues (slow queries, API timeouts)
- Security events (rate limit hits, suspicious requests)

**DON'T Log:**
- Passwords or JWT tokens
- Credit card numbers or PII
- Full request bodies in production (may contain sensitive data)
- High-frequency debug logs in production (cost/performance)

### Log Levels

- **ERROR**: Something failed, needs attention
- **WARN**: Something unexpected but handled
- **INFO**: Important business events
- **DEBUG**: Detailed information for debugging (dev only)

### Log Structure

```typescript
// ✅ Good - Structured with context
logger.info({
  event: 'product_created',
  productId: product.id,
  productName: product.name,
  adminId: user.id,
  duration: Date.now() - startTime,
}, 'Product created successfully');

// ❌ Bad - Unstructured string
console.log(`Product ${product.name} created by ${user.email}`);
```

---

## Cost Estimates

**Startup tier (< 1M requests/month):**
- Better Stack: $10/month
- Sentry (free tier): $0
- **Total: ~$10/month**

**Growth tier (1-10M requests/month):**
- CloudWatch Logs: ~$50/month (10GB logs)
- Sentry Pro: $26/month
- **Total: ~$76/month**

**Enterprise tier (> 10M requests/month):**
- DataDog: $300-500/month
- Sentry Business: $80+/month
- **Total: ~$400-600/month**

---

## Monitoring Checklist

Once centralized logging is implemented:

- [ ] Error rate alert (>10 errors/minute)
- [ ] 500 status code alert
- [ ] Slow query alert (>5 seconds)
- [ ] Disk space alert (<10% free)
- [ ] Memory usage alert (>90%)
- [ ] Failed authentication alert (>10 failures/minute)

---

## References

- [Pino Documentation](https://getpino.io/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Sentry Documentation](https://docs.sentry.io/)
- [AWS CloudWatch Logs](https://docs.aws.amazon.com/cloudwatch/latest/logs/)
- [Better Stack](https://betterstack.com/logs)
- [OpenTelemetry](https://opentelemetry.io/)

---

**Last Updated:** 2026-05-30
**Next Review:** When implementing production deployment or experiencing logging/debugging difficulties
