# 05. Sécurité

Ce document liste les menaces identifiées et les mitigations attendues. Il doit être complété et validé par l'agent cybersécurité avant toute implémentation des zones concernées.

## Menaces principales

### 1. Fraude au watch time

**Scénario** : un utilisateur automatise l'envoi de heartbeats (script, extension navigateur) sans réellement regarder le stream, pour accumuler des points et des tickets de tirage.

**Mitigations attendues** :

- Heartbeats signés côté client avec un secret de session à courte durée de vie, non réutilisable.
- Vérification de cohérence temporelle stricte côté serveur (un heartbeat ne peut avancer le compteur que d'un intervalle plausible).
- Corrélation avec l'état réel du lecteur (événements play/pause remontés, pas seulement un minuteur côté client).
- Plafond quotidien de points par utilisateur, quel que soit le nombre de sessions ouvertes.
- Détection de patterns anormaux (heartbeats parfaitement réguliers sur de longues durées, plusieurs comptes partageant les mêmes empreintes d'appareil/IP).

**État du lecteur embarqué YouTube** : les événements `postMessage` sont
contrôlés par origine et fenêtre source, mais restent produits dans un
navigateur contrôlé par l'utilisateur. Ils ne constituent donc pas une preuve
serveur de visionnage. Elles restent donc bornées par les horodatages
serveur, le premier plan et le plafond quotidien, mais peuvent créditer comme
les sessions d'extension lorsque ces garde-fous sont satisfaits.

Les ouvertures et heartbeats sont limités par utilisateur et IP. Une session
peut être ouverte pour toute paire plateforme/identifiant valide. Le
client ne choisit jamais la source : `WatchSessionCredentialGuard`
(`backend/src/watch-sessions/watch-session-credential.guard.ts`) la déduit
du credential qui a authentifié la requête, `LECTEUR_EMBARQUE` pour la
session web (cookie), `EXTENSION` pour un jeton d'extension apparié
(`Authorization: Bearer vrx_...`). Ce choix se fait sur le préfixe du
jeton porteur, jamais sur une déclaration du client : un jeton `vrx_` ne
peut provenir que d'un appariement d'extension valide (vérifié par
`ExtensionAuthGuard`, en base à chaque requête), et un JWT de session web
ne porte jamais ce préfixe. Un en-tête qui ne correspond exactement à
aucune des deux formes (préfixe mal orthographié, espace surnuméraire)
part vers la stratégie JWT, qui le rejette : la garde n'a pas de chemin
par défaut qui autorise. Une garde déléguée qui autoriserait sans avoir
posé `request.user` est également refusée, plutôt que de laisser le
contrôleur travailler sur une source indéfinie. La source déduite est figée dans la
`WatchSession` à sa création et jamais réévaluée ensuite : `heartbeat` lit
uniquement cette valeur stockée pour décider s'il peut créditer des
points, indépendamment du credential qui authentifie l'appel de
heartbeat lui-même. Un jeton d'extension compromis ne peut donc pas faire
créditer une session `LECTEUR_EMBARQUE` déjà ouverte, ni inversement.

**Cumul quotidien borné aux sources créditables** : le barème est appliqué
à un cumul du jour, pas à la seule session courante. Ce cumul n'agrège que
les sessions dont la source crédite (`SOURCES_CREDITABLES` dans
`backend/src/watch-sessions/watch-sessions.service.ts`, aujourd'hui la
seule source `EXTENSION`), et le filtre est posé dans la requête Prisma,
pas après coup. Sans cette borne, le temps du lecteur embarqué (non
crédité, mais seulement déclaré par le navigateur) gonflerait le cumul
servant de base au barème : six heures suivies sur le site, puis une
session ouverte depuis l'extension, auraient encaissé le plafond
quotidien en deux heartbeats. La règle est donc unique : une seconde qui
ne peut pas créditer par elle-même ne peut pas non plus financer le
crédit d'une autre session.

**Credential du heartbeat non contraint à la source de la session** :
une session ouverte avec un credential accepte les heartbeats présentés
avec l'autre (jeton d'extension puis cookie, ou l'inverse), à condition
qu'ils désignent le même utilisateur. C'est sans gain pour un attaquant
(tout ce qu'il obtiendrait ainsi, le jeton d'extension seul le lui donne
déjà, et le crédit suit la source figée à l'ouverture), et aucun client
légitime ne mélange les deux. Exiger la correspondance reste un
durcissement souhaitable si un troisième credential apparaît.

### 2. Comptes multiples

**Scénario** : un même utilisateur crée plusieurs comptes pour multiplier ses tickets de tirage.

**Mitigations attendues** :

- Vérification d'unicité sur les comptes de plateformes liés (un compte Twitch/Google/Facebook ne peut être lié qu'à un seul compte site).
- Empreinte d'appareil et suivi d'IP à des fins anti-fraude uniquement (à documenter dans la politique de confidentialité, conformité RGPD).
- Limitation du nombre de tickets par utilisateur et par tirage si nécessaire.

### 3. Abus des endpoints API

**Mitigations attendues** :

- Rate limiting par utilisateur et par IP sur les endpoints sensibles (`/watch-sessions/:id/heartbeat`, `/raffles/:id/tickets`, `/auth/oauth/*`).
- Validation stricte des entrées (DTOs avec règles de validation NestJS) sur tous les endpoints.
- Journalisation et alerte sur les tentatives répétées d'accès non autorisé aux routes `/admin/*`.

Les signalements anti-fraude sont persistés dans `FraudFlag` avec le compte
concerné, la session éventuelle, un type et un détail interne. Ils ne sont
accessibles qu'à `GET /admin/fraud/flags` et leur statut ne peut être modifié
que par un administrateur. Le détail n'est jamais renvoyé à l'utilisateur
concerné ni aux endpoints publics.

**Adresse cliente derrière le reverse proxy** (`backend/src/common/proxy-de-confiance.ts`) :

En production, le backend ne publie aucun port et n'est joignable qu'à
travers Traefik. Sans réglage, Express prend pour adresse cliente celle
de la socket, c'est-à-dire toujours celle du proxy : toute limitation
indexée sur l'IP devient alors un compteur unique partagé par tous les
visiteurs. Sur une route non authentifiée comme `POST /extension/pair`,
dont le tracker retombe précisément sur l'IP, dix requêtes suffiraient à
épuiser le quota horaire de la plateforme entière et à bloquer tout
appariement.

La variable `TRUSTED_PROXY_HOPS` déclare le nombre de proxys de
confiance (`1` en production, imposé par `docker-compose.prod.yml` ; `0`
par défaut). Un nombre de sauts et jamais `true` : faire confiance à
l'`X-Forwarded-For` entier laisserait un client se fabriquer une IP neuve
à chaque requête et contourner la limite. Une valeur non entière ou
négative fait échouer le démarrage, un repli silencieux sur 0
désactiverait la protection sans bruit.

**Dette connue** : les compteurs de débit vivent dans la mémoire du
processus. Avec un seul conteneur backend, ils sont exacts ; à la
première réplique, chaque instance comptera de son côté et la limite
effective sera multipliée d'autant. Redis est déjà dans la pile, le
basculement du stockage est à faire en même temps que la mise à
l'échelle. Même dette que les compteurs de connexions WebSocket.

### 4. Connexions WebSocket non authentifiées ou abusives

**Scénario** : un client se connecte au canal WebSocket sans authentification valide, écoute les notifications d'un autre utilisateur, ou ouvre un nombre excessif de connexions pour saturer le backend.

**Mitigations en place** (Gateway Socket.io, `backend/src/realtime/`) :

- Poignée de main authentifiée par le même JWT que les appels REST, lu dans le cookie de session, à défaut dans le champ `auth.token` ou l'en-tête `Authorization: Bearer`, jamais dans la query string (elle finirait dans les journaux d'accès du reverse proxy). Token absent, expiré, mal signé ou sans `sub` exploitable : `disconnect(true)` immédiat dans `handleConnection`. Algorithme épinglé sur `HS256`, ce qui ferme la substitution d'algorithme (`alg: none`, confusion HMAC/RSA).
- Aucune room n'est rejointe avant la validation du token : une socket non authentifiée n'appartient qu'à sa room implicite `socket.id`, et toutes les émissions passent par `server.to(room)` sur `user:<id>` ou `raffles`. Il n'existe aucune diffusion globale, donc aucune fuite pendant le court intervalle qui précède la déconnexion.
- Le nom de la room privée est dérivé du `sub` du JWT vérifié côté serveur (`roomUtilisateur`), jamais d'un paramètre client. Aucun `@SubscribeMessage` n'est déclaré : le canal est unidirectionnel serveur vers client, un utilisateur ne dispose donc d'aucun message lui permettant de rejoindre une room ou de déclencher une émission. Il n'y a pas d'IDOR de room possible.
- Plafond de 10 connexions simultanées par utilisateur, contrôlé après authentification.
- Plafond de trame entrante ramené à 8 Ko (`maxHttpBufferSize`) au lieu du défaut de 1 Mo, et poignée de main plafonnée à 10 s (`connectTimeout`) au lieu de 45 s. Engine.io v3 refusé (`allowEIO3: false`).
- Origines de la poignée de main restreintes à `CORS_ORIGINS` ; en l'absence de variable, aucune origine tierce n'est déclarée autorisée. Depuis le passage de la session à un cookie `httpOnly`, l'authentification de la poignée de main est partiellement ambiante pour le client web : ce contrôle d'origine cesse d'être une simple défense en profondeur et devient un contrôle porteur.
- Ce contrôle ne peut pas reposer sur l'option `cors` de Socket.io, qui pose ou omet des en-têtes mais ne refuse jamais la connexion, alors que le navigateur n'applique aucune politique d'origine au transport WebSocket (contrairement au transport polling) : une origine non déclarée qui force `transports: ['websocket']` établissait bien la socket. Le refus est donc explicite, dans `allowRequest` (`poigneeDeMainAutorisee`, `backend/src/realtime/realtime.gateway.ts`), avec exactement la règle du garde HTTP : contrôle déclenché par la présence du cookie de session, comparaison sur l'origine complète, refus si l'`Origin` est absente ou hors de `CORS_ORIGINS`. Sans lui, `SameSite=Lax` fermait le détournement depuis un site tiers mais laissait un sous-domaine same-site (page marketing compromise, préproduction, CNAME abandonné) ouvrir une socket authentifiée par le cookie de la victime et lire sa room privée `user:<id>` (solde de points, série de visite, résultats de tirage) ou saturer son plafond de 10 connexions. Un client porteur (extension navigateur, sans cookie) n'a pas d'authentification ambiante à protéger et passe sans friction.
- Aucune donnée sensible (tokens OAuth, mots de passe, hachages) ne transite par ce canal, uniquement des notifications d'état déjà persistées en base. Le payload `raffle:result`, diffusé à tous les clients connectés dans la room commune `raffles`, ne contient que `lotId` et `ticketId`, jamais d'identifiant utilisateur ni d'email : il est calqué sur `GET /raffles/:id/result`, déjà public.
- Pont Redis `realtime:events` (le worker BullMQ tourne dans un processus sans serveur Socket.io) : tout message reçu est validé avant relais, avec une liste blanche stricte des noms d'événements et un format de room borné (`raffles` ou `user:<25 à 64 caractères alphanumériques>`). Un message illisible ou non conforme est journalisé et ignoré. C'est une défense en profondeur : un accès en écriture à Redis reste de toute façon une compromission complète (injection de jobs BullMQ), le pont ne doit simplement pas l'aggraver en offrant un canal de diffusion arbitraire vers les clients.

**Risques résiduels acceptés en V1.0 (dette explicite)** :

- **Pas de limitation de débit sur les tentatives de connexion**, ni globale ni par IP. L'impact est une consommation de ressources (une vérification HMAC et une socket éphémère par tentative), sans compromission de données ni contournement de contrôle d'accès. Le risque est accepté parce qu'il est strictement du même ordre que celui déjà présent sur les endpoints REST : aucun throttler n'est en place côté API à ce stade (menace 3). Une limitation par IP posée maintenant serait de plus contre-productive : derrière Traefik, toutes les connexions se présentent avec l'adresse du conteneur proxy tant que l'IP client réelle n'est pas dérivée de `X-Forwarded-For` avec une liste de proxys de confiance. Un compteur par IP appliqué à cet état du code dégénérerait en déni de service global auto-infligé.
- **Le compteur de connexions par utilisateur est en mémoire de processus**, donc non répliqué. Avec N instances d'API, le plafond effectif devient 10 x N. Impact limité à la disponibilité, aucun accès élargi.
- **Contrainte de déploiement associée, à ne pas contourner** : le service `backend` reste en instance unique tant que l'adaptateur Redis de Socket.io n'est pas branché. Passer à plusieurs répliques sans cet adaptateur casserait silencieusement les notifications (une émission ne toucherait que les clients connectés à l'instance émettrice) en plus de diluer le plafond de connexions.

**Cibles avant ouverture publique** :

- Throttler global (REST et poignée de main WebSocket), après dérivation fiable de l'IP client derrière Traefik.
- Adaptateur Redis de Socket.io, préalable obligatoire à toute montée en répliques du backend.
- Expiration du JWT non réévaluée pendant la durée de vie d'une socket : une connexion établie survit à l'expiration du token (durée de vie actuelle de 7 jours). À traiter avec le mécanisme de révocation de session, qui n'existe pas encore côté REST non plus.
- Mot de passe Redis (`requirepass`) et publication des ports `redis`/`postgres` restreinte à `127.0.0.1` dans `docker-compose.override.yml`, qui les expose aujourd'hui sur toutes les interfaces de la machine de développement.

### 5. Sécurité des tokens OAuth tiers

**Mitigations attendues** :

- Les credentials OAuth Twitch et Google sont chiffrés au repos avec
  AES-256-GCM et une
  clé de déploiement distincte (`OAUTH_TOKEN_ENCRYPTION_KEY`). Une clé absente
  ou invalide désactive le flux plutôt que de stocker un token en clair.
- L'état OAuth Twitch ou Google est signé, expire après dix minutes et doit
  correspondre
  à un nonce placé dans un cookie `httpOnly`, `SameSite=Lax` et `Secure` en
  production. En production, le préfixe `__Host-` empêche un sous-domaine de
  poser ce cookie pour le domaine parent. L'empreinte du nonce est enregistrée
  côté serveur puis consommée atomiquement par le premier callback valide. Le
  callback refuse donc tout état absent, modifié, expiré ou rejoué.
- Un compte Twitch ou Google déjà lié ne peut pas être rattaché à un autre
  utilisateur.
  Une adresse email locale existante n'est jamais liée automatiquement :
  l'utilisateur doit d'abord ouvrir sa session locale.
- Les tokens OAuth Facebook appliquent le même chiffrement AES-256-GCM avant
  leur persistance. Facebook demande uniquement `email` et `public_profile`.
  Google demande uniquement l'identité et l'accès YouTube en
  lecture seule. Le backend exige un email vérifié et un refresh token avant
  toute liaison. Il refuse aussi le token si Google omet un scope demandé ou
  renvoie une portée supplémentaire, et ne réinclut pas d'anciens droits déjà
  accordés au même client OAuth.
- Rotation et révocation des tokens en cas de déconnexion ou de suppression de compte.
- Scope OAuth minimal demandé à chaque plateforme (principe du moindre privilège).

### 6. Intégrité du tirage au sort

**Scénario** : contestation d'un tirage jugé non équitable.

**Mitigations en place** :

- Algorithme de tirage déterministe à partir d'une graine de 256 bits issue de `crypto.randomBytes` (CSPRNG). `Math.random` est interdit dans toute logique de gain.
- Sélection sans remise avec rejection sampling : pas de biais de modulo, un ticket ne peut pas gagner deux lots.
- Graine journalisée dans `Raffle.graineAleatoire`, publiée uniquement une fois le statut `TIRE` atteint (`404` avant), pour qu'elle ne puisse pas fuiter pendant que les tickets sont encore distribués.
- Liste des participants figée au moment du tirage : empreinte SHA-256 dans `Raffle.empreinteParticipants` et volume dans `Raffle.nombreParticipants`, écrits dans la même transaction que le résultat. La liste ordonnée est publiée après le tirage sur `GET /raffles/:id/participants`. C'est ce qui rend l'audit réellement praticable : avec la seule graine, personne ne peut rejouer le tirage. Tout ajout ou retrait de ticket postérieur à la publication devient détectable.
- Clôture atomique : `updateMany` conditionné au statut `OUVERT` dans la transaction de tirage, plus contrainte unique sur `RaffleWinner.ticketId`. Deux exécutions concurrentes ne peuvent pas tirer deux fois le même tirage.
- Aucune attribution de ticket à un tirage dont la `dateTirage` est dépassée : la liste des participants ne peut pas diverger de l'empreinte publiée du fait d'un gain de carte à gratter arrivant pendant la clôture.
- Aucune donnée personnelle dans les endpoints publics de tirage : pseudo et identifiant de ticket uniquement, jamais d'email ni d'identifiant utilisateur.

**Risque résiduel accepté en V1.0 (dette explicite)** :

- Les tirages administratifs exigent désormais un engagement SHA-256 de la graine dès la création (`Raffle.engagementGraine`). Au déclenchement, l'administrateur fournit la graine secrète et une entropie publique postérieure ; la graine effective est `SHA-256(graine_exploitant || entropie_publique)` et la graine secrète est révélée avec le résultat.
- Ce risque est accepté pour la V1.0 parce que le tirage n'est déclenchable que par le job planifié (aucun endpoint d'administration de tirage n'existe encore) et parce qu'une demi-mesure serait pire : pré-générer la graine et la stocker en base avant le tirage rendrait le résultat prédictible pour quiconque lit la base, et permettrait à un participant averti d'optimiser ses tickets.
- Contreparties obligatoires, à ne pas contourner : aucune communication publique (site, règlement, page de résultats) ne doit affirmer qu'il est impossible d'arranger un tirage. Le vocabulaire autorisé est « tirage reproductible et vérifiable », pas « tirage prouvé équitable ».
- L'entropie publique doit provenir d'une source datée postérieure et non contrôlée par l'exploitant, par exemple un bloc Bitcoin ou un round drand. Sa valeur est conservée dans `Raffle.entropiePublique` pour permettre la vérification indépendante.

**Mitigations restant à mettre en place** :

- Séparation des rôles : aucun compte administrateur ne doit pouvoir modifier un tirage après clôture des participations. À traiter avec la carte du back-office (aujourd'hui aucun endpoint d'administration n'existe, le risque n'est donc pas encore ouvert).
- Journal d'audit en écriture seule des exécutions de tirage (`RaffleDrawAudit`) : administrateur, date, engagement utilisé et empreinte du résultat. Il est écrit après le commit du résultat et aucune route de modification ou suppression n'est exposée.
- Rate limiting sur les endpoints publics de consultation, dont `GET /raffles/:id/participants` qui est paginé et plafonné à 2000 identifiants par page en attendant le throttler global. Même précaution sur `GET /streams`, plafonné à 200 chaînes.

## Session et cookie

**Scénario** : un XSS, sur le site ou via une dépendance frontend
compromise, lit le jeton de session et l'exfiltre. L'attaquant rejoue
alors la session depuis sa propre machine, hors de tout contrôle
d'origine, jusqu'à l'expiration du jeton.

**Décision** : le jeton n'est jamais renvoyé dans le corps d'une réponse
ni stocké côté client. `POST /auth/login` et `POST /auth/register` le
posent dans un cookie `httpOnly`, donc invisible du JavaScript de la
page. Le choix initial d'un stockage en `localStorage`, tranché sans
consultation lors de la conception de la page de connexion, a été annulé
pour cette raison : il exposait la session à tout XSS sans contrepartie
réelle. La conception retenue ici a été validée en amont, avant écriture
du code, avec la revue de sécurité.

**Mitigations en place** (`backend/src/auth/cookie-session.ts`,
`backend/src/common/verification-origine.guard.ts`, `backend/src/main.ts`) :

- `HttpOnly` : un XSS ne peut plus lire ni exfiltrer le jeton. Il peut
  toujours agir depuis l'onglet de la victime, mais l'accès ne survit
  plus à la fermeture de la page.
- **Host-only, sans attribut `Domain`** : le cookie n'est envoyé qu'au
  domaine de l'API. Fixer `Domain` l'aurait diffusé à tous les
  sous-domaines présents et futurs, y compris un CNAME abandonné repris
  par un tiers.
- **Préfixe `__Host-`** (nom `__Host-vr_session`) : le navigateur refuse
  le cookie s'il n'est pas `Secure`, host-only et de portée `/`. Il
  empêche surtout un sous-domaine compromis de poser un cookie de même
  nom sur le domaine parent, qui masquerait la session légitime
  (fixation de session). En développement local, où l'absence de TLS
  interdit `Secure`, le nom retombe sur `vr_session`.
- **`SameSite=Lax`** plutôt que `Strict` : le frontend et l'API sont deux
  sous-domaines du même site enregistrable, donc `Lax` suffit à tous les
  appels de l'application et `None` (qui exposerait le cookie à tout site
  tiers) est inutile. `Strict` a été écarté parce qu'il bloquerait le
  cookie sur la navigation de premier niveau de retour des callbacks
  OAuth (`GET /auth/oauth/:platform/callback`) : la liaison d'un compte
  tiers ne verrait plus l'utilisateur connecté et risquerait de créer un
  second compte, ce qui percute directement la menace 2.
- **`Secure` piloté par `COOKIE_SECURE`**, actif par défaut et désactivé
  uniquement en développement local. Volontairement pas dérivé de
  `NODE_ENV`, qui vaut `production` dans l'image Docker y compris en
  développement et poserait un cookie silencieusement rejeté sur HTTP.
- **`Max-Age` aligné sur l'expiration du JWT** (7 jours) : un cookie qui
  survivrait au jeton donnerait une session que l'interface croit ouverte
  et que l'API refuse.
- **CORS restreint à la liste exacte `CORS_ORIGINS`** avec identifiants
  activés. Jamais de renvoi en miroir de l'`Origin` reçue ni de motif de
  sous-domaine, qui laisseraient un site tiers lire des réponses
  authentifiées. Liste vide, aucune origine n'est acceptée.
- **Vérification d'origine sur les requêtes mutantes** (garde global) :
  `SameSite=Lax` raisonne au niveau du site enregistrable, donc tout
  sous-domaine est considéré same-site et pourrait émettre un `POST`
  accompagné du cookie. Le CORS empêche l'attaquant de lire la réponse,
  pas la requête d'être exécutée : sans ce contrôle, une carte à gratter
  ou un ticket de tirage pourrait être consommé à l'insu de la victime.
  Toute requête `POST`, `PUT`, `PATCH` ou `DELETE` portant le cookie doit
  présenter un `Origin` figurant dans `CORS_ORIGINS`, sinon `403`.
  L'origine absente est refusée, sans repli sur `Referer` (contournable
  par `Referrer-Policy: no-referrer`). Le garde est enregistré en
  `APP_GUARD` dans `AppModule`, donc appliqué à toute route mutante, y
  compris celles ajoutées plus tard : au 14/08/2026 il couvre
  `POST /auth/*`, `POST /watch-sessions*`, `POST /me/daily-checkin` et
  `POST /scratch-cards/:id/scratch`.
