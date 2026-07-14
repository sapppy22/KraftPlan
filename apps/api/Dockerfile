# Portable image for the unified KraftPlan API (apps/api).
# Runs the combined Fastify server (all services) in one process.
FROM node:20-bookworm-slim
WORKDIR /app

# Build tools for the argon2 native dependency (falls back to prebuilt when available).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

# Install deps against the full workspace (the API imports service source directly).
COPY . .
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
ENV API_PORT=4001
EXPOSE 4001

# tsx runs the TypeScript entrypoint directly — no separate build step needed.
CMD ["pnpm", "--filter", "@kraftplan/api", "start"]
