# ── Vesion API — production image ──────────────────────────────
# Multi-stage build: install → build → minimal runtime.

FROM node:20-alpine AS base
# openssl lets Prisma detect the right engine variant (without it,
# it falls back to openssl-1.1.x which can't load on this image)
RUN apk add --no-cache openssl && corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# ── Dependencies ───────────────────────────────────────────────
FROM base AS deps
COPY .npmrc pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile=false --filter @vesion/api...

# ── Build ──────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY pnpm-workspace.yaml package.json ./
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN pnpm prisma generate && pnpm build && pnpm prune --prod

# ── Runtime ────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
RUN apk add --no-cache dumb-init openssl && addgroup -S vesion && adduser -S vesion -G vesion
WORKDIR /app
ENV NODE_ENV=production

# node_modules is split across the workspace root (hoisted) and the
# package-local dir (version overrides) — both must be preserved at
# the same relative depth as the build stage for module resolution
# to find everything.
COPY --from=build --chown=vesion:vesion /app/node_modules ./node_modules
COPY --from=build --chown=vesion:vesion /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=vesion:vesion /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=vesion:vesion /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=vesion:vesion /app/apps/api/package.json ./apps/api/package.json

RUN mkdir -p /app/uploads && chown vesion:vesion /app/uploads
USER vesion

WORKDIR /app/apps/api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/v1/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "node ../../node_modules/prisma/build/index.js migrate deploy && node dist/src/main.js"]
