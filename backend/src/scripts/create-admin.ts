#!/usr/bin/env ts-node

/**
 * Secure Admin Initialization Script
 *
 * This script creates the first admin user from environment variables.
 * It should be run once during initial deployment.
 *
 * Usage:
 *   npm run create-admin
 *
 * Required Environment Variables:
 *   - ADMIN_EMAIL: Admin email address
 *   - ADMIN_PASSWORD: Admin password (must meet complexity requirements)
 *   - DATABASE_URL: PostgreSQL connection string
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface AdminCredentials {
  email: string;
  password: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePassword(password: string): boolean {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const minLength = password.length >= 8;
  const maxLength = password.length <= 128;

  return hasUpper && hasLower && hasNumber && hasSpecial && minLength && maxLength;
}

function promptCredentials(): Promise<AdminCredentials> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter admin email: ', (email) => {
      rl.question('Enter admin password: ', (password) => {
        rl.close();
        resolve({ email, password });
      });
    });
  });
}

async function createAdmin() {
  try {
    console.log('🔐 Admin User Creation Script\n');

    // Check if admin users already exist
    const existingAdminCount = await prisma.adminUser.count();

    if (existingAdminCount > 0) {
      console.error('❌ Error: Admin users already exist in the database.');
      console.error('   Cannot create additional admin through this script.');
      console.error('   Use the admin dashboard to create additional users.\n');
      process.exit(1);
    }

    let credentials: AdminCredentials;

    // Try to get credentials from environment variables
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      console.log('📋 Using credentials from environment variables\n');
      credentials = {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      };
    } else {
      console.log('📋 Environment variables not found. Please enter credentials manually.\n');
      credentials = await promptCredentials();
      console.log('');
    }

    // Validate email
    if (!validateEmail(credentials.email)) {
      console.error('❌ Error: Invalid email format\n');
      process.exit(1);
    }

    // Validate password
    if (!validatePassword(credentials.password)) {
      console.error('❌ Error: Password does not meet complexity requirements:');
      console.error('   - At least 8 characters');
      console.error('   - At least one uppercase letter');
      console.error('   - At least one lowercase letter');
      console.error('   - At least one number');
      console.error('   - At least one special character (!@#$%^&*(),.?":{}|<>)\n');
      process.exit(1);
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(credentials.password, saltRounds);

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await prisma.adminUser.create({
      data: {
        email: credentials.email.toLowerCase().trim(),
        passwordHash,
        role: 'admin',
      },
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Created: ${admin.createdAt}\n`);

    console.log('🔐 IMPORTANT: Store these credentials securely.');
    console.log('   DO NOT commit them to version control.\n');

  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
