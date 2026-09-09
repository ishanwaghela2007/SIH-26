# SIH 2026 Worker Service

Worker onboarding and verification for the Employee Portal. Authentication is delegated to `auth-service` through its gRPC `ValidateToken` method. Worker-domain data is isolated here; the service does not access auth-service's Prisma database.

## Local setup

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma migrate deploy
pnpm start:dev
```

The worker service listens on port `3002` by default.

## Worker API

- `GET /workers/me`
- `POST /workers/me/onboarding`
- `PATCH /workers/me/onboarding`
- `POST /workers/me/skills`
- `DELETE /workers/me/skills/:skillId`
- `POST /workers/me/documents`
- `POST /workers/me/submit`

## Admin API

- `GET /admin/workers`
- `PATCH /admin/workers/:workerId/review`
- `PATCH /admin/workers/:workerId/documents/:documentId/review`

Worker documents are represented by storage keys. File upload and object storage remain outside this service.
