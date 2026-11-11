# syntax=docker/dockerfile:1
FROM oven/bun:1.4-alpine AS base
WORKDIR /app

# All dependencies, for the checks.
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Type check and unit tests. The release stage copies from here, so a failing check fails the build.
FROM deps AS check
COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
RUN bun run typecheck && bun test

# Runtime dependencies only.
FROM base AS prod-deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS release
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY --from=check /app/src ./src
COPY drizzle ./drizzle
COPY assets ./assets
USER bun

# Secrets come from the environment (see docker-compose.yml), never from files baked into the image.
# Run migrations with: docker compose run --rm bot src/db/migrate.ts
ENTRYPOINT ["bun"]
CMD ["src/index.ts"]
