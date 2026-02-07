import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  products: defineTable({
    name: v.string(),
    description: v.string(),
    images: v.array(v.id("_storage")),
    affiliateUrl: v.string(),
    categories: v.array(v.id("categories")),
    useCases: v.array(v.id("useCases")),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("adminUsers"),
    updatedBy: v.id("adminUsers"),
  })
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_status_and_created_at", ["status", "createdAt"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["status"],
    })
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["status"],
    }),

  categories: defineTable({
    name: v.string(),
    parentCategoryId: v.optional(v.id("categories")),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_parent", ["parentCategoryId"])
    .index("by_created_at", ["createdAt"]),

  useCases: defineTable({
    name: v.string(),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_created_at", ["createdAt"]),

  adminUsers: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    role: v.literal("admin"),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_created_at", ["createdAt"])
    .index("by_last_login", ["lastLoginAt"]),

  auditLogs: defineTable({
    adminUserId: v.union(v.id("adminUsers"), v.null()),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.object({})),
  })
    .index("by_admin_user", ["adminUserId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_admin_and_timestamp", ["adminUserId", "timestamp"])
    .index("by_entity_and_timestamp", ["entityType", "entityId", "timestamp"]),

  passwordResets: defineTable({
    adminId: v.id("adminUsers"),
    tokenHash: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    used: v.optional(v.boolean()),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_admin", ["adminId"])
    .index("by_expires_at", ["expiresAt"]),

  analyticsEvents: defineTable({
    eventType: v.string(),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.object({})),
    timestamp: v.number(),
    sessionId: v.string(),
  })
    .index("by_event_type", ["eventType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_entity", ["entityId"])
    .index("by_event_and_timestamp", ["eventType", "timestamp"]),

  rateLimits: defineTable({
    key: v.string(),
    timestamp: v.number(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_key", ["key"])
    .index("by_timestamp", ["timestamp"])
    .index("by_key_and_timestamp", ["key", "timestamp"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
