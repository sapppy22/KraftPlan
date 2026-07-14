FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ packages/
COPY services/auth/ services/auth/
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @forgefit/auth-service build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/services/auth/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
EXPOSE 4001
CMD ["node", "dist/index.js"]
