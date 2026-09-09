# SIH 2026 Auth Service

The auth-service is the authentication boundary for the SIH 2026 cooperative gig-services platform. It exposes HTTP endpoints for the BFF/client layer and a gRPC contract for internal services. Prisma owns persistence; password hashing, Google identity verification, refresh-token storage, Redis protection, and auth events remain private to this service.

## Local setup

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma migrate deploy
pnpm start:dev
```

From the `docker` directory, `docker compose --env-file .env up --build` starts PostgreSQL, Redis, Kafka, and the service. Never commit `.env` or real JWT/admin/Google credentials.

The service uses Prisma 7 with the PostgreSQL driver adapter. `DATABASE_URL` is read by `prisma.config.ts`; the generated client is written under `src/generated` during setup/build and is ignored by Git.

## HTTP API

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout` (Bearer access token)
- `POST /auth/google/login` (server-verified Google ID token)
- `POST /auth/google/link` (authenticated, explicit account linking)
- `POST /auth/email/verify`
- `POST /auth/email/resend`
- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `GET /auth/me` (Bearer access token)
- `PATCH /auth/me` (Bearer access token; update name/language)

Admin-only user administration is exposed separately from public auth:

- `GET /admin/users`
- `PATCH /admin/users/:userId/status`
- `PATCH /admin/users/:userId/role`
- `POST /admin/users/:userId/revoke-sessions`

Operational endpoints:

- `GET /health/live` (process liveness)
- `GET /health/ready` (PostgreSQL, Redis, and Kafka readiness)

Browser OAuth callbacks are intentionally not enabled in this service; mobile clients send a Google ID token to the server for verification. A browser flow can be added at the BFF boundary with state/CSRF handling.

## Platform boundaries

The SIH solution has separate Admin, Employee/Worker, and End User portals, with a Language Bridge around the cooperative marketplace. This service owns identity, roles, account status, admin bootstrap, sessions, and authorization checks. Job matching, wage rules, bookings, payments, worker onboarding details, and translation belong in their respective services and should consume this service through gRPC or validated access tokens.

## Internal gRPC API

The contract is in `proto/auth.proto` under package `auth`:

`Login`, `GoogleLogin`, `RefreshToken`, `RevokeToken`, `ValidateToken`, `GetUser`, and `GetUserRole`.

## Security model

- Local registration always creates a pending `CUSTOMER`.
- Google-created accounts are verified and active only after Google identity validation.
- Access tokens are short-lived and support RS256 via `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`; HS256 is retained as a compatible fallback using `JWT_ACCESS_SECRET`.
- Refresh tokens are opaque, selector-addressed, Argon2id-hashed, rotated atomically, and family-revoked on reuse.
- Verification/reset tokens are single-use, expiring, selector-addressed, and persisted only as hashes.
- Password reset revokes all active refresh sessions.
- Redis provides distributed rate limits and access-token JTI denylisting.
- Database transactions write audit records and `OutboxEvent` rows atomically; Kafka publishing is asynchronous and retryable.
- Verification/reset notification events carry an optional AES-GCM envelope (`AUTH_EVENT_ENCRYPTION_KEY`), never a raw secret; production must configure that shared 32-byte base64 key for the notification consumer.
- Admin bootstrap is environment-driven and never exposed through public registration.

Run `pnpm test`, `pnpm run lint`, `pnpm run prisma:validate`, and `pnpm run build` before deployment.
