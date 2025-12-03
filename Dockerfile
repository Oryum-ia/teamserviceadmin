# Multi-stage Dockerfile for Next.js 15 app (Node 20)

# Base image
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (cached layer)
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# Build stage
FROM base AS builder

# Variables públicas necesarias en tiempo de build para Next.js
# Dokploy las pasa como build args
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_TRACKING_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_TRACKING_URL=$NEXT_PUBLIC_TRACKING_URL

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
