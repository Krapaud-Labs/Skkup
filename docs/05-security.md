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

**Scénario** : un client se connecte au canal WebSocket sans authentification valide, ou ouvre un nombre excessif de connexions pour saturer le backend.

**Mitigations attendues** :

- Poignée de main WebSocket authentifiée par le même JWT que les appels REST ; toute connexion sans token valide ou expiré est refusée immédiatement.
- Un utilisateur ne peut rejoindre que sa propre room privée, jamais celle d'un autre utilisateur (vérification du `userId` du token contre la room demandée).
- Limitation du nombre de connexions simultanées par utilisateur et par IP, et du taux de reconnexion, pour éviter les tentatives de saturation.
- Aucune donnée sensible (tokens OAuth, mots de passe) n'est jamais transmise via ce canal, uniquement des notifications d'état déjà persistées en base.

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
- Rate limiting sur les endpoints publics de consultation, dont `GET /raffles/:id/participants` qui est paginé et plafonné à 2000 identifiants par page en attendant le throttler global.

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
