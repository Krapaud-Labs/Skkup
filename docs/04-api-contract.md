# 04. Contrat API (V1)

API REST exposée par le backend NestJS. Les schémas de requête/réponse détaillés (DTOs) seront affinés par l'agent backend ; ce document fixe le périmètre fonctionnel des endpoints.

## Authentification

- `POST /auth/register` : création de compte email/mot de passe
- `POST /auth/login` : connexion
- `POST /auth/logout` : déconnexion, efface le cookie de session
- `PATCH /auth/password` : change le mot de passe et révoque les sessions et appareils associés

L'authentification est volontairement limitée au formulaire natif du site
(email, mot de passe et, à l'inscription, pseudo). Aucun endpoint de
connexion ou d'inscription via Google, Twitch ou Facebook n'est exposé.
Ces plateformes restent uniquement des sources de streams suivis par
l'extension navigateur.

### Session

`POST /auth/register` (201) et `POST /auth/login` (200) n'exposent jamais
le JWT dans le corps de la réponse : ils le posent dans un cookie de
session `httpOnly`, inaccessible au JavaScript de la page. Le corps ne
contient que `{ pseudo }`, information non sensible qui évite au client
un `GET /me` immédiat pour afficher l'état connecté.

Attributs du cookie : `HttpOnly`, `SameSite=Lax`, `Secure`, `Path=/`,
sans attribut `Domain` (host-only), `Max-Age` aligné sur l'expiration du
JWT (7 jours). Le nom est `__Host-vr_session` (préfixe `__Host-`, qui
interdit à un sous-domaine de masquer la session) et retombe sur
`vr_session` en développement local, où l'absence de TLS empêche
`Secure`. La justification de ces choix est détaillée en
[05-security.md](05-security.md#session-et-cookie).

Le client web doit donc émettre ses requêtes avec `credentials:
'include'`, et n'a rien à stocker lui-même. `POST /auth/logout` (204) est
le seul moyen d'effacer ce cookie, qu'aucun script de page ne peut
supprimer ; il n'exige pas de session valide et réussit toujours.

`PATCH /auth/password` (204) exige la session courante et reçoit
`{ ancienMotDePasse, nouveauMotDePasse }`. Le nouveau secret comporte au
moins 12 caractères, une minuscule, une majuscule et un chiffre. Une réponse
`401` indique un ancien secret incorrect ; une réponse `400` indique un secret
identique ou invalide. Après succès, le cookie courant est supprimé, les JWT
antérieurs sont invalidés et tous les appareils d'extension ainsi que les
sessions de visionnage en cours sont révoqués.

Le CORS n'autorise que les origines exactes déclarées dans
`CORS_ORIGINS`, avec les identifiants activés. Toute requête mutante
(`POST`, `PUT`, `PATCH`, `DELETE`) porteuse du cookie de session doit
présenter un en-tête `Origin` appartenant à cette liste, sinon elle est
refusée en `403` (protection CSRF, voir
[05-security.md](05-security.md#session-et-cookie)).

## Profil et points

- `GET /me` : profil utilisateur, solde de points, série de visite
- `POST /me/daily-checkin` : enregistre la visite quotidienne et crédite les points de série
- `GET /me/points/history` : historique paginé des transactions de points
- `GET /me/raffle-tickets` : liste paginée des tickets de tirage obtenus par l'utilisateur

`GET /me` retourne `id`, `email`, `pseudo`, `role` (`VIEWER` ou `ADMIN`),
`soldePoints`, `streakActuel`, `streakMax`, `derniereVisiteAt` et
`createdAt`. Le hash du mot de passe n'est jamais exposé. `role` permet
au frontend de savoir si le compte connecté a accès au back-office
administrateur ; ce champ n'est jamais accepté en entrée, seule la base
en fait foi.

`GET /me/points/history` utilise une pagination par offset via les query
params `page` (entier >= 1, défaut 1) et `limit` (entier entre 1 et 100,
défaut 20). La réponse contient `transactions` (les plus récentes
d'abord), `page`, `limit`, `total` et `totalPages`. L'historique est
toujours limité à l'utilisateur authentifié : aucun identifiant
d'utilisateur n'est accepté en paramètre.

`GET /me/raffle-tickets` utilise la même pagination par offset (`page`,
`limit`, mêmes bornes que `GET /me/points/history`). La réponse contient
`tickets` (les plus récents d'abord), `page`, `limit`, `total` et
`totalPages`. Chaque ticket expose `ticketId`, `raffleId`, `raffleTitre`,
`raffleStatut` (`OUVERT`, `CLOTURE` ou `TIRE`), `obtenuLe` et `gagnant`
(booléen). Si `gagnant` vaut `true`, `lot` contient `{ id, nom }` du lot
remporté, sinon `lot` vaut `null`. Comme pour l'historique de points, le
filtre porte toujours sur l'utilisateur authentifié.

## Visionnage

- `GET /streams` : liste des streams disponibles (Twitch/YouTube/Facebook) proposés sur le site
- `POST /watch-sessions` : ouvre une session de visionnage
- `POST /watch-sessions/:id/heartbeat` : envoie l'état de lecture et la
  position observée ; l'authentification vient de la session et le serveur
  calcule lui-même l'intervalle depuis son horloge
- `POST /watch-sessions/:id/close` : clôture la session

`GET /streams` est **public** (pas de JWT) : la page vitrine doit pouvoir
afficher les chaînes proposées sans compte. La réponse contient
`streams`, chaque entrée exposant `id`, `plateforme` (`TWITCH`,
`YOUTUBE`, `FACEBOOK`), `identifiantChaine` (identifiant de la chaîne sur
la plateforme, réutilisé comme `streamExternalId` à l'ouverture d'une
session de visionnage) et `nomAffiche`. Seules les chaînes marquées
actives sont retournées.

Les trois routes `POST /watch-sessions*` acceptent indifféremment la
session web (cookie) ou le jeton d'une extension appariée (en-tête
`Authorization: Bearer vrx_...`), via une garde combinée. La source
(`LECTEUR_EMBARQUE` ou `EXTENSION`) n'est jamais acceptée depuis le
payload : le serveur la déduit du credential qui a authentifié la
requête, et la fige à l'ouverture de la session. Toute paire
plateforme/identifiant valide peut être suivie, même hors catalogue
partenaire. Les ouvertures et heartbeats sont limités par utilisateur et IP.

En V1.0 ce catalogue est renseigné manuellement (seed puis back-office
administrateur) : la récupération automatique des lives via les API
Twitch/YouTube/Facebook suppose les intégrations OAuth, prévues plus
tard. La forme de la réponse ne changera pas quand cette récupération
arrivera, elle pourra seulement s'enrichir.

En V1, l'extension ouvre la session et envoie les heartbeats pendant le
visionnage actif sur la plateforme choisie. Une pause ou un onglet masqué
suspend le suivi. Les anciennes sessions de lecteur embarqué peuvent encore
être clôturées, mais ne créditent aucun point.

L'extension peut créditer des points lorsque les contrôles anti-fraude
serveur sont satisfaits. Tous les streams valides donnent le
barème de base. Un stream marqué partenaire peut recevoir un bonus horaire
configuré par un administrateur via `PATCH /streams/admin/:id/reward`.
Le plafond quotidien reste commun à l'utilisateur et indépendant du nombre
de sessions.

## Extension navigateur

- `POST /extension/pairing-token` : génère un token d'appariement à usage unique depuis le site, à saisir dans l'extension pour l'associer au compte
- `POST /extension/pair` : échange le token d'appariement contre les identifiants de session utilisés ensuite par l'extension pour authentifier ses heartbeats

### Génération du code d'appariement

`POST /extension/pairing-token` (201) exige la session web (cookie), sans
corps de requête. Elle répond :

```json
{ "code": "H4T7-K9MP-2XQZ", "expireAt": "2026-08-17T09:05:00.000Z" }
```

Le `code` fait 12 caractères en alphabet Crockford base32 (ni I, ni L, ni
O, ni U), affichés par groupes de 4, et vit **5 minutes**. Il est à usage
unique et n'est jamais réaffichable : seule son empreinte est conservée
côté serveur. Générer un nouveau code invalide immédiatement le
précédent s'il n'a pas été consommé. Limite : 5 appels par heure et par
compte.

### Échange contre les identifiants de l'extension

`POST /extension/pair` (200) n'est pas authentifiée : le code est le seul
secret présenté. Corps de requête :

```json
{ "code": "h4t7 k9mp 2xqz" }
```

La saisie est normalisée avant vérification (casse, espaces et tirets
ignorés, `O` lu comme `0`, `I` et `L` comme `1`). Réponse :

```json
{
  "jetonExtension": "vrx_...",
  "expireAt": "2026-09-16T09:00:00.000Z",
  "pseudo": "Kra"
}
```

`jetonExtension` est un jeton **opaque** (256 bits d'aléa, préfixe
`vrx_`), pas un JWT : il est enregistré côté serveur sous forme
d'empreinte et reste donc révocable, ce qu'un JWT signé ne permettrait
pas avant son expiration. Durée de vie : 30 jours. Il n'est renvoyé
qu'une fois, l'extension le conserve dans son propre stockage et le
présente ensuite en `Authorization: Bearer <jetonExtension>`.

Un compte peut avoir 5 appareils appariés au maximum ; au-delà, les
appariements les plus anciens sont révoqués automatiquement. Un code
inconnu, expiré ou déjà consommé donne la même réponse `401` avec le même
message, pour ne pas transformer l'endpoint en oracle. Limite : 10 appels
par heure et par adresse IP.

Ce jeton est cloisonné du JWT de session web : il n'ouvre que les routes
gardées par l'authentification d'extension ou par la garde combinée des
sessions de visionnage (voir section Visionnage), et un JWT de session
ne peut pas s'y substituer. L'extension navigateur livrée (`extension/`)
ouvre une session et envoie ses heartbeats avec l'en-tête
`Authorization: Bearer <jetonExtension>` et les payloads décrits dans la
section Visionnage ; ces appels créditent des points, contrairement au
lecteur embarqué.

### Gestion des appareils appariés

- `GET /extension/pairings` : liste les appareils appariés au compte authentifié
- `DELETE /extension/pairings/:id` : révoque un appareil apparié (désappariement)

Ces deux routes exigent la session web (cookie), comme
`POST /extension/pairing-token` : c'est depuis le site, pas depuis
l'extension elle-même, qu'un utilisateur consulte et coupe ses appareils.

`GET /extension/pairings` (200) répond :

```json
{
  "appareils": [
    {
      "id": "clx...",
      "pairedAt": "2026-08-01T09:00:00.000Z",
      "expireAt": "2026-08-31T09:00:00.000Z",
      "statut": "ACTIF"
    }
  ]
}
```

`statut` vaut `ACTIF`, `EXPIRE` ou `REVOQUE`, dérivé côté serveur à
partir de `expireAt` et `revoqueAt`. Aucune métadonnée d'appareil
(nom, agent utilisateur, dernière activité) n'est conservée : voir
docs/05-security.md. L'utilisateur distingue ses appareils par leur
date d'appariement.

`DELETE /extension/pairings/:id` (204) révoque l'appareil correspondant
à `revoqueAt` s'il appartient au compte authentifié ; `404` s'il
n'existe pas, `403` s'il appartient à un autre compte. Révoquer un
appareil déjà révoqué est sans effet (idempotent). Le jeton révoqué est
immédiatement refusé par `ExtensionAuthGuard` sur toutes les routes
qu'il ouvre.

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

Tous les endpoints `/admin/*` sont protégés par `AdminGuard`
(`backend/src/auth/guards/admin.guard.ts`), qui exige un rôle `ADMIN` sur
le compte authentifié par le JWT de session web (cookie ou en-tête
`Authorization`). Le jeton d'extension navigateur n'est jamais accepté
sur ces routes : un accès admin ne peut jamais se faire via ce
credential distinct. Un appel sans session valide échoue en `401`, un
appel authentifié mais sans rôle `ADMIN` échoue en `403`. Voir
docs/05-security.md pour le mécanisme de désignation du premier compte
administrateur.

- `POST /admin/raffles` : création d'un tirage et de ses lots
- `POST /admin/raffles/:id/draw` : déclenche le tirage
- `GET /admin/fraud/flags` : liste des comptes/sessions signalés par les règles anti-fraude
- `POST /admin/shop/items` : gestion du catalogue de la boutique (V1.1)
- `POST /admin/sponsors` : gestion des sponsors associés aux lots
- `GET /admin/sponsors` : liste des sponsors et le nombre de lots associés
- `PATCH /admin/sponsors/:id` : modification du nom, du logo ou de l'activation
- `POST /admin/announcements` : création d'un message d'actualité (titre, texte, période d'affichage)
- `PATCH /admin/announcements/:id` : modification ou activation/désactivation d'un message
- `GET /announcements/active` : messages d'actualité actifs à afficher sur la page d'accueil (endpoint public)
- `PATCH /admin/fraud/flags/:id` : changement du statut d'un signalement
  (`OUVERTE`, `EXAMINEE`, `IGNOREE`)

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
  (`{ raffleId, statut }`). Pas encore émis : l'ouverture et la clôture
  manuelles relèvent du back-office administrateur, et le tirage
  automatique clôture et tire dans la même transaction.
- `raffle:result` (room `raffles`) : résultat publié, diffusé à tous les
  clients connectés (`{ raffleId, graineAleatoire, empreinteParticipants,
  resultatPublieAt, nombreTickets, gagnants: [{ lotId, ticketId }] }`)

Détails de connexion :

- Le JWT est lu dans le cookie de session envoyé avec la poignée de main
  Socket.io, à défaut dans le champ `auth.token`, à défaut dans l'en-tête
  `Authorization: Bearer` (voies réservées aux clients sans cookie, comme
  l'extension navigateur). Une connexion sans token valide est fermée
  immédiatement.
- Une poignée de main portant le cookie de session doit présenter un
  en-tête `Origin` figurant dans `CORS_ORIGINS`, sinon elle est refusée
  avant même la vérification du token (même règle que les requêtes
  mutantes HTTP). Les clients sans cookie ne sont pas concernés.
- La room privée est dérivée du JWT côté serveur (`user:<userId>`) : le
  client ne l'indique jamais lui-même.
- Les événements de tirage sont diffusés sur une room commune `raffles`
  que tout client authentifié rejoint automatiquement (choix V1.0, voir
  [02-architecture.md](02-architecture.md#implémentation-de-la-gateway)).
  Leur contenu est celui déjà exposé publiquement par
  `GET /raffles/:id/result` : aucun identifiant utilisateur n'y figure.

## Conventions

- Authentification par JWT porté par le cookie de session, avec repli sur l'en-tête `Authorization: Bearer` pour les clients qui n'ont pas ce cookie (extension navigateur), sur tous les endpoints hors `/auth/*` et hors endpoints publics explicitement listés (`GET /raffles*`, `GET /streams`, `GET /announcements/active`), et sur la poignée de main WebSocket.
- Rate limiting systématique sur les endpoints sensibles (`heartbeat`, `extension/pairing-token`, `extension/pair`, `shop/purchase`, `scratch-cards/:id/scratch`) et sur les connexions WebSocket, détaillé en [05-security.md](05-security.md).
- Toutes les réponses d'erreur suivent un format uniforme (code, message, correlation_id) pour faciliter le suivi côté cybersécurité et support.
