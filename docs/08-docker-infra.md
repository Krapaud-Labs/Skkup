# 08. Infrastructure Docker

## Principe

Docker en priorité, pensé pour un déploiement sur un VPS auto-géré (par exemple
OVH ou Hetzner), sans dépendance à un cloud managé. Les `Dockerfile` de
`backend/` et `frontend/` sont des builds multi-étapes (dépendances, build,
image de production allégée), vérifiés localement (`docker build` et
`docker compose up`).

## Services

| Service | Rôle | Port exposé |
| --- | --- | --- |
| `proxy` (Traefik) | Reverse proxy, TLS automatique (Let's Encrypt) | 80, 443 |
| `frontend` | Application Next.js | interne, routé par le proxy |
| `backend` | API NestJS + Gateway WebSocket | interne, routé par le proxy (WSS via Traefik) |
| `worker` | Jobs BullMQ (heartbeats, tirages, notifications) | aucun (pas de port exposé) |
| `postgres` | Base de données | interne uniquement |
| `redis` | Cache et files d'attente | interne uniquement |

## Environnements

- `docker-compose.yml` : base commune (services, réseaux, volumes), sans
  règles de routage Traefik spécifiques à un domaine.
- `docker-compose.override.yml` : chargé automatiquement par
  `docker compose up` en local. Expose `frontend` (3000), `backend` (3001),
  `postgres` (5432) et `redis` (6379) directement sur des ports locaux, pour
  développer sans dépendre d'un nom de domaine.
- `docker-compose.prod.yml` : à utiliser explicitement avec
  `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`.
  Ajoute le TLS automatique (Let's Encrypt, défi HTTP) et les règles de
  routage Traefik par nom de domaine (`FRONTEND_DOMAIN`, `BACKEND_DOMAIN`),
  avec redirection systématique HTTP vers HTTPS.

Le routage par domaine a été vérifié localement avec des domaines factices
(en-tête `Host` forcé via `curl`) : Traefik redirige bien vers HTTPS pour
les deux domaines configurés. L'émission réelle du certificat Let's Encrypt
ne peut être testée qu'avec un nom de domaine public et un serveur
accessible depuis Internet (limite normale en environnement local).

## Variables d'environnement

Toutes les variables sensibles (secrets OAuth, chaînes de connexion base de
données, secrets JWT) sont fournies via un fichier `.env` non versionné, avec
un `.env.example` versionné listant les clés attendues sans valeurs réelles.

## Montée en charge du WebSocket

Tant qu'une seule instance du service `backend` tourne, aucune
configuration particulière n'est nécessaire pour le WebSocket. Si le
projet passe un jour à plusieurs instances du backend (scalabilité
horizontale), il faudra activer l'adaptateur Redis de Socket.io (déjà
disponible via le service `redis` existant) pour que les événements
diffusés par une instance atteignent les clients connectés sur une autre
instance, et configurer Traefik en sticky sessions ou en mode
adaptateur-compatible pour le trafic WebSocket.

## Prochaine étape

Configurer un vrai nom de domaine et des enregistrements DNS pointant vers le
VPS de production pour valider l'émission effective du certificat Let's
Encrypt (non testable en local).
