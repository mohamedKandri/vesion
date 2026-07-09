# ── Vesion Web — production image (Next.js standalone) ────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# ── Dependencies ───────────────────────────────────────────────
FROM base AS deps
COPY .npmrc pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile=false --filter @vesion/web...

# ── Build ──────────────────────────────────────────────────────
FROM base AS build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY pnpm-workspace.yaml package.json ./
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN pnpm build

# ── Runtime ────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
RUN apk add --no-cache dumb-init && addgroup -S vesion && adduser -S vesion -G vesion
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# With outputFileTracingRoot at the monorepo root, the standalone
# bundle nests the app under apps/web with node_modules at its root.
COPY --from=build --chown=vesion:vesion /app/apps/web/.next/standalone ./
COPY --from=build --chown=vesion:vesion /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=vesion:vesion /app/apps/web/public ./apps/web/public

USER vesion
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000 >/dev/null || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]
