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
- `POST /watch-sessions` : ouvre une session de visionnage pour un stream donné
- `POST /watch-sessions/:id/heartbeat` : envoie un heartbeat signé (position de lecture, horodatage client)
- `POST /watch-sessions/:id/close` : clôture la session

## Tirages au sort

- `GET /raffles` : liste des tirages ouverts et passés, avec lots et dates
- `GET /raffles/:id` : détail d'un tirage (lots, tickets distribués, statut)
- `POST /raffles/:id/tickets` : convertit des points en tickets pour ce tirage
- `GET /raffles/:id/result` : résultat du tirage une fois clôturé (gagnants, graine aléatoire pour audit)

## Administration (accès restreint, à sécuriser en priorité avec l'agent cybersécurité)

- `POST /admin/raffles` : création d'un tirage et de ses lots
- `POST /admin/raffles/:id/draw` : déclenche le tirage
- `GET /admin/fraud/flags` : liste des comptes/sessions signalés par les règles anti-fraude

## Conventions

- Authentification par JWT (Bearer) sur tous les endpoints hors `/auth/*`.
- Rate limiting systématique sur les endpoints sensibles (`heartbeat`, `tickets`, `oauth/*`), détaillé en [05-security.md](05-security.md).
- Toutes les réponses d'erreur suivent un format uniforme (code, message, correlation_id) pour faciliter le suivi côté cybersécurité et support.
