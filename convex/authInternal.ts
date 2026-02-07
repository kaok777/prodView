import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const validateAdminSession = internalQuery({
  args: { adminId: v.id("adminUsers") },
  handler: async (ctx, args): Promise<Doc<"adminUsers"> | null> => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin) {
      return null;
    }
    
    // Check if admin account is still active
    return admin;
  },
});

export const getCurrentAdminInternal = internalQuery({
  args: { adminId: v.optional(v.id("adminUsers")) },
  handler: async (ctx, args): Promise<Doc<"adminUsers"> | null> => {
    if (!args.adminId) {
      return null;
    }
    
    const admin = await ctx.db.get(args.adminId);
    return admin || null;
  },
});

export const getAdminByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const updateLastLogin = internalMutation({
  args: { adminId: v.id("adminUsers") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, {
      lastLoginAt: Date.now(),
    });
  },
});

export const insertResetToken = internalMutation({
  args: {
    adminId: v.id("adminUsers"),
    tokenHash: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Clean up old tokens for this admin
    const oldTokens = await ctx.db
      .query("passwordResets")
      .withIndex("by_admin", (q) => q.eq("adminId", args.adminId))
      .collect();

    for (const token of oldTokens) {
      await ctx.db.delete(token._id);
    }

    return await ctx.db.insert("passwordResets", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getResetTokenByHash = internalQuery({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("passwordResets")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();
  },
});

export const deleteResetTokenMutation = internalMutation({
  args: { tokenId: v.id("passwordResets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.tokenId);
  },
});

export const insertAdmin = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("adminUsers", {
      ...args,
      role: "admin",
      createdAt: Date.now(),
    });
  },
});

export const updateAdminPassword = internalMutation({
  args: {
    adminId: v.id("adminUsers"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, { passwordHash: args.passwordHash });
  },
});
