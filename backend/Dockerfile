# Multi-stage Dockerfile for YatraShare Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package.json package-lock.json ./
COPY shared ./shared
COPY backend ./backend

# Install dependencies and build shared & backend
RUN npm ci --workspace=@yatrashare/shared --workspace=@yatrashare/backend
RUN npm run build --workspace=@yatrashare/shared
RUN npm run build --workspace=@yatrashare/backend

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install curl for container health check
RUN apk add --no-cache curl

# Copy build artifacts and production node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/src/models/schema.sql ./backend/dist/models/

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "backend/dist/server.js"]
