---
last_updated: 2026-11-19
owner: backend
status: needs-review
---

# Audit des contrats API - 2026-10-18

Statut : `needs-review` — audit documentaire, aucune approbation de contrat.

Périmètre : comparaison en lecture seule de `docs/design/api-contracts.md` avec
les contrôleurs NestJS, DTO, gardes, services et tests backend suivis par Git.
Les constats API-001 à API-004 et les résultats historiques décrivent le code
consulté le 2026-10-18. La section Notifications a été réactualisée le
2026-10-23 à partir des sources au commit
`4be88699a1c2f3b50830a441359fb91b80b77e75`. Les références aux tests dans
l'inventaire historique désignent des fichiers/cas inspectés, pas des résultats
d'exécution. Les résultats QA frais sont rapportés séparément ci-dessous.

## Résumé

Le tableau de `api-contracts.md` contient quatre contrats API prioritaires et
une ligne ACT-04 Notifications. Il s'agit d'un échantillon des interfaces, et non d'un inventaire complet des routes sensibles;
des familles entières de routes authentifiées ou mutantes n'y figurent pas.
Les divergences initialement relevées pour API-002 et API-003 sont résolues au
niveau du choix owner : les routes et payloads actuels sont retenus et alignés
sur le code source. Pour API-004, le commit owner-authored
[`2cb202ee7028cadf3cd7a99191e09697bd0e5817`](https://github.com/Krapaud-Labs/Skkup/commit/2cb202ee7028cadf3cd7a99191e09697bd0e5817) du 2026-10-29 confirme que
`VIEWER` et `ADMIN` peuvent lire leur propre résumé personnel et supersède,
pour cette seule route, la cible historique `VIEWER` uniquement du
2026-10-18. Le contrôleur n'applique pas de garde de rôle explicite et les
autorisations des routes admin ne changent pas. Pour Notifications,
`GET /viewer/announcements` et `ViewerGuard` sont présents avec des specs
contrôleur/service et un E2E HTTP source. Les specs contrôleur/service figurent
dans le run QA frais de 17 suites/157 tests au SHA `8abb4a44`; l'E2E HTTP source
401/200/403 n'a pas été exécuté dans ce run et mocke le service, donc ne prouve
pas l'intégration avec la base réelle.
Le cycle d'annonce à trois états reste une cible. `GET /announcements/active`
demeure une route publique distincte.

Les conventions communes du document sur le versionnement API, les codes
d'erreur stables, la corrélation, l'idempotence et les limites sont des
assertions documentaires. Elles ne sont pas toutes établies par les sources
actuelles. Cet audit les qualifie de « non prouvées »; il ne les retire pas.
Les décisions owner de route documentées pour API-002 et API-003 sont
consignées séparément ci-dessous; elles ne prouvent pas leur implémentation ni
les tests manquants. La portée de la décision API-004 est consignée sous
ADR-020; les preuves HTTP/CI au SHA de livraison restent ouvertes.

## Revue des contrats prioritaires et de Notifications

| ID | Route documentée | Source réelle | DTO et validation | Autorisation, erreurs, limites et idempotence | Tests source et verdict |
| --- | --- | --- | --- | --- | --- |
| API-001 | `POST /auth/register` | Alignée : `AuthController.register`, [`auth.controller.ts:52`](../../backend/src/auth/auth.controller.ts#L52). | `RegisterDto` valide email, mot de passe, pseudo et consentement; le `ValidationPipe` global applique whitelist et `forbidNonWhitelisted` ([DTO](../../backend/src/auth/dto/register.dto.ts#L1), [main.ts:43](../../backend/src/main.ts#L43)). | Route publique; réponse `201`, cookie de session et `{ pseudo }`. Limite 5 par heure. Règlement non accepté : `400`; conflit d'unicité : `409`; erreur interne de création masquée. Aucune clé d'idempotence; une répétition après création peut échouer en conflit ([contrôleur](../../backend/src/auth/auth.controller.ts#L52), [service](../../backend/src/auth/auth.service.ts#L30)). | Tests DTO, service (règlement, conflit, erreur interne, hachage) et contrôleur (cookie/réponse) ([register.dto.spec.ts](../../backend/src/auth/dto/register.dto.spec.ts#L15), [auth.service.spec.ts](../../backend/src/auth/auth.service.spec.ts#L66), [auth.controller.spec.ts](../../backend/src/auth/auth.controller.spec.ts#L63)). **Partiellement aligné** : la route et l'accès public correspondent, mais le contrat omet les contraintes, erreurs et limite effectivement appliquées. |
| API-002 | `POST /watch-sessions/:id/heartbeat` | Route implémentée : `WatchSessionsController.heartbeat` ([controller](../../backend/src/watch-sessions/watch-sessions.controller.ts#L26)). | DTO retenu et implémenté : `positionLectureSecondes`, `enLecture`; credentials de session/extension acceptés par la garde ([DTO](../../backend/src/watch-sessions/dto/heartbeat.dto.ts#L1), [guard](../../backend/src/watch-sessions/watch-session-credential.guard.ts#L18)). | `WatchSessionCredentialGuard`; limite 4/minute. La logique renvoie notamment `404`, `403`, `400` ou `409` selon la session, son état, l'intervalle et la concurrence ([service](../../backend/src/watch-sessions/watch-sessions.service.ts#L126), [concurrence](../../backend/src/watch-sessions/watch-sessions.service.ts#L216)). Pas de clé de rejeu idempotente; le verrou optimiste empêche le double traitement concurrent. | Tests du service (`watch-sessions.service.spec.ts`) et de la credential guard (`watch-session-credential.guard.spec.ts`) couvrent logique métier et authentification, **pas le contrôleur/la route HTTP** ([service](../../backend/src/watch-sessions/watch-sessions.service.spec.ts#L181), [guard](../../backend/src/watch-sessions/watch-session-credential.guard.spec.ts#L27)). |
| API-003 | `POST /admin/raffles/:id/draw` | Route implémentée : `AdminRafflesController.tirer` ([controller](../../backend/src/raffles/admin-raffles.controller.ts#L22)). | Payload documenté retenu et implémenté : `graineExploitant`, `entropiePublique` ([DTO](../../backend/src/raffles/dto/create-raffle.dto.ts#L72)). | `AdminGuard` impose le rôle admin; limite 5 par heure. Engagement de graine invalide ou tirage déjà clôturé/effectué/non éligible : conflit ([controller](../../backend/src/raffles/admin-raffles.controller.ts#L43), [service](../../backend/src/raffles/raffles.service.ts#L67)). La transition transactionnelle empêche un deuxième tirage; aucun mécanisme de clé d'idempotence ne rejoue la réponse précédente. | Le test `raffle-draw.spec.ts` couvre l'exécuteur métier, **pas `AdminRafflesController` ni sa route admin** ([raffle-draw.spec.ts:132](../../backend/src/raffles/raffle-draw.spec.ts#L132)); aucun test de contrôleur admin n'est recensé. |
| API-004 | `GET /me/dashboard/summary` | Route implémentée : `MeController.resumeDashboard` ([controller](../../backend/src/me/me.controller.ts#L22)). | Aucun DTO d'entrée; le service agrège les données de l'utilisateur identifié ([service](../../backend/src/me/me.service.ts#L76)). | `JwtAuthGuard`, sans garde de rôle explicite; la stratégie accepte cookie ou Bearer. Le commit owner-authored `2cb202ee7028cadf3cd7a99191e09697bd0e5817` et ADR-020 confirment l'accès du rôle `VIEWER` et `ADMIN` à son propre résumé; l'identité reste bornée à l'utilisateur authentifié. Cette décision supersède la cible historique `Role.VIEWER` uniquement du 2026-10-18 pour cette route et ne concerne pas les routes admin. | Le run antérieur au SHA `607ce1f` comprend les tests unitaires `me.service.spec.ts` et `me.controller.spec.ts`, sans preuve HTTP. Le run QA frais au SHA `8abb4a44` n'inclut pas ces specs. Le test E2E source au commit `2cb202ee` modifie le cas ADMIN de 403 à 200 avec identité bornée, mais aucune exécution HTTP/CI au SHA de livraison courant n'est établie. ACT-04/11 restent `needs-review`. |

## Exécution ciblée des tests Backend

Le compte rendu historique de l'exécution ciblée rapporte une réussite depuis
le checkout racine au commit `6b0845cff30061ae539158302c1c6eb0637b2b5e` :
depuis `backend/`, **5 suites, 47 tests réussis et le code de sortie 0**. Le
résultat est conservé comme résultat rapporté et attribué; aucun journal Jest
brut n'est disponible dans les artefacts consultés, il ne constitue donc pas
une preuve brute indépendante d'exécution. Les sources et tests concernés ont
été comparés dans ce compte rendu à `origin/dev` au commit
`7887791f65b4036c211a351e19a9690a9c0e6aab`, sauf
`backend/src/me/me.service.ts` et `backend/src/me/me.service.spec.ts`, exclus
de cette comparaison et de l'exécution. Une comparaison documentaire distincte
des cinq sources/specs nommées avec la base de cette révision
`625807a18b408a2899000f4d002f34fb1045561e` n'a relevé aucun diff. Cela ne
constitue pas une nouvelle exécution. `me.controller.spec.ts` utilise un mock
`MeService`; il ne vérifie pas le comportement du service réel.

```sh
cd backend
npm test -- --runInBand --no-cache --runTestsByPath \
  src/watch-sessions/watch-sessions.service.spec.ts \
  src/watch-sessions/watch-session-credential.guard.spec.ts \
  src/raffles/raffle-draw.spec.ts \
  src/me/me.controller.spec.ts \
  src/announcements/announcements.service.spec.ts
```

Ce résultat concerne uniquement ces tests unitaires ciblés. Il ne constitue
pas une preuve de test HTTP d'intégration, d'application effective des
permissions ou quotas, ni de traçabilité ou persistance de l'audit. Ces
éléments restent à vérifier et le gate design reste `review`. Leur suivi est
rattaché aux actions
[ACT-04/ACT-05/ACT-06](design-traceability-and-open-actions-2026-10-18.md#actions-ouvertes-owners-et-preuves)
du relevé de traçabilité.

Deux tentatives ultérieures, distinctes, depuis le worktree temporaire local
`/private/tmp/skkup-mvp001-20261018` n'ont pas exécuté les tests : la première
s'est arrêtée car Jest était absent; après `npm ci --offline --ignore-scripts`,
la suivante s'est arrêtée au chargement faute de client Prisma généré. Ce chemin
temporaire décrit uniquement cet environnement local et n'est pas un chemin
portable. Ces échecs de préparation ne remplacent ni n'invalident le résultat
historique rapporté depuis le checkout racine.

## Constats détaillés API-001 à API-004 et Notifications

Les constats ci-dessous séparent le texte actuellement documenté, les sources
observées et les preuves disponibles. Les classifications signalent une
clarification documentaire, une décision propriétaire enregistrée ou une
preuve de test manquante. Elles ne constituent ni une modification du contrat
ni une approbation.

### API-001 — `POST /auth/register`

- **Contrat documenté :** route publique d'inscription recevant email, pseudo,
  mot de passe et consentements; le tableau annonce un compte ou une erreur de
  validation, sans préciser statut HTTP, cookie, forme de réponse, quotas ou
  critères détaillés du DTO (`docs/design/api-contracts.md:17`).
- **Comportement source observé :** le contrôleur renvoie `201 Created`, pose
  le cookie de session et retourne `{ pseudo }`; la limite déclarée est de cinq
  requêtes par heure (`auth.controller.ts:52-63`). Le DTO exige notamment un
  mot de passe d'au moins 12 caractères satisfaisant les règles de classes,
  chiffres et caractères spéciaux, ainsi que `accepteReglement: true`
  (`register.dto.ts:4-21`).
- **Preuves :** route, code de statut, cookie et payload dans
  [`auth.controller.ts:52`](../../backend/src/auth/auth.controller.ts#L52);
  contraintes dans [`register.dto.ts:4`](../../backend/src/auth/dto/register.dto.ts#L4);
  politique du mot de passe exercée dans
  [`register.dto.spec.ts:15`](../../backend/src/auth/dto/register.dto.spec.ts#L15);
  cookie d'inscription vérifié dans
  [`auth.controller.spec.ts:72`](../../backend/src/auth/auth.controller.spec.ts#L72).
- **Classification : clarification documentaire.** Le résumé du contrat peut
  être précisé pour rendre visibles ces comportements établis; aucune décision
  de route ou de règle métier n'est déduite ici.

### API-002 — heartbeat de session de visionnage

- **Contrat documenté :** le propriétaire a retenu la route actuelle
  `POST /watch-sessions/:id/heartbeat`, avec credential de session ou
  d'extension, position de lecture et état de lecture
  (`docs/design/api-contracts.md:18`).
- **Comportement source observé :** le contrôleur expose
  `POST /watch-sessions/:id/heartbeat`. `HeartbeatDto` contient
  `positionLectureSecondes` et `enLecture`; la garde accepte la session web
  authentifiée par cookie ou un jeton Bearer d'extension appariée
  (`watch-sessions.controller.ts:21-48`, `heartbeat.dto.ts:3-14`,
  `watch-session-credential.guard.ts:18-57`).
- **Preuves :** chemin et limite de quatre requêtes par minute dans
  [`watch-sessions.controller.ts:26`](../../backend/src/watch-sessions/watch-sessions.controller.ts#L26);
  schéma d'entrée dans
  [`heartbeat.dto.ts:3`](../../backend/src/watch-sessions/dto/heartbeat.dto.ts#L3);
  mécanismes d'authentification dans
  [`watch-session-credential.guard.ts:18`](../../backend/src/watch-sessions/watch-session-credential.guard.ts#L18).
  Les tests du service couvrent notamment l'identité, l'état et la concurrence
  ([`watch-sessions.service.spec.ts:181`](../../backend/src/watch-sessions/watch-sessions.service.spec.ts#L181),
  [`watch-sessions.service.spec.ts:431`](../../backend/src/watch-sessions/watch-sessions.service.spec.ts#L431));
  la garde possède aussi des tests cookie/JWT et jeton d'extension
  ([`watch-session-credential.guard.spec.ts:27`](../../backend/src/watch-sessions/watch-session-credential.guard.spec.ts#L27),
  [`watch-session-credential.guard.spec.ts:42`](../../backend/src/watch-sessions/watch-session-credential.guard.spec.ts#L42));
  aucun test de contrôleur heartbeat n'est recensé dans les fichiers de test
  source observés.
- **Classification : décision propriétaire enregistrée et preuve manquante.**
  Le choix du 2026-10-18 est la route actuelle
  `POST /watch-sessions/:id/heartbeat`. Le code l'expose déjà, mais aucun test
  de contrôleur heartbeat ne prouve directement son routage HTTP; les tests du
  service et de la garde restent des preuves distinctes.

### API-003 — exécution d'un tirage administrateur

- **Contrat documenté :** le propriétaire a retenu la route actuelle
  `POST /admin/raffles/:id/draw`, avec graine d'exploitant et entropie publique
  (`docs/design/api-contracts.md:19`).
- **Comportement source observé :** `AdminRafflesController` expose
  `POST /admin/raffles/:id/draw`, protégé par `AdminGuard`, limité à cinq
  requêtes par heure et prenant `graineExploitant` et `entropiePublique` dans
  `DrawRaffleDto` (`admin-raffles.controller.ts:22-52`,
  `create-raffle.dto.ts:72-80`).
- **Preuves :** route, garde et quota dans
  [`admin-raffles.controller.ts:22`](../../backend/src/raffles/admin-raffles.controller.ts#L22);
  champs et contraintes du DTO dans
  [`create-raffle.dto.ts:72`](../../backend/src/raffles/dto/create-raffle.dto.ts#L72).
  Un test de l'exécuteur de tirage existe
  ([`raffle-draw.spec.ts:132`](../../backend/src/raffles/raffle-draw.spec.ts#L132)),
  mais aucun test de `AdminRafflesController` n'est recensé dans les fichiers
  de test backend observés.
- **Classification : décision propriétaire enregistrée et preuve manquante.**
  Le choix du 2026-10-18 est la route actuelle
  `POST /admin/raffles/:id/draw`. Un test de `AdminRafflesController` manque
  pour prouver directement le branchement HTTP et sa garde; le test de
  l'exécuteur de tirage ne le remplace pas.

### API-004 - `GET /me/dashboard/summary`

- **Contrat documenté :** `docs/04-api-contract.md` décrit l'accès des comptes
  authentifiés `VIEWER` et `ADMIN`; `docs/design/api-contracts.md:20` indique
  `JwtAuthGuard` sans `ViewerGuard` explicite. Le registre ACT-11 reprend
  l'accès aux deux rôles. Le commit owner-authored
  `2cb202ee7028cadf3cd7a99191e09697bd0e5817` retire `ViewerGuard` de cette
  route, met à jour le contrat et change le cas E2E ADMIN de 403 à 200 avec
  vérification de l'identité. Il supersède la cible historique
  `Role.VIEWER` uniquement du 2026-10-18 pour le seul résumé personnel; les
  autorisations des routes admin ne sont pas modifiées.
- **Comportement source observé :** la route est protégée par `JwtAuthGuard`,
  sans exigence explicite de rôle sur le contrôleur; la stratégie JWT accepte
  les credentials applicables (cookie de session ou Bearer)
  (`me.controller.ts:23-37`, `jwt.strategy.ts:15-36`). Le résumé appelle le
  service avec l'identité portée par le JWT.
- **Preuves :** garde et route dans
  [`me.controller.ts:23`](../../backend/src/me/me.controller.ts#L23),
  extraction du credential dans
  [`jwt.strategy.ts:15`](../../backend/src/auth/strategies/jwt.strategy.ts#L15).
  Le run antérieur au SHA `607ce1f` comprend un test de service sur le bornage
  par utilisateur (`me.service.spec.ts:127`) et un test contrôleur de la
  délégation/métadonnées de garde; il ne prouve pas le comportement HTTP ni le
  rôle attendu. Le run frais au SHA `8abb4a44` ne comprend pas les specs `me`.
- **Classification : décision owner établie; preuve HTTP/CI de livraison
  encore requise.** `2cb202ee` contient le test E2E source qui attend `200` pour
  ADMIN et vérifie que le service reçoit uniquement l'identité de cet admin.
  Le run QA frais au SHA de livraison `8abb4a44` ne comprend pas les specs
  `me`; l'existence du test source ne prouve pas son exécution sur le SHA
  livré. ACT-04/11 et le gate global de readiness restent ouverts.

### Notifications — route viewer implémentée, cycle trois états encore cible

- **Comportement source observé :** `GET /viewer/announcements` est implémentée
  avec `ViewerGuard` et une limite de 60 requêtes par minute. Le service trie
  par `(createdAt,id)`, accepte un curseur opaque, limite une page à 50 éléments
  et filtre `actif=true` sans filtre temporel
  ([controller](../../backend/src/announcements/announcements.controller.ts#L35),
  [service](../../backend/src/announcements/announcements.service.ts#L44)).
  `ViewerGuard` exige une session JWT et vérifie le rôle `VIEWER` en base
  ([guard](../../backend/src/auth/guards/viewer.guard.ts#L9)).
- **Tests ciblés exécutés au SHA `8abb4a44` :** les specs contrôleur et service
  figurent dans le run QA frais de 17 suites/157 tests. Le spec contrôleur
  vérifie route, garde et délégation
  ([announcements.controller.spec.ts](../../backend/src/announcements/announcements.controller.spec.ts#L12));
  les specs service couvrent curseur et requête bornée
  ([announcements.service.spec.ts](../../backend/src/announcements/announcements.service.spec.ts#L127)).
  Le rapport QA détaille les commandes et limites.
- **E2E HTTP source non exécuté dans ce run :** il vérifie 401 anonyme, 200
  VIEWER et 403 ADMIN
  ([announcements-viewer.e2e-spec.ts](../../backend/test/announcements-viewer.e2e-spec.ts#L79)).
  Le E2E remplace `AnnouncementsService` par un mock; il ne prouve donc pas le
  chemin HTTP vers Prisma ni le comportement déployé.
- **Limite de modèle :** le code utilise encore le booléen `actif`; il ne
  possède pas les états `DRAFT`, `PUBLISHED` et `ARCHIVED`, ni une action
  explicite de publication. Le cycle trois états reste une cible documentée
  dans [`announcement-lifecycle-2026-10-22.md`](announcement-lifecycle-2026-10-22.md).
  La route publique historique `GET /announcements/active` reste distincte et
  filtre également les dates (`announcements.service.ts:24-41`).
- **Classification :** route, garde, pagination et fichiers de tests sont
  présents; résultat d'exécution, intégration route→service→DB et déploiement
  restent non prouvés. La cible de cycle trois états n'est pas implémentée.

## Cartographie Backend ACT-04 / ACT-07 / ACT-11 et état des preuves

Cette mise à jour rattache les constats API aux relevés de traçabilité ACT-04,
ACT-07 et ACT-11 du 2026-10-18
([registre et preuves](design-traceability-and-open-actions-2026-10-18.md#relevé-act-07---parcours-admin-révocation-erreurs-et-reprise-2026-10-18);
[décisions owner](design-traceability-and-open-actions-2026-10-18.md#décisions-owner-du-2026-10-18---intégration-design)). Elle complète
l'inventaire ci-dessus. Les exécutions fraîches sont consignées dans la section
ci-dessous; elles ne valent pas approbation des ACT ni du gate de conception.

| ACT | Cartographie Backend pertinente | État constaté et limite |
| --- | --- | --- |
| ACT-04 | Routes, DTO, gardes, quotas et fichiers de tests associés à API-001..004 et Notifications, détaillés dans les sections précédentes. | Run ciblé antérieur au HEAD `607ce1f390357dccf74d67734433e0b4b4566e9d`: les specs existantes de `me.service` et `me.controller` passent; le code et les specs de `me.service` sont identiques à `origin/dev`, aucune divergence n'est observée. Le run QA plus récent au SHA `8abb4a44` n'inclut pas les specs `me`. Preuve directe de route HTTP heartbeat et `AdminRafflesController`, application des quotas aux routes produit, chaîne d'audit et persistance restent absentes. Résultats et limites dans les sections datées ci-dessous. |
| ACT-07 | Le tirage admin relie route, `AdminGuard`, DTO et exécuteur; le relevé de parcours demande encore la preuve intégrée route → permission → mutation → audit et les tests de reprise. | Le test de l'exécuteur de tirage ne prouve pas la route HTTP ni la chaîne d'audit. Les autres constats admin du relevé ACT-07 (modération, suspension et révocation) restent hors de la couverture de cet audit des contrats prioritaires. |
| ACT-11 | `Role.VIEWER` est appliqué à `GET /viewer/announcements` via `ViewerGuard`; un E2E HTTP source couvre 401/200/403 avec service mocké. API-004 `/me/dashboard/summary` utilise `JwtAuthGuard` sans garde de rôle explicite; ADR-020 et les documents canoniques confirment `VIEWER` et `ADMIN` limités au résumé personnel; cette décision supersède la cible historique VIEWER-only pour cette route et ne modifie pas les rôles des routes admin. | Notifications: les specs contrôleur/service sont incluses dans le run QA frais de 17 suites/157 tests au SHA `8abb4a44`; l'E2E HTTP source n'a pas été exécuté dans ce run et le service mocké ne prouve pas l'accès DB réel. Cycle trois états et readiness restent ouverts. API-004: le run au SHA de livraison `8abb4a44` ne contient pas les specs `me`; le test E2E source de 2cb202ee n'est pas une preuve d'exécution HTTP/CI au SHA de livraison. ACT-04/11 restent `needs-review`. |

### Vérification ciblée antérieure, 2026-11-19

SHA testé: `607ce1f390357dccf74d67734433e0b4b4566e9d`. Run antérieur au run
QA du SHA `8abb4a44`. Environnement local: Node
v26.10.0, npm 11.19.1, Jest 30.4.1; commandes exécutées depuis `backend/`.

1. `./node_modules/.bin/jest --runInBand --runTestsByPath src/auth/guards/admin.guard.spec.ts src/common/verification-origine.guard.spec.ts src/common/throttler.guards.spec.ts src/auth/auth.password.spec.ts src/auth/strategies/jwt.strategy.spec.ts src/auth/auth.controller.spec.ts src/realtime/realtime.gateway.spec.ts src/me/me.service.spec.ts src/fraud-flags/fraud-flags.service.spec.ts src/admin-users/admin-users.service.spec.ts`
   - 9 suites et 93 tests réussis. La suite `throttler.guards.spec.ts` n'a pas pu ouvrir son serveur local dans le bac à sable (`listen EPERM` sur `0.0.0.0`), donc cette première commande s'est terminée en échec avant ses assertions.
2. `./node_modules/.bin/jest --runInBand --runTestsByPath src/common/throttler.guards.spec.ts`
   - Relance autorisée du seul test bloqué par l'environnement: 1 suite, 3 tests réussis.
3. `./node_modules/.bin/jest --runInBand --runTestsByPath src/me/me.controller.spec.ts src/auth/oauth-token-crypto.spec.ts`
   - 2 suites, 7 tests réussis.

Résultat consolidé sans double comptage: 12 suites, 103 tests passés. La spec
du contrôleur `me` vérifie les métadonnées de `JwtAuthGuard` et la délégation
au service; la spec de service couvre agrégation et périmètre utilisateur.
Les tests de throttling portent sur un contrôleur synthétique de test et ne
prouvent pas les quotas configurés sur API-002/API-003. Les tests de gardes,
révocation, origine, audit, fraude, admin et chiffrement restent unitaires ou
mockés: ils ne démontrent ni chaîne HTTP complète, ni persistance réelle,
rotation de secrets, CSRF complet, configuration déployée, ni révocation
inter-réplique. Les parcours E2E du 2026-11-18 n'ont pas été rejoués. ACT-04,
ACT-05, ACT-07 et ACT-11 restent `needs-review` selon leurs critères respectifs.

### Run QA frais au SHA 8abb4a44, 2026-11-19

SHA testé: `8abb4a446e2e907a02d191910dc50d7074fd1b12`. Environnement: Node
v26.10.0, npm 11.19.1, Jest 30.4.1. Commande exécutée depuis `backend/`:

```sh
./node_modules/.bin/jest --runInBand --runTestsByPath \
  src/auth/auth.service.spec.ts \
  src/auth/dto/register.dto.spec.ts \
  src/auth/guards/viewer.guard.spec.ts \
  src/watch-sessions/watch-sessions.service.spec.ts \
  src/watch-sessions/watch-session-credential.guard.spec.ts \
  src/announcements/announcements.controller.spec.ts \
  src/announcements/announcements.service.spec.ts \
  src/announcements/announcements.module.spec.ts \
  src/extension/extension-auth.guard.spec.ts \
  src/extension/extension.service.spec.ts \
  src/extension/jetons-extension.spec.ts \
  src/raffles/raffles.controller.spec.ts \
  src/raffles/raffles.service.spec.ts \
  src/raffles/dto/create-raffle.dto.spec.ts \
  src/raffles/tirage.spec.ts \
  src/realtime/realtime.bridge.spec.ts \
  src/realtime/realtime.service.spec.ts
```

Résultat: **17 suites et 157 tests réussis**, code 0; aucune relance
environnementale. Le run antérieur au SHA `607ce1f390357dccf74d67734433e0b4b4566e9d`
reste distinct: 12 suites et 103 tests, comprenant alors les specs
`me.service` et `me.controller`. Le run frais ci-dessus ne comprend pas ces
deux specs et ne constitue donc pas une preuve directe pour API-004.

Ces tests sont unitaires ou de contrôleur avec mocks. Ils ne prouvent pas les
routes HTTP réelles heartbeat ou `AdminRaffles`, l'application effective des
quotas/`429`, l'accès PostgreSQL réel ou la persistance transactionnelle des
journaux d'audit, le CSRF ou l'origine sur une configuration déployée, la
rotation ou la provenance du secret manager, ni la révocation d'une socket
active après logout/changement de mot de passe/désactivation avec coordination
inter-réplique. Les tests de notifications vérifient la metadata et la
délégation avec service mocké; les tests de service s'appuient sur Prisma
mocké. Les contrôleurs de tirage testés ne sont pas `AdminRafflesController`.
ACT-04 et ACT-11 restent `needs-review` pour les preuves HTTP/CI et leurs
autres critères ouverts. Ce résultat ne décide pas la permission métier
attendue pour API-004.

### Tests existants, tests non exécutés et gaps de vérification

- **Tests présents dans les sources, inventaire et non résultats d'exécution :**
  API-001 possède des tests DTO, service et contrôleur d'inscription;
  API-002 des tests du service heartbeat et de `WatchSessionCredentialGuard`;
  API-003 un test de l'exécuteur `raffle-draw` et des tests unitaires du
  `AdminGuard`; API-004 un test de l'agrégation dans `me.service`; Notifications
  des specs contrôleur et service ainsi qu'un E2E HTTP source couvrant 401/200/403.
  L'E2E remplace `AnnouncementsService` par un mock; les tests ne prouvent pas
  l'intégration route→service→Prisma. Ces sources ont été repérées/consultées,
  elles ne sont pas réputées passées par cette cartographie.
- **Tentatives ultérieures non exécutées :** deux tentatives depuis le worktree
  temporaire local `/private/tmp/skkup-mvp001-20261018` ont échoué pendant la
  préparation : la première avec `jest: command not found`, code `127`; la
  suivante, après `npm ci --offline --ignore-scripts`, au chargement faute de
  client Prisma généré. Ces deux résultats ne remplacent pas l'exécution
  historique rapportée plus haut. La commande de cette exécution historique est
  conservée dans la section précédente; les commandes exactes et sorties brutes
  des tentatives échouées ne sont pas conservées dans les éléments consultés.
  Le chemin temporaire est propre à l'environnement local, non portable. Aucun
  test de ces tentatives n'a démarré; aucune dépendance n'a été installée pour
  cette cartographie.
- **Gap HTTP / 401 / 403 :** aucun test de contrôleur heartbeat ou
  `AdminRafflesController` n'établit les réponses HTTP, le routage et
  l'application effective des gardes. Les tests unitaires de la credential
  guard et du `AdminGuard` restent des preuves isolées, pas des tests HTTP.
  Pour API-004, ADR-020 autorise les comptes `VIEWER` et `ADMIN` à lire leur
  propre résumé et le contrôleur applique `JwtAuthGuard` sans garde de rôle.
  Le test E2E source au commit `2cb202ee` attend `200` pour ADMIN et vérifie
  l'identité bornée; son existence ne prouve pas une exécution HTTP/CI sur le
  SHA de livraison. Les tests unitaires ne prouvent pas cette intégration.
  Pour Notifications, les sources E2E couvrent les réponses 401/403/200 avec
  service mocké; le comportement DB réel et l'absence de fuite via cette
  intégration restent à vérifier. Les cas d'erreur métier du service
  heartbeat ne démontrent pas à eux seuls les statuts renvoyés par HTTP.
- **Gap rate-limit :** les valeurs `@Throttle` mentionnées plus haut sont des
  constats de code source. Aucun résultat de test ciblé ne confirme leur
  application HTTP, les fenêtres effectives ni la réponse `429` sur ces routes.
- **Gap audit :** les tests unitaires repérés ne démontrent pas, sur une
  requête admin intégrée, la chaîne route → permission → mutation → écriture
  et persistance du journal d'audit, ni les comportements en cas d'échec
  d'écriture. Le relevé ACT-07 maintient cette preuve intégrée ouverte; aucune
  observation runtime n'est revendiquée ici.

## Routes sensibles omises

Les références ci-dessous illustrent des routes présentes dans les contrôleurs
mais absentes du tableau des quatre lignes. Elles ne constituent pas un
inventaire exhaustif de toute l'API.

| Famille | Routes / contrôleurs non recensés |
| --- | --- |
| Authentification | `GET /auth/session`, `POST /auth/login`, `PATCH /auth/password`, `POST /auth/logout` ([auth.controller.ts:45](../../backend/src/auth/auth.controller.ts#L45)). |
| Données et mutations viewer | Routes `/me` pour profil, historique, récompenses, tickets, inscription à un tirage et check-in ([me.controller.ts:29](../../backend/src/me/me.controller.ts#L29)); lecture et grattage de cartes sous `/me/scratch-cards` ([scratch-cards.controller.ts:15](../../backend/src/scratch-cards/scratch-cards.controller.ts#L15)). |
| Annonces | `GET /announcements/active` et routes admin de création, liste, modification, historique, restauration et archivage ([announcements.controller.ts:26](../../backend/src/announcements/announcements.controller.ts#L26)). |
| Extension et visionnage | Appariement, liste et révocation sous `/extension` ([extension.controller.ts:33](../../backend/src/extension/extension.controller.ts#L33)); ouverture et fermeture sous `/watch-sessions`, en plus du heartbeat ([watch-sessions.controller.ts:31](../../backend/src/watch-sessions/watch-sessions.controller.ts#L31)). |
| Administration des tirages | Liste, historique, création et modification sous `/admin/raffles`, en plus du tirage ([admin-raffles.controller.ts:27](../../backend/src/raffles/admin-raffles.controller.ts#L27)). |
| Modération | Liste, détail et mise à jour des signalements sous `/admin/fraud/flags` ([fraud-flags.controller.ts:19](../../backend/src/fraud-flags/fraud-flags.controller.ts#L19)). |
| Autres mutations admin | Statut des utilisateurs ([admin-users.controller.ts:16](../../backend/src/admin-users/admin-users.controller.ts#L16)); lots ([admin-lots.controller.ts:19](../../backend/src/admin-lots/admin-lots.controller.ts#L19)); sponsors ([sponsors.controller.ts:19](../../backend/src/sponsors/sponsors.controller.ts#L19)); contenu et publication ([content.controller.ts:40](../../backend/src/content/content.controller.ts#L40)); récompenses de streams ([streams.controller.ts:30](../../backend/src/streams/streams.controller.ts#L30)). |

## Assertions communes non prouvées

- **Version API :** les conventions mentionnent une API versionnée, mais les
  routes citées dans les contrôleurs sont sans préfixe de version explicite.
- **Codes d'erreur et corrélation :** le document les demande; les sources
  consultées n'établissent pas de format stable commun ni d'identifiant de
  corrélation. Le point d'entrée configure la validation globale, mais la
  recherche source n'a pas trouvé de filtre global d'exception qui prouve ce
  format ([main.ts:43](../../backend/src/main.ts#L43)).
- **Idempotence :** aucune clé d'idempotence par requête n'est démontrée dans
  ces routes. Certaines opérations ont des protections métier contre les
  doubles effets (tirage unique, verrou concurrent du heartbeat), ce qui ne
  prouve pas un contrat générique de rejeu idempotent.
- **Limites :** les exemples ci-dessus montrent des quotas `@Throttle` réels,
  mais leurs valeurs et unités sont absentes du tableau.

Ces constats ne suppriment pas les conventions existantes et ne tranchent pas
si elles sont des exigences futures. Le document doit distinguer les attentes
non confirmées du comportement actuellement établi par le code.

## Décisions reçues et points restant à traiter

1. Le tableau de `api-contracts.md` est maintenu comme échantillon des quatre
   contrats prioritaires; les routes sensibles omises sont signalées séparément
   ci-dessus et le document ne prétend pas être un inventaire exhaustif.
2. Les choix owner du 2026-10-18 retiennent les routes actuelles pour API-002
   (`POST /watch-sessions/:id/heartbeat`) et API-003
   (`POST /admin/raffles/:id/draw`). Leur couverture directe par test de
   contrôleur reste manquante.
3. Les conventions existantes de versionnement, d'erreurs/corrélation et
   d'idempotence restent des exigences documentées; leur réalisation n'est pas
   prouvée par l'audit. Toute révision ultérieure de ces exigences reste une
   décision du propriétaire distincte de l'alignement des routes ci-dessus.
4. `GET /viewer/announcements` est réservé au rôle `VIEWER` par `ViewerGuard`.
   Pour API-004, ADR-020 consigne la décision owner-authored du commit
   `2cb202ee` : `VIEWER` et `ADMIN` peuvent lire leur propre résumé personnel;
   cette décision supersède la cible historique `VIEWER` uniquement du
   2026-10-18, sans modifier les autorisations des routes admin. Les specs
   contrôleur/service Notifications ont passé dans le run QA `8abb4a44` de
   17/157; l'E2E HTTP source 401/200/403 n'a pas été exécuté et mocke le service,
   sans prouver l'intégration DB. Le cycle `DRAFT`/`PUBLISHED`/`ARCHIVED` reste
   une cible non implémentée.

**Conclusion de revue : `needs-review`.** Les choix owner de route API-002 et
API-003 sont consignés séparément du comportement observé. Pour API-004,
ADR-020 et le commit owner-authored `2cb202ee` établissent l'accès du rôle
`VIEWER` et `ADMIN` au seul résumé de sa propre identité; la cible historique
`VIEWER` uniquement du 2026-10-18 est supersédée. Le test E2E source modifié par
ce commit n'est pas une preuve d'exécution au SHA de livraison. Le run QA de
17 suites/157 tests au SHA `8abb4a44` ne comprend pas les specs `me`. ACT-04/11
et la readiness restent ouverts faute de preuve HTTP/CI liée à la livraison et
selon leurs autres critères. Aucun contrat global n'est approuvé par cet audit.

## Méthode et commandes de vérification

Lecture des sources et tests suivis; aucun test backend n'a été exécuté pendant
la présente modification documentaire et aucun appel réseau n'a été effectué.
Les résultats QA des 12 suites/103 tests au SHA `607ce1f` et des 17 suites/157
tests au SHA `8abb4a44` sont attribués et bornés dans les sections précédentes;
le premier run inclut les specs `me`, le second non. Le résultat historique de
5 suites/47 tests est repris comme résultat rapporté, sans journal Jest brut.
Les tentatives ultérieures du worktree temporaire local ont échoué avant
l'exécution ou au chargement et ne le remplacent pas. La comparaison des cinq
sources/specs nommées contre la base `625807a18b408a2899000f4d002f34fb1045561e`
est documentaire, pas un test. `git diff --check` a été exécuté sur les deux
fichiers documentaires modifiés. La tentative initiale de résolution hors ligne
`npm exec --offline --no -- markdownlint-cli2 docs/design/api-contract-audit-2026-10-18.md docs/README.md`
a échoué avec `ENOTCACHED`; cela indique un échec de lookup initial, pas une
absence de l'outil. Après chargement de l'environnement d'outils partagé,
`markdownlint-cli2 docs/design/api-contract-audit-2026-10-18.md docs/README.md`
a réussi avec markdownlint-cli2 v0.23.3 / markdownlint v0.41.1 et 0 issue.
Recherches effectuées :

```sh
rg -n "API-001|API-002|API-003|API-004|api-contracts" docs/design
nl -ba docs/design/api-contracts.md | sed -n '1,260p'
rg --files backend/src | rg '(controller|dto|guard|spec)\.ts$'
rg -n "^@Controller|^[[:space:]]+@(Get|Post|Patch|Delete|Put|All)" backend/src --glob '*controller.ts'
rg -n "APP_FILTER|ExceptionFilter|correlation|requestId|VALIDATION_ERROR|RATE_LIMITED|DEPENDENCY_UNAVAILABLE" backend/src
git ls-files docs/design/api-contracts.md backend/src
```

Le dernier `git ls-files` a confirmé le suivi Git du contrat et des sources
backend consultées. `git diff --check` porte uniquement sur les deux fichiers
documentaires modifiés; Markdownlint a passé sur ces deux fichiers via l'outil
partagé (v0.23.3 / markdownlint v0.41.1, 0 issue). Aucun de ces contrôles ne
valide le contrat API, les permissions ou les tests backend.
