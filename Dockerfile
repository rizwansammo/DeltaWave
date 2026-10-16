# syntax=docker/dockerfile:1.7
# DeltaWave Technology: Next.js 16 + Payload CMS 3, production image.
# Built by GitHub Actions and published to GHCR; never built on the server.
#
# The same image runs the website (default command) and, as one-off
# containers, the Payload CLI for migrations and seeds:
#   node node_modules/payload/bin.js migrate
#   node node_modules/payload/bin.js run scripts/seed-content.ts

ARG NODE_VERSION=24.18.1

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# All dependencies, for the build.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Production dependencies only, for the runtime image.
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod

FROM deps AS build
COPY . .
# Public values are fixed into the browser bundle at build time.
ARG NEXT_PUBLIC_SITE_URL=https://www.deltawave.tech
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NODE_ENV=production
# The build loads the Payload config but never connects to a database or
# signs anything; these placeholders exist only in this build stage.
RUN PAYLOAD_SECRET=build-stage-placeholder-not-used-at-runtime \
    DATABASE_URL=postgresql://build:build@127.0.0.1:1/build \
    pnpm build \
 && rm -rf .next/cache

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    MEDIA_DIR=/app/media
LABEL org.opencontainers.image.source="https://github.com/rizwansammo/DeltaWave" \
      org.opencontainers.image.title="DeltaWave Technology" \
      org.opencontainers.image.description="DeltaWave Technology website and Payload CMS"
# Source for the Payload CLI (config, collections, migrations, seeds) and
# the approved photography; .dockerignore keeps tests, docs and secrets out.
COPY --chown=node:node . .
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
RUN mkdir -p /app/media && chown node:node /app/media
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/enquiry').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
