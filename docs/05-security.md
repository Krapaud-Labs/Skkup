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

- Poignée de main authentifiée par le même JWT que les appels REST, lu dans le champ `auth.token` ou l'en-tête `Authorization: Bearer`, jamais dans la query string (elle finirait dans les journaux d'accès du reverse proxy). Token absent, expiré, mal signé ou sans `sub` exploitable : `disconnect(true)` immédiat dans `handleConnection`. Algorithme épinglé sur `HS256`, ce qui ferme la substitution d'algorithme (`alg: none`, confusion HMAC/RSA).
- Aucune room n'est rejointe avant la validation du token : une socket non authentifiée n'appartient qu'à sa room implicite `socket.id`, et toutes les émissions passent par `server.to(room)` sur `user:<id>` ou `raffles`. Il n'existe aucune diffusion globale, donc aucune fuite pendant le court intervalle qui précède la déconnexion.
- Le nom de la room privée est dérivé du `sub` du JWT vérifié côté serveur (`roomUtilisateur`), jamais d'un paramètre client. Aucun `@SubscribeMessage` n'est déclaré : le canal est unidirectionnel serveur vers client, un utilisateur ne dispose donc d'aucun message lui permettant de rejoindre une room ou de déclencher une émission. Il n'y a pas d'IDOR de room possible.
- Plafond de 10 connexions simultanées par utilisateur, contrôlé après authentification.
- Plafond de trame entrante ramené à 8 Ko (`maxHttpBufferSize`) au lieu du défaut de 1 Mo, et poignée de main plafonnée à 10 s (`connectTimeout`) au lieu de 45 s. Engine.io v3 refusé (`allowEIO3: false`).
- Origines de la poignée de main restreintes à `CORS_ORIGINS` ; en l'absence de variable, aucune origine tierce n'est déclarée autorisée. À noter que le contrôle d'origine ne protège pas à lui seul un transport WebSocket : ce qui ferme réellement le détournement inter-site ici, c'est que l'authentification repose sur un jeton porté explicitement dans la poignée de main et non sur un cookie ambiant.
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
