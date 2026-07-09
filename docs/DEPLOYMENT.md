# Deployment Guide

The platform ships as two Docker images (API and Web) behind NGINX, with PostgreSQL and Redis as
internal services. A single VM with Docker Compose comfortably serves tens of thousands of users;
the images are also ready for Kubernetes if you outgrow one host.

## Production stack (Docker Compose)

```
Internet ──▶ NGINX (TLS, rate limits, static cache)
              ├── /api/*  ──▶ api  (NestJS, port 4000)
              └── /*      ──▶ web  (Next.js, port 3000)
                     api ──▶ postgres (internal)
                     api ──▶ redis    (internal)
                 backup ──▶ nightly pg_dump → ./backups
```

### 1. Prepare the host

- Linux VM (2 vCPU / 4 GB RAM minimum), Docker + Compose installed.
- DNS `A` records for `vesion.dev` and `www.vesion.dev` pointing at the host.
- TLS certificates in `./nginx/certs/fullchain.pem` and `./nginx/certs/privkey.pem`
  (Let's Encrypt via certbot on the host works well: `certbot certonly --standalone`).

### 2. Configure

```bash
cp .env.example .env
```

Set production values — most importantly:

```
NODE_ENV=production
WEB_URL=https://vesion.dev
CORS_ORIGINS=https://vesion.dev,https://www.vesion.dev
NEXT_PUBLIC_API_URL=https://vesion.dev/api/v1
NEXT_PUBLIC_APP_URL=https://vesion.dev
POSTGRES_PASSWORD=<strong>
JWT_ACCESS_SECRET=<openssl rand -base64 48>
JWT_REFRESH_SECRET=<openssl rand -base64 48>
COOKIE_SECRET=<openssl rand -base64 48>
ENCRYPTION_KEY=<openssl rand -hex 32>
SMTP_HOST=<your mail server>
```

The API **refuses to boot in production** with missing or placeholder secrets.

### 3. Launch

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Database migrations run automatically on API start (`prisma migrate deploy`). Seed once if
desired: `docker compose -f docker-compose.prod.yml exec api node node_modules/ts-node/dist/bin.js prisma/seed.ts`
(or run the seed locally against the production `DATABASE_URL`).

### 4. Verify

```bash
curl -fsS https://vesion.dev/api/v1/health
docker compose -f docker-compose.prod.yml ps      # all healthy
```

## Zero-downtime updates

```bash
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d   # containers replaced one by one
```

Compose health checks gate NGINX routing, so a failed build never receives traffic.

## Backups

- The `backup` service writes a compressed `pg_dump` nightly into `./backups` and prunes files
  older than 14 days.
- Manual snapshot / restore: `./scripts/backup.sh` and `./scripts/backup.sh restore <file>`.
- **Off-site**: sync `./backups` and the `uploads` volume to object storage or another host
  (rsync/rclone on a cron). Test restores quarterly — a backup that has never been restored is
  a hope, not a strategy.

## Monitoring & logging

- **Health**: `/api/v1/health` checks PostgreSQL, Redis, and heap; wire it to your uptime monitor.
- **Logs**: both apps log structured JSON to stdout — aggregate with `docker logs`, Loki, or any
  collector. NGINX logs include request timing (`rt=`).
- **Audit**: security-relevant actions are stored in the `AuditLog` table and visible under
  Admin → Audit logs.

## CI/CD

`.github/workflows/ci.yml` runs lint, unit tests (with coverage artifacts), API integration tests
against real PostgreSQL/Redis services, production builds, and Docker image builds on `main`.
Add a deploy job that SSHes to the host and runs the update commands above, or push images to a
registry and pull them in compose.

## Scaling beyond one host

- Point `DATABASE_URL` at managed PostgreSQL and `REDIS_HOST` at managed Redis.
- Run multiple `api`/`web` replicas behind a load balancer (the API is stateless; sessions live
  in PostgreSQL/Redis; uploads need a shared volume or object storage).
- The compose services translate 1:1 into Kubernetes Deployments + Services.
