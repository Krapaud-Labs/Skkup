# Viewer Rewards

Plateforme communautaire qui récompense les viewers de streams (Twitch,
YouTube, Facebook Live) pour leur visite quotidienne et leur temps de
visionnage. Les points gagnés servent de tickets de participation à des
tirages au sort réguliers, avec de vrais lots à la clé.

La documentation complète du projet (vision, spécifications
fonctionnelles, architecture, modèle de données, sécurité, design system,
CI/CD, Docker, gitflow, conformité légale) se trouve dans
[docs/](docs/00-overview.md).

## Structure du dépôt

```text
docs/           Documentation du projet (voir docs/00-overview.md)
backend/        API NestJS + Prisma (PostgreSQL)
frontend/       Application Next.js + Tailwind (design system en place)
infra/          Fichiers d'infrastructure complémentaires
docker-compose.yml           Topologie Docker de base (voir docs/08-docker-infra.md)
docker-compose.override.yml  Dev local (ports directs, chargé automatiquement)
docker-compose.prod.yml      Production (TLS Traefik/Let's Encrypt, routage par domaine)
CONTRIBUTING.md              Gitflow, conventions de commits et de code
```

## État d'avancement

- Backend : scaffold NestJS + Prisma (PostgreSQL) opérationnel,
  authentification email/mot de passe (JWT) en place, sessions de
  visionnage avec validation anti-fraude des heartbeats et crédit de
  points en place, visite quotidienne et calcul du streak en place,
  système de cartes à gratter en place (paliers et probabilités de gain
  provisoires, à valider avec le client), profil utilisateur et
  historique paginé des transactions de points en place, moteur de
  tirage au sort en place (job planifié BullMQ, graine aléatoire
  cryptographique journalisée pour l'audit, endpoints publics de
  consultation des tirages et des résultats), catalogue public des
  streams partenaires en place (`GET /streams`, contenu géré
  manuellement en attendant les intégrations OAuth des plateformes).
- Frontend : scaffold Next.js + Tailwind opérationnel, design system
  gamer néon (palette, typographie, composants) en place.
- Infra : reverse proxy Traefik avec TLS automatique (Let's Encrypt) en
  place pour la production.

Suivi détaillé des fonctionnalités restantes dans
[docs/01-features.md](docs/01-features.md).

## Démarrage rapide (Docker, tous les services)

```bash
cp .env.example .env   # ajuster les valeurs
docker compose up -d --build
```

## Démarrage rapide (backend)

```bash
cd backend
cp .env.example .env   # ou ajuster .env existant
npm install
npx prisma generate
npm run start:dev
```

## Démarrage rapide (frontend)

```bash
cd frontend
npm install
npm run dev
```

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour le gitflow et les conventions
de contribution.
