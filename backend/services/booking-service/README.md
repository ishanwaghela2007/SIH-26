# SIH 2026 Booking Service

Booking lifecycle, status tracking, and payment-intent state for the cooperative marketplace. Auth is delegated to `auth-service` through gRPC. Job ownership is checked through `job-service` using the caller's validated access token.

## Endpoints

- `POST /bookings` - create a booking for an assigned job
- `GET /bookings/mine` - list the caller's bookings
- `GET /bookings/:bookingId` - view a booking
- `POST /bookings/:bookingId/payment-intent` - create an idempotent payment intent
- `PATCH /bookings/:bookingId/status` - update booking status
- `POST /payments/webhook` - signed provider status callback

Payment processing is intentionally provider-neutral. The service persists payment intent and webhook state, but does not claim to charge money without a configured external payment provider adapter. Webhooks must include an HMAC-SHA256 signature in `x-payment-signature`.
