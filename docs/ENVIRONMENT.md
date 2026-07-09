# Environment Variables

All configuration is environment-driven. Copy `.env.example` → `.env` and adjust. The API
validates required variables at boot and refuses weak/placeholder secrets in production.

## Application

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` enables strict secret checks, secure cookies, JSON logs |
| `APP_NAME` | `Vesion` | Display name |
| `API_PORT` | `4000` | API listen port |
| `WEB_PORT` | `3000` | Web listen port (dev script) |
| `API_URL` | `http://localhost:4000` | External API origin |
| `WEB_URL` | `http://localhost:3000` | External web origin — used in email links |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |

## Database & cache

| Variable | Default | Description |
| --- | --- | --- |
| `POSTGRES_HOST/PORT/USER/PASSWORD/DB` | see example | Used by Docker Compose |
| `DATABASE_URL` | — **required** | Prisma connection string |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Cache, rate data, mail queue |
| `REDIS_PASSWORD` | empty | Set in production |

## Auth & crypto (all required)

| Variable | How to generate | Description |
| --- | --- | --- |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` | Signs access tokens |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` | Reserved for refresh-token signing needs |
| `JWT_ACCESS_TTL` | default `900` | Access token lifetime (seconds) |
| `JWT_REFRESH_TTL` | default `2592000` | Refresh token lifetime (seconds, 30 days) |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` | **Exactly 64 hex chars** — AES-256-GCM for TOTP secrets |
| `COOKIE_SECRET` | `openssl rand -base64 48` | Cookie signing |
| `BCRYPT_ROUNDS` | `12` | Password hashing cost |

## Rate limiting

| Variable | Default | Description |
| --- | --- | --- |
| `THROTTLE_TTL` | `60` | Window in seconds |
| `THROTTLE_LIMIT` | `100` | Requests per window per IP (auth routes have stricter overrides) |

## Email (SMTP — your own server)

| Variable | Default | Description |
| --- | --- | --- |
| `SMTP_HOST` / `SMTP_PORT` | `localhost` / `1025` | Dev default targets Mailpit |
| `SMTP_SECURE` | `false` | `true` for implicit TLS (465) |
| `SMTP_USER` / `SMTP_PASSWORD` | empty | Leave empty for unauthenticated relays |
| `MAIL_FROM` | `Vesion <no-reply@vesion.dev>` | From header |

## Files

| Variable | Default | Description |
| --- | --- | --- |
| `UPLOAD_DIR` | `./uploads` | Disk path for uploads (a named volume in production) |
| `MAX_UPLOAD_SIZE_MB` | `25` | Per-file cap |

## Frontend (build-time, `NEXT_PUBLIC_*` is baked into the bundle)

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | Browser → API base URL |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Canonical site URL (SEO, sitemap) |
| `API_INTERNAL_URL` | falls back to public | Server-side fetch base (container-to-container, e.g. `http://api:4000/api/v1`) |

## Misc

| Variable | Default | Description |
| --- | --- | --- |
| `SEED_PASSWORD` | `ChangeMe!2026` | Password for seeded accounts |
| `PLAYWRIGHT_BASE_URL` | dev server | Point e2e tests at a deployed environment |
