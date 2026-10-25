# syntax=docker/dockerfile:1.7
# ─── Étape 1 : dépendances ────────────────────────────────────────────────────
FROM node:26-alpine AS deps
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,id=skuup-frontend-npm,target=/root/.npm npm_config_audit=false npm_config_fund=false npm ci

# ─── Étape 2 : build Next.js ──────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app/frontend
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY frontend/ ./
COPY asset/ /app/asset/
RUN npm run build

# ─── Étape 3 : image de production allégée ────────────────────────────────────
FROM node:26-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
# Bind on every container interface so Dokploy/Traefik can reach the app on
# whichever network it selects.
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./.next/static
COPY --from=build /app/asset/brand/logos/skkup-wordmark-transparent.png ./asset/brand/logos/
COPY --from=build /app/asset/brand/marks ./asset/brand/marks
COPY --from=build /app/asset/icons/ui ./asset/icons/ui
COPY --from=build /app/asset/dashboard/illustrations ./asset/dashboard/illustrations
COPY --from=build /app/asset/dashboard/rewards ./asset/dashboard/rewards
COPY --from=build /app/asset/marketing ./asset/marketing
COPY --from=build /app/asset/platforms/twitch.png /app/asset/platforms/youtube.png ./asset/platforms/
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]
