"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const hashPassword = internalAction({
  args: { password: v.string() },
  handler: async (ctx, args): Promise<string> => {
    const saltRounds = 12;
    return await bcrypt.hash(args.password, saltRounds);
  },
});

export const verifyPassword = internalAction({
  args: {
    password: v.string(),
    hash: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    return await bcrypt.compare(args.password, args.hash);
  },
});

export const createResetToken = internalAction({
  args: { adminId: v.id("adminUsers") },
  handler: async (ctx, args): Promise<string> => {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    await ctx.runMutation(internal.authInternal.insertResetToken, {
      adminId: args.adminId,
      tokenHash,
      expiresAt,
    });

    return token;
  },
});

export const getResetToken = internalAction({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<Doc<"passwordResets"> | null> => {
    const tokenHash = crypto.createHash("sha256").update(args.token).digest("hex");
    return await ctx.runQuery(internal.authInternal.getResetTokenByHash, {
      tokenHash,
    });
  },
});

export const deleteResetToken = internalAction({
  args: { tokenId: v.id("passwordResets") },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(internal.authInternal.deleteResetTokenMutation, {
      tokenId: args.tokenId,
    });
  },
});

export const createInitialAdmin = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"adminUsers">> => {
    const existing = await ctx.runQuery(internal.authInternal.getAdminByEmail, {
      email: args.email,
    });

    if (existing) {
      throw new Error("Admin already exists");
    }

    const passwordHash: string = await ctx.runAction(internal.authActions.hashPassword, {
      password: args.password,
    });

    return await ctx.runMutation(internal.authInternal.insertAdmin, {
      email: args.email,
      passwordHash,
    });
  },
});
