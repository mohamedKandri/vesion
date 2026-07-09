# VESION Platform

The complete software-company platform behind **VESION** — a cinematic 3D marketing website, a
client dashboard, an admin back office, and a REST API. Fully self-contained: no third-party
SaaS APIs, no external trackers, no payment gateways. Everything runs on your own infrastructure.

## What's inside

| App | Stack | Purpose |
| --- | --- | --- |
| `apps/web` | Next.js 14, Tailwind, Framer Motion, React Three Fiber, GSAP, Lenis | Marketing site ("software universe" experience), client dashboard, admin dashboard |
| `apps/api` | NestJS 10, Prisma 5, PostgreSQL 16, Redis 7, BullMQ | Versioned REST API with OpenAPI docs |

### Feature highlights

- **Marketing** — 3D glass-crystal hero, orbiting service planets, bento service grid, portfolio
  fly-through, energy process pipeline, tech orbs, blog, case studies, careers, pricing, FAQ,
  legal pages, newsletter, SEO/sitemap/robots.
- **Client dashboard** — projects with kanban/milestones/timeline/files, invoices, payments,
  quotes (accept/decline), e-signable contracts, messaging, support tickets, knowledge base,
  AI assistant, notifications, activity history, profile/2FA/company settings.
- **Admin** — analytics with charts, CRM inbox, clients, projects & task management with
  drag-and-drop kanban and time tracking, team & RBAC, invoicing with discounts/taxes/refunds,
  subscriptions with recurring billing jobs, quotes, contracts, support desk with internal
  notes, blog/portfolio/KB CMS, careers ATS, audit logs, platform settings.
- **AI assistant** — fully local engine (intent rules + knowledge-base retrieval + live platform
  data) with streamed SSE responses and conversation history. No LLM API calls.
- **Security** — JWT + rotating refresh tokens with reuse detection, TOTP 2FA, bcrypt, AES-256-GCM
  secret encryption, RBAC, rate limiting, helmet/CSP, audit trail, OWASP-aligned validation.

## Quick start

```bash
# 1. Prerequisites: Node 20+, pnpm 9+, Docker
corepack enable

# 2. Configure
cp .env.example .env          # then edit secrets (see docs/ENVIRONMENT.md)

# 3. Infrastructure (PostgreSQL, Redis, Mailpit)
docker compose up -d

# 4. Install, migrate, seed
pnpm install
pnpm db:migrate               # creates the schema (prisma migrate dev)
pnpm db:seed                  # demo data + login accounts

# 5. Run everything
pnpm dev
```

| URL | What |
| --- | --- |
| http://localhost:3000 | Website + dashboards |
| http://localhost:4000/api/docs | OpenAPI (Swagger) documentation |
| http://localhost:8025 | Mailpit inbox (verification & notification emails) |

Seeded logins (password `ChangeMe!2026` unless `SEED_PASSWORD` is set):
`admin@vesion.dev` · `manager@vesion.dev` · `dev@vesion.dev` · `client@northwind.example.com`

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Detailed local setup, troubleshooting |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production Docker stack, TLS, backups, monitoring |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, patterns, decisions |
| [docs/API.md](docs/API.md) | REST conventions, auth, endpoint map |
| [docs/DATABASE.md](docs/DATABASE.md) | ER diagram, schema notes, migrations |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model, OWASP mapping, hardening |
| [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | Conventions, adding features, testing |
| [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md) | Repository layout |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Every environment variable explained |

## Commands

```bash
pnpm dev          # run web + api in watch mode
pnpm build        # production builds
pnpm lint         # eslint across the monorepo
pnpm test         # unit tests with coverage (Jest + Vitest)
pnpm --filter @vesion/api test:e2e   # API integration tests (needs Docker infra)
pnpm --filter @vesion/web test:e2e   # Playwright end-to-end tests
pnpm db:studio    # Prisma Studio database browser
```

## License

Proprietary — © VESION. All rights reserved.
