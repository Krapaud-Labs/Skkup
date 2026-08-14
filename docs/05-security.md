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
serveur de visionnage. Par défaut de sécurité, les sessions
`LECTEUR_EMBARQUE` sont suivies et validées temporellement mais ne créditent
aucun point. L'attribution ne pourra être activée qu'avec une attestation de
plateforme ou un mécanisme équivalent vérifiable côté serveur.

Les ouvertures et heartbeats sont limités par utilisateur et IP. Une session
ne peut être ouverte que pour une chaîne active du catalogue partenaire. Le
client ne choisit pas la source : l'endpoint public force
`LECTEUR_EMBARQUE`. `EXTENSION` sera réservé à une future authentification
d'appariement distincte.

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

- Chiffrement au repos des tokens OAuth Twitch/Google/Facebook stockés en base.
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

- Pas de schéma d'engagement préalable sur la graine : elle est générée et committée dans la même transaction que le résultat. Le dispositif prouve donc la **reproductibilité** du tirage, pas l'impossibilité pour l'exploitant d'avoir choisi la graine a posteriori. Un contestataire ayant accès au serveur ou complice de l'exploitant ne peut pas être réfuté par les seules données publiées.
- Ce risque est accepté pour la V1.0 parce que le tirage n'est déclenchable que par le job planifié (aucun endpoint d'administration de tirage n'existe encore) et parce qu'une demi-mesure serait pire : pré-générer la graine et la stocker en base avant le tirage rendrait le résultat prédictible pour quiconque lit la base, et permettrait à un participant averti d'optimiser ses tickets.
- Contreparties obligatoires, à ne pas contourner : aucune communication publique (site, règlement, page de résultats) ne doit affirmer qu'il est impossible d'arranger un tirage. Le vocabulaire autorisé est « tirage reproductible et vérifiable », pas « tirage prouvé équitable ».
- Cible à implémenter avant l'ouverture des endpoints d'administration de tirage (`POST /admin/raffles/:id/draw`) : engagement public de `SHA-256(graine_exploitant)` dès l'ouverture du tirage, combiné à une source d'entropie publique postérieure et non contrôlée par l'exploitant (par exemple le condensé d'un bloc Bitcoin ou un round drand daté après `dateTirage`), la graine effective étant `SHA-256(graine_exploitant || entropie_publique)`. Révélation de `graine_exploitant` au moment de la publication du résultat.

**Mitigations restant à mettre en place** :

- Séparation des rôles : aucun compte administrateur ne doit pouvoir modifier un tirage après clôture des participations. À traiter avec la carte du back-office (aujourd'hui aucun endpoint d'administration n'existe, le risque n'est donc pas encore ouvert).
- Journal d'audit en écriture seule des exécutions de tirage (qui, quand, quel résultat), à brancher sur le point d'extension `onTirageTermine`.
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
