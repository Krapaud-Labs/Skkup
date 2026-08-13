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

`GET /me` retourne `id`, `email`, `pseudo`, `soldePoints`, `streakActuel`,
`streakMax`, `derniereVisiteAt` et `createdAt`. Le hash du mot de passe
n'est jamais exposé.

`GET /me/points/history` utilise une pagination par offset via les query
params `page` (entier >= 1, défaut 1) et `limit` (entier entre 1 et 100,
défaut 20). La réponse contient `transactions` (les plus récentes
d'abord), `page`, `limit`, `total` et `totalPages`. L'historique est
toujours limité à l'utilisateur authentifié : aucun identifiant
d'utilisateur n'est accepté en paramètre.

## Visionnage

- `GET /streams` : liste des streams disponibles (Twitch/YouTube/Facebook) proposés sur le site
- `POST /watch-sessions` : ouvre une session de visionnage pour un stream donné (source : lecteur embarqué ou extension)
- `POST /watch-sessions/:id/heartbeat` : envoie un heartbeat signé (position de lecture ou URL observée, horodatage client, source)
- `POST /watch-sessions/:id/close` : clôture la session

## Extension navigateur

- `POST /extension/pairing-token` : génère un token d'appariement à usage unique depuis le site, à saisir dans l'extension pour l'associer au compte
- `POST /extension/pair` : échange le token d'appariement contre les identifiants de session utilisés ensuite par l'extension pour authentifier ses heartbeats

## Cartes à gratter (V1.0)

- `GET /me/scratch-cards` : liste des cartes à gratter disponibles pour l'utilisateur
- `POST /me/scratch-cards/:id/scratch` : gratte une carte et révèle le gain (points, ticket, ou autre récompense)

## Boutique (V1.1, hors périmètre V1.0)

- `GET /shop/items` : catalogue de la boutique (codes réduction, bons d'achat, tickets de tirage)
- `POST /shop/purchase` : achète un article avec des points (y compris un ticket de tirage, au prix fixé dans le catalogue)

## Tirages au sort

- `GET /raffles` : liste des tirages ouverts et passés, avec lots et dates (V1.0 : uniquement le tirage hebdomadaire ; le mensuel s'ajoute en V1.1)
- `GET /raffles/:id` : détail d'un tirage (lots, tickets distribués, statut)
- `GET /raffles/:id/result` : résultat du tirage une fois clôturé (gagnants, graine aléatoire, empreinte et nombre de participants figés au moment du tirage)
- `GET /raffles/:id/participants?page=&taille=` : liste ordonnée des identifiants de tickets ayant participé, paginée (taille par défaut 500, plafond 2000)

Ces quatre endpoints sont **publics** (pas de JWT) : les tirages, leurs
lots et leurs résultats sont affichés sur les pages vitrine, référencées
par les moteurs de recherche. En contrepartie, aucune donnée personnelle
n'en sort : les gagnants sont identifiés par leur pseudo et l'identifiant
de leur ticket, jamais par leur email ou leur identifiant utilisateur.
`GET /raffles/:id/result` et `GET /raffles/:id/participants` répondent
`404` tant que le tirage n'est pas en statut `TIRE`, pour que ni la graine
aléatoire ni la composition du chapeau ne fuitent avant la sélection.

Vérifier un tirage soi-même : récupérer la graine sur
`GET /raffles/:id/result`, la liste complète des tickets sur
`GET /raffles/:id/participants`, contrôler que le condensé SHA-256 de
cette liste correspond à `empreinteParticipants`, puis rejouer
l'algorithme décrit dans
[02-architecture.md](02-architecture.md#moteur-de-tirage-au-sort). Le
résultat obtenu doit être identique aux gagnants publiés.

En V1.0, un ticket de tirage s'obtient uniquement via
`POST /me/scratch-cards/:id/scratch`. En V1.1, `POST /shop/purchase`
redevient une seconde voie ; il n'existe pas de taux de conversion direct
points → ticket (voir [01-features.md](01-features.md)).

## Administration (accès restreint, à sécuriser en priorité avec l'agent cybersécurité)

- `POST /admin/raffles` : création d'un tirage et de ses lots
- `POST /admin/raffles/:id/draw` : déclenche le tirage
- `GET /admin/fraud/flags` : liste des comptes/sessions signalés par les règles anti-fraude
- `POST /admin/shop/items` : gestion du catalogue de la boutique (V1.1)
- `POST /admin/sponsors` : gestion des sponsors associés aux lots
- `POST /admin/announcements` : création d'un message d'actualité (titre, texte, période d'affichage)
- `PATCH /admin/announcements/:id` : modification ou activation/désactivation d'un message
- `GET /announcements/active` : messages d'actualité actifs à afficher sur la page d'accueil (endpoint public)

## Temps réel (WebSocket)

En complément de l'API REST, le backend expose une Gateway WebSocket
(Socket.io) décrite dans
[02-architecture.md](02-architecture.md#temps-réel-websocket). Événements
poussés côté client, dans la room privée de l'utilisateur authentifié :

- `points:updated` : nouveau solde de points après un gain
  (`{ soldePoints, montant, type }`)
- `streak:updated` : progression du streak, y compris remise à zéro
  (`{ streakActuel, streakMax }`)
- `scratch-card:unlocked` : nouvelle carte à gratter disponible
  (`{ carteId, streakPalier }`)
- `raffle:status` (room `raffles`) : changement de statut d'un tirage
  (`{ raffleId, statut }`)
- `raffle:result` (room `raffles`) : résultat publié, diffusé à tous les
  clients connectés (`{ raffleId, graineAleatoire, empreinteParticipants,
  resultatPublieAt, nombreTickets, gagnants: [{ lotId, ticketId }] }`)

Détails de connexion :

- Le JWT est transmis dans le champ `auth.token` de la poignée de main
  Socket.io, à défaut dans l'en-tête `Authorization: Bearer`. Une
  connexion sans token valide est fermée immédiatement.
- La room privée est dérivée du JWT côté serveur (`user:<userId>`) : le
  client ne l'indique jamais lui-même.
- Les événements de tirage sont diffusés sur une room commune `raffles`
  que tout client authentifié rejoint automatiquement (choix V1.0, voir
  [02-architecture.md](02-architecture.md#implémentation-de-la-gateway)).
  Leur contenu est celui déjà exposé publiquement par
  `GET /raffles/:id/result` : aucun identifiant utilisateur n'y figure.

## Conventions

- Authentification par JWT (Bearer) sur tous les endpoints hors `/auth/*` et hors endpoints publics explicitement listés (`GET /raffles*`, `GET /announcements/active`), et sur la poignée de main WebSocket.
- Rate limiting systématique sur les endpoints sensibles (`heartbeat`, `shop/purchase`, `scratch-cards/:id/scratch`, `oauth/*`) et sur les connexions WebSocket, détaillé en [05-security.md](05-security.md).
- Toutes les réponses d'erreur suivent un format uniforme (code, message, correlation_id) pour faciliter le suivi côté cybersécurité et support.
