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

# Copy ALL workspace package.json files (Safe way for Monorepo workspace resolution)
COPY apps/customer2/package.json ./apps/customer2/
COPY apps/customer-service2/package.json ./apps/customer-service2/
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
RUN npx turbo run build --filter=customer2...

# ── Runner stage (Production optimized) ──────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV COREPACK_ENABLE_AUTO_PIN=0
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/customer2/public ./apps/customer2/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer2/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer2/.next/static ./apps/customer2/.next/static

USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/customer2/server.js"]
