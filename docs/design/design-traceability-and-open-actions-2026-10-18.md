Warning: truncated output (original token count: 27777)
Total output lines: 1026

---
last_updated: 2026-11-19
owner: conception
status: needs-review
---

# Traçabilité de conception et actions ouvertes

Date de la passe : 2026-10-18
Rôle : concepteur
Statut : `needs-review`
Portée : documentation de conception uniquement, sans modification du code, des données, des contrats d'API, du cahier accepté ou du profil.

Ce document relie la vision aux stories, aux parcours, à l'architecture, aux données, aux interfaces et aux preuves disponibles. Il décrit aussi les propriétaires, les actions et les preuves attendues pour les écarts restants. Une preuve locale ou technique ne vaut pas approbation indépendante, juridique ou opérationnelle.

## Sources vérifiées

- `docs/product/vision-and-scope.md`
- `docs/product/user-stories.md`
- `docs/product/user-flows.md`
- `docs/design/architecture.md`
- `docs/archive/design/data-model-superseded-2026-10-23.md`
- `docs/design/api-contracts.md`
- `docs/design/security-design.md`
- `docs/design/design-readiness.md`
- `backend/src/*/` pour les contrôleurs, services et tests présents
- `backend/prisma/schema.prisma` pour les entités et enums présents
- `frontend/src/lib/` et `frontend/e2e/` pour les consommateurs et preuves de parcours
- `extension/src/` pour le manifeste, l'appariement et les heartbeats
- `docs/quality/p0-evidence-matrix.md` et `docs/quality/evidence/` pour les preuves QA archivées

## Légende de fraîcheur des preuves

- **[R18] Référence courante du 2026-10-18** : état documentaire ou preuve
  relue pendant cette passe. Elle peut établir l'existence d'un artefact, mais
  ne remplace pas une validation indépendante de la story.
- **[H09-11] Campagne historique des 2026-10-09 à 2026-10-11** : rapport,
  capture, test ou commit rattaché à une campagne antérieure. Il reste utile
  pour l'historique et la reproductibilité, mais ne constitue pas une preuve
  fraîche du 18 octobre sans relecture.
- **[À produire]** : preuve attendue non disponible ou non suffisante.

## Correspondance stories → actions → preuves et owners

