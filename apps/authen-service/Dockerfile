# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /repo

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/configs/package.json ./packages/configs/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/authen-service/package.json ./apps/authen-service/

# Install all workspace dependencies from root
RUN npm ci --workspace=packages/db \
           --workspace=packages/configs \
           --workspace=packages/typescript-config \
           --workspace=apps/authen-service \
           --include-workspace-root

# Copy source
COPY packages/db ./packages/db
COPY packages/configs ./packages/configs
COPY packages/typescript-config ./packages/typescript-config
COPY apps/authen-service ./apps/authen-service

# Build packages then service
RUN npm run build --workspace=packages/db
RUN npm run build --workspace=apps/authen-service

# ── Runtime stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and required node_modules
COPY --from=builder /repo/apps/authen-service/dist ./dist
COPY --from=builder /repo/apps/authen-service/node_modules ./node_modules
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages/db/dist ./node_modules/@digishop/db/dist
COPY --from=builder /repo/packages/db/package.json ./node_modules/@digishop/db/package.json

EXPOSE 4001
CMD ["node", "dist/index.js"]
