import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const logAction = internalMutation({
  args: {
    adminUserId: v.union(v.id("adminUsers"), v.null()),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    metadata: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    if (args.action.length > 100) {
      throw new Error("Action name too long");
    }
    
    if (args.entityType.length > 50) {
      throw new Error("Entity type too long");
    }
    
    if (args.entityId.length > 100) {
      throw new Error("Entity ID too long");
    }
    
    let sanitizedMetadata = args.metadata;
    if (args.metadata) {
      const metadataStr = JSON.stringify(args.metadata);
      if (metadataStr.length > 2000) {
        sanitizedMetadata = { error: "Metadata too large", originalSize: metadataStr.length };
      }
    }
    
    await ctx.db.insert("auditLogs", {
      adminUserId: args.adminUserId,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      timestamp: Date.now(),
      metadata: sanitizedMetadata,
    });
  },
});

export const getAuditLogs = query({
  args: {
    adminId: v.id("adminUsers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.authInternal.validateAdminSession, {
      adminId: args.adminId
    });
    if (!admin) {
      throw new Error("Unauthorized");
    }
    
    const limit = Math.min(args.limit || 50, 500);
    
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  },
});

export const getSecurityEvents = query({
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
    
    const limit = Math.min(args.limit || 100, 500);
    
    const securityActions = [
      "login_success", "login_failed_user_not_found", "login_failed_invalid_password",
      "login_rate_limited", "login_error", "password_reset_requested", "password_reset_completed"
    ];
    
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit * 2);
    
    return logs
      .filter(log => securityActions.includes(log.action))
      .slice(0, limit);
  },
});

export const cleanupOldLogs = internalMutation({
  args: { daysToKeep: v.number() },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - (args.daysToKeep * 24 * 60 * 60 * 1000);
    
    const oldLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffTime))
      .collect();
    
    let deletedCount = 0;
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
      deletedCount++;
      
      if (deletedCount >= 100) {
        break;
      }
    }
    
    return { deletedCount, remaining: oldLogs.length - deletedCount };
  },
});
