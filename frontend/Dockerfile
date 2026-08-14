# --- Étape 1 : dépendances ---
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Étape 2 : build Next.js ---
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# --- Étape 3 : image de production allégée (sortie "standalone") ---
FROM node:26-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]
