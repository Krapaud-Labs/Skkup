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
# Next standalone does not include the public directory by default.
COPY --from=build /app/frontend/public ./public
COPY --from=build /app/frontend/assets/brand/logos/skkup-wordmark-transparent.png ./frontend/assets/brand/logos/
COPY --from=build /app/frontend/assets/brand/marks ./frontend/assets/brand/marks
COPY --from=build /app/frontend/assets/icons/ui ./frontend/assets/icons/ui
COPY --from=build /app/frontend/assets/dashboard/illustrations ./frontend/assets/dashboard/illustrations
COPY --from=build /app/frontend/assets/dashboard/rewards ./frontend/assets/dashboard/rewards
COPY --from=build /app/frontend/assets/marketing ./frontend/assets/marketing
COPY --from=build /app/frontend/assets/platforms/twitch.png /app/frontend/assets/platforms/youtube.png /app/frontend/assets/platforms/kick.png ./frontend/assets/platforms/
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]
