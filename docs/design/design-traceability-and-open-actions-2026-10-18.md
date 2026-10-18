---
last_updated: 2026-10-18
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
- `docs/design/data-model.md`
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
| US-001 | ACT-01, ACT-06, ACT-09 | `docs/product/vision-and-scope.md`, contenu public et preuve de provenance média; navigation et légal à rejouer | Produit + QA; Design + Conformité pour les médias | [R18] cadrage; [H09-11] campagnes existantes; [À produire] revue publique complète |
| US-002 | ACT-03, ACT-04, ACT-05, ACT-06 | `backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.password.spec.ts`, `backend/src/auth/session-revocation.service.ts`; formulaire : message positif EN/FR lorsque `motDePasseValide`, tests ciblés frontend 11/11 sans assertion d'absence; DTO inscription : test unitaire de validation réussi, limites de portée ci-dessous | Backend + QA; Sécurité + Conformité | Preuves ciblées partielles; [À produire] relecture indépendante fraîche et décision juridique |
| US-003 | ACT-04, ACT-05, ACT-06, ACT-07 | Sources/specs pairing identiques à `origin/dev`; frontend `CodeAppariement` 1 suite/10 tests Vitest code 0; backend jetons-extension 11 tests réussis, code global 1 car `extension.service` et `extension-auth.guard` n'ont exécuté aucun test faute de client Prisma | Backend + QA; Sécurité | E2E extension non exécutés; aucun appairage réel, HTTP ou expiration/révocation persistée; US-003/ACT-06 `needs-review` |
| US-004 | ACT-02, ACT-04, ACT-05, ACT-06, ACT-07 | Backend sessions/heartbeats, specs, DTO et client frontend `watch-sessions` identiques à `origin/dev`; frontend watch-sessions Vitest 1 suite/3 tests code 0; aucun test `useSessionVisionnage` inventorié; backend service + credential.guard code 1 au chargement, 0 test faute de client Prisma | Backend + QA; DevOps + Sécurité | Aucune preuve de heartbeat HTTP, persistance, idempotence DB ou Redis/BullMQ; US-004/ACT-06 `needs-review` |
| US-005 | ACT-04, ACT-06, ACT-07 | `backend/src/me/me.controller.ts`, `backend/src/me/me.controller.spec.ts`, `backend/src/me/me.service.spec.ts`, `frontend/src/components/dashboard/HistoriquePointsViewer.test.tsx` (4/4 Vitest/jsdom; composant et spec identiques à `origin/dev`) | Backend + QA | Preuve unitaire ciblée uniquement; aucune preuve E2E, API ou persistance; [À produire] matrice indépendante complète |
| US-006 | ACT-04, ACT-06, ACT-07, ACT-08 | `backend/src/raffles/admin-raffles.controller.ts`, `backend/src/raffles/raffles.controller.spec.ts`, `backend/src/raffles/raffle-draw.spec.ts`; frontend Vitest 2 suites/24 tests code 0, sources/specs correspondants identiques à `origin/dev`; backend tirage 16 tests réussis, trois suites sans test exécuté faute de client Prisma généré | Backend + QA; Auditeur | Preuves unitaires limitées, sans preuve navigateur, HTTP réel, permission, persistance ou audit durable; [À produire] audit indépendant du tirage complet |
| US-007 | ACT-04, ACT-05, ACT-06, ACT-07 | Sources/specs `fraud-flags`, `admin-users`, composants/specs `ModerationAdminV3` et `UsersAdminV3` identiques à `origin/dev`; frontend Vitest 2 suites/5 tests code 0; backend fraud-flags + admin-users code 1 avant exécution de tests | Backend + QA; Sécurité + Conformité | Preuve frontend ciblée; aucun test backend démarré, aucune preuve d'autorisation, mutation persistée ou parcours HTTP complet; US-007/ACT-06 `needs-review` |

## Chaîne de traçabilité

| Vision / résultat | Stories | Parcours | Architecture | API / données observées | Preuves attendues | État |
| --- | --- | --- | --- | --- | --- | --- |
| Comprendre le service et ses règles | US-001 | Vitrine, légal et FAQ | Frontend public, contenu publié | `backend/src/content/content.controller.ts`; `ManagedContent`, `ContentVersion` | navigation publique FR/EN, contenu publié, accessibilité et preuve de provenance média | `needs-review` |
| Créer et utiliser un compte majeur | US-002 | FLOW-001, inscription/connexion | `auth` et session cookie | `backend/src/auth/auth.controller.ts`; `User.sessionVersion` et guards de session | succès, validation, doublon, limite, expiration/révocation, permission et preuve juridique de l'âge | `needs-review` |
| Apparier et révoquer l'extension | US-003 | FLOW-001, appariement/reprise | `extension` et stockage du jeton | `backend/src/extension/extension.controller.ts`; `ExtensionPairingToken`, `ExtensionPairing` | code consommé une fois, cinq appareils, expiration, révocation, extension Chrome réelle et reprise | `needs-review` |
| Créditer l'activité sans doublon | US-004 | FLOW-001, heartbeat accepté/refusé/plafond | `watch-sessions`, Redis/BullMQ et ledger | `backend/src/watch-sessions/watch-sessions.controller.ts`; `WatchSession`, `PointsTransaction` | cadence, nonce, idempotence, plafond 65, panne dépendance, cohérence dashboard/ledger | `needs-review` |
| Maintenir le streak et les tickets | US-005 | FLOW-001, check-in, jour manqué et reprise | `me` et transactions métier | `backend/src/me/me.controller.ts`; `PointsTransaction`, `RaffleTicket`, `ScratchCard` | paliers 1/3/7/14/30, reset, bonus unique, solde/historique cohérents | `needs-review` |
| Exécuter un tirage manuel auditable | US-006 | FLOW-002, préparation/exécution/publication | `raffles`, worker et audit | `backend/src/raffles/raffles.controller.ts`, `backend/src/raffles/admin-raffles.controller.ts`; `Raffle`, `RaffleLot`, `RaffleDrawAudit`, `RaffleWinner` | liste figée, CSPRNG, engagement/empreinte, permissions, confirmation, résultat et audit publiable | `needs-review` |
| Examiner et sanctionner un signal fraude | US-007 | parcours admin de modération, suspension/réactivation | `fraud-flags`, `admin-users` et audit | `backend/src/fraud-flags/fraud-flags.controller.ts`, `backend/src/admin-users/admin-users.controller.ts`; `FraudFlag`, `ContentAuditEvent`/journal admin | décision humaine proportionnée, permission, CSRF, audit, réversibilité et notification si applicable | `needs-review` |

## Ce que le code permet de confirmer

