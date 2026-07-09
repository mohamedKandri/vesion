# Developer Guide

## Daily workflow

```bash
docker compose up -d      # infra
pnpm dev                  # web :3000 + api :4000, both in watch mode
pnpm db:studio            # inspect data
```

Branch from `main`, keep PRs focused, and make sure `pnpm lint && pnpm test && pnpm build`
passes locally — CI runs the same plus API e2e and Docker builds.

## Adding an API module

1. `src/modules/<name>/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/*.dto.ts`.
2. Model changes go in `prisma/schema.prisma` → `pnpm db:migrate --name add_<thing>`.
3. Controller: `@ApiTags`, `@ApiOperation` on every route; `@Roles(...)` for staff routes,
   `@Public()` for anonymous ones (public routes still receive `req.user` when a token is sent).
4. Service rules:
   - accept the `AuthUser` actor and scope client queries by `actor.companyId` — never trust ids
     from the request body for tenancy;
   - use `paginated()` + `safeSort()` for lists;
   - recompute money server-side; return Prisma `include`/`select` shapes that match
     `apps/web/src/lib/types.ts` (update both together).
5. Register the module in `app.module.ts` and add a spec file for any non-trivial logic.

## Adding a web page

- Marketing → `src/app/(marketing)/<route>/page.tsx` as a **server component**; fetch public data
  with `serverFetch` (ISR) and set `metadata`.
- Dashboard/admin → client component page under `src/app/dashboard|admin/...`; fetch with
  `usePagedQuery`/`useApiQuery`; compose from `components/ui` and `components/features`; add the
  route to the corresponding layout's nav array.
- Reused business UI (shared by client + admin) belongs in `components/features` with an
  `isStaff` prop — don't fork views.

## Conventions

- **TypeScript strict**; no `any` unless justified. Relative imports in the API, `@/` alias in web.
- **Errors**: throw Nest HTTP exceptions with user-readable messages in the API; surface them via
  `useToast` in the web app.
- **Naming**: kebab-case files, PascalCase components/classes, camelCase everything else,
  SCREAMING_SNAKE Prisma enums (humanized in the UI via `humanize()`).
- **Accessibility**: every input has a label (or `aria-label`), icon buttons have `aria-label`,
  dialogs trap Escape, animations respect `prefers-reduced-motion` (use `useReducedMotion`).
- **No placeholder content** — copy is real or it doesn't ship.

## Testing

```bash
pnpm --filter @vesion/api test          # Jest unit (+coverage)
pnpm --filter @vesion/api test:e2e      # supertest against real infra
pnpm --filter @vesion/web test          # Vitest (+coverage)
pnpm --filter @vesion/web test:e2e      # Playwright (starts the dev server itself)
```

Guidelines: unit-test pure logic and service rules with mocked Prisma; e2e-test contracts
(auth, RBAC, validation) rather than implementation; frontend tests focus on the UI kit,
utilities, and security-relevant rendering (markdown XSS).

## 3D & animation notes

- Three.js scenes live in `components/three/*` and mount via `next/dynamic` (`ssr: false`).
- Keep draw calls low: reuse geometries, clamp `dpr` at 1.5–1.75, prefer `Sparkles`/points over
  meshes for particles, and gate heavy scenes off small screens.
- GSAP ScrollTrigger effects must be created inside `gsap.context` and reverted on unmount;
  Lenis is already wired to ScrollTrigger in `SmoothScroll`.

## Common tasks

| Task | How |
| --- | --- |
| New pricing plan | Insert a `Plan` row (Admin → seed or Prisma Studio); marketing revalidates in ≤5 min |
| New KB article | Admin → Content CMS → Knowledge base (feeds the AI assistant automatically) |
| New assistant intent | Extend `INTENTS` + a handler in `apps/api/src/modules/ai/assistant-engine.ts` |
| New email | Add a `mail.send({...})` call — the shared template renders heading/body/CTA |
| New setting | `Setting` key/value via Admin → Settings; read with `prisma.setting.findUnique` |
