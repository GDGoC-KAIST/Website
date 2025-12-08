# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/lib ./lib
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/public ./public
COPY --from=builder /app/openapi.json ./openapi.json
COPY --from=builder /app/.env.example ./.env.example

EXPOSE 8080
USER node

CMD ["node", "lib/index.js"]
