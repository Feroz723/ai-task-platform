FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/
RUN npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:shared-types
RUN npm run build -w apps/api

FROM node:22-alpine AS runner
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/
RUN npm ci --only=production --ignore-scripts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
USER appuser
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "apps/api/dist/index.js"]
