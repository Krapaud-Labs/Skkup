---
last_updated: 2026-10-18
owner: backend
status: needs-review
---

# Audit des contrats API - 2026-10-18

Statut : `needs-review` — audit documentaire, aucune approbation de contrat.

Périmètre : comparaison en lecture seule de `docs/design/api-contracts.md` avec
les contrôleurs NestJS, DTO, gardes, services et tests backend suivis par Git.
Aucun test n'a été exécuté. Les constats décrivent le code source consulté le
2026-10-18; ils ne décident pas quelles différences constituent des exigences
futures.

## Résumé

Le tableau de `api-contracts.md` contient quatre lignes. Il s'agit d'un
échantillon des interfaces, et non d'un inventaire complet des routes sensibles :
plusieurs chemins et payloads ne correspondent pas aux contrôleurs actuels, et
des familles entières de routes authentifiées ou mutantes n'y figurent pas.

Les conventions communes du document sur le versionnement API, les codes
d'erreur stables, la corrélation, l'idempotence et les limites sont des
assertions documentaires. Elles ne sont pas toutes établies par les sources
actuelles. Cet audit les qualifie de « non prouvées »; il ne les retire pas et
ne détermine pas si elles doivent devenir des exigences futures.

## Revue des quatre lignes

| ID | Route documentée | Source réelle | DTO et validation | Autorisation, erreurs, limites et idempotence | Tests source et verdict |
| --- | --- | --- | --- | --- | --- |
| API-001 | `POST /auth/register` | Alignée : `AuthController.register`, [`auth.controller.ts:52`](../../backend/src/auth/auth.controller.ts#L52). | `RegisterDto` valide email, mot de passe, pseudo et consentement; le `ValidationPipe` global applique whitelist et `forbidNonWhitelisted` ([DTO](../../backend/src/auth/dto/register.dto.ts#L1), [main.ts:43](../../backend/src/main.ts#L43)). | Route publique; réponse `201`, cookie de session et `{ pseudo }`. Limite 5 par heure. Règlement non accepté : `400`; conflit d'unicité : `409`; erreur interne de création masquée. Aucune clé d'idempotence; une répétition après création peut échouer en conflit ([contrôleur](../../backend/src/auth/auth.controller.ts#L52), [service](../../backend/src/auth/auth.service.ts#L30)). | Tests DTO, service (règlement, conflit, erreur interne, hachage) et contrôleur (cookie/réponse) ([register.dto.spec.ts](../../backend/src/auth/dto/register.dto.spec.ts#L15), [auth.service.spec.ts](../../backend/src/auth/auth.service.spec.ts#L66), [auth.controller.spec.ts](../../backend/src/auth/auth.controller.spec.ts#L63)). **Partiellement aligné** : la route et l'accès public correspondent, mais le contrat omet les contraintes, erreurs et limite effectivement appliquées. |
| API-002 | `POST /watch/heartbeats` | Non trouvée. Le heartbeat réel est `POST /watch-sessions/:id/heartbeat`, `WatchSessionsController.heartbeat` ([controller](../../backend/src/watch-sessions/watch-sessions.controller.ts#L26)). | `HeartbeatDto` contient `positionLectureSecondes` et `enLecture`; le jeton est un credential d'en-tête, et aucun champ stream, timestamp ou nonce n'est dans ce DTO ([DTO](../../backend/src/watch-sessions/dto/heartbeat.dto.ts#L1)). | `WatchSessionCredentialGuard` accepte le JWT de session ou le jeton d'extension appariée ([guard](../../backend/src/watch-sessions/watch-session-credential.guard.ts#L18)). Limite 4/minute. La logique renvoie notamment `404`, `403`, `400` ou `409` selon la session, son état, l'intervalle et la concurrence ([service](../../backend/src/watch-sessions/watch-sessions.service.ts#L126), [concurrence](../../backend/src/watch-sessions/watch-sessions.service.ts#L216)). Pas de clé de rejeu idempotente; le verrou optimiste empêche le double traitement concurrent. | Tests source couvrant session inconnue, propriétaire, statut, pause, intervalle, crédit et concurrence ([watch-sessions.service.spec.ts](../../backend/src/watch-sessions/watch-sessions.service.spec.ts#L181), [verrou](../../backend/src/watch-sessions/watch-sessions.service.spec.ts#L430)). **Divergent** : chemin et payload documentés diffèrent; « device token » omet l'authentification web également admise. |
| API-003 | `POST /admin/draws/:id/run` | Le contrôleur expose `POST /admin/raffles/:id/draw`, `AdminRafflesController.tirer` ([controller](../../backend/src/raffles/admin-raffles.controller.ts#L22)). | `DrawRaffleDto` attend `graineExploitant` et `entropiePublique`, pas un `drawId` ni une confirmation ([DTO](../../backend/src/raffles/dto/create-raffle.dto.ts#L72)). | `AdminGuard` impose le rôle admin; limite 5 par heure. Engagement de graine invalide ou tirage déjà clôturé/effectué/non éligible : conflit ([controller](../../backend/src/raffles/admin-raffles.controller.ts#L43), [service](../../backend/src/raffles/raffles.service.ts#L67)). La transition transactionnelle empêche un deuxième tirage; aucun mécanisme de clé d'idempotence ne rejoue la réponse précédente. | La protection contre le double tirage est testée au niveau de l'exécuteur ([raffle-draw.spec.ts:132](../../backend/src/raffles/raffle-draw.spec.ts#L132)). Le test de contrôleur disponible vise le contrôleur public, pas `AdminRafflesController` ([raffles.controller.spec.ts](../../backend/src/raffles/raffles.controller.spec.ts#L7)). **Divergent** : route et payload ne correspondent pas; couverture de la route admin non démontrée par un test de contrôleur. |
| API-004 | `GET /me/dashboard/summary` | Alignée : `MeController.resumeDashboard` ([controller](../../backend/src/me/me.controller.ts#L22)). | Aucun DTO d'entrée pour cette lecture. Le service dérive l'identité du paramètre injecté par le contrôleur et limite les transactions récentes à cinq ([service](../../backend/src/me/me.service.ts#L76)). | `JwtAuthGuard` protège `/me`, mais le contrôleur n'exige pas explicitement `Role.VIEWER`. La stratégie prend le cookie ou un Bearer token ([controller](../../backend/src/me/me.controller.ts#L23), [stratégie](../../backend/src/auth/strategies/jwt.strategy.ts#L15)). Limite par défaut 120/minute. Un utilisateur absent produit `404` ([service](../../backend/src/me/me.service.ts#L116)). GET est sans mutation. | Le service a un test de bornage des données par utilisateur ([me.service.spec.ts:127](../../backend/src/me/me.service.spec.ts#L127)); le test du contrôleur ne couvre pas `resumeDashboard` ([me.controller.spec.ts](../../backend/src/me/me.controller.spec.ts#L14)). **Partiellement aligné** : route et agrégat correspondent, mais le cookie n'est pas le seul credential et le rôle viewer n'est pas imposé par cette garde. |

## Constats détaillés API-001 à API-004 et Notifications

Les constats ci-dessous séparent le texte actuellement documenté, les sources
observées et les preuves disponibles. Les classifications signalent soit une
clarification documentaire, soit une décision réservée au propriétaire, soit
une preuve de test manquante. Elles ne constituent ni une modification du
contrat ni une approbation.

### API-001 — `POST /auth/register`

- **Contrat documenté :** route publique d'inscription recevant email, pseudo,
  mot de passe et consentements; le tableau annonce un compte ou une erreur de
  validation, sans préciser statut HTTP, cookie, forme de réponse, quotas ou
  critères détaillés du DTO (`docs/design/api-contracts.md:11`).
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

- **Contrat documenté :** `POST /watch/heartbeats`, consommateur « extension »,
  payload décrit comme jeton, stream, timestamp et nonce, autorisation
  « device token » (`docs/design/api-contracts.md:12`).
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
- **Classification : choix propriétaire.** Le propriétaire doit décider si le
  contrat décrit la route et le payload actuels ou une cible distincte. La
  couverture de test du service ne prouve pas à elle seule le routage HTTP.

### API-003 — exécution d'un tirage administrateur

- **Contrat documenté :** `POST /admin/draws/:id/run`, entrée `drawId` et
  confirmation, autorisation admin (`docs/design/api-contracts.md:13`).
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
- **Classification : choix propriétaire et preuve manquante.** Le propriétaire
  doit trancher entre route actuelle et route cible; un test de contrôleur
  admin manque pour prouver directement le branchement HTTP et sa garde.

### API-004 — `GET /me/dashboard/summary`

- **Contrat documenté :** l'endpoint viewer est décrit comme utilisant une
  session cookie et un viewer authentifié (`docs/design/api-contracts.md:14`).
- **Comportement source observé :** la route est protégée par `JwtAuthGuard`,
  sans exigence explicite de rôle `VIEWER` sur le contrôleur; la stratégie JWT
  accepte les credentials applicables (cookie de session ou Bearer)
  (`me.controller.ts:23-37`, `jwt.strategy.ts:15-36`). Le résumé appelle le
  service avec l'identité portée par le JWT.
- **Preuves :** garde et route dans
  [`me.controller.ts:23`](../../backend/src/me/me.controller.ts#L23),
  extraction du credential dans
  [`jwt.strategy.ts:15`](../../backend/src/auth/strategies/jwt.strategy.ts#L15).
  Le test de service vérifie le bornage par utilisateur
  ([`me.service.spec.ts:127`](../../backend/src/me/me.service.spec.ts#L127));
  `me.controller.spec.ts` ne teste pas `resumeDashboard` et aucune exigence de
  rôle dédiée n'y est prouvée.
- **Classification : choix propriétaire et preuve manquante.** Le propriétaire
  doit décider si l'accès doit exiger explicitement `Role.VIEWER`; un test de
  contrôleur pour `resumeDashboard` manque.

### Notifications — route existante et proposition ADR

- **Contrat documenté :** le tableau `api-contracts.md` ne recense pas les
  notifications (`docs/design/api-contracts.md:9-14`). L'ADR-011 propose
  `GET /viewer/announcements`, mais présente cette route comme une
  recommandation, pas comme un endpoint réalisé
  (`adr-011-viewer-notifications-announcements-modal-2026-10-18.md:150-173`).
- **Comportement source observé :** `GET /announcements/active` existe,
  applique une limite de 60 requêtes par minute et délègue au service. Celui-ci
  filtre `actif=true`, les dates de début non futures et les dates de fin non
  dépassées (`announcements.controller.ts:22-31`,
  `announcements.service.ts:20-37`).
- **Preuves :** contrôleur et quota dans
  [`announcements.controller.ts:22`](../../backend/src/announcements/announcements.controller.ts#L22);
  filtre temporel dans
  [`announcements.service.ts:20`](../../backend/src/announcements/announcements.service.ts#L20).
  Le test de service vérifie la fenêtre active
  ([`announcements.service.spec.ts:22`](../../backend/src/announcements/announcements.service.spec.ts#L22)).
  L'ADR confirme explicitement que `/viewer/announcements` n'est pas encore
  implémentée (`adr-011-viewer-notifications-announcements-modal-2026-10-18.md:220-225`).
- **Classification : clarification documentaire, choix propriétaire et preuve
  manquante.** Maintenir la distinction entre la route existante et la route
  proposée; toute réalisation ou adoption de cette dernière reste à décider
  par le propriétaire et n'est pas prouvée par le code actuel.

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

## Décisions humaines requises

1. Déterminer si `api-contracts.md` doit devenir un inventaire exhaustif des
   routes sensibles, ou rester un échantillon explicitement présenté comme tel.
2. Déterminer si API-002 et API-003 doivent être corrigées pour refléter les
   routes et payloads présents, ou si les routes documentées décrivent une
   évolution future voulue.
3. Déterminer si le versionnement, les codes d'erreur/corrélation uniformes et
   les clés d'idempotence sont des exigences futures à conserver, ou si le
   contrat doit seulement décrire le comportement actuellement implémenté.
4. Déterminer si les endpoints viewer doivent imposer explicitement
   `Role.VIEWER`, notamment API-004, ou accepter tout compte authentifié.

**Conclusion de revue : `needs-review`. Aucune décision de permission ou de
contrat n'est prise ici; aucune porte `approved` n'est attribuée.**

## Méthode et commandes de vérification

Lecture des sources et tests suivis; aucune commande de test ni aucun appel
réseau n'a été exécuté. Recherches effectuées :

```sh
rg -n "API-001|API-002|API-003|API-004|api-contracts" docs/design
nl -ba docs/design/api-contracts.md | sed -n '1,260p'
rg --files backend/src | rg '(controller|dto|guard|spec)\.ts$'
rg -n "^@Controller|^[[:space:]]+@(Get|Post|Patch|Delete|Put|All)" backend/src --glob '*controller.ts'
rg -n "APP_FILTER|ExceptionFilter|correlation|requestId|VALIDATION_ERROR|RATE_LIMITED|DEPENDENCY_UNAVAILABLE" backend/src
git ls-files docs/design/api-contracts.md backend/src
```

Le dernier `git ls-files` a confirmé le suivi Git du contrat et des sources
backend consultées. Markdownlint n'était pas disponible dans l'environnement;
aucun résultat Markdownlint n'est revendiqué.