- Les contrôleurs présents couvrent les domaines auth, extension, sessions de visionnage, espace `me`, tirages, contenu, lots, utilisateurs, fraude, annonces, streams et cartes à gratter.
- Le schéma Prisma contient les agrégats `User`, `ExtensionPairing`, `WatchSession`, `PointsTransaction`, `Raffle`, `RaffleLot`, `RaffleTicket`, `RaffleDrawAudit`, `FraudFlag` et le contenu administrable.
- Les tests unitaires et E2E référencés couvrent plusieurs cas ciblés, mais leur existence ne prouve pas à elle seule la couverture complète de chaque chaîne ci-dessus.
- Les contrats d'API sont actualisés selon les décisions owner du 2026-10-18; les routes cibles et les comportements déjà implémentés restent explicitement distingués. La matrice signale les preuves d'implémentation et de test encore à produire.

## Actions ouvertes, owners et preuves

| ID | Point de `design-readiness` | Owner proposé | Action autonome proposée | Preuve attendue | Décision / état |
| --- | --- | --- | --- | --- | --- |
| ACT-01 | MVP/Post-MVP | Produit + Coordinateur | Conserver la matrice vision, roadmap et stories confirmée par l'owner sans changer le cahier accepté | matrice de périmètre versionnée et décision datée; preuves indépendantes encore à relire | `needs-review`, décision confirmée; preuves/readiness restantes |
| ACT-02 | Architecture, exploitation et dépendances | DevOps | Rattacher chaque dépendance à un timeout, retry, healthcheck, alerte et responsable | `docs/design/ops-audit-2026-10-18.md`, preuve intermédiaire de configuration locale et gaps ops; runbook préproduction exécuté, journaux et alerte observée restent à produire | `needs-review`, preuves externes et décisions d'opération manquantes |
| ACT-03 | Données, rétention, export, suppression, rollback | Data + Conformité | Conserver la proposition par catégorie sous validation Conformité; rapprocher les modèles, implémentations, tests et preuves d'exécution | baseline owner du 2026-10-18; audit Data détaillé ci-dessous; procédure testée et preuve de restauration restent à produire | `needs-review`, décision documentaire confirmée; validation Conformité et preuves restantes |
| ACT-04 | Rapprochement API/code | Backend + QA | Conserver l'inventaire endpoint→contrat→spec et les tests ciblés documentés par l'audit API accepté, sans confondre les sources correspondantes avec la preuve HTTP complète | `docs/design/api-contract-audit-2026-10-18.md` documente l'inventaire et 5 suites / 47 tests passés pour les sources correspondant à `origin/dev`; les preuves HTTP de permission, quota et audit, les tests de route et la divergence `me.service` restent ouverts | `needs-review`, inventaire et tests ciblés documentés; preuves et divergence restantes |
| ACT-05 | Sécurité | Sécurité + Conformité | Fournir rotation/révocation session, CSRF, limites heartbeat, secrets, audit admin et sauvegarde | audit Backend et audit indépendant détaillés dans le relevé ACT-05 ci-dessous; preuves déployées et décisions de sécurité restent à produire | `needs-review`, aucune approbation sécurité |
| ACT-06 | Stories P0 | QA + Auditeur | Rejouer US-001 à US-006 story par story, succès et erreurs, avec rattachement exact | relevé QA ACT-06 ci-dessous, matrice P0, commandes et artefacts bruts; verdict indépendant reçu le 2026-10-18, statut `needs-review` | `needs-review`, résultats non entièrement réconciliés |
| ACT-07 | Parcours admin, révocation, erreurs et reprise | UX + Backend + QA | Conserver les règles de parcours admin confirmées et produire les preuves sans ajouter de comportement non prouvé | relevé Backend/auditeur/QA ACT-07 ci-dessous; diagrammes et tests de reprise, permission et mutation restent à produire | `needs-review`, règles confirmées; preuves intégrées non réconciliées |
| ACT-08 | Direction visuelle et accessibilité | Frontend + Accessibilité + Auditeur | Comparer les 13 références aux rendus, états, clavier, contraste et reduced-motion | relevé Frontend/QA/auditeur ACT-08 ci-dessous; rechecks ciblés terminés, preuves navigateur et rendu produit restent à produire | `needs-review`, aucune approbation visuelle |
| ACT-09 | Médias | Design + Conformité | Appliquer la traçabilité par média, provenance et droits confirmée comme exigence de conception | relevé Backend/Data et audit indépendant ACT-09 ci-dessous; inventaire fichier/ressource, briefs et autorisations restent à compléter | `needs-review`, exigence confirmée; aucune conclusion juridique |
| ACT-10 | Décisions ouvertes | Coordinateur + owners ci-dessus | Tenir le registre opérationnel ACT-10 ci-dessous, sans inventer dates ni identités d'owners, avec jalon, vérificateur et preuve de sortie | ce registre daté, ses champs obligatoires remplis et une relecture par les owners; la clôture exige une preuve de sortie pour chaque ligne | `needs-review`, décision de gouvernance confirmée; champs et preuves en attente |
| ACT-11 | Marqueurs « à vérifier/à définir » | Responsable produit pour les arbitrages métier; Concepteur pour le registre; Auditeur indépendant pour la relecture | Conserver les décisions reçues hors MVP et rattacher chaque occurrence à sa source, son owner et sa preuve, sans inventer de valeur | rapport ACT-11 versionné avec chemins/lignes existants, tableau occurrence→classement→owner/action, relecture indépendante et absence de marqueur non classé | `needs-review`, décisions de périmètre confirmées; owners/preuves restantes |
| ACT-12 | Traçabilité complète | Concepteur + Auditeur | Relire cette matrice indépendamment et corriger les liens manquants | [Rapport indépendant de traçabilité ACT-12](../audits/act-12-independent-traceability-review-2026-10-18.md), revue limitée; les critères non démontrés restent ouverts | `needs-review` |
| ACT-13 | Approbation design | Auditeur indépendant + responsable habilité | Organiser la revue finale après clôture des écarts, sans pré-cocher la porte | verdict indépendant `accepted` ou `rework`, preuve datée | `needs-review`, aucune approbation |

## Relevé ACT-10 - registre opérationnel des décisions ouvertes, 2026-10-18

Ce registre transforme l'écart ACT-10 en suivi vérifiable sans inventer
d'identité, date ou décision métier. Chaque ligne doit conserver les champs
owner, milestone, preuve de sortie, date et statut. « Date non définie » signifie
que l'owner doit proposer une date avant qu'une décision datée soit consignée.
Les milestones sont
des portes de séquence, pas des engagements calendaires. ACT-10 reste
`needs-review`.