- **Même vérification sur la poignée de main WebSocket**, faute de quoi
  la protection s'arrêtait au HTTP alors que le canal temps réel expose
  les mêmes données (voir menace 4).
- Le déclencheur de ce contrôle est la **présence du cookie**, jamais
  l'absence d'en-tête `Authorization` : un attaquant ajouterait sinon un
  en-tête bidon pour désactiver la vérification pendant que le cookie
  authentifie réellement la requête.
- **Repli sur `Authorization: Bearer`** conservé dans la stratégie JWT,
  pour les clients qui n'ont pas ce cookie (extension navigateur, appels
  de test). L'en-tête n'est jamais ambiant : il ne réintroduit pas de
  CSRF. L'ordre est déterministe, cookie prioritaire, pour qu'un en-tête
  injecté en amont ne puisse pas supplanter une session légitime.
- **Corps de réponse minimal** : `{ pseudo }`, information déjà publique
  sur les pages de tirage. Aucun jeton, aucun hash de mot de passe, aucun
  drapeau de rôle exploitable comme décision d'accès.

**Risques résiduels acceptés (dette explicite)** :

- **Pas de révocation de session côté serveur.** `POST /auth/logout`
  efface le cookie, ce qui ferme l'accès depuis le navigateur de
  l'utilisateur, mais le JWT reste cryptographiquement valide jusqu'à
  7 jours : une copie déjà exfiltrée resterait utilisable, et aucun
  mécanisme n'invalide les sessions lors d'un changement de mot de passe
  ou d'une compromission de compte. Le report est accepté parce que le
  passage au cookie `httpOnly` réduit précisément l'exposition qui
  rendait cette révocation urgente. La durée de 7 jours ne doit pas être
  allongée tant que ce manque n'est pas comblé.
