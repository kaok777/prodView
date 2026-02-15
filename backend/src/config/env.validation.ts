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

  if (isProduction && process.env.CORS_ORIGIN === 'http://localhost:5173') {
    errors.push('CORS_ORIGIN must not be localhost in production');
  }

  // Port validation
  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid number between 1 and 65535');
  }

  // Warn about default JWT_SECRET in production
  if (isProduction && process.env.JWT_SECRET?.includes('change-this')) {
    errors.push('WARNING: JWT_SECRET appears to be the default value. CHANGE IT IMMEDIATELY!');
  }

  // CORS_MAX_AGE validation (default 86400 seconds = 24 hours)
  const corsMaxAge = parseInt(process.env.CORS_MAX_AGE || '86400', 10);
  if (isNaN(corsMaxAge) || corsMaxAge < 0 || corsMaxAge > 86400) {
    errors.push('CORS_MAX_AGE must be a valid number between 0 and 86400 (24 hours)');
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
