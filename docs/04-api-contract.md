# 04. Contrat API (V1)

API REST exposée par le backend NestJS. Les schémas de requête/réponse détaillés (DTOs) seront affinés par l'agent backend ; ce document fixe le périmètre fonctionnel des endpoints.

## Authentification

- `POST /auth/register` : création de compte email/mot de passe
- `POST /auth/login` : connexion, retourne un JWT de session
- `GET /auth/oauth/:platform/start` (platform = twitch, google, facebook) : démarre le flux OAuth de liaison ou de connexion
- `GET /auth/oauth/:platform/callback` : callback OAuth, crée ou lie le compte

## Profil et points

- `GET /me` : profil utilisateur, solde de points, série de visite
- `POST /me/daily-checkin` : enregistre la visite quotidienne et crédite les points de série
- `GET /me/points/history` : historique paginé des transactions de points

## Visionnage

- `GET /streams` : liste des streams disponibles (Twitch/YouTube/Facebook) proposés sur le site
- `POST /watch-sessions` : ouvre une session de visionnage pour un stream donné (source : lecteur embarqué ou extension)
- `POST /watch-sessions/:id/heartbeat` : envoie un heartbeat signé (position de lecture ou URL observée, horodatage client, source)
- `POST /watch-sessions/:id/close` : clôture la session

## Extension navigateur

- `POST /extension/pairing-token` : génère un token d'appariement à usage unique depuis le site, à saisir dans l'extension pour l'associer au compte
- `POST /extension/pair` : échange le token d'appariement contre les identifiants de session utilisés ensuite par l'extension pour authentifier ses heartbeats

## Boutique et cartes à gratter

- `GET /shop/items` : catalogue de la boutique (codes réduction, bons d'achat, tickets de tirage)
- `POST /shop/purchase` : achète un article avec des points (y compris un ticket de tirage, au prix fixé dans le catalogue)
- `GET /me/scratch-cards` : liste des cartes à gratter disponibles pour l'utilisateur
- `POST /me/scratch-cards/:id/scratch` : gratte une carte et révèle le gain (points, ticket, ou autre récompense)

## Tirages au sort

- `GET /raffles` : liste des tirages ouverts et passés, avec lots et dates
- `GET /raffles/:id` : détail d'un tirage (lots, tickets distribués, statut)
- `GET /raffles/:id/result` : résultat du tirage une fois clôturé (gagnants, graine aléatoire pour audit)

Un ticket de tirage s'obtient uniquement via `POST /shop/purchase` ou
`POST /me/scratch-cards/:id/scratch` ; il n'existe pas de taux de
conversion direct points → ticket (voir
[01-features.md](01-features.md)).

## Administration (accès restreint, à sécuriser en priorité avec l'agent cybersécurité)

- `POST /admin/raffles` : création d'un tirage et de ses lots
- `POST /admin/raffles/:id/draw` : déclenche le tirage
- `GET /admin/fraud/flags` : liste des comptes/sessions signalés par les règles anti-fraude
- `POST /admin/shop/items` : gestion du catalogue de la boutique
- `POST /admin/sponsors` : gestion des sponsors associés aux lots

## Temps réel (WebSocket)

En complément de l'API REST, le backend expose une Gateway WebSocket
(Socket.io) décrite dans
[02-architecture.md](02-architecture.md#temps-réel-websocket). Événements
poussés côté client, dans la room privée de l'utilisateur authentifié :

- `points:updated` : nouveau solde de points après un gain
- `streak:updated` : progression du streak, y compris remise à zéro
- `scratch-card:unlocked` : nouvelle carte à gratter disponible
- `raffle:status` (room du tirage) : changement de statut d'un tirage (ouvert, clôturé)
- `raffle:result` (room du tirage) : résultat publié, diffusé à tous les participants connectés

## Conventions

- Authentification par JWT (Bearer) sur tous les endpoints hors `/auth/*`, et sur la poignée de main WebSocket.
- Rate limiting systématique sur les endpoints sensibles (`heartbeat`, `shop/purchase`, `scratch-cards/:id/scratch`, `oauth/*`) et sur les connexions WebSocket, détaillé en [05-security.md](05-security.md).
- Toutes les réponses d'erreur suivent un format uniforme (code, message, correlation_id) pour faciliter le suivi côté cybersécurité et support.