- Ce point est à traiter avec l'expiration du JWT non réévaluée pendant
  la vie d'une socket (menace 4) : même carte, même mécanisme. La piste
  la moins coûteuse est un champ `sessionsInvalidesAvant` sur `User`,
  comparé à l'`iat` du jeton, qui révoque toutes les sessions d'un compte
  en une écriture.
- **Pas de jeton anti-CSRF en double soumission.** La vérification
  d'origine couvre le même risque tant que tous les clients légitimes
  envoient un en-tête `Origin` fiable. À reconsidérer si ce n'était plus
  le cas.
- **Pas de limitation de débit sur `/auth/*`**, et `POST /auth/register`
  répond `409` sur un email déjà pris, ce qui permet d'énumérer des
  comptes. À traiter avec le throttler global (menace 3).
- **En développement local uniquement** : le cookie circule en clair et
  les cookies ignorant le port, il est partagé entre `localhost:3000` et
  `localhost:3001`. Acceptable sur une base de développement jetable, à
  condition qu'aucun environnement local ne pointe vers la base de
  production.

## Rôle administrateur et garde d'accès back-office

**Scénario** : le back-office administrateur (gestion des tirages, des
signalements anti-fraude, des annonces) doit rester inaccessible à un
compte viewer ordinaire, et un compte compromis ou un bug ne doit pas
permettre à un utilisateur de s'auto-élever au rôle `ADMIN`.

