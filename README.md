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
frontend/       Application Next.js + Tailwind (contenu réel à venir)
infra/          Fichiers d'infrastructure complémentaires
docker-compose.yml   Topologie Docker (voir docs/08-docker-infra.md)
CONTRIBUTING.md      Gitflow, conventions de commits et de code
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
