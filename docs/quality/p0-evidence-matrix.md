---
last_updated: 2026-10-18
owner: Mickael MUR
---

# Matrice de traçabilité P0

Cette matrice relie chaque story P0 à son parcours, son contrat, sa preuve
technique et sa preuve indépendante attendue. Une preuve historique ou la seule
présence d'un test ne vaut pas validation de la readiness.

| Story | Parcours / contrat | Preuves existantes et rattachement précis | Reste non prouvé / limite de portée | État |
| --- | --- | --- | --- | --- |
| US-001 | vitrine, FAQ, légal | `frontend/e2e/responsive-accessibility.spec.ts` couvre l'accès responsive et l'état public; la campagne brute est archivée dans [`p0-live-2026-10-08/playwright-report.json`](evidence/p0-live-2026-10-08/playwright-report.json). | Le contenu public actuel, ses liens légaux et sa relecture indépendante ne sont pas archivés dans cette campagne. Aucun résultat de conformité éditoriale n'est déduit des tests de rendu. | needs-review |
| US-002 | FLOW-001, API-001 | Campagne archivée du 2026-10-08 : `auth.service.spec.ts` et `auth.controller.spec.ts` figurent dans le rapport backend brut [`p0-live-2026-10-08/backend-jest-report.json`](evidence/p0-live-2026-10-08/backend-jest-report.json); cette référence historique ne décrit pas le run isolé du 2026-10-18. Runs isolés du 2026-10-18 : frontend `FormulaireAuth.test.tsx`, 11/11; DTO `npm test -- --runInBand src/auth/dto/register.dto.spec.ts`, code 0, 1 suite/1 test. `auth.controller.spec.ts`: `npm test -- --runInBand src/auth/auth.controller.spec.ts`, code 1 avant tout test, client Prisma absent. | Aucun test contrôleur exécuté dans le run isolé; le résultat historique est distinct. Pas de preuve indépendante de bout en bout inscription → connexion, des erreurs exposées ni de révocation de session. Les tests techniques ne valent pas validation métier indépendante. | needs-review |
| US-003 | FLOW-001, API-002 | Campagne archivée du 2026-10-08 : rapports bruts et scénarios authentifiés dans [`p0-live-2026-10-08`](evidence/p0-live-2026-10-08/). Run isolé du 2026-10-18 : frontend `./node_modules/.bin/vitest run src/components/extension/CodeAppariement.test.tsx`, 1 suite/10 tests, code 0; backend `npm test -- --runInBand src/extension/extension.service.spec.ts src/extension/extension-auth.guard.spec.ts src/extension/jetons-extension.spec.ts`, 11 tests passés, code global 1 car `extension.service` et `extension-auth.guard` n'ont exécuté aucun test faute de client Prisma. | E2E extension non exécutés le 2026-10-18; pas d'appairage réel, d'HTTP ni d'expiration/révocation persistée. Détails du run daté : [relevé ACT-06](../design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18). | needs-review |
| US-004 | FLOW-001, API-002 | Le mapping story/source est `watch-sessions` (sessions/heartbeats), DTO, specs et client frontend `watch-sessions`, et non `me`/`realtime`. Campagne historique du 2026-10-08 conservée dans [`p0-live-2026-10-08`](evidence/p0-live-2026-10-08/). Run isolé du 2026-10-18 : frontend `./node_modules/.bin/vitest run src/lib/watch-sessions.test.ts`, 1 suite/3 tests, code 0. Run QA frais du hook frontend : `frontend/ npm test -- src/hooks/useSessionVisionnage.test.tsx` (script `test` → `vitest run`), 1 fichier/5 tests, code 0; Node 26.10.0, npm 11.19.1, Vitest 4.1.11; source/spec sans diff avec `origin/dev` `7887791`. Backend : Jest 30.4.2 et `@prisma/client` 7.10.0 disponibles, mais `generated/prisma` absent; aucun test backend, génération de client, DB ou service exécuté. | Le test du hook frontend sous mocks ne prouve aucun HTTP réel, serveur, DB, Redis ou BullMQ; aucun heartbeat HTTP, persistance, idempotence DB ou traitement Redis/BullMQ n'est établi. Le contrat ERR-HEARTBEAT « ignorer sans crédit » n'est pas réconcilié avec les specs qui rejettent par `BadRequestException`. [Relevé ACT-06](../design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18). | needs-review |
| US-005 | FLOW-001, API-004 | Le mapping story/source est `me` et historique points/streak, non les tests `scratch-cards`/`streams` attribués précédemment à cette story. Campagne historique du 2026-10-08 conservée dans [`p0-live-2026-10-08`](evidence/p0-live-2026-10-08/). Run isolé du 2026-10-18 : `./node_modules/.bin/vitest run src/components/dashboard/HistoriquePointsViewer.test.tsx`, 4/4 tests Vitest/jsdom; composant et spec identiques à `origin/dev`. | Test unitaire frontend uniquement; aucune preuve E2E, API ou persistance. Les specs existantes n'assertent pas explicitement une carte aux seuils 3/7/14/30 ni des tickets après 30; aucun run frais backend n'est établi. [Relevé ACT-06](../design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18). | needs-review |
| US-006 | FLOW-002, API-003 | Campagne archivée du 2026-10-08 conservée dans les rapports bruts. Run isolé du 2026-10-18 : frontend `./node_modules/.bin/vitest run src/components/admin/RafflesAdminV3.test.tsx src/components/raffles/ListeTirages.test.tsx`, 2 suites/24 tests, code 0, sources/specs identiques à `origin/dev`; backend `npm test -- --runInBand src/raffles/raffles.controller.spec.ts src/raffles/raffles.service.spec.ts src/raffles/raffle-draw.spec.ts src/raffles/tirage.spec.ts`, seul `raffle-draw.spec.ts` a exécuté 16 tests réussis, code global 1, trois suites sans test faute de client Prisma. | Aucun Prisma/service/Docker utilisé; pas de navigateur, HTTP réel, preuve de permission, persistance ou audit durable. [Relevé ACT-06](../design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18). | needs-review |

