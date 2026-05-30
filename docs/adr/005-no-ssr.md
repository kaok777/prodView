# 005. No Server-Side Rendering (SSR)

**Date:** 2026-05-30
**Status:** Accepted
**Deciders:** Development Team

## Context

We needed to decide on the frontend rendering strategy for ProdView. The main options were:

1. **Client-Side Rendering (CSR)** - React SPA with Vite
2. **Server-Side Rendering (SSR)** - Next.js, Remix, or similar
3. **Static Site Generation (SSG)** - Pre-rendered HTML pages
4. **Hybrid** - Combination of SSR and CSR

Requirements:
- Fast development velocity
- Good SEO for product pages
- Admin dashboard doesn't need SEO
- Affiliate marketing focus (need SEO for public pages)
- Limited team resources

## Decision

We will use **Client-Side Rendering (CSR)** with React + Vite, without server-side rendering.

Implementation details:
- React 19 for UI framework
- Vite for build tooling and dev server
- React Router for client-side routing
- react-helmet-async for dynamic meta tags

## Consequences

### Positive

- **Faster Development**: Simpler architecture, easier debugging
- **Lower Complexity**: No need to manage server rendering concerns
- **Better DX**: Hot Module Replacement (HMR) works perfectly
- **Easy Deployment**: Static files served via CDN
- **Clear Separation**: Frontend is pure static files, backend is pure API
- **Build Performance**: Vite builds are extremely fast
- **Lower Hosting Costs**: CDN hosting cheaper than SSR server

### Negative

- **SEO Challenges**: Initial HTML has no content (requires JavaScript to render)
- **Slower First Paint**: Users see blank page until JavaScript loads
- **Search Engine Crawling**: Google must execute JavaScript (can be slow)
- **Social Sharing**: Open Graph tags require JavaScript (poor preview cards)
- **Performance**: Larger JavaScript bundles compared to SSR
- **Core Web Vitals**: LCP and FCP may be worse than SSR

### Risks

- **Google Indexing**: Google may not index content as quickly as SSR pages
- **Social Media Previews**: Facebook/Twitter may not see meta tags (affects sharing)
- **SEO Performance**: May rank lower than SSR competitors
- **Migration Complexity**: Moving to SSR later would be significant work

## Mitigation Strategies

### SEO Improvements
1. **Pre-rendering**: Use prerender.io or similar for bot detection
2. **React Helmet**: Dynamic meta tags for each page
3. **Sitemap**: Generate XML sitemap for search engines
4. **Structured Data**: Add JSON-LD for rich snippets

### Performance Improvements
1. **Code Splitting**: Lazy load admin routes (already implemented)
2. **Image Optimization**: Lazy loading with loading="lazy"
3. **CDN**: Serve static files globally via Cloudflare
4. **HTTP/2**: Multiplexing reduces impact of multiple requests

### Social Sharing
1. **Static meta tags**: Add basic OG tags to index.html
2. **Prerender service**: Detect social bots and serve pre-rendered HTML

## Alternatives Considered

### Next.js (SSR)
- **Pros**: Excellent SEO, fast first paint, built-in optimization, hybrid rendering
- **Cons**: More complex, requires Node.js server, slower development, harder debugging
- **Rejected because**: Complexity overhead not justified for affiliate marketing site with mostly admin functionality

### Remix
- **Pros**: Modern SSR framework, excellent DX, nested routing
- **Cons**: Requires server, less mature ecosystem, learning curve
- **Rejected because**: Overkill for our use case, team unfamiliar with Remix

### Static Site Generation (SSG)
- **Pros**: Best performance, best SEO, can deploy to CDN
- **Cons**: Requires rebuild for content changes, not suitable for real-time admin dashboard
- **Rejected because**: Admin features need real-time updates

## When to Reconsider

We should reconsider SSR if:
1. **Organic traffic < 20%** of total traffic after 6 months
2. **Google Search Console** shows poor indexing or ranking
3. **Business requires** immediate SEO performance (e.g., funding depends on organic growth)
4. **Team grows** and can handle SSR complexity

## Related Decisions

- Vite configuration in `vite.config.ts`
- React Helmet for meta tags in page components
- Code splitting for admin routes (ADR-006, if created)

## Notes

The decision to skip SSR was pragmatic - we prioritized development speed and simplicity over theoretical SEO benefits. For an affiliate marketing site, direct traffic and social sharing matter more than organic search initially.

If SEO becomes critical later, we can:
1. Add a prerender service (low effort, high impact)
2. Create a hybrid approach (static product pages + CSR admin)
3. Migrate to Next.js (high effort, highest impact)

As of 2026, Google's JavaScript rendering has improved significantly, making CSR more viable for SEO than in previous years.
