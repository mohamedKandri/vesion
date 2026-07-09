# Architecture

## System overview

```
┌────────────────────────────── Browser ──────────────────────────────┐
│  Marketing site (SSR/ISR)   Client dashboard (SPA)   Admin (SPA)    │
└───────────────┬──────────────────────┬──────────────────────────────┘
                │ static/ISR           │ JSON + SSE (Bearer JWT)
        ┌───────▼───────┐      ┌───────▼────────────────────────┐
        │  Next.js 14   │      │  NestJS REST API  /api/v1      │
        │  (apps/web)   │─────▶│  (apps/api)                    │
        └───────────────┘ ISR  │  guards → controllers →        │
                        fetch  │  services → Prisma             │
                               └───┬──────────┬─────────────────┘
                                   │          │
                          ┌────────▼───┐  ┌───▼─────────────────┐
                          │ PostgreSQL │  │ Redis               │
                          │ (Prisma)   │  │ cache · BullMQ mail │
                          └────────────┘  └─────────────────────┘
```

**Why a modular monolith?** One deployable API with strict module boundaries beats microservices
at this team size: single transaction scope, no network seams, trivial local dev — while the
module layout (`src/modules/*`) keeps future extraction cheap. Event-style seams already exist
via BullMQ (email) and cron jobs (billing, ticket hygiene).

## Backend (NestJS)

Layering inside every module:

- **Controller** — HTTP concerns only: routing, versioning (`/api/v1`), Swagger metadata,
  role annotations.
- **DTOs** — `class-validator` classes; the global `ValidationPipe` whitelists and rejects
  unknown fields.
- **Service** — business rules and data access via `PrismaService` (Prisma acts as the
  repository layer; services own the query shapes and access rules).
- **Cross-cutting** (`src/common`) — JWT + roles guards (global), audit interceptor (records all
  authenticated mutations), response envelope interceptor, Prisma-aware exception filter,
  pagination/sort helpers with column whitelisting.

Key decisions:

- **AuthN/AuthZ** — short-lived JWT access tokens; opaque refresh tokens stored *hashed* with
  rotation and reuse detection (a replayed refresh token revokes the whole session family).
  RBAC via a `UserRole` enum; admins bypass role checks, clients are always scoped to their
  `companyId` inside services — never trusted from the request.
- **Multi-tenancy** — single database, company-scoped queries. Every client-facing service method
  filters by the caller's company and hides drafts/internal notes.
- **Money** — `Decimal(12,2)` columns; totals (subtotal → discount → tax) are always recomputed
  server-side. Invoice/quote numbers are per-year sequences with unique constraints.
- **Background work** — BullMQ (Redis) for transactional email with retries; `@nestjs/schedule`
  crons for invoice overdue flagging, subscription period rollover, quote expiry, and
  auto-closing resolved tickets.
- **Caching** — Redis cache-aside (`CacheService.remember`) for hot public content (plans, FAQ,
  KB categories, analytics) with prefix invalidation on writes.
- **AI assistant** — deliberately local: an intent rule engine (pricing, services, project
  status, billing, support, admin KPIs — answered from the database) with a scored
  knowledge-base/FAQ retrieval fallback. Streaming is real SSE; the engine can be swapped for an
  LLM provider behind the same `AssistantEngine` interface without touching the API surface.

## Frontend (Next.js App Router)

Route groups:

- `(marketing)` — server components with ISR (`serverFetch`, 2–5 min revalidate). The home page
  is the "software universe": React Three Fiber scenes (glass crystal hero, planet galaxy),
  GSAP ScrollTrigger (portfolio fly-through, process pipeline), Lenis smooth scrolling, and
  Framer Motion micro-interactions. 3D mounts client-side only, is skipped on small screens,
  and falls back to a static nebula under `prefers-reduced-motion`.
- `(auth)` — login/register/verify/reset flows.
- `dashboard` / `admin` — client components behind `DashboardShell` (bootstraps the session,
  enforces roles, renders sidebar/topbar/notifications). Data via TanStack Query with a typed
  `api` client that auto-refreshes tokens on 401 (deduplicated) and normalizes errors.

Shared feature components (`components/features`) — kanban board, project detail, invoice detail,
ticket thread, messenger — are reused by both dashboards with an `isStaff` switch, so client and
admin views can never drift apart.

State: server cache in TanStack Query; the only global client state is the auth store (Zustand).

## Design system

Tokens live as CSS variables (`globals.css`) consumed by Tailwind: deep-navy background, electric
blue / violet / cyan accents, glassmorphism (`.glass`, `.panel`, `.glow-border`), 24–40px radii,
and a small UI kit (`components/ui`) — buttons, inputs, tables with pagination, modals, tabs,
toasts, skeletons, empty states, badges with a status→tone map.

## Testing strategy

- **API unit** (Jest): pure utils (pagination, crypto, slugs) and service logic with mocked
  Prisma (auth flows, invoice totals).
- **API e2e** (supertest): real HTTP against real PostgreSQL/Redis — health, registration,
  verification gate, RBAC, validation, public content.
- **Web unit** (Vitest + Testing Library): utils, UI kit, and the markdown renderer's XSS
  guarantees.
- **Web e2e** (Playwright): marketing journeys, form validation, auth pages, desktop + mobile
  profiles.