| ID | Owner(s) proposé(s) par rôle | Milestone non calendaire | Preuve de sortie objectivement vérifiable | Vérificateur / condition de clôture | Date / décision | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| ACT-01 | Produit + Coordinateur | Avant approbation design et avant implémentation des éléments concernés | matrice vision/périmètre/stories versionnée, décision produit tracée et cohérence vérifiée | Concepteur + Auditeur; aucune story concernée ne reste sans périmètre ou décision tracée | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-02 | DevOps + Backend | Avant préproduction et avant toute prétention de readiness ops | runbook exécuté, journaux, healthchecks/alertes observés et preuve de sauvegarde/restauration | Auditeur + Ops; exécution et journaux correspondent aux dépendances inventoriées | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-03 | Data + Conformité | Avant approbation design et avant traitement de données en préproduction | inventaire des données, procédure export/purge/restauration testée et validation des questions conformité | Data + Conformité; chaque catégorie possède une procédure et une preuve d'exécution | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-04 | Backend + QA | Avant implémentation d'une divergence contractuelle et avant approbation design | inventaire endpoint→contrat→spec et tests ciblés documentés; preuves HTTP de permission, quota et audit, tests de route et traitement de la divergence `me.service` | Backend + Auditeur; l'inventaire et les 5 suites / 47 tests correspondants sont vérifiables, puis les preuves HTTP et la divergence exclue sont traitées | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-05 | Sécurité + Conformité | Avant préproduction et avant approbation design | rapport indépendant; résultats unitaires limités consignés (8 tests origine dans une commande multi-suite en échec, 5 tests AdminGuard réussis séparément); preuves déployées de révocation/CSRF/limites/secrets/audit et sauvegarde restent requises | Sécurité + Auditeur; les résultats unitaires ne sont pas présentés comme preuve HTTP, déploiement ou persistance; chaque contrôle requis possède une preuve reproductible et datée | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-06 | QA + Auditeur | Avant approbation design et avant livraison des stories P0 | matrice US-001..US-006 avec commandes, artefacts bruts, erreurs/permissions et verdict indépendant | QA + Auditeur; chaque story P0 possède des cas et artefacts reliés, sans résultat non réconcilié | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-07 | UX + Backend + QA | Avant implémentation des transitions admin et avant livraison concernée | parcours nominal/dégradé, tests route→permission→mutation→audit, E2E de reprise et décision produit | QA + Auditeur; transitions et mutations réussies/échouées sont observées sur le parcours intégré | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-08 | Frontend + Accessibilité + Auditeur | Avant approbation design et avant livraison visuelle | preuves navigateur 320/768/1280/zoom 200 %, contraste, reflow, lecteur d'écran et recheck indépendant | Accessibilité + Auditeur; chaque taille et contrôle applicable possède une preuve rendue | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-08 / Notifications | Frontend + QA + Auditeur | Avant implémentation Notifications et avant approbation visuelle | rendu produit réel, modal/focus/états et preuve d'absence du point décoratif, recheck QA/auditeur | QA + Auditeur; ouverture, fermeture, focus, états et absence du point sont vérifiés dans le produit | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-09 | Design + Data + Conformité | Avant livraison de tout média publié et avant approbation design | inventaire asset/ressource→source→usage→brief/retouches→preuve, liens éditables et ressources distantes tracées | Concepteur + Auditeur; chaque média publié correspond à une entrée vérifiable | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-11 | Responsable produit + Concepteur + Auditeur indépendant | Avant approbation design | chaque marqueur classé, sourcé, ownerisé et relu sans marqueur non traité | Concepteur + Auditeur; le scan ne laisse aucune occurrence non classée | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-11 / Notifications - session et permissions | Backend + QA + Auditeur | Avant implémentation ou release Notifications | preuve 401/403 ou navigateur authentifié refusé sans contenu d'annonce, avec vérification QA/auditeur indépendante | QA + Auditeur; aucun titre, texte ou donnée d'annonce n'est présent dans la réponse ou l'écran refusé | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-12 | Concepteur + Auditeur | Avant toute demande d'approbation design | registre relu, liens vérifiés, écarts documentés et rapport indépendant distinct | Auditeur; chaque US et ACT est reliée, les statuts sont cohérents et aucune clôture n'est implicite | date non définie; owner propose puis décision datée consignée | `needs-review` |
| ACT-13 | Auditeur indépendant + responsable habilité | Après clôture des écarts et juste avant une éventuelle décision globale | verdict indépendant `accepted` ou `rework`, preuve datée et décision explicite du responsable habilité | Auditeur + responsable habilité; verdict et décision sont consignés sans auto-approbation | date non définie; owner propose puis décision datée consignée | `needs-review` |

La preuve attendue pour ACT-10 est donc ce registre daté lui-même, avec ses
champs obligatoires et les preuves de sortie rattachées. ACT-10 ne sera
considéré clôturable qu'après remplissage par les owners, relecture indépendante
et vérification de chaque condition de sortie. Ce tableau ne constitue pas une
validation owner-approved ni une approbation de readiness.

## Relevé ACT-03 - audit Data, 2026-10-18

Ce relevé synthétise l'audit Data spécialisé et distingue la baseline proposée
par le Coordinateur, les observations locales et les écarts encore ouverts. La
proposition du 2026-10-08 reste à valider et révisable; elle ne vaut ni
approbation design, ni approbation d'audit, ni conclusion juridique. ACT-03
reste `needs-review`.

### Baseline proposée à valider

La proposition préparée par le Coordinateur et consignée dans
`docs/delivery/readiness-decision-request.md:82-92` prévoit, sous réserve de
validation et de révision :

- purge ou anonymisation de l'utilisateur après trois ans d'inactivité ;
- conservation de la session, du heartbeat et du device token pendant 90 jours
  après expiration ou dernière activité ;
- conservation du ledger, des tickets, des signaux fraude et des journaux
  d'audit pendant au moins trois ans, puis purge ou anonymisation selon
  l'obligation applicable ;
- purge mensuelle journalisée, revue trimestrielle et aucune suppression
  irréversible avant sauvegarde vérifiée ;
- demandes manuelles d'export ou de suppression par courriel, accusé sous sept
  jours, traitement sous trente jours et export JSON.

### Preuves observées et limites

