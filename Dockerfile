# ── Stage 1: Build ─────────────────────────────────────────────────────────────
# Exact Node.js release, so a build can never fall back to an older cached image.
# Dependabot (.github/dependabot.yml) opens a pull request for newer 24.x releases.
FROM node:24.22.2-alpine AS builder
WORKDIR /app

# Copy manifests first for layer-cached dependency install
COPY package*.json .npmrc ./
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
FROM node:24.22.2-alpine
WORKDIR /app

# Security fixes for Alpine packages that are newer than the base image
RUN apk upgrade --no-cache

# npm, corepack and yarn are only needed for the install; the running server never uses them,
# so they (and their dependencies) don't ship.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-v* \
     /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg

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
