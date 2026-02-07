import { v } from "convex/values";
import { action, internalQuery, internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import bcrypt from "bcryptjs";

export const adminLogin = action({
  args: {
    email: v.string(),
    password: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ adminId: string; email: string; role: string }> => {
    // Rate limiting check
    const rateLimitKey = `login:${args.email}:${args.ip || 'unknown'}`;
    const rateCheck = await ctx.runQuery(internal.security.checkRateLimit, {
      key: rateLimitKey,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,
    });
    
    if (!rateCheck.allowed) {
      await ctx.runMutation(internal.audit.logAction, {
        adminUserId: null,
        action: "login_rate_limited",
        entityType: "auth",
        entityId: args.email,
        metadata: { ip: args.ip, userAgent: args.userAgent },
      });
      throw new Error("Too many login attempts. Please try again later.");
    }
    
    // Validate input
    const emailValidation = await ctx.runQuery(internal.security.validateInput, {
      type: "email",
      value: args.email,
    });
    
    if (!emailValidation.valid) {
      throw new Error("Invalid email format");
    }
    
    const passwordValidation = await ctx.runQuery(internal.security.validateInput, {
      type: "password",
      value: args.password,
    });
    
    // Record attempt for rate limiting
    await ctx.runMutation(internal.security.recordAttempt, {
      key: rateLimitKey,
      ip: args.ip,
      userAgent: args.userAgent,
    });
    
    try {
      const admin: Doc<"adminUsers"> | null = await ctx.runQuery(internal.adminAuth.getAdminByEmail, {
        email: args.email.toLowerCase().trim(),
      });
      
      if (!admin) {
        await ctx.runMutation(internal.audit.logAction, {
          adminUserId: null,
          action: "login_failed_user_not_found",
          entityType: "auth",
          entityId: args.email,
          metadata: { ip: args.ip, userAgent: args.userAgent },
        });
        throw new Error("Invalid credentials");
      }
      
      const validPassword = await bcrypt.compare(args.password, admin.passwordHash);
      
      if (!validPassword) {
        await ctx.runMutation(internal.audit.logAction, {
          adminUserId: admin._id,
          action: "login_failed_invalid_password",
          entityType: "auth",
          entityId: args.email,
          metadata: { ip: args.ip, userAgent: args.userAgent },
        });
        throw new Error("Invalid credentials");
      }
      
      // Update last login
      await ctx.runMutation(internal.adminAuth.updateLastLogin, {
        adminId: admin._id,
      });
      
      // Log successful login
      await ctx.runMutation(internal.audit.logAction, {
        adminUserId: admin._id,
        action: "login_success",
        entityType: "auth",
        entityId: args.email,
        metadata: { ip: args.ip, userAgent: args.userAgent },
      });
      
      return {
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
      };
      
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid credentials") {
        throw error;
      }
      
      await ctx.runMutation(internal.audit.logAction, {
        adminUserId: null,
        action: "login_error",
        entityType: "auth",
        entityId: args.email,
        metadata: { 
          error: error instanceof Error ? error.message : "Unknown error",
          ip: args.ip, 
          userAgent: args.userAgent 
        },
      });
      
      throw new Error("Authentication failed");
    }
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

export const createAdmin = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const emailValidation = await ctx.runQuery(internal.security.validateInput, {
      type: "email",
      value: args.email,
    });
    
    if (!emailValidation.valid) {
      throw new Error(emailValidation.error || "Invalid email");
    }
    
    const passwordValidation = await ctx.runQuery(internal.security.validateInput, {
      type: "password",
      value: args.password,
    });
    
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error || "Invalid password");
    }
    
    const existingAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
      .unique();
    
    if (existingAdmin) {
      throw new Error("Admin already exists");
    }
    
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(args.password, saltRounds);
    
    return await ctx.db.insert("adminUsers", {
      email: args.email.toLowerCase().trim(),
      passwordHash,
      role: "admin",
      createdAt: Date.now(),
    });
  },
});

// Setup function to create the first admin user
export const setupFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const existingAdmins = await ctx.db.query("adminUsers").collect();
    
    if (existingAdmins.length > 0) {
      throw new Error("Admin users already exist.");
    }
    
    const defaultEmail = "vibrationconnect@gmail.com";
    const defaultPassword = "Cxserfd345;";
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);
    
    const adminId = await ctx.db.insert("adminUsers", {
      email: defaultEmail,
      passwordHash,
      role: "admin",
      createdAt: Date.now(),
    });
    
    return {
      adminId,
      email: defaultEmail,
      password: defaultPassword,
      message: "First admin created successfully."
    };
  },
});
