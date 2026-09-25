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
| `worker` | Jobs BullMQ (tirages, maintenance, notifications) | aucun (pas de port exposé) |
| `migrate` | Application des migrations Prisma versionnées | aucun |
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
- `docker-compose.dokploy.yml` : fichier autonome pour un VPS déjà administré
  par Dokploy. Il n'embarque pas le service `proxy`, ne publie aucun port sur
  l'hôte et laisse le Traefik de Dokploy gérer les domaines et le TLS.

## Déploiement avec Dokploy

Créer un projet et un environnement de production, puis un service de type
Docker Compose relié au dépôt GitHub privé. Utiliser la branche `dev` et le
chemin `./docker-compose.dokploy.yml`. Laisser les déploiements isolés
désactivés : Dokploy ajoute son réseau uniquement aux services associés à un
domaine, tandis que le fichier Compose maintient PostgreSQL et Redis sur un
réseau interne distinct.

Renseigner les variables dans l'onglet Environment du service. Dokploy les
écrit dans le fichier `.env` consommé par les services. Utiliser des secrets
réels et uniques, notamment pour `POSTGRES_PASSWORD` et `JWT_SECRET`. Les
valeurs de production minimales sont :

- `DATABASE_URL=postgresql://skuup:<mot-de-passe>@postgres:5432/skuup` ;
- `REDIS_PASSWORD=<mot-de-passe-unique>` ;
- `REDIS_URL=redis://:<mot-de-passe-unique>@redis:6379` ;
- `COOKIE_SECURE=true` ;
- `CORS_ORIGINS=https://<domaine-frontend>` ;
- `NEXT_PUBLIC_API_URL=https://<domaine-api>`.

Dans l'onglet Domains, ajouter séparément :

- le domaine public au service `frontend`, port interne `3000` ;
- le sous-domaine API au service `backend`, port interne `3000`.

Le domaine canonique de la vitrine est `https://skkup.fr`. Le frontend
redirige automatiquement `www.skkup.fr` vers cet hôte en HTTPS et publie
`/robots.txt`, `/sitemap.xml` ainsi qu'une URL canonique par page publique.
Configurer donc les deux entrées DNS côté Dokploy, avec le certificat TLS
actif sur les deux noms, puis conserver `skkup.fr` comme domaine principal
dans les liens partagés.

Les enregistrements DNS A doivent déjà pointer vers l'adresse IPv4 publique du
VPS avant l'activation HTTPS. Vérifier le résultat avec Preview Compose avant
le premier déploiement. Le service `migrate` doit terminer avec succès, puis
les services `backend`, `worker` et `frontend` doivent devenir sains. Ne jamais
publier directement les ports de PostgreSQL ou Redis.

Chaque service possède un healthcheck adapté. Le service ponctuel `migrate`
exécute `prisma migrate deploy` après la disponibilité de PostgreSQL. Le
backend et le worker ne démarrent qu'après son succès et la disponibilité
réelle de Redis, puis le frontend attend que le backend réponde. Une erreur de
migration bloque donc le démarrage au lieu de produire des erreurs HTTP 500.
Traefik expose uniquement son endpoint `ping` interne pour que Docker contrôle
également le reverse proxy.

Le worker planifie aussi `nettoyage-etats-temporaires` toutes les quinze
minutes. Une transaction protégée par un verrou advisory PostgreSQL supprime
les états OAuth et codes d'appariement expirés depuis au moins 24 heures, puis
clôture les sessions de visionnage sans heartbeat depuis dix minutes. Le job
émet les événements structurés `maintenance.cleanup.completed` et
`maintenance.cleanup.failed`, exploitables par la supervision et les alertes
Dokploy. Les index de rétention sont versionnés dans Prisma. En cas de
régression, revenir à l'image worker précédente puis relancer le déploiement
après avoir vérifié les journaux du job.

Une base créée avant l'introduction des migrations doit être marquée une seule
fois avec la migration initiale déjà appliquée. Cette opération de baseline est
réservée à l'exploitant après sauvegarde et vérification du schéma. Les nouveaux
environnements appliquent automatiquement toutes les migrations versionnées.

Le routage par domaine a été vérifié localement avec des domaines factices
(en-tête `Host` forcé via `curl`) : Traefik redirige bien vers HTTPS pour
les deux domaines configurés. L'émission réelle du certificat Let's Encrypt
ne peut être testée qu'avec un nom de domaine public et un serveur
accessible depuis Internet (limite normale en environnement local).

## Variables d'environnement

Toutes les variables sensibles (chaînes de connexion base de données et
secrets JWT) sont fournies via un fichier `.env` non versionné, avec
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

## Procédure Dokploy et rollback

Le fichier `docker-compose.dokploy.yml` est la seule source de vérité pour le service Compose de production. Ne jamais lancer `docker compose up` sans `-f` dans le checkout Dokploy : `docker-compose.yml` local inclut Traefik et des ports hôte incompatibles avec le Traefik et les services gérés par Dokploy.

Contrôle non destructif sur le VPS :

```bash
cd /etc/dokploy/compose/<service>/code
docker compose -f docker-compose.dokploy.yml config
docker compose -f docker-compose.dokploy.yml ps
```

Pour un rollback, sélectionner le commit voulu dans l’interface Dokploy puis relancer le déploiement du service. Ne pas utiliser `git checkout` puis `docker compose up` manuellement sur le service actif. Vérifier ensuite les services `healthy`, la fin de `migrate`, les logs et une requête HTTPS sur `https://skkup.fr/`.
---
last_updated: 2026-09-25
---
