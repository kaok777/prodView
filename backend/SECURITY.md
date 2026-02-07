# Security Documentation

This document describes the security measures implemented in the prodView backend API.

## Table of Contents

1. [Authentication Security](#authentication-security)
2. [Authorization Model](#authorization-model)
3. [Password Handling](#password-handling)
4. [Input Validation](#input-validation)
5. [Rate Limiting Strategy](#rate-limiting-strategy)
6. [HTTP Security Headers](#http-security-headers)
7. [Production Assumptions](#production-assumptions)

---

## Authentication Security

### JWT-Based Authentication

The application uses JSON Web Tokens (JWT) for stateless authentication:

- **Token Generation**: JWTs are signed using `HS256` algorithm with a secret key from environment variables
- **Token Expiration**: Access tokens expire after a configurable duration (default: 1 hour)
- **Token Structure**: Contains user ID and role claims for authorization
- **Storage**: Tokens should be stored securely on the client (not in localStorage; use httpOnly cookies or secure session storage)

### Implementation Details

- JWT strategy validates tokens on protected routes (`src/auth/strategies/jwt.strategy.ts`)
- Local strategy handles username/password authentication (`src/auth/strategies/local.strategy.ts`)
- Guards enforce authentication requirements (`src/guards/jwt-auth.guard.ts`)

### Environment Variables

```
JWT_SECRET=<strong-random-secret>
JWT_EXPIRATION=1h
```

---

## Authorization Model

### Role-Based Access Control (RBAC)

The application implements role-based authorization with two primary roles:

- **ADMIN**: Full access to all resources, including user management, product creation/editing, analytics
- **USER**: Read-only access to public product information

### Implementation

- Roles are stored in the database (`User.role` field in Prisma schema)
- `RolesGuard` enforces role requirements (`src/guards/roles.guard.ts`)
- `@Roles()` decorator specifies required roles for controller methods (`src/common/decorators.ts`)

### Protected Endpoints

Admin-only routes:
- `POST /products` - Create products
- `PUT /products/:id` - Update products
- `DELETE /products/:id` - Delete products
- `GET /analytics/*` - Access analytics data
- `POST /auth/register` - Create new users

---

## Password Handling

### Hashing

- **Algorithm**: bcrypt with configurable salt rounds (default: 10)
- **Implementation**: Passwords are hashed before storage in `auth.service.ts`
- **Verification**: bcrypt compare function validates login attempts

### Best Practices

```typescript
// Password hashing on registration
const hashedPassword = await bcrypt.hash(password, 10);

// Password verification on login
const isPasswordValid = await bcrypt.compare(password, user.password);
```

### Password Requirements

Enforced through validation in DTOs:
- Minimum length: 8 characters
- Must contain: uppercase, lowercase, number, special character
- Pattern: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/`

---

## Input Validation

### Validation Strategy

The application uses a multi-layer validation approach:

1. **DTO Validation**: Class-validator decorators on Data Transfer Objects
2. **Custom Validation Service**: Additional business logic validation (`src/common/validation.service.ts`)
3. **Prisma Schema**: Database-level constraints

### Key Validations

#### Authentication DTOs

**LoginDto** (`src/auth/dto/login.dto.ts`):
- Email: Valid email format, not empty
- Password: String, not empty

#### Product DTOs

**CreateProductDto** (`src/products/dto/create-product.dto.ts`):
- Name: String, 1-200 characters, no XSS patterns
- Description: Optional string, max 2000 characters
- Price: Positive number, max 1,000,000
- Category: Valid ObjectId reference
- Images: Array of valid URLs with image extensions

**UpdateProductDto** (`src/products/dto/update-product.dto.ts`):
- All fields optional
- Same validation rules as CreateProductDto when provided

#### Sanitization

- XSS Prevention: Input strings are checked for malicious patterns
- SQL Injection Prevention: Prisma ORM with parameterized queries
- NoSQL Injection Prevention: Validation Service checks for MongoDB operators

### Validation Service Features

Located in `src/common/validation.service.ts`:

```typescript
// Sanitize text input
sanitizeInput(input: string): string

// Validate ObjectId format
isValidObjectId(id: string): boolean

// Validate URL format
isValidUrl(url: string): boolean

// Validate image URL
isValidImageUrl(url: string): boolean
```

---

## Rate Limiting Strategy

### Global Rate Limiting

Implemented in `src/common/rate-limit.service.ts` and applied via middleware in `main.ts`.

### Configuration

**Standard Endpoints**:
- Window: 15 minutes
- Max requests: 100 per IP address

**Authentication Endpoints** (`/auth/*`):
- Window: 15 minutes
- Max requests: 10 per IP address
- Prevents brute-force attacks

**File Upload Endpoints** (`/upload/*`):
- Window: 15 minutes
- Max requests: 20 per IP address
- Prevents storage abuse

### Implementation Details

```typescript
// Rate limit configuration
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}
```

### Response Headers

When rate limit is active:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: Timestamp when limit resets

### 429 Response

When rate limit exceeded:
```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later."
}
```

---

## HTTP Security Headers

### Helmet.js Integration

The application uses Helmet.js middleware to set security-related HTTP headers (`src/main.ts`).

### Configured Headers

#### Content Security Policy (CSP)
- Restricts resource loading to prevent XSS attacks
- Configured for development and production environments

#### X-Content-Type-Options
- Set to `nosniff`
- Prevents MIME type sniffing

#### X-Frame-Options
- Set to `DENY`
- Prevents clickjacking attacks

#### Strict-Transport-Security (HSTS)
- Enforces HTTPS connections
- Max age: 31536000 seconds (1 year)
- Includes subdomains

#### X-XSS-Protection
- Enabled with mode=block
- Provides legacy XSS protection

### CORS Configuration

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Additional Security Features

- **Global Validation Pipe**: Enables automatic validation and transformation
- **HTTP-Only Cookies**: Recommended for JWT storage in production
- **CSRF Protection**: Should be implemented for state-changing operations in production

---

## Production Assumptions

### Environment Configuration

**Required Environment Variables**:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
JWT_SECRET=<strong-random-secret-min-32-chars>
JWT_EXPIRATION=1h

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-production-domain.com

# File Upload (if using cloud storage)
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_REGION=<your-region>
AWS_S3_BUCKET=<your-bucket>
```

### Infrastructure Security

**Assumed Production Measures**:

1. **Reverse Proxy**: Application runs behind nginx/Apache with SSL termination
2. **SSL/TLS**: All traffic encrypted with valid certificates
3. **Firewall**: Network-level firewall restricts access to database and internal services
4. **Secrets Management**: Environment variables stored in secure vault (AWS Secrets Manager, Azure Key Vault, etc.)
5. **Monitoring**: Application and security logs centralized and monitored
6. **Backups**: Regular database backups with encryption at rest
7. **DDoS Protection**: CloudFlare or similar service for DDoS mitigation

### Database Security

1. **Connection**: Use SSL/TLS for database connections
2. **Credentials**: Strong passwords, rotated regularly
3. **Access Control**: Principle of least privilege for database users
4. **Encryption**: Data at rest encryption enabled

### Recommended Additional Measures

For production deployments, consider implementing:

1. **CSRF Protection**: Use `csurf` middleware for state-changing operations
2. **API Versioning**: Implement versioning strategy for backward compatibility
3. **Input Sanitization**: Additional HTML sanitization for rich text fields
4. **Audit Logging**: Comprehensive audit trails for sensitive operations (implemented in `src/audit/audit.service.ts`)
5. **Security Scanning**: Regular vulnerability scans and dependency updates
6. **Intrusion Detection**: Monitor for suspicious activity patterns
7. **Data Encryption**: Encrypt sensitive fields at application level
8. **Session Management**: Implement refresh tokens and token rotation
9. **API Gateway**: Use API gateway for additional security layer
10. **Container Security**: If using Docker, implement container security best practices

### Security Testing

Regular security assessments should include:

- **Penetration Testing**: Annual third-party security audits
- **Dependency Scanning**: Automated scanning for vulnerable dependencies (`npm audit`)
- **SAST/DAST**: Static and dynamic application security testing
- **Security Headers Testing**: Verify headers using tools like securityheaders.com

### Incident Response

Have a documented incident response plan that includes:

1. Detection and alerting mechanisms
2. Escalation procedures
3. Containment strategies
4. Evidence preservation
5. Communication protocols
6. Post-incident review process

---

## Security Contacts

For security issues or vulnerabilities, contact:
- **Email**: security@your-domain.com
- **Response Time**: Within 24 hours for critical issues

See `/public/security.txt` for responsible disclosure policy.

---

## Compliance

This application implements security controls aligned with:

- OWASP Top 10 (2021)
- OWASP API Security Top 10
- CWE/SANS Top 25

Regular reviews ensure continued compliance with security best practices.