**Mitigations en place** :

- Champ `role` sur `User` (enum `VIEWER` / `ADMIN`, défaut `VIEWER`,
  `backend/prisma/schema.prisma`). Aucun endpoint n'accepte ni n'expose
  ce champ en écriture : ni `POST /auth/register`, ni aucune route du
  domaine `/me`, ne permettent de le fixer.
- `AdminGuard` (`backend/src/auth/guards/admin.guard.ts`), prévu pour
  être posé directement sur chaque futur contrôleur `/admin/*`. Il étend
  `JwtAuthGuard` (donc authentifie via le même JWT de session web que le
  reste du site, cookie en priorité, en-tête `Authorization` en repli)
  puis relit le rôle en base par l'identifiant du JWT avant d'autoriser
  l'accès. Un compte non authentifié échoue en `401` (hérité de
  `JwtAuthGuard`/Passport) ; un compte authentifié mais non `ADMIN`, ou
  disparu entre l'émission du JWT et la requête, échoue en `403` : les
  deux cas sont distingués, la fuite d'information (existence d'un
  compte valide mais insuffisamment privilégié) est acceptée ici parce
  que la route `/admin/*` elle-même n'est déjà accessible qu'à un
  utilisateur authentifié.
- Le rôle est relu en base à chaque requête plutôt que porté par une
  réclamation (`claim`) du JWT : le jeton vit jusqu'à 7 jours, une
  révocation de droits admin doit prendre effet dès la requête suivante,
  pas attendre l'expiration du jeton.