## Portée et limites de la preuve

Chaque story P0 doit être reliée à une commande ou un test reproductible, à un
parcours navigateur si elle possède une interface, aux états chargement/vide/
erreur/succès/interdit ou désactivé applicables, et aux viewports 320/768/1280
pour les écrans responsive. Les preuves absentes restent `needs-review` et
interdisent le passage de `design-readiness.md` à `approved`.

La campagne archivée est une preuve QA locale sous Docker, non une preuve de
préproduction ou de production. Elle ne prouve donc pas l'alerting, le canal de
notification, l'astreinte, le rollback applicatif, la restauration complète
exercée ni l'approbation de conception. Ces éléments restent des obligations
distinctes à produire et à faire relire indépendamment.

Les liens relatifs de la colonne « preuves existantes » sont intentionnels :
ils pointent vers les artefacts versionnés avec cette matrice et non vers un
résultat distant non relu. Aucun état `needs-review` n'est converti en
`verified` par la présence de tests locaux.

## Campagnes historiques

Les chiffres ci-dessous appartiennent aux campagnes archivées ou aux rapports
datés du 2026-10-07, 2026-10-08 ou 2026-10-10. Ils ne sont pas les runs isolés
du 2026-10-18 décrits plus bas et restent soumis à leurs limites et à la
relecture indépendante.

- `frontend/e2e/dashboard-responsive-live.spec.ts` : 6 tests authentifiés
  Docker réussis pour US-005 et US-006 aux trois viewports requis.
- Après le correctif frontend `dcf9b6d`, les suites
  `dashboard-v3-secondary-live.spec.ts` et
  `dashboard-viewer-main-live.spec.ts` totalisent 116/116 tests réussis dans
  Docker, incluant permissions admin, titres, responsive, reduced motion,
  zoom 200 % et cibles tactiles.
