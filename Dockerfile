# ═══════════════════════════════════════════════════════════════════
# WebClient Dockerfile - Multi-stage Build
# ═══════════════════════════════════════════════════════════════════
# Stage 1: Build the Vite React application
# ═══════════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
# These are baked into the build at build time
ARG VITE_API_BASE=https://api.saby.ai/v1
ENV VITE_API_BASE=$VITE_API_BASE

# Build the application (outputs to dist/)
RUN npm run build

# ═══════════════════════════════════════════════════════════════════
# Stage 2: Production - Serve with nginx
# ═══════════════════════════════════════════════════════════════════
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a simple health check endpoint
RUN echo '{"status":"healthy","service":"WebClient","version":"1.0.0"}' > /usr/share/nginx/html/health.json

# Expose port 3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health.json || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

