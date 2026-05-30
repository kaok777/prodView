# 002. Monorepo Structure

**Date:** 2026-05-30
**Status:** Accepted
**Deciders:** Development Team

## Context

We needed to decide how to organize the codebase for ProdView, which consists of a React frontend and NestJS backend. The main options were:

1. **Monorepo** - Single repository with frontend and backend
2. **Separate repositories** - Frontend and backend in different repos
3. **Monorepo with workspace tooling** - Using Nx, Turborepo, or Lerna

Requirements:
- Easy local development
- Simple deployment
- Shared types between frontend and backend (future consideration)
- Small team (1-3 developers)

## Decision

We will use a **simple monorepo structure** without workspace tooling.

Directory structure:
```
prodView/
├── backend/          # NestJS backend
│   ├── src/
│   ├── prisma/
│   └── package.json
├── src/              # React frontend
├── public/
├── package.json      # Frontend dependencies
└── README.md
```

## Consequences

### Positive

- **Single Clone**: Developers clone one repository to get everything
- **Atomic Commits**: Frontend and backend changes in same commit
- **Easier Onboarding**: New developers see full stack in one place
- **Shared Documentation**: README, CONTRIBUTING.md apply to both
- **Version Control**: Single git history shows full project evolution
- **Simpler CI/CD**: One repository to monitor and deploy
- **Type Sharing**: Easy to share TypeScript types (future enhancement)

### Negative

- **Build Complexity**: Two separate build processes (npm run build in both directories)
- **Dependencies**: Must maintain two package.json files
- **Git History**: Mixed frontend and backend commits (can be noisy)
- **Large Repository**: More files than single-purpose repo
- **Deploy Complexity**: Must deploy frontend and backend separately despite being in same repo

### Risks

- **Accidental Cross-Dependencies**: Developers might import backend code in frontend
- **Merge Conflicts**: More likely with multiple developers
- **Repository Size**: May grow large with both codebases

## Implementation Details

**Development Workflow:**
```bash
# Start both servers
./start-dev.sh

# Or separately:
cd backend && npm run start:dev  # Terminal 1
npm run dev                       # Terminal 2
```

**Build Workflow:**
```bash
# Backend
cd backend && npm run build

# Frontend
npm run build
```

**Deployment:**
- Frontend: Deploy dist/ to CDN or static hosting
- Backend: Deploy backend/dist/ to Node.js server

## Alternatives Considered

### Separate Repositories
- **Pros**: Clear separation, independent versioning, smaller repos
- **Cons**: Harder to sync changes, duplicate documentation, complex local setup
- **Rejected because**: Development friction outweighs organizational benefits for small team

### Nx/Turborepo Monorepo
- **Pros**: Shared dependencies, incremental builds, task caching
- **Cons**: Complex setup, learning curve, overkill for 2-project repo
- **Rejected because**: Complexity not justified for simple frontend + backend setup

## Future Considerations

If the project grows to include:
- Mobile app
- Admin desktop app
- Shared component library
- Multiple backend services

Then we should reconsider using Nx or Turborepo for better workspace management.

## Related Decisions

- Package managers: npm for both frontend and backend
- No shared packages initially (types can be duplicated)
- Development script in `start-dev.sh` for convenience

## Notes

This simple monorepo structure balances ease of development with minimal tooling overhead. The lack of workspace tooling means we can't share dependencies between frontend and backend, but this is acceptable since they have different dependency requirements anyway.

For a small team working on both frontend and backend, having everything in one repository significantly reduces context switching and makes it easier to understand the full system.
