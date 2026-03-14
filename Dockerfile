# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests first for layer-cached dependency install
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN npm ci

# Copy source and build all workspaces (shared → frontend → backend)
COPY . .
RUN npm run build

# Prune dev dependencies before copying to final image
RUN npm prune --omit=dev

# ── Stage 2: Production image ───────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Workspace package.json files are needed for module resolution
COPY --from=builder /app/package.json ./
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/backend/package.json ./backend/

# Production node_modules (hoisted to root by npm workspaces)
COPY --from=builder /app/node_modules ./node_modules

# Compiled backend + shared
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared/dist ./shared/dist

# Built frontend assets served by Express
COPY --from=builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=3001
ENV STATIC_DIR=/app/frontend/dist
EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