- `AdminGuard` hérite spécifiquement de `JwtAuthGuard`, jamais de
  `ExtensionAuthGuard` : le jeton opaque de l'extension navigateur
  n'ouvre donc structurellement aucune route `/admin/*`, indépendamment
  du rôle du compte auquel il est apparié. C'est le même principe de
  cloisonnement des deux credentials que celui déjà appliqué entre les
  routes de visionnage de l'extension et les routes de session web (voir
  section suivante) : un jeton conçu pour vivre plusieurs semaines dans
  le stockage d'une extension ne doit jamais suffire à accéder au
  back-office.

- `AdminGuard` ne porte que le contrôle d'accès : la limitation de débit
  reste à déclarer explicitement sur chaque futur contrôleur `/admin/*`
  (`@UseGuards(AdminGuard, ThrottlerGuard)`), `ThrottlerGuard` n'étant
  pas enregistré en garde globale sur ce projet. La protection CSRF, elle,
  est bien globale (`VerificationOrigineGuard` en `APP_GUARD`) et couvre
  donc d'office les futures routes mutantes du back-office.

**Désignation du premier compte administrateur** :

Aucun endpoint HTTP ne permet de promouvoir un compte au rôle `ADMIN`,
y compris pour un compte déjà `ADMIN` (pas de `PATCH
/admin/users/:id/role` en V1.0) : toute route de ce type serait une
cible directe pour une élévation de privilèges (vol de session admin,
CSRF, bug de contrôle d'accès). La désignation passe uniquement par une
commande CLI dédiée, exécutée manuellement par un opérateur disposant
déjà d'un accès direct au serveur ou au conteneur backend :

```bash
docker compose exec backend npm run admin:promote -- utilisateur@example.com
```

(`backend/src/scripts/promouvoir-admin.ts`, compilé avec le reste du
projet puis exécuté via `node dist/src/scripts/promouvoir-admin.js`,
même schéma que le point d'entrée du worker BullMQ). Le script lit
`DATABASE_URL` dans l'environnement du processus, comme `main.ts` et
`worker.ts` (les conteneurs la reçoivent via `env_file: .env`), refuse
de s'exécuter si elle est absente plutôt que de retomber sur les valeurs
par défaut du driver `pg` et d'opérer sur une base non voulue, cherche le
compte par email et met à jour son rôle. Il ne charge délibérément pas
`dotenv` : cette dépendance est de développement et l'image de production
est construite avec `npm ci --omit=dev`, le script échouerait au
démarrage exactement là où il doit servir. Choix retenu plutôt qu'un script de
seed Prisma : un seed s'exécute typiquement à l'initialisation d'un
environnement et suppose de connaître l'email à l'avance ; une commande
CLI peut promouvoir n'importe quel compte existant à tout moment de la
vie du projet, sans étape de seed à rejouer ni état à maintenir en
synchronisation avec les seeds. Cela suppose un accès infrastructure
(SSH sur l'hôte ou `docker exec` dans le conteneur backend) déjà
nécessairement restreint aux opérateurs de confiance, sans quoi
l'intégrité de la base entière est de toute façon compromise : la
commande n'introduit donc pas de surface d'attaque nouvelle par rapport
au niveau de confiance déjà requis pour administrer le déploiement.

## Appariement de l'extension navigateur

**Scénario** : l'extension MV3 ne partage pas le cookie de session du
site (contexte d'exécution distinct). Elle doit donc porter un credential
propre, qui dort plusieurs semaines dans le stockage de l'extension,
lisible par tout logiciel ayant accès au profil du navigateur. Un
credential volé là permettrait de simuler du visionnage, donc de fabriquer
des points et des tickets. Le code d'appariement, lui, transite par un
canal hors ligne (l'utilisateur le recopie) et peut être lu par-dessus
l'épaule ou rester affiché sur un poste partagé.

**Décisions** (`backend/src/extension/`) :

- **Code d'appariement à usage unique**, 12 caractères en alphabet
  Crockford base32, soit 60 bits d'entropie tirés de `randomBytes`.
  L'alphabet exclut I, L, O et U (confusions de lecture), et la
  normalisation rapproche les sosies visuels : la lisibilité ne coûte
  rien à l'entropie, elle évite seulement des rejets de codes valides.
  Comme 32 divise 256, la réduction d'un octet aléatoire modulo 32 reste
  uniforme, sans biais à corriger.
- **Durée de vie de 5 minutes**, un seul code vivant par compte : générer
  un nouveau code supprime le précédent non consommé.
- **Rien n'est stocké en clair** : la base ne garde que l'empreinte
  SHA-256 du code comme du jeton d'accès. Un condensé rapide suffit là où
  un mot de passe exigerait bcrypt : ces secrets sont tirés au sort, il
  n'y a pas de recherche hors ligne possible. Le code en clair n'existe
  que dans la réponse HTTP qui le crée, il n'est jamais réaffichable.
- **Usage unique atomique** : la consommation est un `updateMany` filtré
  sur `consommeAt IS NULL` dont on exige `count === 1`. Tester le champ lu
  juste avant laisserait deux requêtes simultanées obtenir chacune un
  jeton depuis le même code.
- **Jeton d'accès opaque et révocable** plutôt qu'un JWT : 256 bits
  d'aléa, préfixe `vrx_`, vérifié en base à chaque requête. Un JWT signé
  resterait valide jusqu'à son expiration même après un désappariement,
  ce qui est inacceptable pour un credential de 30 jours vivant hors du
  navigateur. Le coût est une lecture indexée par requête, négligeable
  devant les écritures que déclenche déjà un heartbeat.
- **Durée de 30 jours** : plus longue que la session web (7 jours) parce
  que l'extension n'a aucun moyen de redemander une authentification,
  mais bornée. Plafond de 5 appareils appariés par compte, les plus
  anciens étant révoqués au-delà : un partage de compte organisé ne peut
  pas accumuler des jetons valides indéfiniment.
- **Cloisonnement des credentials** : la garde de l'extension refuse tout
  porteur sans le préfixe `vrx_`, et la stratégie JWT ne reconnaît pas un
  jeton opaque. Un jeton d'extension n'ouvre donc pas les routes du site,
  et inversement.
- **Réponses indistinctes** : code inconnu, expiré ou déjà consommé
  donnent le même `401` et le même message. Distinguer ces cas dirait à
  un attaquant qu'un code deviné existe réellement.
- **Limitation de débit** : 5 générations par heure et par compte,
  10 échanges par heure et par adresse IP (`POST /extension/pair` n'étant
  pas authentifiée, le tracker retombe sur l'IP, ce qui suppose la vraie
  IP du client : voir « Adresse cliente derrière le reverse proxy »).
  Cette limite protège surtout la disponibilité : la résistance à la
  devinette vient de l'entropie seule. Avec 60 bits et une fenêtre de
  5 minutes, un attaquant réparti sur un million d'adresses tenterait
  environ 10^6 codes par fenêtre contre 1,15 x 10^18 possibles, soit une
  chance sur mille milliards par code vivant : hors de portée même sans
  limitation de débit.
- **Vérification d'origine** : `POST /extension/pairing-token` porte le
  cookie et reste donc soumise au garde CSRF ; `POST /extension/pair`
  n'envoie pas de cookie et n'a rien à y gagner (le code y est le secret,
  pas une autorité ambiante).

**Désappariement** (`GET /extension/pairings`, `DELETE /extension/pairings/:id`) :

L'endpoint de désappariement qui conditionnait la pose
d'`ExtensionAuthGuard` sur une première route est livré :
`GET /extension/pairings` liste les appareils appariés au compte
(identifiant, dates d'appariement et d'expiration, statut dérivé
`ACTIF`/`EXPIRE`/`REVOQUE`), `DELETE /extension/pairings/:id` révoque
un appareil via `revoqueAt`. Les deux routes exigent la session web,
comme la génération du code : un jeton d'extension ne peut pas se
désapparier lui-même, seul le site peut couper un appareil. La
révocation est un `updateMany` filtré sur `userId` et `revoqueAt IS
NULL`, dans la continuité du reste du module (usage unique atomique) :
révoquer un appareil déjà révoqué reste sans effet plutôt que d'écraser
son horodatage. `userId` conditionne l'écriture elle-même et pas
seulement le contrôle de propriété qui la précède : la lecture de
contrôle ne sert qu'à distinguer `404` de `403`, elle n'est jamais ce
qui autorise la mise à jour (IDOR fermé côté écriture).

`GET /extension/pairings` ne projette que `id`, `createdAt`, `expireAt`
et `revoqueAt` : ni empreinte de jeton, ni adresse IP, ni agent
utilisateur, ces métadonnées n'étant de toute façon pas collectées. Le
statut est calculé côté serveur, jamais accepté du client.

`DELETE /extension/pairings/:id` est limité en débit (30 requêtes par
minute et par compte) : la réponse distingue `404` d'un `403`, ce qui
est sans portée face à des identifiants cuid, mais ne doit pas devenir
un oracle d'existence interrogeable en masse.

Un appareil révoqué perd l'accès immédiatement et non à l'échéance :
`ExtensionAuthGuard` relit `revoqueAt` et `expireAt` en base à chaque
requête, sans cache, et refuse un jeton révoqué avec le même message
qu'un jeton inconnu (aucune distinction de motif exposée à l'appelant).

**Risques résiduels acceptés (dette explicite)** :

- **Pas de révocation automatique au changement de mot de passe.** Le
  désappariement reste manuel : rien ne coupe aujourd'hui les appareils
  appariés lorsqu'un utilisateur change son mot de passe, alors que la
  compromission d'un compte implique celle de ses appareils. Ce n'est
  pas un report de conception mais une dépendance non satisfaite :
  **il n'existe encore aucun endpoint de changement de mot de passe côté
  backend** (seuls `register`, `login` et `logout` existent). Cette
  révocation automatique reste à ajouter dès que ce endpoint sera livré,
  pas avant.
- **Pas de purge planifiée** des codes expirés et des appariements
  échus : sans effet sur la sécurité (ils sont refusés), à traiter avec
  les tâches de maintenance.
- **Aucune trace d'usage par appareil** (pas de `derniereUtilisationAt`,
  volontairement, pour ne pas ajouter une écriture à chaque heartbeat) :
  un appareil compromis ne se repère donc pas à son activité. À
  reconsidérer si un tableau de bord des appareils est ajouté.

## Politique de sécurité du contenu du frontend

La directive CSP `connect-src` du frontend autorise uniquement l'origine du
site, l'origine exacte de l'API et son équivalent WebSocket. Ces deux dernières
origines sont dérivées de `NEXT_PUBLIC_API_URL` dans
`frontend/next.config.ts`. Les autorisations génériques `ws:` et `wss:` sont
interdites afin qu'un script injecté ne puisse pas ouvrir une connexion vers
un serveur arbitraire.

Cette variable est intégrée pendant le build Next.js. L'image frontend de
production doit donc être construite avec l'URL publique réelle de l'API, via
l'argument de build déclaré dans `docker-compose.yml`. Modifier uniquement la
variable au démarrage du conteneur ne met pas la CSP à jour. Une valeur absente
conserve l'origine locale `http://localhost:3001`, ce qui est adapté au
développement mais bloque volontairement les appels à une API distante. Toute
modification du domaine ou du protocole de l'API impose donc une reconstruction
du frontend et une vérification de l'en-tête `Content-Security-Policy` servi.

## Surface de l'extension navigateur (client MV3)

**Scénario** : une extension s'exécute avec des privilèges que la page
n'a pas, détient un credential de 30 jours et injecte du code dans des
pages tierces qu'elle ne contrôle pas. Trois risques distincts :
demander plus de permissions que nécessaire (toute faille de l'extension
devient alors une faille sur Twitch, YouTube et Facebook), laisser le
credential à portée d'un contexte exposé, et traiter le contenu d'une
page tierce comme une donnée de confiance.

**Décisions** (`extension/src/`) :

- **Permissions minimales** : `storage` et `alarms`, plus une seule
  permission d'hôte, l'origine de l'API. Ni `tabs`, ni `webNavigation`,
  ni `history` : l'extension ne voit pas l'historique de navigation, la
  présence au premier plan est observée dans la page elle-même
  (`document.visibilityState` et `document.hasFocus()`, lus depuis le
  monde isolé du script de contenu, donc hors d'atteinte du JavaScript
  de la page). Les trois plateformes ne figurent que dans
  `content_scripts.matches` : en MV3 cela autorise l'injection du script
  et l'accès au DOM, sans accorder l'accès aux cookies (qui exigerait la
  permission `cookies`) ni le droit d'émettre des requêtes
  cross-origin depuis le script de contenu, dont les `fetch` sont soumis
  à la politique CORS de la page depuis Chrome 85. `all_frames: false`
  limite encore l'exécution au document principal. Un test verrouille
  cette liste (`extension/src/manifeste.test.ts`) : l'élargir doit être
  un choix conscient, pas un effet de bord.
- **Manifeste généré au build** depuis l'URL d'API réellement compilée
  dans le bundle : la permission d'hôte ne peut pas diverger de
  l'origine appelée.
- **CSP explicite** : `script-src 'self'; object-src 'self'` pour les
  pages d'extension. C'est la valeur par défaut de MV3, la déclarer ne
  change rien au comportement de Chrome mais rend tout assouplissement
  futur (script distant, `wasm-unsafe-eval`) visible en revue et
  détectable par un test.
- **Jeton dans `chrome.storage.local`** : c'est le seul stockage
  persistant dont dispose une extension MV3 (le service worker n'a pas de
  document, donc pas de `localStorage`, et `storage.session` est vidé à
  la fermeture du navigateur). Il n'est pas chiffré au repos, mais un
  chiffrement applicatif n'apporterait rien : la clé devrait vivre dans
  le même profil, à côté du secret qu'elle protège. La mitigation réelle
  est ailleurs, dans la nature du credential : jeton opaque, révocable,
  borné à 30 jours et à 5 appareils, sans pouvoir sur les routes du site
  (voir « Appariement de l'extension navigateur »). Un jeton expiré est
  effacé à la lecture plutôt que laissé à dormir dans le profil.
- **État de suivi dans `storage.session`** : non écrit sur disque, vidé à
  la fermeture, et inaccessible aux scripts de contenu (niveau d'accès
  `TRUSTED_CONTEXTS` par défaut).
- **Le script de contenu ne voit jamais le jeton** : il observe l'élément
  vidéo et pousse un état, seuls le service worker et la popup lisent le
  dépôt. La séparation est une discipline de code, pas une barrière
  imposée par Chrome (`storage.local` reste lisible depuis un script de
  contenu) : elle vaut donc autant que la revue qui la maintient.
- **Cloisonnement des credentials** : toutes les requêtes de l'extension
  partent en `credentials: "omit"`, pour ne jamais joindre par mégarde
  une session web présente dans le profil.
- **Messages du runtime validés** : le service worker refuse tout message
  dont l'émetteur n'est pas un contexte de cette extension
  (`sender.id !== runtime.id`) et vérifie ensuite la forme du payload
  (plateforme dans la liste connue, identifiant de chaîne non vide et
  borné en longueur, position de lecture finie et positive) avant de s'en
  servir. Le script de contenu vit dans une page tierce et tire une
  partie de ce contenu du balisage de cette page : c'est une entrée non
  fiable, traitée comme un payload d'API.
- **Cadence irrégulière aux deux étages** : voir « Fraude au watch time »
  ci-dessus. Le heartbeat partant au premier signal reçu après l'échéance
  de son délai, la gigue du délai ne suffit pas : la période de signal du
  script de contenu est tirée au sort elle aussi
  (`extension/src/commun/cadence.ts`). Une période fixe ramenait tous les
  heartbeats sur la même grille et produisait un intervalle serveur
  constant, c'est-à-dire exactement le motif que la détection
  d'intervalles identiques invalide : le contrôle anti-fraude se
  retournait contre l'utilisateur légitime.

**Risques résiduels acceptés (dette explicite)** :

- **`streamExternalId` déduit du DOM sur YouTube et Facebook.** L'URL
  d'une page `/watch` ne porte pas l'identifiant de chaîne : il est relevé
  dans le balisage public de la page (microdonnées, lien canonique). Une
  page capable de contrôler ce balisage annoncerait donc une chaîne
  arbitraire. L'impact reste borné parce que le serveur arbitre seul :
  `WatchSessionsService.ouvrir` refuse (403) toute paire
  plateforme/identifiant invalide, la durée créditée est recalculée depuis
  les horodatages du serveur et le plafond quotidien de points s'applique.
- **Un élément `<video>` quelconque de la page suffit à déclencher le
  suivi.** Le détecteur ne connaît volontairement pas les lecteurs des
  trois plateformes : il observe le premier élément vidéo du document.
  Une page qui en insère un discret ferait donc compter du temps sans
  visionnage réel. Même borne que ci-dessus : temps réel dépensé, onglet
  au premier plan, paire plateforme/identifiant valide, plafond quotidien.
- **Le crédit par l'extension est actif** (`WatchSessionCredentialGuard`
  posée sur `POST /watch-sessions/*`, voir menace 1) : les deux risques
  ci-dessus produisent donc désormais un gain réel, borné aux mêmes
  garde-fous serveur (durée recalculée depuis l'horloge serveur, plafond
  quotidien). Le gain reste un temps de visionnage réellement dépensé,
  onglet au premier plan, sur une paire valide.

## Conformité

- RGPD : minimisation des données collectées (empreintes d'appareil, IP) et information claire dans la politique de confidentialité.
- Voir [10-legal-compliance.md](10-legal-compliance.md) pour le cadre juridique du jeu-concours et le lien avec les exigences anti-fraude renforcées.

## Process de merge obligatoire

Avant tout merge d'une pull request sur `dev` ou `main`, quelle que soit la
zone touchée, l'agent cybersécurité doit réaliser les deux vérifications
suivantes et les valider explicitement sur la carte Trello associée :

1. **Audit de sécurité** portant sur le changement proposé :
   - recherche de vulnérabilités OWASP pertinentes pour le code modifié
     (injection, contrôle d'accès, gestion des secrets, désérialisation,
     dépendances vulnérables) ;
   - vérification que les mitigations listées plus haut dans ce document
     (anti-fraude watch time, comptes multiples, rate limiting, intégrité
     du tirage) ne sont pas affaiblies par le changement ;
   - vérification qu'aucun secret (clé API, token, mot de passe) n'est
     introduit en clair dans le code ou la configuration versionnée.
2. **Tests unitaires** : exécution de la suite de tests unitaires du
   périmètre modifié et confirmation qu'elle passe intégralement, en plus
   du passage de la CI (voir [07-ci-cd.md](07-ci-cd.md)). L'agent
   cybersécurité vérifie aussi que les nouveaux comportements sensibles
   (validation de heartbeat, calcul de points, création de ticket, tirage)
   sont couverts par au moins un test, pas seulement que la suite existante
   passe.

Si l'un des deux points échoue, la pull request n'est pas approuvée et le
merge n'a pas lieu, indépendamment du résultat de la CI automatisée : ce
contrôle est un gate humain (agent) en plus du gate automatisé.

## À faire par l'agent cybersécurité avant implémentation

- Revue de ce document et complément des menaces spécifiques identifiées.
- Définition précise des règles de rate limiting (seuils, fenêtres de temps).
- Choix des outils de détection anti-fraude (règles maison ou service tiers).
