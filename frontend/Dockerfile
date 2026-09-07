# Multi-stage Dockerfile for YatraShare Frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package.json package-lock.json ./
COPY shared ./shared
COPY frontend ./frontend

# Install dependencies and build shared & frontend
RUN npm ci --workspace=@yatrashare/shared --workspace=@yatrashare/frontend
RUN npm run build --workspace=@yatrashare/shared
RUN npm run build --workspace=@yatrashare/frontend

# Nginx Production Stage
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
