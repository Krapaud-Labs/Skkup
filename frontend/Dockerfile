# syntax=docker/dockerfile:1.7
# ─── Étape 1 : dépendances ────────────────────────────────────────────────────
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=skuup-frontend-npm,target=/root/.npm npm ci

# ─── Étape 2 : build Next.js ──────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY . .
RUN npm run build

# ─── Étape 3 : image de production allégée ────────────────────────────────────
FROM node:26-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
# Bind on every container interface so Dokploy/Traefik can reach the app on
# whichever network it selects.
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]