- `frontend/e2e/dashboard-v3-prototype.spec.ts` : 12 tests réussis, couvrant
  états, reduced motion, contrastes et focus clavier du prototype.
- Tests backend ciblés P0 : la preuve historique Docker est de 31 suites et
  247 tests réussis (`src/auth`, `src/extension`, `src/watch-sessions`,
  `src/me`, `src/realtime`, `src/scratch-cards`, `src/streams`, `src/raffles`,
  `src/admin-lots`, `src/admin-users`, `src/common/throttler.guards.spec.ts`).
  La relance locale hors Docker a obtenu 30 suites réussies sur 31 et 244 tests
  sur 247, avec trois erreurs `listen EPERM` dans la suite de throttling. Les
  logs de refus d'accès administrateur sont observés pendant les tests.
- Après reconstruction de l'image frontend Docker depuis `9dacd69`,
  `frontend/e2e/responsive-accessibility.spec.ts` passe à 11/11 sur le projet
  desktop, dont la validation automatique de la visite à la connexion.
- Suite frontend Vitest après le correctif : 32 fichiers, 120 tests réussis,
  6 tests ignorés.
- Ces résultats historiques ne sont pas une approbation et restent soumis à
  la relecture indépendante et ne ferment pas seuls les stories P0.

## Runs isolés QA du 2026-10-18

Cette section rapporte seulement les exécutions isolées du 2026-10-18. Les
commandes non conservées dans le relevé QA ne sont pas reconstituées. Les
limites complètes et la provenance par story figurent dans le
[relevé ACT-06 du 2026-10-18](../design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18).

| Story | Commande / exécution consignée | Résultat réellement exécuté | Suites non chargées / limites |
| --- | --- | --- | --- |
| US-001 | `frontend/`: `./node_modules/.bin/vitest run src/app/page.test.tsx` | Code 0; 1 fichier, 1 test. Source et spec identiques à `origin/dev`. | Vitest/jsdom seulement; aucun navigateur, serveur, API, BDD ou validation légale. Autre test légal: `./node_modules/.bin/vitest run src/components/legal/ReglementPublicContent.test.tsx`, code 0, 1 fichier/2 tests; composant/spec identiques à `origin/dev`. |
| US-002 | `frontend/`: `npm test -- src/components/auth/FormulaireAuth.test.tsx` | Code 0; 11 tests. Environnement Vitest 4.1.11, Node 26.10.0, npm 11.19.1; 465 packages installés hors ligne dans le worktree isolé. Depuis `backend/`: `npm test -- --runInBand src/auth/dto/register.dto.spec.ts`, code 0, 1 suite/1 test. | Checkout racine frontend: aucun test démarré, binding natif `rolldown` manquant; récupéré dans le worktree isolé. Backend controller: `npm test -- --runInBand src/auth/auth.controller.spec.ts`, code 1 avant test, client Prisma absent. Aucun parcours HTTP/API/BDD. Les tests frontend n'assertent pas l'absence du message positif. |
| US-003 | Frontend: `./node_modules/.bin/vitest run src/components/extension/CodeAppariement.test.tsx`. Backend: `npm test -- --runInBand src/extension/extension.service.spec.ts src/extension/extension-auth.guard.spec.ts src/extension/jetons-extension.spec.ts`. | Frontend: code 0, 1 suite/10 tests. Backend: 11 tests jetons passés, code global 1. Sources/specs pairing identiques à `origin/dev`. | `extension.service` et `extension-auth.guard`: aucun test démarré, client Prisma absent. Aucun E2E extension, appairage réel, HTTP ni expiration/révocation persistée. |
| US-004 | `frontend/`: `npm test -- src/hooks/useSessionVisionnage.test.tsx` (script `test` → `vitest run`) | Code 0; 1 fichier/5 tests; Node 26.10.0, npm 11.19.1, Vitest 4.1.11; source et spec sans diff avec `origin/dev` au commit `7887791`. Le run existant `./node_modules/.bin/vitest run src/lib/watch-sessions.test.ts` reste 1 suite/3 tests. | Hook frontend sous mocks seulement; aucun HTTP réel ni serveur prouvé. Backend : Jest 30.4.2 et `@prisma/client` 7.10.0 disponibles, mais `generated/prisma` absent; aucun test backend, génération client, DB ou service exécuté. Pas de preuve DB/Redis/BullMQ, heartbeat HTTP, persistance ou idempotence. ERR-HEARTBEAT : « ignorer sans crédit » reste non réconcilié avec les rejets `BadRequestException` des specs. |
| US-005 | `frontend/`: `./node_modules/.bin/vitest run src/components/dashboard/HistoriquePointsViewer.test.tsx`. | Vitest/jsdom, 4/4 tests; composant et spec identiques à `origin/dev`. | Aucune preuve E2E, API ou persistance. Les tests existants n'assertent pas explicitement de carte aux seuils 3/7/14/30 ni de tickets à chaque dizaine après 30. Aucun run frais backend n'est établi. |
| US-006 | Frontend: `./node_modules/.bin/vitest run src/components/admin/RafflesAdminV3.test.tsx src/components/raffles/ListeTirages.test.tsx`. Backend: `npm test -- --runInBand src/raffles/raffles.controller.spec.ts src/raffles/raffles.service.spec.ts src/raffles/raffle-draw.spec.ts src/raffles/tirage.spec.ts`. | Frontend: code 0, 2 suites/24 tests, sources/specs correspondants identiques à `origin/dev`. Backend: seul `raffle-draw.spec.ts`, 16 tests réussis; code global 1. | Trois suites backend n'ont exécuté aucun test faute de client Prisma généré. Aucun Prisma généré, service ou Docker. Pas de navigateur, HTTP réel, permission, persistance ou audit durable. |

