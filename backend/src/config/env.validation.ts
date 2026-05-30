/**
 * Environment Variable Validation
 *
 * Validates required environment variables on application startup.
 * Fails fast if critical configuration is missing.
 *
 * Fixed: LOW-B1 - CORS preflight maxAge too short
 * Part of: MEDIUM-B4 - Configuration centralization
 */

export interface EnvironmentVariables {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  CORS_ORIGIN: string;
  CORS_MAX_AGE: number;
}

export function validateEnvironment(): EnvironmentVariables {
  const errors: string[] = [];

  // Required variables
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // JWT_SECRET strength validation
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters for security');
  }

  // Reject placeholder JWT_SECRET values
  const jwtSecret = process.env.JWT_SECRET || '';
  const forbiddenJwtSecrets = [
    'CHANGE_THIS',
    'change-this',
    'your-super-secure-jwt-secret',
    'example',
    'test-secret',
    'openssl_rand_base64',
  ];

  if (forbiddenJwtSecrets.some(forbidden => jwtSecret.includes(forbidden))) {
    errors.push('JWT_SECRET contains placeholder text. Generate a real secret with: openssl rand -base64 48');
  }

  // JWT_EXPIRATION validation
  const jwtExpiration = process.env.JWT_EXPIRATION || '15m';
  if (!jwtExpiration.match(/^\d+[smhd]$/)) {
    errors.push('JWT_EXPIRATION must be in format: 15m, 1h, 7d, etc.');
  }

  // CORS_ORIGIN validation for production
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  if (isProduction && !process.env.CORS_ORIGIN) {
    errors.push('CORS_ORIGIN is required in production');
  }

  const corsOrigin = process.env.CORS_ORIGIN || '';
  if (isProduction && (corsOrigin.includes('localhost') || corsOrigin.includes('127.0.0.1'))) {
    errors.push('CORS_ORIGIN must not be localhost or 127.0.0.1 in production - set to your actual frontend domain');
  }

  // Validate CORS_ORIGIN is a valid URL
  if (corsOrigin && !corsOrigin.match(/^https?:\/\/.+/)) {
    errors.push('CORS_ORIGIN must be a valid URL starting with http:// or https://');
  }

  // Port validation
  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid number between 1 and 65535');
  }

  // CORS_MAX_AGE validation (default 86400 seconds = 24 hours)
  const corsMaxAge = parseInt(process.env.CORS_MAX_AGE || '86400', 10);
  if (isNaN(corsMaxAge) || corsMaxAge < 0 || corsMaxAge > 86400) {
    errors.push('CORS_MAX_AGE must be a valid number between 0 and 86400 (24 hours)');
  }

  // NODE_ENV validation
  const validEnvs = ['development', 'production', 'test', 'staging'];
  if (nodeEnv && !validEnvs.includes(nodeEnv)) {
    errors.push(`NODE_ENV must be one of: ${validEnvs.join(', ')}. Got: ${nodeEnv}`);
  }

  // Database URL validation for production
  if (isProduction) {
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      errors.push('DATABASE_URL should not use localhost in production - use a proper database host');
    }
    if (dbUrl.includes(':admin@') || dbUrl.includes(':password@') || dbUrl.includes(':test@')) {
      errors.push('DATABASE_URL appears to contain a weak or placeholder password');
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ Environment Variable Validation Failed:\n');
    errors.forEach((error) => console.error(`   - ${error}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRATION: jwtExpiration,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    CORS_MAX_AGE: corsMaxAge,
  };
}
