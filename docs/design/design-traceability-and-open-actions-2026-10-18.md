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
- `docs/quality/p0-evidence-matrix.md` et les rapports du work item pour les preuves archivées

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
| US-002 | ACT-03, ACT-04, ACT-05, ACT-06 | `backend/src/auth/auth.controller.ts`, tests auth et `qa-us002-auth-session-2026-10-09-kit-1.16.30.md`; expiration, révocation et âge juridique à confirmer | Backend + QA; Sécurité + Conformité | [H09-11] preuve technique; [À produire] relecture indépendante fraîche et décision juridique |
| US-003 | ACT-04, ACT-05, ACT-06, ACT-07 | `backend/src/extension/extension.controller.ts`, `qa-p0-pairing-persistence-revocation-docker-https-2026-10-11.md`; extension réelle, reprise et limite appareils à revalider | Backend + QA; Sécurité | [H09-11] campagne Docker; [À produire] preuve navigateur/extension indépendante |
| US-004 | ACT-02, ACT-04, ACT-05, ACT-06, ACT-07 | `backend/src/watch-sessions/watch-sessions.controller.ts`, `qa-us004-points-heartbeats-2026-10-09-kit-1.16.30.md`; panne dépendance, plafond et cohérence ledger à revalider | Backend + QA; DevOps + Sécurité | [H09-11] campagne historique; [À produire] preuve fraîche de dépendance et cohérence métier |
| US-005 | ACT-04, ACT-06, ACT-07 | `backend/src/me/me.controller.ts`, `qa-us005-streak-dashboard-2026-10-09-kit-1.16.30.md`, `qa-us005-visite-streak-docker-2026-10-10.md`; paliers et reset à rapprocher du contrat | Backend + QA | [H09-11] campagnes historiques; [À produire] matrice indépendante complète |
| US-006 | ACT-04, ACT-06, ACT-07, ACT-08 | `backend/src/raffles/admin-raffles.controller.ts`, `qa-us006-raffle-admin-2026-10-09-kit-1.16.30.md`, `qa-us006-raffle-positive-2026-10-09-kit-1.16.30.md`; publication, preuve cryptographique et audit à revalider | Backend + QA; Auditeur | [H09-11] campagnes historiques; [À produire] audit indépendant du tirage complet |
| US-007 | ACT-04, ACT-05, ACT-06, ACT-07 | `backend/src/fraud-flags/fraud-flags.controller.ts`, `qa-p0-admin-moderation-mutation-docker-https-2026-10-11.md`; proportionnalité, réversibilité et notification à confirmer | Backend + QA; Sécurité + Conformité | [H09-11] campagne historique; [À produire] décision métier et audit indépendant |

## Chaîne de traçabilité

| Vision / résultat | Stories | Parcours | Architecture | API / données observées | Preuves attendues | État |
| --- | --- | --- | --- | --- | --- | --- |
| Comprendre le service et ses règles | US-001 | Vitrine, légal et FAQ | Frontend public, contenu publié | `content.controller.ts`; `ManagedContent`, `ContentVersion` | navigation publique FR/EN, contenu publié, accessibilité et preuve de provenance média | `needs-review` |
| Créer et utiliser un compte majeur | US-002 | FLOW-001, inscription/connexion | `auth` et session cookie | `auth.controller.ts`; `User.sessionVersion` et guards de session | succès, validation, doublon, limite, expiration/révocation, permission et preuve juridique de l'âge | `needs-review` |
| Apparier et révoquer l'extension | US-003 | FLOW-001, appariement/reprise | `extension` et stockage du jeton | `extension.controller.ts`; `ExtensionPairingToken`, `ExtensionPairing` | code consommé une fois, cinq appareils, expiration, révocation, extension Chrome réelle et reprise | `needs-review` |
| Créditer l'activité sans doublon | US-004 | FLOW-001, heartbeat accepté/refusé/plafond | `watch-sessions`, Redis/BullMQ et ledger | `watch-sessions.controller.ts`; `WatchSession`, `PointsTransaction` | cadence, nonce, idempotence, plafond 65, panne dépendance, cohérence dashboard/ledger | `needs-review` |
| Maintenir le streak et les tickets | US-005 | FLOW-001, check-in, jour manqué et reprise | `me` et transactions métier | `me.controller.ts`; `PointsTransaction`, `RaffleTicket`, `ScratchCard` | paliers 1/3/7/14/30, reset, bonus unique, solde/historique cohérents | `needs-review` |
| Exécuter un tirage manuel auditable | US-006 | FLOW-002, préparation/exécution/publication | `raffles`, worker et audit | `raffles.controller.ts`, `admin-raffles.controller.ts`; `Raffle`, `RaffleLot`, `RaffleDrawAudit`, `RaffleWinner` | liste figée, CSPRNG, engagement/empreinte, permissions, confirmation, résultat et audit publiable | `needs-review` |
| Examiner et sanctionner un signal fraude | US-007 | parcours admin de modération, suspension/réactivation | `fraud-flags`, `admin-users` et audit | `fraud-flags.controller.ts`, `admin-users.controller.ts`; `FraudFlag`, `ContentAuditEvent`/journal admin | décision humaine proportionnée, permission, CSRF, audit, réversibilité et notification si applicable | `needs-review` |

