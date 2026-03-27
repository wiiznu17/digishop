# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/configs/package.json ./packages/configs/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/portal-service/package.json ./apps/portal-service/

RUN npm ci --workspace=packages/db \
           --workspace=packages/configs \
           --workspace=packages/typescript-config \
           --workspace=apps/portal-service \
           --include-workspace-root

COPY packages/db ./packages/db
COPY packages/configs ./packages/configs
COPY packages/typescript-config ./packages/typescript-config
COPY apps/portal-service ./apps/portal-service

RUN npm run build --workspace=packages/db
RUN npm run build --workspace=apps/portal-service

# ── Runtime stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /repo/apps/portal-service/dist ./dist
COPY --from=builder /repo/apps/portal-service/node_modules ./node_modules
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages/db/dist ./node_modules/@digishop/db/dist
COPY --from=builder /repo/packages/db/package.json ./node_modules/@digishop/db/package.json

EXPOSE 4004
CMD ["node", "dist/index.js"]