| Story | ACT-IDs associés | Preuve actuelle ou attendue | Owner proposé | Fraîcheur / état |
| --- | --- | --- | --- | --- |
| US-001 | ACT-01, ACT-06, ACT-09 | `docs/product/vision-and-scope.md`; parcours [FLOW-007](../product/user-flows.md#flow-007), contenu public et preuve de provenance média; navigation et légal à rejouer | Produit + QA; Design + Conformité pour les médias | [R18] cadrage; [H09-11] campagnes existantes; [À produire] revue publique complète |
| US-002 | ACT-03, ACT-04, ACT-05, ACT-06 | `backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.password.spec.ts`, `backend/src/auth/session-revocation.service.ts`; formulaire : message positif EN/FR lorsque `motDePasseValide`, tests ciblés frontend 11/11 sans assertion d'absence; DTO inscription : test unitaire de validation réussi, limites de portée ci-dessous | Backend + QA; Sécurité + Conformité | Preuves ciblées partielles; [À produire] relecture indépendante fraîche et décision juridique |
| US-003 | ACT-04, ACT-05, ACT-06, ACT-07 | Sources/specs pairing identiques à `origin/dev`; frontend `CodeAppariement` 1 suite/10 tests Vitest code 0. Les anciens runs backend avec client Prisma absent sont historiques. E2E pairing frais du 2026-11-18 : run `skkup-e2e-extension-pairing-20261118211611-46941-12481`, 1/1, code 0; la preuve et ses limites figurent dans la [matrice P0](../quality/p0-evidence-matrix.md). | Backend + QA; Sécurité | E2E pairing HTTP/PostgreSQL isolé confirmé; révocation et concurrence ne sont pas établies par ce run. Aucun appairage via navigateur, stockage Chrome ou intégration publiée n'est prouvé; US-003/ACT-06 `needs-review`. |
| US-004 | ACT-02, ACT-04, ACT-05, ACT-06, ACT-07 | Frontend watch-sessions Vitest 1 suite/3 tests et hook 1 fichier/5 tests, code 0; E2E HTTP/PostgreSQL heartbeat le 2026-11-19 au HEAD code `fae60bd`: run `skkup-e2e-watch-session-heartbeat-20261119142138-49965-27434`, 2/2 après 12 migrations; le run `d3679cac` du 18 novembre reste historique. Détails et limites dans la [matrice P0](../quality/p0-evidence-matrix.md). | Backend + QA; DevOps + Sécurité | L'E2E frais au SHA code `fae60bd` confirme le parcours HTTP/PostgreSQL ciblé, les refus d'identité, la cohérence de persistance, la concurrence et le plafond quotidien selon ses assertions. Le run complémentaire final recrée app Nest et store avant quota: quatre DTO invalides authentifiés donnent `400`, puis le cinquième `429`; preuve limitée single-process, pas production/multi-instance. L'idempotence stricte d'une requête n'est pas démontrée. Pas de preuve Redis/BullMQ ou d'idempotence exhaustive; ERR-HEARTBEAT « ignorer sans crédit » vs rejets `BadRequestException` restent non réconciliés; US-004/ACT-06 `needs-review`. |
| US-005 | ACT-04, ACT-06, ACT-07 | `backend/src/me/me.controller.ts`, `backend/src/me/me.controller.spec.ts`, `backend/src/me/me.service.spec.ts`, `frontend/src/components/dashboard/HistoriquePointsViewer.test.tsx` (4/4 Vitest/jsdom; composant et spec identiques à `origin/dev`); E2E isolé frais du 2026-11-18 : `daily-checkin`, run `skkup-e2e-daily-checkin-20261118211641-47965-32567`, 1/1, code 0; détails dans la [matrice P0](../quality/p0-evidence-matrix.md). | Backend + QA | Le run frais confirme le parcours E2E ciblé, avec identités/dates synthétiques et notifications Realtime mockées; il ne couvre pas l'UI navigateur. Les types et montants de récompense restent indécis; audit indépendant complet à produire. `needs-review` |
| US-006 | ACT-04, ACT-06, ACT-07, ACT-08 | `backend/src/raffles/admin-raffles.controller.ts` et specs métier; frontend Vitest 2 suites/24 tests code 0; E2E HTTP/PostgreSQL `raffle-admin-draw` au HEAD code `fae60bd` le 2026-11-19, run `skkup-e2e-raffle-admin-draw-20261119142444-56522-27013`, 3/3 après 12 migrations; le run `d3679cac` du 18 novembre reste historique. Détails dans la [matrice P0](../quality/p0-evidence-matrix.md). | Backend + QA; Auditeur | Le run frais prouve permissions, mutation, audit persistant, rejeu et course inscription/fermeture pour ses assertions. La relance complémentaire observe le `429` en single-process et un échec synthétique du trigger d’audit avec rollback; cela ne prouve pas les pannes réelles d’audit, le throttling multi-instance, l’ordre inverse du snapshot, le worker déployé, l’UI ou la CI au SHA testé. Audit indépendant complet à produire; `needs-review`. |
| US-007 | ACT-04, ACT-05, ACT-07 | Décision owner : la réversibilité porte sur la suspension du compte, par réactivation admin; le statut `FraudFlag` est distinct. Parcours [FLOW-008](../product/user-flows.md#flow-008); sources/specs correspondantes et composants/specs `ModerationAdminV3` et `UsersAdminV3` identiques à `origin/dev`; frontend Vitest 2 suites/5 tests code 0; tests Backend ciblés frais au HEAD `55c84793` : fraud-flags + admin-users, 2 suites/4 tests code 0, détails et limites dans la [matrice P0](../quality/p0-evidence-matrix.md#vérification-unitaire-ciblée-act-07--us-007--19-novembre-2026) | Backend + QA; Sécurité + Conformité | La preuve unitaire mockée ajoute les cas service de filtrage, absence, auto-désactivation et désactivation/audit. Aucune preuve intégrée de permission HTTP, persistance, réactivation ou audit PostgreSQL; US-007/ACT-07 restent `needs-review`; US-007 est P1, hors ACT-06 |
| US-008 | ACT-01, ACT-04, ACT-06, ACT-07 | Décision propriétaire du 2026-10-22 et [spécification du cycle](announcement-lifecycle-2026-10-22.md); résultats QA ciblés synthétisés dans la [matrice P0](../quality/p0-evidence-matrix.md#us-008-cycle-des-annonces) | Produit + Backend + QA; Auditeur | Les rapports QA locaux du 2026-10-30 rapportent le cycle en PostgreSQL jetable, huit migrations/deux tests E2E, refus 403 des cinq mutations admin et 14 tests frontend réussis. Les rapports ne sont pas versionnés, aucun SHA source n'est consigné; ces résultats ne peuvent donc être reliés au code de ce checkout ni reproduits à partir d'artefacts présents. CI de livraison, preuve indépendante et preuve de livraison restent non établies; `needs-review` |

| US-009 | ACT-01, ACT-04, ACT-11 | Cahier accepté, story, FLOW-004 et baseline produit mandatée le 2026-11-19 dans `docs/delivery/readiness-decision-request.md`; points pour récompenses garanties seulement, aucun ticket/chance vendu ou échangé en points, participation gratuite par compte majeur/opération | Produit + Backend + QA; juriste avant activation | Qualification juridique du mécanisme, règles des cartes à gratter, implémentation et preuves à produire; `needs-review` |
| US-010 | ACT-01, ACT-04, ACT-07, ACT-11 | Cahier accepté, story, FLOW-005 et baseline produit mandatée le 2026-11-19; cycles lots et contenus explicitement séparés | Produit + Backend + QA | Lots `DRAFT` → `PUBLISHED` → `CLOSED` → `DRAWN` → `ARCHIVED`; contenus `DRAFT` → publication explicite → `ARCHIVED`; permissions, médias, parcours admin et preuves QA restent à produire; `needs-review` |
| US-011 | ACT-01, ACT-03, ACT-11 | Cahier accepté, story, FLOW-006 et baseline produit mandatée le 2026-11-19; données gagnant/support minimisées, aucune publication d'identifiant par défaut | Produit + Data + QA | Délais 7/14 jours; notification après validation journalisée; traitement privé; publication facultative d'un pseudo avec choix distinct. Revue Data/Conformité, procédure de réclamation et preuves restent à produire; `needs-review` |

## Chaîne de traçabilité

| Vision / résultat | Stories | Parcours | Architecture | API / données observées | Preuves attendues | État |
| --- | --- | --- | --- | --- | --- | --- |
| Comprendre le service et ses règles | US-001 | FLOW-007, vitrine, légal et FAQ | Frontend public, contenu publié | `backend/src/content/content.controller.ts`; `ManagedContent`, `ContentVersion` | navigation publique FR/EN, contenu publié, accessibilité et preuve de provenance média | `needs-review` |
| Créer et utiliser un compte majeur | US-002 | FLOW-001, inscription/connexion | `auth` et session cookie | `backend/src/auth/auth.controller.ts`; `User.sessionVersion` et guards de session | succès, validation, doublon, limite, expiration/révocation, permission et preuve juridique de l'âge | `needs-review` |
| Apparier et révoquer l'extension | US-003 | FLOW-001, appariement/reprise | `extension` et stockage du jeton | `backend/src/extension/extension.controller.ts`; `ExtensionPairingToken`, `ExtensionPairing` | code consommé une fois, un seul appareil actif par compte, expiration, révocation, extension Chrome réelle et reprise | `needs-review` |
| Créditer l'activité sans doublon | US-004 | FLOW-001, heartbeat accepté/refusé/plafond | `watch-sessions`, transaction PostgreSQL et ledger | `backend/src/watch-sessions/watch-sessions.controller.ts`; `WatchSession`, `PointsTransaction` | cadence, nonce, idempotence, plafond journalier de 90 points, panne dépendance, cohérence dashboard/ledger | `needs-review` |
| Maintenir le streak et les tickets | US-005 | FLOW-001, check-in, jour manqué et reprise | `me` et transactions métier | `backend/src/me/me.controller.ts`; `PointsTransaction`, `RaffleTicket`, `ScratchCard` | paliers 1/3/7/14/30, reset, bonus unique, solde/historique cohérents | `needs-review` |
| Exécuter un tirage manuel auditable | US-006 | FLOW-002, préparation/exécution/publication | `raffles`, worker et audit | `backend/src/raffles/raffles.controller.ts`, `backend/src/raffles/admin-raffles.controller.ts`; `Raffle`, `RaffleLot`, `RaffleDrawAudit`, `RaffleWinner` | liste figée, CSPRNG, engagement/empreinte, permissions, confirmation, résultat et audit publiable | `needs-review` |
| Examiner et sanctionner un signal fraude | US-007 | FLOW-008, parcours admin de modération et gestion séparée du statut de compte | `fraud-flags`, `admin-users` et audit | `backend/src/fraud-flags/fraud-flags.controller.ts`, `backend/src/admin-users/admin-users.controller.ts`; `FraudFlag`, `ContentAuditEvent`/journal admin | décision humaine proportionnée, permission, CSRF et audit; la suspension du compte est réversible par réactivation admin, sans confondre le statut distinct du `FraudFlag`; notification si applicable | `needs-review` |
| Gérer le cycle des annonces | US-008 | FLOW-003 | annonces admin et projection viewer | [Spécification du cycle DRAFT/PUBLISHED/ARCHIVED](announcement-lifecycle-2026-10-22.md), ADR-011 | Les rapports QA locaux non versionnés rapportent migrations/tests PostgreSQL ciblés et 14 tests frontend, synthétisés dans la [matrice P0](../quality/p0-evidence-matrix.md#us-008-cycle-des-annonces). Sans SHA source ni artefacts durables, leur lien avec ce checkout et leur reproductibilité ne sont pas vérifiables; CI/livraison et revue indépendante restent à établir | `needs-review` |

| Utiliser tickets pour participer aux tirages | US-009 | FLOW-004 | tickets et tirages viewer | `RaffleTicket`, `Raffle`; mécanisme technique scratchcard V1.0 et offre boutique V1.1 distingués | Règles d'octroi, éligibilité, consommation, limites, priorité et preuve QA du parcours restent à établir | `needs-review` |
| Gérer les lots et contenus au back-office | US-010 | FLOW-005 | lots, contenu administrable et permissions admin | Contrats lots/contenus; champs et transitions restent à spécifier | Décision owner puis parcours, permissions et preuve QA à produire | `needs-review` |
| Notifier un gagnant et traiter le support | US-011 | FLOW-006 | résultat du tirage, données minimisées du gagnant, contact support | `RaffleWinner`; minimisation/conservation à examiner au titre d'ACT-03 | Délais acceptés; déclencheur/procédure de réclamation et preuve QA restent à établir | `needs-review` |

### Complément de couverture du cahier accepté — 2026-11-07

Le backlog et l'inventaire des parcours avaient omis des capacités explicites
du cahier. Les lignes suivantes complètent le crosswalk sans ajouter de règle
métier. Elles ne ferment pas ACT-01 ni le critère de readiness.

| Story | ACT-IDs associés | Parcours | Éléments acceptés et inconnues restantes | État |
| --- | --- | --- | --- | --- |
| US-009 — tickets et participation | ACT-01, ACT-04, ACT-11 | FLOW-004 | Baseline produit mandatée le 2026-11-19 : récompenses garanties contre points; aucune chance/ticket vendu ou échangé contre points; une participation gratuite par compte majeur/opération sans achat, dépense de points ou visionnage obligatoire. Qualification juridique, règles détaillées des cartes à gratter, implémentation et preuves restent ouvertes. ACT-06 reste réservé aux stories P0. | `needs-review` |
| US-010 — lots et contenus éditoriaux | ACT-01, ACT-04, ACT-07, ACT-11 | FLOW-005 | Baseline produit mandatée le 2026-11-19 : lot `DRAFT` → `PUBLISHED` → `CLOSED` → `DRAWN` → `ARCHIVED`; contenu éditorial `DRAFT` → publication explicite → `ARCHIVED`. Permissions, provenance média, implémentation et preuves restent ouvertes. | `needs-review` |
| US-011 — notification du gagnant et support | ACT-01, ACT-03, ACT-11 | FLOW-006 | Délais de sept et quatorze jours issus du cahier; baseline mandatée le 2026-11-19 : notification après validation journalisée du résultat, traitement privé, aucun identifiant public par défaut et choix distinct pour publier un pseudo ré-identifiable. Revue Data/Conformité, déclencheur implémenté, contenu et réclamation restent à vérifier. ACT-06 reste réservé aux stories P0; aucune étape admin n'est actuellement spécifiée pour ACT-07. | `needs-review` |

## Ce que le code permet de confirmer

- Les contrôleurs présents couvrent les domaines auth, extension, sessions de visionnage, espace `me`, tirages, contenu, lots, utilisateurs, fraude, annonces, streams et cartes à gratter.
- Le schéma Prisma contient les agrégats `User`, `ExtensionPairing`, `WatchSession`, `PointsTransaction`, `Raffle`, `RaffleLot`, `RaffleTicket`, `RaffleDrawAudit`, `FraudFlag` et le contenu administrable.
- Les tests unitaires et E2E référencés couvrent plusieurs cas ciblés, mais leur existence ne prouve pas à elle seule la couverture complète de chaque chaîne ci-dessus.
- Les contrats d'API sont actualisés selon les décisions owner du 2026-10-18; les routes cibles et les comportements déjà implémentés restent explicitement distingués. La matrice signale les preuves d'implémentation et de test encore à produire.

## Actions ouvertes, owners et preuves

| ID | Point de `design-readiness` | Owner proposé | Action autonome proposée | Preuve attendue | Décision / état |
| --- | --- | --- | --- | --- | --- |
| ACT-01 | MVP/Post-MVP | Produit + Coordinateur | Conserver la matrice vision, roadmap et stories confirmée par l'owner sans changer le cahier accepté; rattacher les capacités au cahier et maintenir en `needs-review` les validations et preuves non établies | matrice de périmètre versionnée; complément US-009..011/FLOW-004..006 relu le 2026-11-07; baseline prudente produit mandatée le 2026-11-19 et consignée dans les sources canoniques | `needs-review`, règles de travail documentées; validations spécialisées et readiness globale restantes |
| ACT-02 | Architecture, exploitation et dépendances | DevOps | Rattacher chaque dépendance à un timeout, retry, healthcheck, alerte et responsable; conserver les contrôles d'architecture et de dépendance MVP | `docs/design/ops-audit-2026-10-18.md`, preuve intermédiaire de configuration locale et gaps ops. Les exercices staging (runbook, alerting, rollback, sauvegarde/restauration) sont suivis post-MVP dans [#422](https://github.com/Krapaud-Labs/Skkup/issues/422), sans être réputés réalisés. | `needs-review`, architecture/dépendances et décisions d'opération MVP encore ouvertes; staging post-MVP |
| ACT-03 | Données, rétention, export, suppression, rollback | Data + Conformité | Valider la matrice de conservation par finalité/catégorie; rapprocher modèles, implémentations, tests et preuves; ne pas inférer de durée universelle | baseline documentaire du 2026-10-18 réconciliée le 2026-11-19; matrice Data/Conformité détaillée, procédure testée et preuve de restauration restent à produire | `needs-review`, principes documentés; décision de durées par catégorie, validation Conformité et preuves restantes |
| ACT-04 | Rapprochement API/code | Backend + QA | Conserver l'inventaire endpoint→contrat→spec et les tests ciblés documentés dans l'audit API, sans confondre les sources correspondantes avec la preuve HTTP complète | `docs/design/api-contract-audit-2026-10-18.md` documente l'inventaire, les runs unitaires et les E2E HTTP/PostgreSQL heartbeat/tirage admin passés au HEAD code `fae60bd` le 2026-11-19 (2/2 et 3/3, 12 migrations par run); les runs `d3679cac` du 18 novembre restent historiques; la décision owner API-004 est enregistrée dans [ADR-020](../delivery/decision-log.md) et référencée ci-dessous. ERR-HEARTBEAT « ignorer sans crédit » reste à réconcilier avec les rejets `BadRequestException`; le `429` heartbeat vérifié en test isolé single-process et le throttling tirage limité au single-process, les cas d'erreur/audit non couverts, la preuve CI au SHA testé et la divergence `me.service` restent ouvertes | `needs-review`, inventaire et preuves ciblées documentés; sémantique heartbeat, gaps et divergence restantes |
| ACT-05 | Sécurité | Sécurité + Conformité | Fournir les preuves de révocation de session, CSRF, limites, gestion des secrets et audit admin; qualifier séparément une sauvegarde/restauration uniquement si une exigence de sécurité spécifique MVP est établie | Audits Backend, indépendant et cybersécurité détaillés dans le relevé ACT-05 ci-dessous; gaps et preuves déployées restent à produire. Les exercices de staging de sauvegarde/restauration relèvent de [#422](https://github.com/Krapaud-Labs/Skkup/issues/422), post-MVP, et ne sont pas réputés réalisés. | `needs-review`, aucune approbation sécurité |
| ACT-06 | Stories P0 | QA + Auditeur | Rejouer US-001 à US-006 story par story, succès et erreurs, avec rattachement exact | relevé QA ACT-06 ci-dessous, matrice P0, commandes et artefacts bruts; verdict indépendant reçu le 2026-10-18, statut `needs-review` | `needs-review`, résultats non entièrement réconciliés |
| ACT-07 | Parcours admin, révocation, erreurs et reprise | UX + Backend + QA | Conserver les règles de parcours admin confirmées et produire les preuves sans ajouter de comportement non prouvé | relevé Backend/auditeur/QA ACT-07 ci-dessous; E2E `raffle-admin-draw` 3/3 au HEAD code `fae60bd` (2026-11-19) couvrant certains scénarios de route, permission, mutation et audit; le run `d3679cac` du 18 novembre reste historique; tests unitaires ciblés fraud-flags/admin-users 2 suites/4 tests PASS au HEAD `55c84793` le 2026-11-19, consignés dans la [matrice P0](../quality/p0-evidence-matrix.md#vérification-unitaire-ciblée-act-07--us-007--19-novembre-2026); reprise, réactivation, échec d'audit et autres parcours admin restent à produire | `needs-review`, règles confirmées; preuves intégrées partielles et critères restants non réconciliés |
| ACT-08 | Direction visuelle et accessibilité | Frontend + Accessibilité + Auditeur | Comparer les 13 références aux rendus, états, clavier, contraste et reduced-motion | [Preuve responsive des navigations Viewer/Admin du 2026-11-07](../quality/evidence/localhost-dashboard-nav-labels-2026-11-07/README.md), acceptée uniquement pour les libellés mono-mot; comparatifs complets, clavier/focus, contraste, zoom, lecteur d'écran, reduced-motion et Notifications/modal restent à produire | `needs-review`, sous-critère navigation ciblée accepté; aucune approbation visuelle globale |
| ACT-09 | Médias | Design + Conformité | Appliquer la traçabilité par média, provenance et droits confirmée comme exigence de conception | relevé Backend/Data et audit indépendant ACT-09 ci-dessous; inventaire fichier/ressource, briefs et autorisations restent à compléter | `needs-review`, exigence confirmée; aucune conclusion juridique |
| ACT-10 | Décisions ouvertes | Coordinateur + owners ci-dessus | Tenir le registre opérationnel ACT-10 ci-dessous, sans inventer dates ni identités d'owners, avec jalon, vérificateur et preuve de sortie | ce registre daté, ses champs obligatoires remplis et une relecture par les owners; la clôture exige une preuve de sortie pour chaque ligne | `needs-review`, décision de gouvernance confirmée; champs et preuves en attente |
| ACT-11 | Marqueurs « à vérifier/à définir » | Responsable produit pour les arbitrages métier; Concepteur pour le registre; Auditeur indépendant pour la relecture | Conserver les décisions reçues hors MVP et rattacher chaque occurrence à sa source, son owner et sa preuve, sans inventer de valeur | [Scan ACT-11 du 2026-11-18](../quality/evidence/act11-marker-scan-2026-11-18/README.md): HEAD `d3679cac`, 90 fichiers/34 occurrences/13 fichiers; worktree non ignoré, 90 fichiers/33 occurrences/13 fichiers; delta -1 occurrence, aucun changement de corpus. Classement indépendant PASS le 2026-11-18, limité aux comptes, occurrences, classifications et liens. Les décisions owners et les preuves de fond restent ouvertes; le rapport du 2026-11-07 demeure historique. Aucune approbation globale | `needs-review`, preuve de scan acceptée dans sa portée limitée; owners/preuves restantes |
| ACT-12 | Traçabilité complète | Concepteur + Auditeur | Relire cette matrice indépendamment et corriger les liens manquants | Revue indépendante du 2026-11-18 : PASS limité aux liens/ancres, statuts ACT-11 et US-003/004, décisions, owners et preuves; les écarts de fond et l…15777 tokens truncated…nte. Les miniatures de
  plateformes et les URLs `imageUrl` doivent être rattachées à la ressource,
  sa date de consultation, son usage et la preuve applicable, sans déduire une
  licence.
- L'audit indépendant confirme les gaps de traçabilité fichier par fichier et
  de couverture des ressources distantes. Les déclarations IA existantes ne
  remplacent ni un brief par asset ni les liens vers les sources éditables.

### Preuves requises et disposition

Fournir un inventaire exhaustif `asset/ressource→fichier ou URL→usage→source→
brief/retouches→preuve`, les liens éditables pour les sources et dérivés, les
déclarations d'IA rattachées à chaque média, ainsi que les éléments propres à
chaque miniature distante et image de lot. Refaire un scan d'orphelins avec une
méthode traçable. Le statut reste `needs-review`; aucune licence, autorisation
ou conclusion juridique n'est déduite.

### Complément de cartographie locale Docker, 2026-10-29

- L’inventaire vérifié du 2026-10-28 comprend 70 médias suivis sous `asset/`, avec taille, format/dimensions et SHA-256 par chemin; les sommes restent une empreinte du fichier local et ne prouvent pas sa provenance ou ses droits.
- Sans cookie, les réponses SSR locales `/`, `/faq`, `/reglement` et `/dashboard` ont référencé `apple-icon.png`, `favicon.ico` et `icon.png`; les trois URL d’asset ont répondu HTTP 200 et leurs SHA-256 servis correspondent aux fichiers locaux.
- La lecture PostgreSQL Docker en transaction `READ ONLY`, filtrée strictement sur les IDs synthétiques `qa_dashv3_%` et `local_demo_%`, n’a trouvé aucun stream, lot, contenu QA ni utilisateur demo. Aucune donnée non synthétique n’a été interrogée. Il n’existe donc pas de média API seedé observable dans cette cible pendant cette passe.
- Cette observation limitée n’est pas une trace navigateur, un dashboard authentifié, une preuve des ressources après hydratation, une collecte d’URL de miniature ou une validation des droits. Briefs/prompts, sources éditables, retouches, provenance individuelle et revue Design/Conformité demeurent à fournir; ACT-09 reste `needs-review`.

## Relevé ACT-12 - audit de traçabilité, 2026-10-18

Une vérification et consolidation documentaire limitée a confirmé la présence
des stories `US-001` à `US-007` dans leur table et des actions `ACT-01` à
`ACT-13` dans le registre, sans modifier les décisions. Ce constat ne remplace
pas la revue indépendante complète. Le [rapport de revue ACT-12](../audits/act-12-independent-traceability-review-2026-10-18.md)
consigne le verdict limité, son périmètre et les critères restant ouverts. Les
actions conservent leur statut `needs-review`. Les lignes README Données,
Contrats et Sécurité indiquent que les documents sont présents mais que la
validation/readiness reste à faire. Aucun statut fermé, `verified` ou `approved`
n'est déduit.

`ACT-10` (gouvernance des décisions ouvertes), `ACT-12` (audit de traçabilité)
et `ACT-13` (approbation globale) sont des actions transversales; elles ne sont
pas rattachées à une seule US. Les noms de fichiers abrégés de la chaîne de
traçabilité restent moins navigables, tandis que la table principale des stories
fournit les chemins complets des preuves citées. Cette limite doit être corrigée
si une navigation directe est requise.

Le statut de la revue reste `needs-review`; la conception reste en `Status:
review` et aucune approbation globale n'est proposée.

### Revue indépendante ACT-12 du crosswalk — 2026-11-07

Verdict indépendant initial : `rework`, limité à la traçabilité. Les écarts relevés
étaient : rattachement erroné d'US-007 P1 à ACT-06; absence d'identifiants
FLOW pour US-001 et US-007; absence d'ACT-11 dans le crosswalk US-010 alors
que FLOW-005 le demande; index incomplet des parcours dotés de diagrammes et
des parcours dont les étapes restent à spécifier. Les corrections locales
apportées le 2026-11-07 sont les identifiants FLOW-007/008 et leurs liens,
l'exclusion explicite d'US-007 d'ACT-06, l'ajout d'ACT-11 à US-010 et la
clarification de l'index des diagrammes. La relecture indépendante après ces
corrections est `accepted` pour le crosswalk, les ancres et l'index, en
vérification statique des sources GFM. Le rendu GitHub live n'a pas été
consulté. Les gaps de preuves QA, accessibilité, médias et décisions owner
restent `needs-review`; ce verdict et ces corrections ne valident pas la
readiness globale.

## Relevé ACT-11 - scan des marqueurs ouverts, 2026-10-18

Ce relevé versionne le classement du scan ACT-11 sans fermer les décisions et
sans transformer une campagne historique en preuve actuelle. Les owners sont le
responsable produit pour les arbitrages métier, le concepteur pour le registre
et l'auditeur indépendant pour la relecture. L'action reste celle d'ACT-11 :
remplacer chaque marqueur par une décision prouvée ou par un `needs-review`
explicite, puis faire relire le classement par le concepteur et l'auditeur.

### Décisions métier ou externes à maintenir en `needs-review`

| Mention | Source probante | Classement | Owner / action attendue |
| --- | --- | --- | --- |
| Nom marketing final des points | `docs/01-features.md:53-57`, notamment la ligne 56 | Décision produit à prendre avec le client; ne pas déduire un nom depuis le code | Produit + Coordinateur; décider et dater le nom avant toute communication finale |
| Paliers, type de récompense, probabilités et expérience des cartes à gratter | `docs/01-features.md:62-75`, notamment les lignes 68-75 | Décision métier et conception à maintenir `needs-review` | Produit + Frontend + Concepteur; fixer règles et preuve d'acceptation |
| Prix et disponibilité effective des récompenses V1.1 | `docs/01-features.md:138-143` | Prix configuré par article dans Admin; montants proposés et disponibilité effective restent à renseigner avant publication | Produit + Admin; renseigner les valeurs par article et dater la disponibilité sans modifier la règle de tarification |
| Calendrier du projet | `docs/README.md:47` | Décision de planification à maintenir `needs-review` | Coordinateur + responsable; fournir calendrier et owner datés |

### Éléments historiques à ne pas interpréter comme actuels

| Mention | Source | Classement | Action attendue |
| --- | --- | --- | --- |
| Scan des marqueurs de code sans `TODO`, `FIXME` ou `HACK` | `docs/code-style-audit.md:1-3,28-35`, audit daté du 2026-09-09 | Preuve historique limitée au périmètre et à la date de l'audit; elle ne clôt pas les marqueurs documentaires ACT-11 actuels | Documentation + Auditeur; conserver l'archive et relancer un scan actuel si une clôture est demandée |
| « à vérifier après intégration » sur la route de modération | `docs/audits/dashboard-v3-admin-independent-visual-audit-2026-10-05-r2.md:64-68` | Mention d'une campagne visuelle historique et d'une branche d'intégration; ne pas la présenter comme état courant | Frontend + QA + Auditeur; revalider sur le HEAD/écran réellement ciblé |

### Précisions session supportées mais encore limitées

| Mention | Sources générales | Précision autorisée | Owner / action restante |
| --- | --- | --- | --- |
| Session expirée / permission dans Notifications/modal | `docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md:107-109`; `backend/src/auth/session-revocation.service.ts`; `backend/src/auth/guards/jwt-auth.guard.ts`; `backend/src/auth/guards/admin.guard.ts`; les rapports QA historiques cités antérieurement ne sont pas livrés sous `docs` | Des sources générales d'authentification/session sont suivies dans le code. Elles ne prouvent pas le comportement du menu/modal après expiration ni le refus sans fuite pour un rôle non viewer; les rapports non livrés restent preuve historique non disponible | QA + Backend + Auditeur; revalider spécifiquement Notifications/modal après expiration et le refus rôle non-viewer, puis produire une preuve indépendante |

### Réconciliation du scan documentaire relancé

Le scan read-only du 2026-10-18 a parcouru le corpus de 90 fichiers Markdown
sous `docs`, hors répertoires `evidence` et `archive`, en recherchant `à
vérifier`, `à planifier`, `à définir`, `TODO`, `FIXME` et `HACK`. Il a trouvé
31 occurrences dans 10 fichiers; le résultat n'inclut pas le code source ni les
autres formats. La portée d'écriture était distincte et limitée à quatre
documents : `docs/README.md`, `docs/08-docker-infra.md`,
`docs/design/api-contract-audit-2026-10-18.md` et ce registre de traçabilité.
Les trois occurrences suivantes sont maintenant rattachées aux actions de
suivi existantes, sans changer leurs décisions ni leurs statuts.

| Occurrence | Classement et lien de suivi |
| --- | --- |
| Vérification expiration/reconnexion du pairing publié, `docs/README.md` | Preuve de release à rejouer; rattachement aux [ACT-06/US-003 et ACT-07](#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18) et au [parcours ACT-07](#relevé-act-07---parcours-admin-révocation-erreurs-et-reprise-2026-10-18). |
| État Dokploy à vérifier, `docs/08-docker-infra.md` | Vérification opérateur production, non effectuée par ce scan; rattachement à la ligne [ACT-02 Ops](#actions-ouvertes-owners-et-preuves). |
| Vérifications HTTP/intégration, permissions, quotas et audit, `docs/design/api-contract-audit-2026-10-18.md` | Au moment du scan documentaire, les preuves étaient classées à produire; depuis, les E2E heartbeat et tirage admin ont passé 2/2 et 3/3 au SHA `fae60bd` pour les assertions listées dans l'audit API et la matrice P0. Le `429` heartbeat est vérifié avec app/store neufs, le `429` tirage est limité au single-process, les autres gaps d'audit et la preuve CI au SHA testé restent à produire; rattachement aux lignes [ACT-04, ACT-05 et ACT-06](#actions-ouvertes-owners-et-preuves). |

### Inventaire occurrence par occurrence du scan relancé

Le tableau classe chaque match du corpus. Lorsqu'une ligne contient plusieurs
termes recherchés, le nombre les distingue; les mentions citées dans les
rapports négatifs et dans la description de la méthode sont classées comme
historiques ou métaréf, pas comme tâches produit supplémentaires.

| Source:ligne | Nombre et contexte relevé | Classement | ACT associé / disposition |
| --- | --- | --- | --- |
| `docs/08-docker-infra.md:148` | 1; titre de vérification de l'état Dokploy | Action déjà attribuée à ACT | ACT-02; contrôle opérateur production encore requis, lien ci-dessus. |
| `docs/README.md:47` | 1; expiration et reconnexion de l'extension publiée | Action déjà attribuée à ACT | ACT-06/US-003 et ACT-07; renvois ajoutés à l'index. |
| `docs/README.md:54` | 1; calendrier roadmap non fixé | Décision owner en attente | ACT-10, avec dépendance de périmètre ACT-01; décision calendrier non inventée. |
| `docs/01-features.md:56` | 1; nom marketing des points | Décision owner en attente | ACT-01/ACT-11; arbitrage produit/client attendu. |
| `docs/01-features.md:72` | 1; règles probabilistes et conception des cartes à gratter | Décision owner en attente | ACT-11; règles/valeurs à décider, impacts visuels à traiter sous ACT-08. |
| `docs/01-features.md:139` | 1; coût du code de réduction | Décision owner en attente | ACT-11; valeur commerciale non décidée. |
| `docs/01-features.md:140` | 1; coût du bon d'achat | Décision owner en attente | ACT-11; valeur commerciale non décidée. |
| `docs/01-features.md:141` | 1; prix du ticket hebdomadaire | Décision owner en attente | ACT-11; valeur commerciale non décidée. |
| `docs/01-features.md:142` | 1; prix du ticket mensuel et valeur évoquée en premier jet | Décision owner en attente | ACT-11; la valeur de premier jet n'est pas une décision. |
| `docs/code-style-audit.md:28` | 3; termes de recherche cités dans le constat historique d'une recherche négative | Mention historique ou négative | ACT-11; ne rapporte pas de marqueurs actifs dans le code actuel. |
| `docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md:128` | 1; session expirée et refus selon permission dans Notifications | Action déjà attribuée à ACT | ACT-04/ACT-06/ACT-11; preuve spécifique modal/session reste à produire. |
| `docs/audits/dashboard-v3-admin-independent-visual-audit-2026-10-05-r2.md:68` | 1; branchement de route dans une preuve visuelle datée | Mention historique ou négative | ACT-08/ACT-11/ACT-12; conserver comme constat historique, revalider le rendu ciblé. |
| `docs/audits/dashboard-v3-assets-accessibility-2026-10-03.md:10` | 1; terme cité dans une recherche négative de placeholders | Mention historique ou négative | ACT-09/ACT-11; résultat d'audit daté, pas une tâche active. |
| `docs/design/design-readiness.md:27` | 3; termes listés comme catégorie de complétude du gate | Métaréf du scan | ACT-11/ACT-13; checklist générale, pas trois nouvelles décisions. |
| `docs/design/api-contract-audit-2026-10-18.md:73` | 1; vérifications HTTP, permissions, quotas et audit non prouvées | Action déjà attribuée à ACT | ACT-04/ACT-05/ACT-06; renvoi ajouté à la matrice d'actions. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:88` | 2; libellés de catégorie dans la ligne de registre ACT-11 | Métaréf du scan | ACT-11; libellés de registre, pas des actions distinctes. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:664` | 3; termes de recherche cités dans la ligne sur l'audit de code du 2026-09-09 | Mention historique ou négative | ACT-11; l'audit ancien est limité à son périmètre et sa date. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:665` | 1; citation du constat de modération du 2026-10-05 | Mention historique ou négative | ACT-08/ACT-11/ACT-12; la source conserve sa date, l'état actuel doit être revalidé. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:677` | 5; termes du motif de recherche cités dans la méthode de scan | Métaréf du scan | ACT-11; documentation méthodologique, pas cinq tâches produit. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:688` | 1; libellé répété pour identifier la mention Dokploy classée | Métaréf du scan | ACT-02/ACT-11; renvoi de classement vers la ligne Ops. |

Total vérifié : 31 occurrences (somme de la colonne nombre), 10 fichiers parmi
90 fichiers Markdown scannés. Aucun match n'est classé comme faux positif sans
contexte; les hits négatifs/historiques et les métaréf restent explicitement
distingués des décisions owner encore ouvertes et des actions attribuées aux
ACT. `docs/README.md` conserve son index, déjà relié aux actions; aucune mise à
jour supplémentaire de l'index n'est nécessaire.

### Recheck ACT-11 du worktree — 2026-11-07

Le scan porte sur le commit de base `e0bdd463197f54d84531ac9017625090554fd02f`
et le worktree courant. Sa méthode, ses exclusions et le classement complet
sont conservés dans le [rapport frais ACT-11](../quality/evidence/act11-marker-scan-2026-11-07/README.md).
La comparaison des comptes par chemin et expression détectée ajoute cinq
occurrences et n'en retire aucune. Elles concernent US-009, trois parcours
FLOW-004..006, et la limite explicitement ouverte du nouveau recheck ACT-08.
Les trois incertitudes métier restent `needs-review`; la limite ACT-08 reste
une preuve globale à produire. Aucun de ces résultats n'est converti en
décision ni en clôture. Les détails complets sont dans le rapport lié.

Le statut global de l'action reste `needs-review`. Le scan ne modifie ni le
cahier, ni le profil, ni les contrats, ni `design-readiness.md`, et ne vaut pas
approbation du `design-gate`.

## Inconnues externes et décisions à ne pas inventer

- L'âge minimum définitif, la conformité du règlement et les durées de conservation nécessitent une décision juridique ou conformité.
- Les alertes, l'astreinte, le rollback applicatif et la restauration complète nécessitent un accès et une exécution ops observables.
- Les conditions d'utilisation des miniatures fournies par les plateformes nécessitent une vérification externe par média et par plateforme.
- Le seuil visuel final et l'acceptation de la fidélité nécessitent un auditeur design indépendant.
- Toute divergence entre les routes du code et les contrats doit être arbitrée par le propriétaire backend; cette matrice ne crée pas de nouveau contrat.

## Demande UX inscription - retrait du succès de validation, 2026-10-18

Le responsable ne souhaite pas le message positif « Password meets the
requirements » (traduction actuelle : « Mot de passe conforme ») dans le
formulaire d'inscription. Le rapport Frontend situe ce message dans
`frontend/src/components/auth/FormulaireAuth.tsx`; les traductions sont en
français et en anglais. QA confirme que les cinq règles et leurs indicateurs,
les erreurs, et le contrôle qui bloque une soumission invalide sont distincts
et doivent être préservés. Aucun test actuel ne vérifie explicitement
l'absence du message quand le mot de passe est valide.

Décision de conception proposée : supprimer seulement le paragraphe positif
dans les deux langues, sans retirer les règles, leurs coches, les erreurs ni
la validation. Après approbation de `design-readiness`, le test ciblé couvrira
FR/EN, l'évolution des cinq règles, l'absence du message positif et le rejet
d'un mot de passe invalide. Aucun code n'est modifié à ce stade, la porte
`DESIGN-FIRST-GATE` restant fermée tant que `design-readiness` est `review`.

## Décisions owner du 2026-10-18 - intégration design

Cette section consigne les décisions reçues du responsable produit/owners. Elle
ne constitue ni une approbation du design-gate, ni une preuve d'implémentation.

| Sujet | ACT / référence | Décision consignée | État de preuve ou action restante |
| --- | --- | --- | --- |
| Périmètre | ACT-01 | La matrice actuelle est confirmée. | La matrice reste à relire avec les preuves indépendantes; ACT-01 reste `needs-review`. |
| Données et rétention | ACT-03 | Conserver une proposition par catégorie sous validation Conformité; aucune durée ni base légale supplémentaire n'est inventée. | Inventaire, procédure testée, validation Conformité et preuve de restauration restent à produire. |
| API-002 | ACT-04 | Documenter l'endpoint réellement implémenté `POST /watch-sessions/:id/heartbeat`. | L'E2E HTTP/PostgreSQL frais au HEAD code `fae60bd` a passé 2/2 après 12 migrations; le run `d3679cac` est historique. Le `429` heartbeat est vérifié avec une app/store neufs;  les autres erreurs métier, la CI au SHA testé et le rattachement du contrat restent ouverts; l'ancien chemin n'est pas présenté comme implémenté. |
| API-003 | ACT-04, ACT-07 | Documenter l'endpoint réellement implémenté `POST /admin/raffles/:id/draw`. | L'E2E `raffle-admin-draw` final au HEAD code `fae60bd` (run `skkup-e2e-raffle-admin-draw-20261119142444-56522-27013`) couvre route, permissions, mutation et audit; la relance quota donne `429` en single-process et l'injection synthétique vérifie rollback de sept champs mutables; le run `d3679cac` est historique. Le `429` tirage reste limité au single-process, les autres pannes d'écriture audit, la CI au SHA testé et les critères ACT-07 restants demeurent ouverts. |
| API-004 | ACT-04, ACT-11 | [ADR-020](../delivery/decision-log.md) consigne la décision owner du commit [`2cb202ee7028cadf3cd7a99191e09697bd0e5817`](https://github.com/Krapaud-Labs/Skkup/commit/2cb202ee7028cadf3cd7a99191e09697bd0e5817) : `VIEWER` et `ADMIN` peuvent lire leur propre résumé via `GET /me/dashboard/summary`; cette portée ne modifie pas les routes admin. | Une preuve HTTP/CI rattachée au SHA de livraison reste à établir. ACT-04/11 et la readiness demeurent `needs-review`; cette décision owner ne vaut pas clôture. Aucun rôle viewer exclusif ni tests 401/403 de rôle ne sont requis par le contrat. |
| Notifications | ACT-04, ACT-07, ACT-08, ACT-10, ACT-11 | `GET /viewer/announcements` existe avec `JwtAuthGuard`, limiteur post-auth et service à curseur (50 éléments). Le service filtre `status=PUBLISHED` sans filtre de dates; le cycle admin crée DRAFT, publie explicitement et archive/restaure avec audit. Le contrat viewer conserve les annonces publiées futures/expirées, exclut les brouillons/archives, recharge à l’ouverture et affiche un modal titre + texte brut sans badge, compteur ni état lu/non lu. Des rapports QA locaux non versionnés rapportent des migrations/tests ciblés; leurs limites de provenance sont consignées dans la matrice P0. | Aucune preuve CI de branche livrée ni preuve reproductible liée au SHA actuel; validation QA/auditeur indépendante reste à établir. La route publique active-only reste distincte. ACT-04/07/08/10/11 conservent leurs statuts de preuve. |
| Parcours admin | ACT-07 | Les règles proposées sont confirmées comme baseline de conception. | L'E2E `raffle-admin-draw` frais au HEAD code `fae60bd` apporte une preuve ciblée route → permission → mutation → audit; le run `d3679cac` est historique. Le `429` heartbeat est vérifié en test isolé avec app/store neufs et le tirage `429` est limité au single-process; les pannes d'audit, la reprise et la révocation restent à produire. |
| Réversibilité US-007 | ACT-07 | Décision owner confirmée : la suspension du compte est réversible par réactivation admin; le statut `FraudFlag` est distinct. | Test intégré de désactivation/réactivation admin, permissions, mutation persistée et audit à produire; ACT-07 reste `needs-review`. |
| Médias | ACT-09 | La traçabilité par média, provenance et droits est confirmée comme exigence de conception. | Inventaire par ressource et revue Conformité restent ouverts; aucune qualification juridique n'est déduite. |
| Valeurs métier hors MVP | ACT-11 | Points, récompenses, probabilités, prix et calendrier restent hors MVP, en attente des owners concernés. | Décisions métier datées et owners explicites restent à consigner; aucune valeur n'est inventée. |
| Gouvernance | ACT-10 | Ne pas inventer de dates ni d'identités d'owners; les champs jalon, vérificateur et critère de sortie restent en attente. | Le registre ACT-10 doit être complété par les owners; `needs-review` est maintenu. |
| Message positif du mot de passe | ACT-07, ACT-08 | Demande owner confirmée : après passage du design-gate uniquement, retirer « Password meets the requirements » / « Mot de passe conforme ». Conserver règles, erreurs, indicateurs et validation bloquante. | Test ciblé FR/EN après le design-gate; aucun code n'est modifié dans cette passe. |

## Décision owner du 2026-10-22 - plateformes de visionnage

Cette décision est consignée à partir du choix reçu du responsable produit le 2026-10-22. Elle fixe la cible MVP; elle ne prouve ni l’intégration ni la validation de readiness.

| Sujet | Référence | Décision consignée | État de preuve ou action restante |
| --- | --- | --- | --- |
| Plateformes de visionnage MVP | ACT-01 | Twitch, YouTube et Kick sont les plateformes visées. | Le manifeste et le parseur de l’extension couvrent Twitch, YouTube et Kick; Facebook reste hors cible. La preuve indépendante et l’approbation globale restent à traiter; ACT-01 et design readiness restent `needs-review`/`review`. |

Le statut de `design-readiness.md` reste `Status: review`; aucune décision
ci-dessus ne ferme un ACT ni ne remplace les preuves Ops, QA, audit indépendant
ou Conformité.

## Règle de sortie

Cette matrice documente la progression mais ne ferme aucune porte. `design-readiness.md` doit rester en `Status: review` jusqu'à réception des preuves indépendantes et des décisions externes requises.
