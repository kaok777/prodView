import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const trackEvent = mutation({
  args: {
    eventType: v.string(),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.object({})),
    timestamp: v.number(),
    ip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rate limiting for analytics events
    const rateLimitKey = `analytics:${args.ip || 'unknown'}`;
    const rateCheck = await ctx.runQuery(internal.security.checkRateLimit, {
      key: rateLimitKey,
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 100,
    });
    
    if (!rateCheck.allowed) {
      // Silently fail analytics to not break user experience
      return;
    }
    
    // Validate event type
    const allowedEvents = [
      'product_view', 'affiliate_click', 'category_click', 
      'use_case_click', 'search', 'page_view'
    ];
    
    if (!allowedEvents.includes(args.eventType)) {
      throw new Error("Invalid event type");
    }
    
    // Sanitize metadata
    let sanitizedMetadata = args.metadata;
    if (args.metadata) {
      const metadataStr = JSON.stringify(args.metadata);
      if (metadataStr.length > 1000) {
        sanitizedMetadata = { error: "Metadata too large" };
      }
      
      const validation = await ctx.runQuery(internal.security.validateInput, {
        type: "text",
        value: metadataStr,
      });
      
      if (!validation.valid) {
        sanitizedMetadata = { error: "Invalid metadata content" };
      }
    }
    
    // Record rate limit attempt
    await ctx.runMutation(internal.security.recordAttempt, {
      key: rateLimitKey,
      ip: args.ip,
    });
    
    // Store analytics event without any PII
    await ctx.db.insert("analyticsEvents", {
      eventType: args.eventType,
      entityId: args.entityId,
      metadata: sanitizedMetadata,
      timestamp: args.timestamp,
      sessionId: Math.random().toString(36).substring(7), // Anonymous session
    });
  },
});

export const trackAffiliateClick = mutation({
  args: {
    productId: v.id("products"),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rate limiting for affiliate clicks
    const rateLimitKey = `affiliate:${args.ip || 'unknown'}`;
    const rateCheck = await ctx.runQuery(internal.security.checkRateLimit, {
      key: rateLimitKey,
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 10,
    });
    
    if (!rateCheck.allowed) {
      throw new Error("Too many affiliate clicks. Please slow down.");
    }
    
    const product = await ctx.db.get(args.productId);
    if (!product || product.status !== "published") {
      throw new Error("Product not found");
    }
    
    // Record attempt
    await ctx.runMutation(internal.security.recordAttempt, {
      key: rateLimitKey,
      ip: args.ip,
      userAgent: args.userAgent,
    });
    
    // Track the click
    await ctx.db.insert("analyticsEvents", {
      eventType: "affiliate_click",
      entityId: args.productId,
      metadata: { 
        url: product.affiliateUrl,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      sessionId: Math.random().toString(36).substring(7),
    });
    
    return { redirectUrl: product.affiliateUrl };
  },
});

export const getTopProducts = query({
  args: { 
    adminId: v.id("adminUsers"),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.authInternal.validateAdminSession, {
      adminId: args.adminId
    });
    if (!admin) {
      throw new Error("Unauthorized");
    }
    
    const limit = Math.min(args.limit || 10, 50);
    
    const productViews = await ctx.db
      .query("analyticsEvents")
      .filter((q) => q.eq(q.field("eventType"), "product_view"))
      .collect();

    const viewCounts = productViews.reduce((acc, event) => {
      if (event.entityId) {
        acc[event.entityId] = (acc[event.entityId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topProductIds = Object.entries(viewCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([id, count]) => ({ productId: id, views: count }));

    const products = await Promise.all(
      topProductIds.map(async ({ productId, views }) => {
        const product = await ctx.db.get(productId as any);
        return product ? { ...product, views } : null;
      })
    );

    return products.filter(Boolean);
  },
});

export const getAffiliateClicks = query({
  args: { 
    adminId: v.id("adminUsers"),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.authInternal.validateAdminSession, {
      adminId: args.adminId
    });
    if (!admin) {
      throw new Error("Unauthorized");
    }
    
    const limit = Math.min(args.limit || 10, 50);
    
    const affiliateClicks = await ctx.db
      .query("analyticsEvents")
      .filter((q) => q.eq(q.field("eventType"), "affiliate_click"))
      .collect();

    const clickCounts = affiliateClicks.reduce((acc, event) => {
      if (event.entityId) {
        acc[event.entityId] = (acc[event.entityId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topClicks = Object.entries(clickCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([id, count]) => ({ productId: id, clicks: count }));

    const products = await Promise.all(
      topClicks.map(async ({ productId, clicks }) => {
        const product = await ctx.db.get(productId as any);
        return product ? { ...product, clicks } : null;
      })
    );

    return products.filter(Boolean);
  },
});

export const getCategoryStats = query({
  args: { adminId: v.id("adminUsers") },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.authInternal.validateAdminSession, {
      adminId: args.adminId
    });
    if (!admin) {
      throw new Error("Unauthorized");
    }
    
    const categoryClicks = await ctx.db
      .query("analyticsEvents")
      .filter((q) => q.eq(q.field("eventType"), "category_click"))
      .collect();

    const clickCounts = categoryClicks.reduce((acc, event) => {
      if (event.entityId) {
        acc[event.entityId] = (acc[event.entityId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const categoryStats = await Promise.all(
      Object.entries(clickCounts).map(async ([categoryId, clicks]) => {
        const category = await ctx.db.get(categoryId as any);
        return category ? { ...category, clicks } : null;
      })
    );

    return categoryStats.filter((stat): stat is NonNullable<typeof stat> => stat !== null)
      .sort((a, b) => b.clicks - a.clicks);
  },
});

export const getSearchStats = query({
  args: { 
    adminId: v.id("adminUsers"),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.authInternal.validateAdminSession, {
      adminId: args.adminId
    });
    if (!admin) {
      throw new Error("Unauthorized");
    }
    
    const limit = Math.min(args.limit || 20, 100);
    
    const searchEvents = await ctx.db
      .query("analyticsEvents")
      .filter((q) => q.eq(q.field("eventType"), "search"))
      .collect();

    const searchCounts = searchEvents.reduce((acc, event) => {
      const metadata = event.metadata as { query?: string } | undefined;
      const query = metadata?.query;
      if (query && typeof query === 'string' && query.length <= 100) {
        const normalizedQuery = query.toLowerCase().trim();
        acc[normalizedQuery] = (acc[normalizedQuery] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(searchCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  },
});
