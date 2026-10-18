---
last_updated: 2026-10-18
---

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
  développer sans dépendre d'un nom de domaine. Le backend local utilise
  `COOKIE_SECURE=false` car il est servi en HTTP sur `127.0.0.1`; la valeur
  de production reste `COOKIE_SECURE=true`. Le proxy TLS local route aussi
  `/socket.io` vers le backend, séparément de `/api`, afin que la poignée de
  main Socket.io et ses upgrades WebSocket ne reçoivent pas le middleware de
  suppression du préfixe REST.
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
les services `backend`, `worker` et `frontend` doivent devenir sains selon les
healthchecks définis. Cette configuration versionnée ne constitue pas une
observation du déploiement Dokploy ou de la production. Ne jamais publier
directement les ports de PostgreSQL ou Redis.

Les fichiers Compose suivis définissent un healthcheck pour chaque service
persistant. Le service ponctuel `migrate` est contrôlé par son code de sortie et
exécute `prisma migrate deploy` après le healthcheck PostgreSQL. Backend et
worker attendent la réussite de la migration et les healthchecks PostgreSQL et
Redis; le frontend attend le healthcheck du backend. Ces dépendances de
démarrage et ces sondes décrivent la configuration, pas une preuve de santé
Dokploy actuelle. Le healthcheck Compose du backend interroge `/`; ce contrôle
ne doit pas être confondu avec `GET /health`, qui retourne un état `ok` statique
et constitue une liveness simple sans vérification de dépendances. Le proxy
Traefik local expose son endpoint `ping` pour le contrôle Docker; le Compose
Dokploy n'embarque pas ce proxy.

Le code du worker planifie `nettoyage-etats-temporaires` toutes les quinze
minutes. Une transaction protégée par un verrou advisory PostgreSQL supprime
les états OAuth et codes d'appariement expirés depuis au moins 24 heures, puis
clôture les sessions de visionnage sans heartbeat depuis dix minutes. Le job
émet les événements structurés `maintenance.cleanup.completed` et
`maintenance.cleanup.failed` dans les logs. Ces événements ne prouvent pas
qu'une collecte, une règle d'alerte Dokploy, une notification reçue ou une
astreinte est configurée. Les index de rétention sont versionnés dans Prisma.
En cas de régression, la marche à suivre doit être confirmée par l'opérateur;
la disponibilité actuelle d'un retour à l'image worker précédente n'est pas
établie par cette documentation.

Une base créée avant l'introduction des migrations doit être marquée une seule
fois avec la migration initiale déjà appliquée. Cette opération de baseline est
réservée à l'exploitant après sauvegarde et vérification du schéma. Les nouveaux
environnements appliquent automatiquement toutes les migrations versionnées.

Le routage par domaine a fait l'objet d'une vérification locale historique
avec des domaines factices (en-tête `Host` forcé via `curl`). Cette observation
ne prouve pas l'état de production ni l'émission courante d'un certificat.
L'émission réelle du certificat Let's Encrypt nécessite un nom public et un
serveur accessible depuis Internet.

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

Les contrôles locaux ne démontrent pas l'émission effective du certificat
Let's Encrypt ni l'état des domaines/DNS en production; ces points nécessitent
une vérification opérateur autorisée.

## Configuration Dokploy documentée et état à vérifier

Le fichier `docker-compose.dokploy.yml` est la seule source de vérité pour le service Compose de production. Ne jamais lancer `docker compose up` sans `-f` dans le checkout Dokploy : `docker-compose.yml` local inclut Traefik et des ports hôte incompatibles avec le Traefik et les services gérés par Dokploy.

Contrôle non destructif sur le VPS :

```bash
cd /etc/dokploy/compose/<service>/code
docker compose -f docker-compose.dokploy.yml config
docker compose -f docker-compose.dokploy.yml ps
```

La documentation antérieure décrivait un rollback par sélection d'un commit
dans l'interface Dokploy. Cette procédure est **non vérifiée** et est contredite
par l'observation de l'interface du staging datée du 2026-10-11, qui ne montrait
ni sélecteur de commit, ni bouton rollback, ni restauration de volume
(`docs/quality/evidence/dash-v3-final-captures/dokploy-rollback-ui-20261011.md`).
Ne pas considérer le rollback ou la restauration comme une capacité disponible
avant confirmation opérateur et exercice réversible sur la cible autorisée. Ne
pas utiliser `git checkout` puis `docker compose up` manuellement sur le service
actif. La présence d'un healthcheck ou de logs ne remplace pas la preuve d'un
retour effectif au commit courant, d'une restauration des données et d'une
vérification HTTPS. Les observations et gaps sont consignés dans
[`ops-audit-2026-10-18.md`](design/ops-audit-2026-10-18.md).