## Ce que le code permet de confirmer

- Les contrôleurs présents couvrent les domaines auth, extension, sessions de visionnage, espace `me`, tirages, contenu, lots, utilisateurs, fraude, annonces, streams et cartes à gratter.
- Le schéma Prisma contient les agrégats `User`, `ExtensionPairing`, `WatchSession`, `PointsTransaction`, `Raffle`, `RaffleLot`, `RaffleTicket`, `RaffleDrawAudit`, `FraudFlag` et le contenu administrable.
- Les tests unitaires et E2E référencés couvrent plusieurs cas ciblés, mais leur existence ne prouve pas à elle seule la couverture complète de chaque chaîne ci-dessus.
- Les contrats d'API existants ne sont pas modifiés par cette passe. La matrice signale uniquement les consommateurs et preuves à rapprocher.

## Actions ouvertes, owners et preuves

| ID | Point de `design-readiness` | Owner proposé | Action autonome proposée | Preuve attendue | Décision / état |
| --- | --- | --- | --- | --- | --- |
| ACT-01 | MVP/Post-MVP | Produit + Coordinateur | Réconcilier vision, roadmap et stories sans changer le cahier accepté | matrice de périmètre versionnée et décision datée | `needs-review`, décision produit requise |
| ACT-02 | Architecture, exploitation et dépendances | DevOps | Rattacher chaque dépendance à un timeout, retry, healthcheck, alerte et responsable | runbook préproduction exécuté, journaux et alerte observée | `needs-review`, preuve ops externe manquante |
| ACT-03 | Données, rétention, export, suppression, rollback | Data + Conformité | Fixer les durées et procédures par catégorie, puis tester export/suppression/restauration | décision juridique, procédure testée, rapport de restauration daté | `needs-review`, ne pas inventer les durées |
| ACT-04 | Rapprochement API/code | Backend + QA | Comparer les routes réellement exposées, leurs DTO, erreurs, permissions, limites et tests aux contrats | inventaire endpoint→contrat→test avec commit de référence | `needs-review`, contrat métier à confirmer si divergence |
| ACT-05 | Sécurité | Sécurité + Conformité | Fournir rotation/révocation session, CSRF, limites heartbeat, secrets, audit admin et sauvegarde | rapport sécurité indépendant et preuves staging | `needs-review`, approbation sécurité absente |
| ACT-06 | Stories P0 | QA + Auditeur | Rejouer US-001 à US-006 story par story, succès et erreurs, avec rattachement exact | matrice P0 indépendante, captures/logs, verdict auditeur | `needs-review`, preuves partielles existantes |
| ACT-07 | Parcours admin, révocation, erreurs et reprise | UX + Backend + QA | Décrire les transitions nominales et dégradées sans ajouter de comportement non prouvé | diagrammes et tests de reprise, permission et mutation | `needs-review` |
| ACT-08 | Direction visuelle et accessibilité | Frontend + Accessibilité + Auditeur | Comparer les 13 références aux rendus, états, clavier, contraste et reduced-motion | rapport indépendant responsive/a11y/fidélité | `needs-review`, revue complète absente |
| ACT-09 | Médias | Design + Conformité | Relier chaque média publié à sa source, son usage, sa licence ou sa déclaration IA | inventaire exhaustif, briefs IA, autorisation des médias distants | `needs-review`, licence externe inconnue |
| ACT-10 | Décisions ouvertes | Coordinateur + owners ci-dessus | Ajouter un owner, une échéance et une condition de sortie à chaque mention ouverte | registre de décisions relu par les owners | `needs-review` |
| ACT-11 | Marqueurs « à vérifier/à définir » | Owner de chaque domaine | Remplacer chaque marqueur par une décision prouvée ou `needs-review` explicite | recherche sans marqueur non traité et références de décision | `needs-review` |
| ACT-12 | Traçabilité complète | Concepteur + Auditeur | Relire cette matrice indépendamment et corriger les liens manquants | rapport d'auditeur distinct, sans auto-approbation | `needs-review` |
| ACT-13 | Approbation design | Auditeur indépendant + responsable habilité | Organiser la revue finale après clôture des écarts, sans pré-cocher la porte | verdict indépendant `accepted` ou `rework`, preuve datée | `needs-review`, aucune approbation |

## Inconnues externes et décisions à ne pas inventer

- L'âge minimum définitif, la conformité du règlement et les durées de conservation nécessitent une décision juridique ou conformité.
- Les alertes, l'astreinte, le rollback applicatif et la restauration complète nécessitent un accès et une exécution ops observables.
- Les conditions d'utilisation des miniatures fournies par les plateformes nécessitent une vérification externe par média et par plateforme.
- Le seuil visuel final et l'acceptation de la fidélité nécessitent un auditeur design indépendant.
- Toute divergence entre les routes du code et les contrats doit être arbitrée par le propriétaire backend; cette matrice ne crée pas de nouveau contrat.

## Règle de sortie

Cette matrice documente la progression mais ne ferme aucune porte. `design-readiness.md` doit rester en `Status: review` jusqu'à réception des preuves indépendantes et des décisions externes requises.
