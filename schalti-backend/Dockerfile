# Multi-stage build für Express Backend
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

# Kopiere package files
COPY package.json package-lock.json* ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Installiere wget für healthcheck
RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Kopiere nur notwendige Dateien
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
# Kopiere Migrations-Dateien (SQL) und TypeScript-Dateien für npm run migrate
COPY --from=builder --chown=nodejs:nodejs /app/src/migrations ./src/migrations
COPY --from=builder --chown=nodejs:nodejs /app/src/config ./src/config
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./tsconfig.json

USER nodejs

EXPOSE 3001

CMD ["node", "dist/app.js"]

