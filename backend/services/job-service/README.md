# SIH 2026 Job Service

Job marketplace and deterministic first-match allocation for the End User and Employee portals. Auth is delegated to `auth-service` through gRPC. This service does not access auth-service's database.

## Endpoints

- `POST /jobs` - customer creates a service request
- `GET /jobs/mine` - customer or assigned worker views their jobs
- `GET /jobs/matches?domain=...&district=...` - worker gets eligible open jobs with match scores
- `POST /jobs/:jobId/accept` - worker claims an open job atomically
- `GET /jobs/:jobId` - customer or assigned worker views a job
- `PATCH /jobs/:jobId/status` - customer/worker updates an allowed status

The acceptance flow uses a conditional database update (`OPEN` plus no assigned worker), so concurrent workers cannot claim the same job.