| Domaine | Sources locales | Observation factuelle | Écart restant |
| --- | --- | --- | --- |
| Modèle et utilisateurs | `docs/design/data-model.md:7-10,40-44`; `backend/prisma/schema.prisma:75-107`; `backend/src/admin-users/admin-users.service.ts:68-91` | Le modèle conceptuel conserve plusieurs durées et procédures à préciser; le schéma User ne porte pas de règle de purge; le service d'administration désactive seulement l'utilisateur | Implémenter ou documenter la procédure autorisée et ses preuves avant toute clôture; ne pas inventer de durée supplémentaire |
| Sessions et activité | `backend/prisma/schema.prisma:190-213`; `backend/src/maintenance/maintenance-cleanup.ts:70-78`; `backend/src/maintenance/maintenance-cleanup.spec.ts:35-66` | Le job clôture après dix minutes d'inactivité; les tests couvrent la clôture et les états temporaires, pas la rétention à 90 jours; aucun Heartbeat autonome n'a été observé | Prouver la correspondance Session/Heartbeat et la purge à 90 jours |
| Appariement appareil | `backend/prisma/schema.prisma:175-187`; `backend/src/maintenance/maintenance-cleanup.ts:62-68` | Les codes `ExtensionPairingToken` temporaires sont supprimés vers 24 heures; aucune règle d'effacement à 90 jours du pairing appareil n'est observée | Décider et prouver la correspondance DeviceToken/pairing, sans assimiler les codes temporaires aux appareils |
| Points, tickets et fraude | `backend/prisma/schema.prisma:240-253,326-345,396-411` | PointsTransaction, RaffleTicket et FraudFlag n'ont pas d'échéance observée; la suppression User cascade vers points, tickets et FraudFlag | Arbitrer la purge/anonymisation et ses effets avant de définir une preuve de sortie |
| Audit et migrations | `backend/prisma/schema.prisma:348-362,454-467`; `backend/prisma/migrations/20260826000000_initial/migration.sql:25-40,68-106,122-132`; `backend/prisma/migrations/20260905000000_maintenance_indexes/migration.sql:1-7`; `backend/prisma/migrations/20261003000000_user_active_status/migration.sql:1` | Il n'existe pas de modèle générique AuditLog; RaffleDrawAudit et ContentAuditEvent ont une relation User `Restrict`; les migrations vérifiées créent les tables/index ou ajoutent `users.actif`, sans politique de purge observée | Décider la correspondance AuditLog et la procédure pour les journaux d'audit |
| Worker et tests | `backend/src/worker.ts:29-30,143-155`; `backend/src/maintenance/maintenance-cleanup.spec.ts:1-18,22-40,69-73` | Le worker s'exécute toutes les 15 minutes et traite OAuth, codes temporaires et clôture de sessions; le spec cité construit un Prisma simulé avec des fonctions Jest, donc il ne prouve pas une purge réelle | Produire une preuve d'exécution réelle de purge et de journalisation |
| Droits et opération | `backend/src/me/me.controller.ts:22-87`; `backend/src/auth/auth.controller.ts:45-103`; `docs/quality/evidence/dash-v3-final-captures/staging-rollback-runbook-20261011.md:14-39`; `docs/quality/ops-evidence-current.md:48-59` | Les routes observées n'exposent pas d'export, suppression ou anonymisation; la procédure courriel est cohérente avec le document, mais aucun export JSON ni traitement sous 30 jours n'est prouvé; le runbook de restauration est préparé, et la restauration PostgreSQL locale ne prouve pas une restauration complète de préproduction | Obtenir les preuves opérationnelles d'export, de traitement, de sauvegarde vérifiée et de restauration complète |

### Questions et preuves attendues

Les correspondances `DeviceToken`/pairing, `Heartbeat` et `AuditLog`/journaux
restent à établir. Les règles de suppression des données de fraude et d'audit
restent à arbitrer. Aucune base légale ni durée additionnelle n'est déduite de
cet audit. La clôture d'ACT-03 exige une décision tracée sur ces points, un
inventaire des données et procédures, ainsi que des preuves d'exécution et de
restauration relues indépendamment.

## Relevé ACT-05 - audit Backend et audit indépendant, 2026-10-18

Ce relevé distingue les mécanismes observés dans le Backend, les limites des
tests et les constats de l'audit indépendant. Une exécution multi-suite de
`verification-origine.guard.spec.ts` a réussi ses 8 tests, mais la commande a
terminé avec le code 1 : six autres suites ont échoué avant chargement, faute de
client Prisma généré, et aucun test de ces suites n'a été exécuté. Séparément,
`admin.guard.spec.ts`, identique à `origin/dev`, a réussi depuis le checkout
racine au commit `6b0845cff30061ae539158302c1c6eb0637b2b5e` (1 suite, 5 tests,
code 0); le diff ciblé de sa source et de son test par rapport à `origin/dev`
est nul. Aucune DB, aucun serveur, Redis ou Docker n'a été démarré. Ces résultats
de tests unitaires ne prouvent ni le comportement HTTP, ni un déploiement, ni la
persistance. Le relevé ne constitue pas une conclusion de sécurité globale.
ACT-05 reste `needs-review`.

Commandes reproductibles et résultats observés :

1. CWD `/private/tmp/skkup-mvp001-20261018/backend` :

   ```sh
   ./node_modules/.bin/jest --runInBand --runTestsByPath src/auth/guards/admin.guard.spec.ts src/common/verification-origine.guard.spec.ts src/auth/auth.service.spec.ts src/auth/auth.password.spec.ts src/watch-sessions/watch-sessions.service.spec.ts src/raffles/raffles.service.spec.ts src/admin-users/admin-users.service.spec.ts
   ```

   Code global 1. `verification-origine.guard.spec.ts` : 8 tests réussis;
   six autres suites échouent avant chargement, faute de client Prisma généré.

2. CWD `/Users/krapaud/Documents/Projets/Projets-Pro/Skkup/backend` :

   ```sh
   npm test -- --runInBand --no-cache --runTestsByPath src/auth/guards/admin.guard.spec.ts
   ```

   Code 0; 1 suite et 5 tests réussis. La source et la spec ont un diff ciblé
   nul par rapport à `origin/dev`.

### Sessions, révocation et temps réel

- Le cookie de session est `HttpOnly`, `SameSite=Lax`, `Secure` par défaut et
  host-only, avec une durée de 24 heures (`backend/src/auth/cookie-session.ts:12,55`).
- La stratégie JWT vérifie l'expiration, `actif` et `sessionVersion`
  (`backend/src/auth/strategies/jwt.strategy.ts:31`; test
  `backend/src/auth/strategies/jwt.strategy.spec.ts:16`).
- Le changement de mot de passe révoque le JWT, le pairing et les sessions dans
  une transaction (`backend/src/auth/auth.service.ts:110`;
  `backend/src/auth/auth.password.spec.ts:69`). La déconnexion incrémente
  `sessionVersion` (`backend/src/auth/auth.controller.ts:100`;
  `backend/src/auth/auth.service.ts:157`), contrairement à la formulation
  historique de `docs/05-security.md:321-327`, qui ne mentionne que la
  suppression locale du cookie.
- La révocation socket est en mémoire (`backend/src/auth/session-revocation.service.ts:5`);
  `docs/quality/p01-security-remediation-evidence.md:57` indique qu'un JWT
  déjà connecté à une socket n'est pas réévalué.

### CSRF, rate limiting et secrets

- Le contrôle d'origine est global (`backend/src/common/verification-origine.guard.ts:14`;
  `backend/src/app.module.ts:65`) et possède des tests unitaires
  (`backend/src/common/verification-origine.guard.spec.ts:28`). Le handshake
  WebSocket suit un chemin distinct (`backend/src/realtime/realtime.gateway.ts:111`;
  `backend/src/realtime/realtime.gateway.spec.ts:224`). Aucun token CSRF séparé
  n'est observé (`docs/05-security.md:329`). Ces tests ne constituent pas une
  campagne déployée.
- Le rate limiting global pré-authentification est de 120/minute/IP
  (`backend/src/app.module.ts:33`); le guard combine utilisateur/IP
  (`backend/src/common/throttler.guards.ts:4`; test `backend/src/common/throttler.guards.spec.ts:66`)
  et le heartbeat est limité à 4/minute
  (`backend/src/watch-sessions/watch-sessions.controller.ts:41`).
  `admin-users.controller.ts:16`, `admin-lots.controller.ts:19` et
  `admin-dashboard.controller.ts:5` ne montrent pas de
  `PostAuthThrottlerGuard`;
  `docs/quality/p01-security-remediation-evidence.md:57` limite les constats à
  un processus local.
