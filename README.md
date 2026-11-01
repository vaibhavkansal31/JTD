# JTD (JCB tractor dumper)

JTD connects construction customers with tractor owners for local material deliveries. This workspace contains the responsive React web experience, an Express booking API, and customer, driver, and admin demo views.

## Run locally

```bash
npm install
npm run dev
```

The web app is served by Vite and the API by Express. Vite proxies `/api` requests to the local API server. Copy `.env.example` to `.env`; set a unique admin password of at least 12 characters and, for production, a unique `JWT_SECRET` of at least 32 random characters. `ADMIN_USERNAME` defaults to `YOUTUBE`. Set `TRUST_PROXY_HOPS` to the number of trusted reverse proxies in front of Express. The example file intentionally contains no credentials. Never use a shared or weak password on a deployed service. Set `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` to the same real Google OAuth web client ID to enable verified Google sign-in. Placeholder IDs are not accepted.

## API

- `GET /api/health` reports API availability and storage mode.
- `POST /api/auth/register` creates customer or driver accounts with hashed passwords.
- `POST /api/auth/login` signs in customers, drivers, and the configured admin.
- `POST /api/auth/google` verifies Google ID tokens on the server.
- `GET /api/bookings` returns only the signed-in customer's bookings; admins can view all.
- `POST /api/bookings` requires an authenticated customer and validates a delivery request.
- `GET /api/admin/summary` requires an authenticated admin session.

Fare estimates use a ₹50 base fare, ₹18 per kilometre, and optional ₹120 loading assistance. The fare is split 90% to the driver and 10% to JTD.

## Demo scope

Passwords are hashed with bcrypt; signed sessions use `HttpOnly`, `SameSite=Strict` cookies; authentication endpoints are rate-limited; Helmet security headers and role checks protect API routes. Accounts, sessions, and bookings are stored in memory and clear when the API restarts, so this is not production-ready persistence. Before deployment, configure HTTPS, a persistent database, secure secrets, backups, monitoring, and account recovery. Google OAuth requires the matching client ID in both server and Vite environment variables. Google Maps routing and GPS, payments, notifications, and document verification are not connected in this demo.