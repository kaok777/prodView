# 003. Prisma ORM over TypeORM

**Date:** 2026-05-30
**Status:** Accepted
**Deciders:** Development Team

## Context

We needed to choose an ORM (Object-Relational Mapping) tool for our NestJS backend to interact with PostgreSQL. The primary options were:

1. **Prisma** - Modern ORM with type-safe query builder and schema-first approach
2. **TypeORM** - Mature ORM with decorator-based models, commonly used with NestJS
3. **Sequelize** - Traditional ORM with JavaScript/TypeScript support
4. **Raw SQL** - Direct PostgreSQL queries via pg library

Requirements:
- Type safety throughout the stack
- Easy database migrations
- Good TypeScript support
- Active maintenance and community
- Performance for affiliate marketing workload (read-heavy with analytics)

## Decision

We will use **Prisma** as our ORM.

Implementation details:
- Schema defined in `prisma/schema.prisma` (single source of truth)
- Automatic TypeScript type generation via `prisma generate`
- Migrations managed via `prisma migrate`
- Query builder provides compile-time type safety
- Built-in connection pooling

## Consequences

### Positive

- **Superior TypeScript support**: Auto-generated types match database schema exactly
- **Schema-first approach**: Single source of truth for data models (Prisma schema)
- **Type-safe queries**: Impossible to write queries that don't match schema (compile-time errors)
- **Excellent DX**: Prisma Studio for database browsing, great autocomplete
- **Modern migrations**: Clean migration files with readable SQL
- **Performance**: Efficient query generation, built-in connection pooling
- **Growing ecosystem**: Strong community, regular updates, good documentation

### Negative

- **Less NestJS integration**: Not as tightly integrated as TypeORM (more manual setup)
- **Learning curve**: Different approach from traditional ORMs (schema-first vs code-first)
- **Migration limitations**: Cannot edit migration files easily (generated from schema changes)
- **Limited raw SQL**: Harder to write complex raw SQL queries compared to TypeORM's query builder
- **Smaller community**: Fewer NestJS-specific examples compared to TypeORM

### Risks

- **Schema changes**: Large schema changes require careful migration planning
- **Vendor lock-in**: Switching from Prisma would require significant refactoring
- **Edge cases**: Some advanced PostgreSQL features may require raw SQL

## Alternatives Considered

### TypeORM
- **Pros**: Better NestJS integration, decorator-based models, large community
- **Cons**: Weaker TypeScript support, migrations can be buggy, less active development
- **Rejected because**: Type safety is more important than tight NestJS integration for long-term maintainability

### Raw SQL (pg library)
- **Pros**: Maximum control, best performance, no abstraction layer
- **Cons**: No type safety, manual query building, error-prone
- **Rejected because**: Loss of type safety and developer productivity

## Implementation Examples

**Prisma Schema:**
```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String
  createdAt   DateTime @default(now())

  @@map("products")
}
```

**Auto-generated TypeScript Type:**
```typescript
type Product = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}
```

**Type-safe Query:**
```typescript
const product = await prisma.product.findUnique({
  where: { id: '123' },
  select: { name: true } // TypeScript knows 'name' exists!
});
// product.name is string
// product.description is undefined (not selected)
```

## Related Decisions

- Database schema in `backend/prisma/schema.prisma`
- PrismaService wrapper in `backend/src/common/prisma.service.ts`
- Migration workflow documented in README.md

## Notes

This decision prioritizes developer experience and type safety over familiarity with TypeORM. The initial setup time is offset by fewer runtime errors and better IDE support.

As of 2026, Prisma is actively maintained and has become a popular choice for TypeScript projects. The type generation feature alone prevents an entire class of bugs that would occur with less type-safe ORMs.