Pour chaque story, les exécutions ci-dessus sont partielles et ne changent pas
son statut. `US-001` à `US-006` restent `needs-review`; voir le
[relevé ACT-06](../design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-06---audit-de-couverture-qa-p0-2026-10-18). `US-007` est P1 et
reste complémentaire, non incluse dans la matrice P0.

## Artefacts bruts archivés le 2026-10-08

La campagne live complète 62/62 est rattachée à
`docs/quality/evidence/p0-live-2026-10-08/README.md`, avec un artefact PNG
brut, les rapports Playwright et backend bruts, et la commande exacte de
reproduction. Le snapshot des gates est également versionné dans
`docs/quality/evidence/p0-live-2026-10-08/gate-snapshot.tsv`. Cette archive renforce la
traçabilité mais ne transforme pas seule les six stories en `verified` : la
nouvelle relecture indépendante reste obligatoire.

## Vérification QA ciblée du 2026-10-07

Le rapport indépendant `qa-p0-targeted-2026-10-07.md` ajoute une campagne
locale ciblée : Playwright `responsive-accessibility.spec.ts` à 11/11 et dix
suites backend P0 à 87/87. Docker était inaccessible dans cette session
(`permission denied` sur le socket local), donc cette campagne ne remplace pas
les preuves Docker authentifiées ni la relecture indépendante. Les six stories
restent `needs-review` avec les limites détaillées dans le rapport.

## Relance indépendante du 2026-10-07

La relance backend ciblée a détecté 31 suites et 247 tests, dont 30 suites
réussies et 3 échecs dans `common/throttler.guards.spec.ts`, causés par
`listen EPERM: operation not permitted 0.0.0.0` hors environnement Docker.
La preuve historique `31 suites / 247 tests réussis` ne doit donc pas être
présentée comme reproductible dans ce contexte.

## Responsables de reprise

- QA : rejouer les tests et produire les captures authentifiées.
- Frontend : corriger les écarts de structure, états, clavier et motion.
- Auditeur : relire la matrice et les preuves après correction.
- Conformité : valider rétention, export, suppression et licences médias.
