import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const getLatestProducts = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    if (args.limit > 100) {
      throw new Error("Limit cannot exceed 100");
    }
    
    return await ctx.db
      .query("products")
      .withIndex("by_status_and_created_at", (q) => q.eq("status", "published"))
      .order("desc")
      .take(args.limit);
  },
});

export const getProductById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    
    // Only return published products to public or admin-specific fields to admins
    if (product && product.status !== "published") {
      return null;
    }
    
    return product;
  },
});

export const searchProducts = query({
  args: { 
    keyword: v.string(),
    paginationOpts: paginationOptsValidator,
    ip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rate limiting for search
    const rateLimitKey = `search:${args.ip || 'unknown'}`;
    const rateCheck = await ctx.runQuery(internal.security.checkRateLimit, {
      key: rateLimitKey,
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 30,
    });
    
    if (!rateCheck.allowed) {
      throw new Error("Search rate limit exceeded. Please slow down.");
    }
    
    // Validate search input
    const validation = await ctx.runQuery(internal.security.validateInput, {
      type: "text",
      value: args.keyword,
    });
    
    if (!validation.valid) {
      throw new Error("Invalid search query");
    }
    
    if (args.keyword.length > 100) {
      throw new Error("Search query too long");
    }
    
    return await ctx.db
      .query("products")
      .withSearchIndex("search_name", (q) =>
        q.search("name", args.keyword.trim()).eq("status", "published")
      )
      .paginate(args.paginationOpts);
  },
});