- Les secrets sont lus depuis l'environnement
  (`backend/src/auth/auth.module.ts:19`; `docker-compose.dokploy.yml:35,108`).
  `docs/quality/p01-security-remediation-evidence.md:45` documente le contrôle
  VPS historique des variables renseignées, et `:50` précise que la rotation
  effective des secrets n'est pas prouvée; aucun accès actuel n'est établi.

### Autorisation et audit applicatif

- `AdminGuard` refuse et journalise les refus d'accès administrateur
  (`backend/src/auth/guards/admin.guard.ts:69`; test
  `backend/src/auth/guards/admin.guard.spec.ts:40`). La spec réussie vérifie
  que le secret transmis dans `request.path` n'apparaît pas dans le log, mais
  ne fournit ni ne vérifie `request.route.path`, que l'implémentation journalise
  (`backend/src/auth/guards/admin.guard.ts:71`). Le chemin de route effectif et
  la structure complète de l'événement ne sont donc pas couverts par ce test.
- `RaffleDrawAudit` est créé dans la transaction du tirage
  (`backend/src/raffles/raffle-draw.ts:135`). En revanche, la mutation de
  `FraudFlag` puis la création de `ContentAuditEvent` sont deux opérations
  séparées et non atomiques (`backend/src/fraud-flags/fraud-flags.service.ts:44-58`).
  La création d'un tirage admin dans
  `RafflesService.creer` ne montre pas d'acteur ni d'événement
  (`backend/src/raffles/raffles.service.ts:33`), et
  `backend/src/fraud-flags/fraud-flags.service.spec.ts:18` ne vérifie pas
  l'événement.

### Sauvegardes et preuve opérationnelle

- L'audit ops ne fournit pas de provider ou de sauvegarde distante et indique
  un runbook non exécuté (`docs/design/ops-audit-2026-10-18.md:9,15,28-30`).
- Le runbook de rollback est préparatoire
  (`docs/quality/evidence/dash-v3-final-captures/staging-rollback-runbook-20261011.md:14`)
  et la preuve ops précise que la restauration PostgreSQL locale ne démontre
  pas une restauration complète de préproduction
  (`docs/quality/ops-evidence-current.md:48-59`). Le volume déclaré dans
  `docker-compose.dokploy.yml:105` n'est pas, à lui seul, une preuve de backup.

### Gaps et preuves attendues

Restent à établir par une revue indépendante et des preuves déployées :
réévaluation socket après révocation, comportement WS/CSRF, couverture des
routes admin, rotation des secrets, cohérence test/code de l'AdminGuard,
acteur et audit des créations admin, ainsi que sauvegarde et restauration
réelles. Aucune conclusion de sécurité globale ni approbation de sécurité n'est
déduite de ce relevé.

## Relevé ACT-06 - audit de couverture QA P0, 2026-10-18

Ce relevé rapproche les campagnes QA disponibles de la portée des stories. La
matrice P0 couvre `US-001` à `US-006`; `US-007` est P1 selon
`docs/product/user-stories.md:9-16`. Aucun constat ci-dessous ne constitue une
conclusion de readiness. ACT-06 reste `needs-review`.

### Résultats disponibles et portée

- `US-004` : les sources backend sessions/heartbeats, leurs specs et DTO,
  ainsi que le client frontend `watch-sessions`, sont identiques à `origin/dev`.
  Depuis `frontend/`, `./node_modules/.bin/vitest run
  src/lib/watch-sessions.test.ts` s'est terminé avec le code 0 (1 suite,
  3 tests). Aucun test `useSessionVisionnage` n'a été inventorié. Le service
  backend et `credential.guard` ont échoué au chargement (code 1) sans démarrer
  aucun test, faute de client Prisma. Aucun client Prisma, service, serveur,
  API, base de données, Redis ou Docker n'a été utilisé. Il n'y a donc pas de
  preuve de heartbeat HTTP, persistance, idempotence DB ni traitement Redis/
  BullMQ. `US-004` et ACT-06 restent `needs-review`.
- `US-003` : les sources/specs pairing sont identiques à `origin/dev`. Le test
  frontend `CodeAppariement` a réussi sous Vitest (1 suite, 10 tests, code 0).
  Côté backend, les 11 tests de jetons-extension ont réussi, mais la commande
  globale s'est terminée avec le code 1 : `extension.service` et
  `extension-auth.guard` n'ont exécuté aucun test, faute de client Prisma.
  Les E2E extension n'ont pas été exécutés. Aucun client Prisma, navigateur,
  serveur, API, base de données ou Docker n'a été utilisé. Aucun appairage réel,
  échange HTTP ni expiration/révocation persistée n'est ainsi prouvé. `US-003`
  et ACT-06 restent `needs-review`.
- `US-007` : les sources et specs `fraud-flags` et `admin-users`, ainsi que les
  composants et specs `ModerationAdminV3` et `UsersAdminV3`, sont identiques à
  `origin/dev`. Les tests frontend Vitest ont réussi avec code 0 (2 suites,
  5 tests). Les tests backend `fraud-flags` et `admin-users` se sont terminés
  avec le code 1 au chargement; zéro test n'a démarré, le client et les enums
  Prisma étant absents. Aucun client Prisma n'a été généré et aucun service,
  serveur, API, base de données ou Docker n'a été utilisé. Il n'y a donc pas de
  preuve d'autorisation, de mutation persistée ni de parcours HTTP complet.
  `US-007` et ACT-06 restent `needs-review`.
- `US-006` : les tests frontend Vitest ont réussi avec code 0 (2 suites,
  24 tests); les sources et specs correspondants sont identiques à `origin/dev`.
  La commande backend s'est terminée avec le code 1 : seul
  `raffle-draw.spec.ts` a exécuté et réussi 16 tests; trois autres suites n'ont
  exécuté aucun test faute de client Prisma généré. Aucun client Prisma n'a été
  généré, aucun service ni Docker n'a été utilisé. Ces résultats ne prouvent ni
  un parcours navigateur, ni HTTP réel, permission, persistance ou audit
  durable. `US-006` et ACT-06 restent `needs-review`.
- `US-005` : `frontend/src/components/dashboard/HistoriquePointsViewer.test.tsx`
  réussit 4/4 tests sous Vitest/jsdom; le composant et sa spec sont identiques
  à `origin/dev`. Cette preuve est limitée au test frontend et ne constitue
  aucune preuve E2E, API ou persistance. `US-005` et ACT-06 restent
  `needs-review`.
- `US-001` : QA a comparé `frontend/src/app/page.tsx` et
  `frontend/src/app/page.test.tsx` à `origin/dev`; le diff est nul. Depuis
  `frontend/`, `./node_modules/.bin/vitest run src/app/page.test.tsx` s'est
  terminé avec le code 0 (1 fichier, 1 test). Cette preuve est unitaire, sous
  Vitest/jsdom; elle ne couvre pas le contenu légal ni la conformité, et
  n'utilise aucun navigateur, serveur, API ou base de données. Le run n'a modifié
  aucun fichier. Elle ne clôt pas `US-001` ni ACT-06, qui restent
  `needs-review`.
