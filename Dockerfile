# Multi-stage Dockerfile for Next.js 15 app (Node 20)

# Base image
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies (cached layer)
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json* ./

# Optional: reduce image size to production dependencies only
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev

# Copy built assets and app files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "start"]
