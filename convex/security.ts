import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

export const checkRateLimit = internalQuery({
  args: {
    key: v.string(),
    windowMs: v.number(),
    maxAttempts: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - args.windowMs;
    
    const attempts = await ctx.db
      .query("rateLimits")
      .withIndex("by_key_and_timestamp", (q) => 
        q.eq("key", args.key).gte("timestamp", windowStart)
      )
      .collect();
    
    return {
      allowed: attempts.length < args.maxAttempts,
      remaining: Math.max(0, args.maxAttempts - attempts.length),
      resetTime: windowStart + args.windowMs
    };
  },
});

export const recordAttempt = internalMutation({
  args: {
    key: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("rateLimits", {
      key: args.key,
      timestamp: Date.now(),
      ip: args.ip,
      userAgent: args.userAgent,
    });
    
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    const oldEntries = await ctx.db
      .query("rateLimits")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .collect();
    
    for (const entry of oldEntries) {
      await ctx.db.delete(entry._id);
    }
  },
});

export const validateInput = internalQuery({
  args: {
    type: v.union(v.literal("email"), v.literal("password"), v.literal("url"), v.literal("text")),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    switch (args.type) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          valid: emailRegex.test(args.value) && args.value.length <= 254,
          error: !emailRegex.test(args.value) ? "Invalid email format" : 
                 args.value.length > 254 ? "Email too long" : null
        };
        
      case "password":
        const hasUpper = /[A-Z]/.test(args.value);
        const hasLower = /[a-z]/.test(args.value);
        const hasNumber = /\d/.test(args.value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(args.value);
        const minLength = args.value.length >= 8;
        const maxLength = args.value.length <= 128;
        
        const valid = hasUpper && hasLower && hasNumber && hasSpecial && minLength && maxLength;
        return {
          valid,
          error: !valid ? "Password must be 8-128 chars with uppercase, lowercase, number, and special character" : null
        };
        
      case "url":
        try {
          const url = new URL(args.value);
          const validProtocols = ['http:', 'https:'];
          const urlValid = validProtocols.includes(url.protocol) && args.value.length <= 2048;
          return {
            valid: urlValid,
            error: !urlValid ? "Invalid URL or URL too long" : null
          };
        } catch {
          return { valid: false, error: "Invalid URL format" };
        }
        
      case "text":
        const hasScript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(args.value);
        const hasOnEvent = /\bon\w+\s*=/gi.test(args.value);
        const hasJavascript = /javascript:/gi.test(args.value);
        const validLength = args.value.length <= 10000;
        
        const textValid = !hasScript && !hasOnEvent && !hasJavascript && validLength;
        return {
          valid: textValid,
          error: !textValid ? "Text contains invalid content or is too long" : null
        };
        
      default:
        return { valid: false, error: "Unknown validation type" };
    }
  },
});