- `US-001` : `frontend/src/components/legal/ReglementPublicContent.tsx` et
  `frontend/src/components/legal/ReglementPublicContent.test.tsx` sont
  identiques à `origin/dev`. Depuis `frontend/`,
  `./node_modules/.bin/vitest run src/components/legal/ReglementPublicContent.test.tsx`
  s'est terminé avec le code 0 (1 fichier, 2 tests). La portée est limitée au
  composant sous Vitest/jsdom; ce résultat ne valide pas juridiquement le
  règlement et ne constitue pas une preuve E2E, navigateur, API ou base de
  données. Le run n'a modifié aucun fichier. `US-001` et ACT-06 restent
  `needs-review`.
- `US-002` : dans le worktree isolé `/private/tmp/skkup-mvp001-20261018/frontend`,
  `npm ci --offline --ignore-scripts --no-audit --no-fund` a réussi et installé
  465 packages; `node_modules` est ignoré. Les manifestes et les sources/specs
  ciblés sont identiques à `origin/dev`. Puis
  `npm test -- src/components/auth/FormulaireAuth.test.tsx` a réussi : 11 tests
  passent. Une tentative préalable dans le checkout racine n'a démarré aucun
  test, à cause du binding natif `rolldown` manquant; la récupération hors ligne
  isolée a permis l'exécution. Selon le constat QA vérifié par l'agent
  `01a14f00-e964-78f2-9618-20c9906dcfd5`, avec composant et test identiques à
  `origin/dev` au commit `7887791f`, le composant rend « Password meets the
  requirements » en anglais et « Mot de passe conforme » en français quand
  `motDePasseValide` est vrai. Vitest 4.1.11, Node 26.10.0 et npm 11.19.1;
  les 11 tests ciblés terminent avec code 0, mais ne vérifient pas l'absence de
  ces messages. Ils utilisent jsdom et des mocks seulement, sans navigateur,
  API ni base de données. La preuve reste partielle; `US-002` et ACT-06 restent
  `needs-review`, sans approbation design.
- `US-002` : depuis `backend/`, la commande
  `npm test -- --runInBand src/auth/dto/register.dto.spec.ts` s'est terminée
  avec le code 0 (1 suite, 1 test). Les fichiers
  `src/auth/dto/register.dto.ts` et `src/auth/dto/register.dto.spec.ts` sont
  identiques à `origin/dev`. Le test `class-validator` vérifie le minimum de
  12 caractères, une minuscule, une majuscule, un chiffre, un symbole, des cas
  invalides et un cas valide. Il ne couvre pas l'email, le pseudo, le
  consentement, ni un parcours HTTP, d'intégration ou avec base de données.
  L'agent QA avait d'abord cherché un chemin erroné, puis corrigé celui-ci et
  exécuté avec succès la commande ci-dessus; aucun constat d'absence du fichier
  n'est retenu. Cette preuve unitaire limitée ne clôt pas US-002 ni ACT-06, qui
  restent `needs-review`.
- `US-002` : depuis le backend isolé, la commande
  `npm test -- --runInBand src/auth/auth.controller.spec.ts` s'est terminée avec
  le code 1 avant l'exécution d'un test. Jest a démarré, mais l'import de
  `auth.service.ts` ne trouve pas `../../generated/prisma/client`; zéro test a
  été exécuté. Les fichiers `src/auth/auth.controller.ts` et
  `src/auth/auth.controller.spec.ts` sont identiques à `origin/dev`. Il s'agit
  d'un démarrage empêché par un prérequis de client généré absent, et non d'un
  test échoué. Aucun client Prisma n'a été généré et aucune base de données ni
  Docker n'a été utilisé. Ce résultat ne clôt pas US-002 ni ACT-06, qui restent
  `needs-review`.
- `docs/quality/qa-p0-targeted-2026-10-07.md:20-29` rapporte 11/11 tests
  Playwright. Le même rapport rapporte 32 fichiers, 120 tests et 6 tests
  ignorés à ses lignes 63-72. Ces résultats sont historiques et les artefacts
  bruts correspondants ne sont pas présents dans ce rapport.
- `docs/quality/p0-evidence-matrix.md:39-45` mentionne 116/116 sans commande
  ni rapport brut rattaché. Ce résultat est incompatible avec les sources et
  cas actuels; il est conservé comme résultat non réconcilié et ne constitue
  pas une preuve.
- La même matrice mentionne 12 tests du prototype sans run brut
  (`docs/quality/p0-evidence-matrix.md:44-45`). Ils restent un résultat déclaré,
  non une preuve exécutable indépendante.
- Elle mentionne 31 suites et 247 tests Docker sans brut
  (`docs/quality/p0-evidence-matrix.md:46-49`). Ce résultat ne doit pas être
  confondu avec la relance locale à 30 suites et 244 tests sur 247, qui comporte
  trois erreurs `listen EPERM` (`docs/quality/p0-evidence-matrix.md:50-52`).

### Archive du 2026-10-08

`docs/quality/evidence/p0-live-2026-10-08/README.md:3-20` rattache à son
commit une archive brute de 62/62 Playwright et 43 suites/288 tests Backend,
avec les rapports JSON correspondants. Cette archive est limitée à son commit
et à son environnement Docker local. Les scénarios E2E ne valent pas, à eux
seuls, validation métier story par story.

### Gaps et disposition

Il manque un rattachement reproductible story→cas→commande→rapport brut pour
US-001 à US-006, la réconciliation des résultats 116/116, les artefacts bruts
des 12 tests prototype et des 31 suites/247 tests Docker, ainsi qu'une relecture
indépendante par story incluant succès, erreurs, permissions et états
applicables. Les résultats historiques restent référencés pour traçabilité,
mais sont classés non réconciliés ou non prouvés selon les cas. Aucun passage de
`needs-review` à un statut de readiness n'est proposé.

## Relevé ACT-07 - parcours admin, révocation, erreurs et reprise, 2026-10-18

Ce relevé synthétise les rapports spécialisés Backend et audit indépendant,
complétés par la revue QA du 2026-10-18. Il constate les comportements et les
limites documentées sans inventer de transition ou de règle produit. ACT-07 est
`needs-review`.

### Parcours et mutations observés

- `docs/product/user-flows.md` décrit surtout `FLOW-001` nominal et
  `FLOW-002` de façon sommaire. Les transitions de modération admin et de
  gestion du contenu ou des utilisateurs ne sont pas décrites.
- La spécification admin décrit les actions fraude ouvrir, traiter, ignorer et
  ajouter une note (`docs/design/dashboard-v3-admin-spec.md:215`). L'API expose
  la liste, le détail et la mutation protégés
  (`backend/src/fraud-flags/fraud-flags.controller.ts:19`;
  `backend/src/fraud-flags/dto/update-fraud-flag.dto.ts:4`). Les statuts du
  schéma sont `OUVERTE`, `EXAMINEE` et `IGNOREE`
  (`backend/prisma/schema.prisma:55`). Aucun parcours de suspension utilisateur
  n'est associé à cette mutation.
