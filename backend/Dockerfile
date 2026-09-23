# syntax=docker/dockerfile:1.7
# ─── Étape 1 : dépendances ────────────────────────────────────────────────────
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=skuup-backend-npm,target=/root/.npm npm_config_audit=false npm_config_fund=false npm ci

# ─── Étape 2 : génération Prisma et compilation NestJS ────────────────────────
FROM deps AS build
WORKDIR /app
COPY . .
RUN npx prisma generate && npm run build

# Réutilise les dépendances déjà téléchargées, puis retire l'outillage de dev.
# Cela évite un second npm ci coûteux et fragile sur les petits VPS.
FROM deps AS production-deps
RUN npm prune --omit=dev

# Image minimale utilisée uniquement pour appliquer les migrations.
# Elle évite d'exporter le compilateur Nest et tout le code source dans Dokploy.
FROM node:26-alpine AS migration
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm_config_audit=false npm_config_fund=false npm ci --omit=dev
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN chown -R node:node /app
USER node

# ─── Étape 3 : image de production allégée ────────────────────────────────────
FROM node:26-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "dist/src/main"]
