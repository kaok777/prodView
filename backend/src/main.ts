import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { validateEnvironment } from './config/env.validation';

async function bootstrap() {
  // Validate environment variables before starting
  validateEnvironment();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  // Enable cookie parser for httpOnly cookies
  app.use(cookieParser());

  // Fixed: P3.4.2 - Enable gzip/deflate compression for all responses
  // Reduces JSON/HTML response size by 70-90%
  // Compression level 6 (default) balances speed vs compression ratio
  app.use(compression({
    filter: (req, res) => {
      // Don't compress if client doesn't accept encoding
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression filter function
      return compression.filter(req, res);
    },
    threshold: 1024, // Only compress responses > 1KB
  }));

  // Configure Helmet with strict Content Security Policy
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Remove 'unsafe-inline' to enforce CSP properly - use CSS files instead
        styleSrc: ["'self'"],
        // Strict script policy - no unsafe-inline or unsafe-eval
        scriptSrc: ["'self'"],
        // Allow images from self, data URIs, and HTTPS (for external product images)
        imgSrc: ["'self'", 'data:', 'https:'],
        // API connections only to self
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        // Add base-uri restriction
        baseUri: ["'self'"],
        // Restrict form actions
        formAction: ["'self'"],
        // Upgrade insecure requests in production
        ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // Get CORS maxAge from environment (default 86400 seconds = 24 hours)
  // Fixed: LOW-B1 - CORS preflight maxAge too short
  const corsMaxAge = configService.get<number>('CORS_MAX_AGE', 86400);

  const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || !isProduction) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: corsMaxAge,
  });

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        return req.path.includes('/uploads/');
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      // F2.7.2: Always disable detailed error messages (even in dev) to prevent schema info exposure
      disableErrorMessages: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Static file serving: When running from dist/src/main.js, we need to go up two levels
  // __dirname in production = dist/src, so we need '../..' to reach project root
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
    maxAge: '30d',
    setHeaders: (res, path) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    },
  });

  app.use((req: any, res: any, next: any) => {
    res.removeHeader('X-Powered-By');
    next();
  });

  app.setGlobalPrefix('api', {
    exclude: ['uploads/*', 'health'],
  });

  const maxBodySize = configService.get<number>('MAX_BODY_SIZE', 10485760);
  app.use(require('express').json({ limit: maxBodySize }));
  app.use(require('express').urlencoded({ extended: true, limit: maxBodySize }));

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`Backend server running on http://localhost:${port}`);
  console.log(`Environment: ${nodeEnv}`);
  console.log(`CORS origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();