- La mutation fraude met à jour le statut et la date, puis crée un événement
  d'audit; le test `backend/src/fraud-flags/fraud-flags.service.spec.ts:18`
  couvre le filtre et le cas manquant, mais pas le succès ni l'événement.
- La spécification prévoit une confirmation et un impact dashboard pour la
  suspension (`docs/design/dashboard-v3-admin-spec.md:227`). La route PATCH et
  son DTO sont relayés par `backend/src/admin-users/admin-users.controller.ts:16`;
  le service interdit l'auto-désactivation, incrémente `sessionVersion` et
  journalise l'activation/désactivation
  (`backend/src/admin-users/admin-users.service.ts:67`). Le DTO ne porte pas de
  motif, impact ou confirmation; ces éléments restent une intention UI. Les
  tests `backend/src/admin-users/admin-users.service.spec.ts:15` couvrent
  l'auto-refus, l'invalidation de session et l'audit, mais pas l'activation,
  l'utilisateur absent ou la répétition.

### Révocation, erreurs et reprise

- Le JWT rejette un utilisateur inactif ou une version de session divergente
  (`backend/src/auth/strategies/jwt.strategy.ts:48`;
  `backend/src/auth/strategies/jwt.strategy.spec.ts:75`). La désactivation admin
  ne notifie pas `SessionRevocationService`, contrairement à la déconnexion ou
  au changement de mot de passe. Le notifier socket est en mémoire
  (`backend/src/auth/session-revocation.service.ts:5`); le test du gateway
  vérifie le notifier, mais pas son branchement depuis la gestion des
  utilisateurs (`backend/src/realtime/realtime.gateway.spec.ts` et
  `backend/src/admin-users/admin-users.service.ts:67`).
- Les documents de conception décrivent des erreurs récupérables et le parcours
  de session (`docs/design/dashboard-redesign-2.0.md:108`). Le backend traite
  l'authentification invalide/expirée et le logout tolérant qui efface le cookie
  (`backend/src/auth/auth.controller.ts:92`); le changement de mot de passe
  passe par `backend/src/auth/auth.controller.ts:78` et le service ligne 110.

### Constats QA supplémentaires

- Les tests unitaires et UI utilisent des mocks ou des niveaux isolés; ils ne
  démontrent pas une route intégrée combinant permission, mutation et audit.
- `AdminRafflesController` ne possède pas de spec de contrôleur identifié
  (`docs/design/api-contract-audit-2026-10-18.md:30`). Le spec AdminGuard
  fournit `request.path`, alors que l'implémentation lit `route.path`.
- Pour la fraude, la mise à jour puis l'audit restent séparés; les specs ne
  couvrent pas le succès ni l'échec de création de l'audit.
- Les tests unitaires logout/changement de mot de passe couvrent leurs chemins,
  mais aucun E2E ne prouve la révocation d'une socket active.
- La reprise sur erreur est couverte pour les annonces seulement; les parcours
  tirage et modération restent sans preuve équivalente.
- La campagne Playwright du 8 octobre couvre le shell et le responsive, pas les
  transitions métier admin de bout en bout.

### Preuves requises avant clôture

Il faut fournir, sans se limiter à des mocks : un test intégré route→permission→
mutation→audit pour les parcours concernés, un spec de contrôleur
`AdminRafflesController`, la couverture succès/échec de l'audit fraude, un E2E
de révocation d'une socket active après logout, changement de mot de passe et
désactivation admin, des scénarios de reprise pour tirage et modération, ainsi
qu'une campagne métier admin reliant chaque transition à ses preuves. Aucun test
ou appel réseau n'a été exécuté pendant cette intégration documentaire.

### Décisions humaines, gaps et disposition

Il faut décider si le produit exige : le motif et la confirmation de suspension,
la révocation immédiate des sockets lors d'une désactivation admin, et un
parcours de récupération/réinitialisation du mot de passe. Ces décisions ne
sont pas déduites des rapports. Il manque également les transitions documentées
des parcours admin, les tests de succès/audit et d'activation/missing/repeat,
ainsi que les preuves d'implémentation et E2E correspondantes; la revue QA est
terminée. Le verdict des rapports reste
`needs-review`; aucune conclusion de readiness n'est tirée.

## Relevé ACT-08 - audit visuel et accessibilité, 2026-10-18

Ce relevé distingue l'intention de conception, les sources présentes et le
comportement réellement observé. Les rechecks QA/auditeur ciblés sont terminés;
la QA n'a exécuté ni test ni navigateur. ACT-08 est `needs-review`; aucune porte
visuelle n'est approuvée.

### Sources produit et intention documentée

- `frontend/src/components/dashboard/TopbarDashboard.tsx:16-20` contient un
  `span aria-hidden="true"` vide dans la cloche Notifications. La règle
  `frontend/src/app/globals.css:301` le rend en point rose, contrairement à
  ADR-011 qui exclut point décoratif, badge et compteur
  (`docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md:82,106`).
- Le numeral `2` n'est pas présent dans le JSX inspecté et ne peut pas être
  attribué à une source produit sur cette base. Les captures actuelles de la
  source sont des captures historiques du dashboard; elles ne prouvent pas le
  rendu actuel du parcours Notifications.
- Le prototype statique est décrit comme maquette sans implémentation, API ou
  rendu navigateur produit (`docs/design/evidence/notifications-modal-concept/README.md:3,21,30`).

### Constats QA et auditeur

- Le prototype porte une intention structurelle de dialogue, focus, `inert`,
  Escape, reduced motion et responsive
  (`docs/design/evidence/notifications-modal-concept/README.md:17`). Cette
  intention ne constitue pas une preuve de comportement navigateur.
- Les rechecks confirment l'intention Escape/menu/modal, le piège de focus et le
  marquage `aria-hidden`. Les déclarations CSS donnent une taille minimale de
  44 px pour le déclencheur de cloche, le profil, la fermeture du modal et les
  contrôles d'états de démonstration
  (`docs/design/evidence/notifications-modal-concept/styles.css:57,60,80,119`).
  Il s'agit de déclarations source, pas de dimensions de boîtes rendues.
- La QA avant correction avait relevé Escape/focus du menu et des cibles de
  39 px. Frontend a corrigé ces points et ajouté le marquage `aria-hidden` dans
  le prototype documentaire seulement; cela ne prouve pas la correction du
  produit.
- Les autres liens et contrôles du prototype restent sous-dimensionnés ou non
  vérifiés : navigation mobile à 2.5 rem, soit 40 px
  (`styles.css:136`), et liens de reprise, liens textuels et lien d'évitement
  sans `min-width`/`min-height` 44 px explicite (`styles.css:28,84,110`).
- La QA n'a exécuté ni navigateur ni test. Les captures historiques du dashboard
  ne remplacent pas une preuve rendue de la modal.

### Preuves attendues et disposition

Produire une preuve sur le rendu navigateur réel aux quatre tailles pertinentes
(320, 768, 1280 et zoom 200 %), avec contraste, reflow, lecteur d'écran, focus,
Escape, `inert`, reduced motion, ouverture/fermeture du menu et modal. Vérifier
séparément l'absence du point rose et l'absence de compteur ou de numeral non
attribué. Le numeral `2` reste inconnu. Le statut reste `needs-review`; aucune
conclusion de gate visuel n'est tirée.

