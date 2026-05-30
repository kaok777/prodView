# Architecture Decision Records (ADRs)

This directory contains records of architectural decisions made for ProdView.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## Format

Each ADR follows this structure:

```markdown
# [Number]. [Title]

**Date:** YYYY-MM-DD
**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Deciders:** [List of people involved]

## Context

What is the issue we're facing that motivates this decision?

## Decision

What is the change we're proposing or have agreed to implement?

## Consequences

What becomes easier or more difficult because of this change?

### Positive
- Benefit 1
- Benefit 2

### Negative
- Trade-off 1
- Trade-off 2

### Risks
- Risk 1
- Risk 2
```

## Index

1. [JWT Tokens in HTTP-only Cookies](./001-jwt-cookies.md) - Authentication token storage strategy
2. [Monorepo Structure](./002-monorepo-structure.md) - Project organization
3. [Prisma ORM over TypeORM](./003-prisma-orm.md) - Database ORM selection
4. [Strict Content Security Policy](./004-strict-csp.md) - CSP configuration
5. [No Server-Side Rendering (SSR)](./005-no-ssr.md) - Frontend rendering approach

## Guidelines

- Create a new ADR for significant architectural decisions
- Number ADRs sequentially (001, 002, etc.)
- Keep ADRs immutable once accepted (create new ADR to supersede)
- Link related ADRs using "Supersedes ADR-XXX" or "Superseded by ADR-XXX"
- Update this README index when adding new ADRs
