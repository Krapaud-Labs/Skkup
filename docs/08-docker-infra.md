# 08. Infrastructure Docker

## Principe

Docker en priorité, pensé pour un déploiement sur un VPS auto-géré (par exemple
OVH ou Hetzner), sans dépendance à un cloud managé. Un squelette minimal est
fourni dans `infra/` et `docker-compose.yml` à la racine ; il sera complété par
l'agent backend/frontend une fois les projets initialisés.

## Services

| Service | Rôle | Port exposé |
| --- | --- | --- |
| `proxy` (Traefik) | Reverse proxy, TLS automatique (Let's Encrypt) | 80, 443 |
| `frontend` | Application Next.js | interne, routé par le proxy |
| `backend` | API NestJS | interne, routé par le proxy |
| `worker` | Jobs BullMQ (heartbeats, tirages, notifications) | aucun (pas de port exposé) |
| `postgres` | Base de données | interne uniquement |
| `redis` | Cache et files d'attente | interne uniquement |

## Environnements

- `docker-compose.yml` : base commune.
- `docker-compose.override.yml` (développement local) : hot-reload, ports
  exposés en local, variables d'environnement de dev.
- `docker-compose.prod.yml` : configuration de production (pas de hot-reload,
  restart policies, healthchecks stricts).

## Variables d'environnement

Toutes les variables sensibles (secrets OAuth, chaînes de connexion base de
données, secrets JWT) sont fournies via un fichier `.env` non versionné, avec
un `.env.example` versionné listant les clés attendues sans valeurs réelles.

## Prochaine étape

Une fois les projets frontend et backend initialisés, écrire les `Dockerfile`
définitifs (multi-stage build : dépendances, build, image de production
allégée) en remplacement des squelettes fournis dans `infra/`.