## Relevé ACT-09 - audit médias Backend/Data et indépendant, 2026-10-18

Ce relevé reprend l'audit Data/Backend et la revue indépendante avec une
classification prudente. Il ne donne aucun avis juridique et ne classe aucune
licence réelle sans preuve spécifique. Une revue Conformité dédiée n'était pas
disponible dans cette passe. ACT-09 reste `needs-review`.

### Inventaire et sources observés

- `docs/design/media-inventory.md:5-11` recense cinq catégories :
  `MEDIA-001` à `MEDIA-004` sont déclarées générées par IA, tandis que
  `MEDIA-005` couvre les miniatures distantes de plateformes. L'inventaire est
  au niveau catégorie et ne relie pas chaque fichier/ressource à sa source,
  son usage, son brief, ses retouches et ses liens éditables.
- `docs/delivery/readiness-decision-request.md:44-50` porte une déclaration
  générale pour `MEDIA-001` à `MEDIA-004` et renvoie `MEDIA-005` aux conditions
  de la plateforme; elle ne fournit pas un chemin de déclaration précis pour
  chaque média.
- Les images de lots ont une source supplémentaire :
  `backend/src/admin-lots/dto/create-admin-lot.dto.ts:36-39` accepte une URL
  HTTPS `imageUrl`, et `frontend/src/components/admin/LotsAdminV3.tsx:445-446`
  la rend. Les miniatures de streams passent par
  `backend/src/streams/streams.service.ts:25-40` et sont affichées par
  `frontend/src/components/streams/ListeStreams.tsx:184-229`.
- La déclaration publique d'IA dans
  `frontend/src/components/i18n/LocalizedHomeSteps.tsx:28-32` est une mention
  générale par interface, pas une lignée par image.
- `docs/design/v3-assets-inventory.md:17-24` identifie des sources de marque,
  dont `frontend/public/branding/skkup-wordmark-transparent.png` et
  `frontend/public/branding/skkup-s-source.png`, mais ne relie pas ces sources
  à tous leurs dérivés publiés. La validation visuelle y reste à poursuivre.

### Constats de couverture et limites

- Aucun média non suivi n'a été trouvé dans le périmètre inspecté; le scan des
  orphelins fondé uniquement sur les noms de fichiers reste inconclusif et ne
  prouve donc pas l'exhaustivité.
- La classification par catégories est prudente, mais la preuve attendue est
  au niveau du fichier local ou de chaque ressource distante. Les miniatures de
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
| Coûts des récompenses et tickets V1.1 | `docs/01-features.md:138-143` | Décision commerciale/Post-MVP à maintenir `needs-review` | Produit; décider prix, périmètre et calendrier avant cette version |
| Calendrier du projet | `docs/README.md:47` | Décision de planification à maintenir `needs-review` | Coordinateur + responsable; fournir calendrier et owner datés |

### Éléments historiques à ne pas interpréter comme actuels

| Mention | Source | Classement | Action attendue |
| --- | --- | --- | --- |
| Scan des marqueurs de code sans `TODO`, `FIXME` ou `HACK` | `docs/13-code-style-audit.md:1-3,28-35`, audit daté du 2026-09-09 | Preuve historique limitée au périmètre et à la date de l'audit; elle ne clôt pas les marqueurs documentaires ACT-11 actuels | Documentation + Auditeur; conserver l'archive et relancer un scan actuel si une clôture est demandée |
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
| Vérifications HTTP/intégration, permissions, quotas et audit, `docs/design/api-contract-audit-2026-10-18.md` | Preuves encore à produire; rattachement aux lignes [ACT-04, ACT-05 et ACT-06](#actions-ouvertes-owners-et-preuves), sans prétendre que des tests d'intégration ont passé. |

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
| `docs/13-code-style-audit.md:28` | 3; termes de recherche cités dans le constat historique d'une recherche négative | Mention historique ou négative | ACT-11; ne rapporte pas de marqueurs actifs dans le code actuel. |
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
| API-002 | ACT-04 | Documenter l'endpoint réellement implémenté `POST /watch-sessions/:id/heartbeat`. | Preuve de contrat accepté et tests de permission/limite/erreur à rattacher; l'ancien chemin n'est pas présenté comme implémenté. |
| API-003 | ACT-04, ACT-07 | Documenter l'endpoint réellement implémenté `POST /admin/raffles/:id/draw`. | Couverture de la route admin, permissions, mutation et audit intégrés restent à prouver. |
| API-004 | ACT-04, ACT-11 | Exiger `Role.VIEWER` comme cible pour le résumé viewer; ce renforcement n'est pas encore implémenté ni prouvé. | Décision de contrat, guard explicite et tests 401/403 à produire; ne pas confondre cible et code actuel. |
| Notifications | ACT-04, ACT-07, ACT-08, ACT-10, ACT-11 | Adopter `GET /viewer/announcements` protégé comme contrat cible. Conserver les décisions précédentes : viewers authentifiés, publiées futures/expirées incluses, archivées exclues, reload à l'ouverture, modal titre + texte brut, aucun badge, compteur ou état lu/non lu. | Endpoint, guard, absence de fuite 401/403, rendu produit et revalidation QA/auditeur restent à produire; la route publique active-only reste un fait actuel insuffisant. |
| Parcours admin | ACT-07 | Les règles proposées sont confirmées comme baseline de conception. | Preuves intégrées route → permission → mutation → audit, reprise et révocation restent à produire. |
| Médias | ACT-09 | La traçabilité par média, provenance et droits est confirmée comme exigence de conception. | Inventaire par ressource et revue Conformité restent ouverts; aucune qualification juridique n'est déduite. |
| Valeurs métier hors MVP | ACT-11 | Points, récompenses, probabilités, prix et calendrier restent hors MVP, en attente des owners concernés. | Décisions métier datées et owners explicites restent à consigner; aucune valeur n'est inventée. |
| Gouvernance | ACT-10 | Ne pas inventer de dates ni d'identités d'owners; les champs jalon, vérificateur et critère de sortie restent en attente. | Le registre ACT-10 doit être complété par les owners; `needs-review` est maintenu. |
| Message positif du mot de passe | ACT-07, ACT-08 | Demande owner confirmée : après passage du design-gate uniquement, retirer « Password meets the requirements » / « Mot de passe conforme ». Conserver règles, erreurs, indicateurs et validation bloquante. | Test ciblé FR/EN après le design-gate; aucun code n'est modifié dans cette passe. |

Le statut de `design-readiness.md` reste `Status: review`; aucune décision
ci-dessus ne ferme un ACT ni ne remplace les preuves Ops, QA, audit indépendant
ou Conformité.

## Règle de sortie

Cette matrice documente la progression mais ne ferme aucune porte. `design-readiness.md` doit rester en `Status: review` jusqu'à réception des preuves indépendantes et des décisions externes requises.
