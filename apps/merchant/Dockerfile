# ── Base stage ────────────────────────────────────────────────────────────────
FROM node:22-slim AS base
ENV COREPACK_ENABLE_AUTO_PIN=0
ENV NEXT_TELEMETRY_DISABLED=1

# ── Deps stage (Install dependencies for the whole monorepo) ───────────────
FROM base AS deps
RUN apt-get update && apt-get install -y openssl libssl-dev libc6 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy root configs
COPY package.json package-lock.json turbo.json ./

# Copy relevant workspace package.json files
COPY apps/merchant/package.json ./apps/merchant/
COPY apps/merchant-service/package.json ./apps/merchant-service/
COPY packages/db/package.json ./packages/db/
COPY packages/configs/package.json ./packages/configs/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# Install everything
RUN npm ci

# ── Builder stage (Build only the target app) ─────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use turbo to build the app and its internal dependencies
RUN npx turbo run build --filter=merchant...

# ── Runner stage (Production optimized) ──────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV COREPACK_ENABLE_AUTO_PIN=0
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/merchant/public ./apps/merchant/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/merchant/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/merchant/.next/static ./apps/merchant/.next/static

USER nextjs
EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/merchant/server.js"]
