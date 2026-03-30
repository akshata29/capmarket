# =============================================================================
# Capmarket Wealth Advisor Platform — Multi-stage Docker build
#
# Stage 1 : Build React/Vite SPA
# Stage 2 : Python 3.11 + nginx + supervisord (single container)
#
# nginx (port 80):
#   /api/*  → proxy to uvicorn on 127.0.0.1:8001
#   /*      → React SPA static files (index.html fallback for client routing)
# =============================================================================

# ─── Stage 1: Build React SPA ─────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /build

# Install dependencies first (layer-cache friendly)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build (vite build only -- tsc type-check is skipped so the
# image can still build even when strict-mode TS errors exist in dev code)
COPY frontend/ ./
RUN npx vite build


# ─── Stage 2: Production runtime ──────────────────────────────────────────────
FROM python:3.11-slim

# Install nginx + supervisor (no recommends = smaller image)
RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Python dependencies (cached layer)
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Backend source
COPY backend/ ./backend/

# Compiled frontend → nginx web root
COPY --from=frontend-build /build/dist /usr/share/nginx/html

# Configs
COPY nginx.conf        /etc/nginx/nginx.conf
COPY supervisord.conf  /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
