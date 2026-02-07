import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export const getAllCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").order("asc").collect();
  },
});

export const getCategoryById = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.categoryId);
  },
});

export const createCategory = mutation({
  args: {
    adminId: v.id("adminUsers"),
    name: v.string(),
    parentCategoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const admin: Doc<"adminUsers"> | null = await ctx.runQuery(internal.authInternal.validateAdminSession, {
      adminId: args.adminId
    });
    if (!admin) {
      throw new Error("Unauthorized");
    }

    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      parentCategoryId: args.parentCategoryId,
      createdAt: Date.now(),
    });

    await ctx.runMutation(internal.audit.logAction, {
      adminUserId: admin._id,
      action: "create_category",
      entityType: "category",
      entityId: categoryId,
      metadata: { name: args.name },
    });

    return categoryId;
  },
});
