FROM oven/bun:1.3 AS base
WORKDIR /app

# --- Install dependencies ---
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# --- Production ---
FROM base AS production

# gosu for PUID/PGID support
RUN apt-get update && apt-get install -y --no-install-recommends gosu && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Production dependencies only
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Build-Artefakte kopieren
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/db ./src/db
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts

# Entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Daten-Verzeichnis
RUN mkdir -p /app/data

# Ports
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Volume für Datenbank
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV DATABASE_URL=/app/data/keepomat.db

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bun", "run", "dist/server/index.js"]
