# Installation Guide

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 20 | LTS recommended |
| pnpm | ≥ 9 | `corepack enable` installs it automatically |
| Docker + Compose | recent | for PostgreSQL, Redis, and Mailpit |
| OpenSSL | any | for generating secrets |

## 1. Clone and configure

```bash
git clone <your-remote> vesion && cd vesion
cp .env.example .env
```

Generate real secrets (do this even for development):

```bash
openssl rand -base64 48   # JWT_ACCESS_SECRET
openssl rand -base64 48   # JWT_REFRESH_SECRET
openssl rand -base64 48   # COOKIE_SECRET
openssl rand -hex 32      # ENCRYPTION_KEY (must be exactly 64 hex chars)
```

Paste them into `.env`. Every variable is documented in [ENVIRONMENT.md](ENVIRONMENT.md).

## 2. Start infrastructure

```bash
docker compose up -d
```

This launches:

- **PostgreSQL 16** on `localhost:5432`
- **Redis 7** on `localhost:6379`
- **Mailpit** (SMTP catcher) on `localhost:1025`, web inbox at http://localhost:8025

## 3. Install dependencies

```bash
pnpm install
```

## 4. Database schema and seed data

```bash
pnpm db:migrate    # prisma migrate dev — creates tables and the migration history
pnpm db:seed       # demo company, projects, plans, KB, blog, FAQ, users
```

Seed accounts (password `ChangeMe!2026`, override with `SEED_PASSWORD`):

| Email | Role |
| --- | --- |
| `admin@vesion.dev` | Admin |
| `manager@vesion.dev` | Manager |
| `dev@vesion.dev` | Developer |
| `client@northwind.example.com` | Client |

## 5. Run

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/api/docs

## Troubleshooting

**`Missing required environment variables`** — the API validates env on boot; check `.env` against
[ENVIRONMENT.md](ENVIRONMENT.md).

**`ENCRYPTION_KEY must be 32 bytes of hex`** — regenerate with `openssl rand -hex 32` (64 hex
characters, no quotes).

**Prisma cannot reach the database** — confirm `docker compose ps` shows postgres healthy and
`DATABASE_URL` matches the compose credentials.

**Port already in use** — change `API_PORT` / the web `-p` flag in `apps/web/package.json`, or stop
the conflicting service.

**Emails not arriving** — everything is caught by Mailpit in development; open http://localhost:8025.

**Windows notes** — run commands from PowerShell or Git Bash; Docker Desktop with the WSL2 backend
is recommended. Line endings are enforced LF via `.editorconfig`/Prettier.
