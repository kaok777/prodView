import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export const getAllUseCases = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("useCases").order("asc").collect();
  },
});

export const getUseCaseById = query({
  args: { useCaseId: v.id("useCases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.useCaseId);
  },
});

export const createUseCase = mutation({
  args: {
    adminId: v.id("adminUsers"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const admin: Doc<"adminUsers"> | null = await ctx.runQuery(internal.authInternal.validateAdminSession, {
      adminId: args.adminId
    });
    if (!admin) {
      throw new Error("Unauthorized");
    }

    const useCaseId = await ctx.db.insert("useCases", {
      name: args.name,
      createdAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.logAction, {
      adminUserId: admin._id,
      action: "create_use_case",
      entityType: "useCase",
      entityId: useCaseId,
      metadata: { name: args.name },
    });

    return useCaseId;
  },
});