export const getProductsByCategory = query({
  args: { 
    categoryId: v.id("categories"),
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    const allProducts = await ctx.db
      .query("products")
      .withIndex("by_status_and_created_at", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();
    
    const filteredProducts = allProducts.filter(product => 
      product.categories.includes(args.categoryId)
    );
    
    const startIndex = args.paginationOpts.cursor ? 
      parseInt(args.paginationOpts.cursor) : 0;
    const endIndex = startIndex + Math.min(args.paginationOpts.numItems, 100);
    const page = filteredProducts.slice(startIndex, endIndex);
    
    return {
      page,
      isDone: endIndex >= filteredProducts.length,
      continueCursor: endIndex < filteredProducts.length ? endIndex.toString() : null
    };
  },
});

export const getProductsByUseCase = query({
  args: { 
    useCaseId: v.id("useCases"),
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    const allProducts = await ctx.db
      .query("products")
      .withIndex("by_status_and_created_at", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();
    
    const filteredProducts = allProducts.filter(product => 
      product.useCases.includes(args.useCaseId)
    );
    
    const startIndex = args.paginationOpts.cursor ? 
      parseInt(args.paginationOpts.cursor) : 0;
    const endIndex = startIndex + Math.min(args.paginationOpts.numItems, 100);
    const page = filteredProducts.slice(startIndex, endIndex);
    
    return {
      page,
      isDone: endIndex >= filteredProducts.length,
      continueCursor: endIndex < filteredProducts.length ? endIndex.toString() : null
    };
  },
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const generateUploadUrl = mutation({
  args: { adminId: v.id("adminUsers") },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.authInternal.validateAdminSession, {
      adminId: args.adminId
    });
    if (!admin) {
      throw new Error("Unauthorized");
    }
    
    return await ctx.storage.generateUploadUrl();
  },
});

export const createProduct = mutation({
  args: {
    adminId: v.id("adminUsers"),
    name: v.string(),
    description: v.string(),
    affiliateUrl: v.string(),
    categories: v.array(v.id("categories")),
    useCases: v.array(v.id("useCases")),
    images: v.array(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<string> => {
    const admin: Doc<"adminUsers"> | null = await ctx.runQuery(internal.authInternal.validateAdminSession, {
      adminId: args.adminId
    });
    if (!admin) {
      throw new Error("Unauthorized");
    }
    
    // Validate inputs
    const nameValidation = await ctx.runQuery(internal.security.validateInput, {
      type: "text",
      value: args.name,
    });
    
    if (!nameValidation.valid) {
      throw new Error(`Invalid name: ${nameValidation.error}`);
    }
    
    const descValidation = await ctx.runQuery(internal.security.validateInput, {
      type: "text",
      value: args.description,
    });
    
    if (!descValidation.valid) {
      throw new Error(`Invalid description: ${descValidation.error}`);
    }
    
    const urlValidation = await ctx.runQuery(internal.security.validateInput, {
      type: "url",
      value: args.affiliateUrl,
    });
    
    if (!urlValidation.valid) {
      throw new Error(`Invalid URL: ${urlValidation.error}`);
    }
    
    if (args.categories.length > 10) {
      throw new Error("Too many categories");
    }
    
    if (args.useCases.length > 10) {
      throw new Error("Too many use cases");
    }
    
    if (args.images.length > 20) {
      throw new Error("Too many images");
    }
    
    const now = Date.now();
    
    const productId: Id<"products"> = await ctx.db.insert("products", {
      name: args.name.trim(),
      description: args.description.trim(),
      affiliateUrl: args.affiliateUrl.trim(),
      categories: args.categories,
      useCases: args.useCases,
      images: args.images,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      createdBy: admin._id,
      updatedBy: admin._id,
    });
    
    await ctx.runMutation(internal.audit.logAction, {
      adminUserId: admin._id,
      action: "create_product",
      entityType: "product",
      entityId: productId,
      metadata: { name: args.name },
    });
    
    return productId;
  },
});

export const updateProduct = mutation({
  args: {
    adminId: v.id("adminUsers"),
    productId: v.id("products"),
    name: v.string(),
    description: v.string(),
    affiliateUrl: v.string(),
    categories: v.array(v.id("categories")),
    useCases: v.array(v.id("useCases")),
    images: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.authInternal.validateAdminSession, {
      adminId: args.adminId
    });
    if (!admin) {
      throw new Error("Unauthorized");
    }
    
    const existingProduct = await ctx.db.get(args.productId);
    if (!existingProduct) {
      throw new Error("Product not found");
    }
    
    // Validate inputs (same as create)
    const nameValidation = await ctx.runQuery(internal.security.validateInput, {
      type: "text",
      value: args.name,
    });
    
    if (!nameValidation.valid) {
      throw new Error(`Invalid name: ${nameValidation.error}`);
    }
    
    const descValidation = await ctx.runQuery(internal.security.validateInput, {
      type: "text",
      value: args.description,
    });
    
    if (!descValidation.valid) {
      throw new Error(`Invalid description: ${descValidation.error}`);
    }
    
    const urlValidation = await ctx.runQuery(internal.security.validateInput, {
      type: "url",
      value: args.affiliateUrl,
    });
    
    if (!urlValidation.valid) {
      throw new Error(`Invalid URL: ${urlValidation.error}`);
    }
    
    if (args.categories.length > 10) {
      throw new Error("Too many categories");
    }
    
    if (args.useCases.length > 10) {
      throw new Error("Too many use cases");
    }
    
    if (args.images.length > 20) {
      throw new Error("Too many images");
    }
    
    const { adminId, productId, ...updates } = args;
    const now = Date.now();
    
    await ctx.db.patch(productId, {
      name: updates.name.trim(),
      description: updates.description.trim(),
      affiliateUrl: updates.affiliateUrl.trim(),
      categories: updates.categories,
      useCases: updates.useCases,
      images: updates.images,
      updatedAt: now,
      updatedBy: admin._id,
    });
    
    await ctx.runMutation(internal.audit.logAction, {
      adminUserId: admin._id,
      action: "update_product",
      entityType: "product",
      entityId: productId,
      metadata: { 
        name: updates.name,
        previousName: existingProduct.name 
      },
    });
    
    return productId;
  },
});

export const deleteProduct = mutation({
  args: { 
    adminId: v.id("adminUsers"),
    productId: v.id("products") 
  },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.authInternal.validateAdminSession, {
      adminId: args.adminId
    });
    if (!admin) {
      throw new Error("Unauthorized");
    }
    
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    
    await ctx.db.delete(args.productId);
    
    await ctx.runMutation(internal.audit.logAction, {
      adminUserId: admin._id,
      action: "delete_product",
      entityType: "product",
      entityId: args.productId,
      metadata: { name: product.name },
    });
  },
});

export const getAllProductsForAdmin = query({
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
    
    const limit = Math.min(args.limit || 100, 1000);
    
    return await ctx.db
      .query("products")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
  },
});

export const getAllProductsAdmin = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 100, 1000);
    
    return await ctx.db
      .query("products")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
  },
});
